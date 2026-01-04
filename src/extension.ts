import * as vscode from 'vscode';
import { ApiTreeDataProvider } from './treeProvider';
import { ApiStorage } from './storage/ApiStorage';
import { ApiItem, FolderItem, FileItem } from './models/ApiTreeItem';
import { FolderEditPanel } from './panels/FolderEditPanel';
import { FileEditPanel } from './panels/FileEditPanel';
import { ApiTestResultsProvider } from './resultPanels';
import { ApiTestRunner } from './services/ApiTestRunner';
import { HttpFileParser } from './utils/HttpFileParser';
import { Config } from './config/Constants';

export async function activate(context: vscode.ExtensionContext) {
	const outputChannel = vscode.window.createOutputChannel('Postcard');
	outputChannel.appendLine('Postcard extension is now active! (entering activate)');

	// Check if we have a workspace
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		vscode.window.showWarningMessage('Postcard requires an open workspace folder to function.');
		return;
	}

	// Initialize storage and tree data provider
	outputChannel.appendLine('Postcard: creating ApiStorage instance');
	const storage = new ApiStorage(outputChannel);
	// Create the tree data provider immediately so the view can be registered
	const treeDataProvider = new ApiTreeDataProvider(storage);

	// Initialize storage in the background to avoid blocking extension activation
	outputChannel.appendLine('Postcard: scheduling storage.initialize() in background');
	storage.initialize()
		.then(() => {
			outputChannel.appendLine(`Postcard: storage.initialize() completed; items=${storage.getChildren().length}`);
			// Refresh the tree after initialization completes
			treeDataProvider.refresh();
		})
		.catch(error => {
			outputChannel.appendLine(`Postcard: storage.initialize() failed: ${String(error)}`);
		});
	
	// Register the results panel provider
	const resultsProvider = new ApiTestResultsProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ApiTestResultsProvider.viewType, resultsProvider)
	);

	// Initialize API test runner
	const apiTestRunner = new ApiTestRunner(storage, resultsProvider);



	// Register the tree view
	const treeView = vscode.window.createTreeView('postcard.explorerView', {
		treeDataProvider,
		canSelectMany: false,
		showCollapseAll: true,
		dragAndDropController: treeDataProvider
	});	// Refresh the tree view after storage is initialized
	setTimeout(() => {
		console.log('Refreshing tree view after initialization');
		treeDataProvider.refresh();
	}, Config.TREE_REFRESH_DELAY);

	// Track current selection
	let currentSelection: ApiItem | undefined;

	// Listen for selection changes
	treeView.onDidChangeSelection(e => {
		if (e.selection.length > 0) {
			currentSelection = e.selection[0];
		} else {
			currentSelection = undefined;
		}
	});

	// Register commands
	const addFolderCommand = vscode.commands.registerCommand('postcard.addFolder', async () => {
		const name = await vscode.window.showInputBox({
			prompt: 'Enter folder name',
			placeHolder: 'Folder name'
		});

		if (name) {
			// Determine parent folder
			let parentId: string | undefined;
			if (currentSelection?.type === 'folder') {
				// Add to selected folder
				parentId = currentSelection.id;
			} else if (currentSelection?.type === 'file') {
				// Add to same parent as selected file
				parentId = currentSelection.parentId;
			}
			// If no selection or root selected, parentId remains undefined (root level)

			await storage.addFolder(name, '', parentId);
			treeDataProvider.refresh();

			// Expand the parent folder if we added to a folder
			if (parentId && currentSelection?.type === 'folder') {
				treeView.reveal(currentSelection, { expand: true });
			}
		}
	});

	const addFileCommand = vscode.commands.registerCommand('postcard.addFile', async () => {
		const name = await vscode.window.showInputBox({
			prompt: 'Enter file name',
			placeHolder: 'File name'
		});

		if (name) {
			// Determine parent folder
			let parentId: string | undefined;
			if (currentSelection?.type === 'folder') {
				// Add to selected folder
				parentId = currentSelection.id;
			} else if (currentSelection?.type === 'file') {
				// Add to same parent as selected file
				parentId = currentSelection.parentId;
			}
			// If no selection or root selected, parentId remains undefined (root level)

			await storage.addFile(name, '', parentId);
			treeDataProvider.refresh();

			// Expand the parent folder if we added to a folder
			if (parentId && currentSelection?.type === 'folder') {
				treeView.reveal(currentSelection, { expand: true });
			}
		}
	});

	const openFolderCommand = vscode.commands.registerCommand('postcard.openFolder', (item: FolderItem) => {
		// Highlight the folder being edited in the tree view
		treeView.reveal(item, { select: true, focus: false, expand: false });
		
		FolderEditPanel.createOrShow(context.extensionUri, item, async (updates: Partial<FolderItem>) => {
			await storage.updateItem(item.id, updates);
			treeDataProvider.refresh();
		}, async () => {
			// Delete the folder
			outputChannel.appendLine(`Extension: Deleting folder with ID: ${item.id}`);
			await storage.deleteItem(item.id);
			outputChannel.appendLine('Extension: Folder deleted, refreshing tree');
			treeDataProvider.refresh();
			// Close the panel after deletion
			FolderEditPanel.currentPanel?.dispose();
			outputChannel.appendLine('Extension: Panel disposed');
		});
	});

	const openFileCommand = vscode.commands.registerCommand('postcard.openFile', (item: FileItem) => {
		// Highlight the file being edited in the tree view
		treeView.reveal(item, { select: true, focus: false, expand: false });
		
		// Get parent folder if it exists
		let parentFolder: FolderItem | undefined;
		if (item.parentId) {
			const parent = storage.getItem(item.parentId);
			if (parent && parent.type === 'folder') {
				parentFolder = parent as FolderItem;
			}
		}

		outputChannel.appendLine(`📂 Extension: Creating FileEditPanel for item: ${item.name}`);
		FileEditPanel.createOrShow(context.extensionUri, item, parentFolder, async (updates: Partial<FileItem>) => {
			outputChannel.appendLine(`📂 Extension: Update callback called for: ${item.name}`);
			// Use the current file's ID from the panel, not the original item.id
			const currentFileId = FileEditPanel.currentPanel?.messageHandler.getCurrentFile().id || item.id;
			await storage.updateItem(currentFileId, updates);
			treeDataProvider.refresh();
		}, async (testData: FileItem) => {
			outputChannel.appendLine(`📂 Extension: Test callback called for: ${testData.name}`);
			await apiTestRunner.runTest(testData);
		}, async () => {
			// Delete the current file
			const currentFileId = FileEditPanel.currentPanel?.messageHandler.getCurrentFile().id || item.id;
			outputChannel.appendLine(`Extension: Deleting file with ID: ${currentFileId}`);
			await storage.deleteItem(currentFileId);
			outputChannel.appendLine('Extension: File deleted, refreshing tree');
			treeDataProvider.refresh();
			// Close the panel after deletion
			FileEditPanel.currentPanel?.dispose();
			outputChannel.appendLine('Extension: Panel disposed');
		});
	});

	const deleteItemCommand = vscode.commands.registerCommand('postcard.deleteItem', async (item: ApiItem) => {
		const answer = await vscode.window.showWarningMessage(
			`Are you sure you want to delete "${item.name}"?`,
			{ modal: true },
			'Yes',
			'No'
		);

		if (answer === 'Yes') {
			await storage.deleteItem(item.id);
			treeDataProvider.refresh();
		}
	});

	const refreshCommand = vscode.commands.registerCommand('postcard.refresh', async () => {
		outputChannel.appendLine('postcard.refresh: invoked by user');
		try {
			outputChannel.appendLine('postcard.refresh: calling storage.initialize()');
			await storage.initialize();
			const rootChildren = storage.getChildren();
			outputChannel.appendLine(`postcard.refresh: storage.initialize() completed - root children count=${rootChildren.length}`);
			outputChannel.appendLine('postcard.refresh: refreshing tree view');
			treeDataProvider.refresh();
			vscode.window.showInformationMessage('Postcard data refreshed');
		} catch (error) {
			outputChannel.appendLine(`postcard.refresh: refresh failed: ${String(error)}`);
			vscode.window.showErrorMessage(`Postcard refresh failed: ${error}`);
		}
	});

	const clearResultsCommand = vscode.commands.registerCommand('postcard.clearResults', () => {
		ApiTestResultsProvider.clearAllResults(resultsProvider);
		vscode.window.showInformationMessage('All test results cleared');
	});

	const duplicateFileCommand = vscode.commands.registerCommand('postcard.duplicateFile', async (item: FileItem) => {
		try {
			const duplicatedFile = await storage.duplicateFile(item.id);
			if (duplicatedFile) {
				treeDataProvider.refresh();
				vscode.window.showInformationMessage(`Test "${item.name}" duplicated successfully`);
				
				// Optionally reveal and select the duplicated file
				setTimeout(() => {
					treeView.reveal(duplicatedFile, { select: true, focus: false, expand: false });
				}, 200);
			} else {
				vscode.window.showErrorMessage('Failed to duplicate test: Item not found or not a file');
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to duplicate test: ${error}`);
		}
	});

	const importHttpCommand = vscode.commands.registerCommand('postcard.importHttp', async () => {
		const fileUri = await vscode.window.showOpenDialog({
			canSelectMany: false,
			openLabel: 'Import .http File',
			filters: { 'HTTP Files': ['http'] }
		});

		if (fileUri && fileUri[0]) {
			const filePath = fileUri[0].fsPath;
			const fileContent = await vscode.workspace.fs.readFile(fileUri[0]);
			const content = fileContent.toString();

			// Parse the .http file content
			const tests = HttpFileParser.parse(content, filePath);

			// Determine parent folder
			let parentId: string | undefined;
			if (currentSelection?.type === 'folder') {
				parentId = currentSelection.id;
			} else if (currentSelection?.type === 'file') {
				parentId = currentSelection.parentId;
			}

			// Add tests to the current folder and open the first one
			let firstTest: FileItem | undefined;
			for (const test of tests) {
				const newFile = await storage.addFile(test.name, test.url, parentId);
				
				// Update the file with parsed data
				await storage.updateItem(newFile.id, {
					method: test.method as any,
					headers: test.headers.map(h => ({ ...h, enabled: true })),
					body: test.body.trim(),
					bodyType: test.body.trim() ? 'json' : 'none'
				} as Partial<FileItem>);
				
				if (!firstTest) {
					firstTest = newFile;
				}
			}

			treeDataProvider.refresh();

			// Open the first imported test
			if (firstTest) {
				vscode.commands.executeCommand('postcard.openFile', firstTest);
			}
		}
	});

	context.subscriptions.push(importHttpCommand);



	// Add all subscriptions
	context.subscriptions.push(
		treeView,
		addFolderCommand,
		addFileCommand,
		openFolderCommand,
		openFileCommand,
		deleteItemCommand,
		refreshCommand,
		clearResultsCommand,
		duplicateFileCommand
	);
}

export function deactivate() {}
