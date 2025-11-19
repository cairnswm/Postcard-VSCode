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
	console.log('Postcard extension is now active!');

	// Check if we have a workspace
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		vscode.window.showWarningMessage('Postcard requires an open workspace folder to function.');
		return;
	}

	// Initialize storage and tree data provider
	const storage = new ApiStorage();
	await storage.initialize();
	const treeDataProvider = new ApiTreeDataProvider(storage);
	
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
			console.log(`Extension: Deleting folder with ID: ${item.id}`);
			await storage.deleteItem(item.id);
			console.log('Extension: Folder deleted, refreshing tree');
			treeDataProvider.refresh();
			// Close the panel after deletion
			FolderEditPanel.currentPanel?.dispose();
			console.log('Extension: Panel disposed');
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

		FileEditPanel.createOrShow(context.extensionUri, item, parentFolder, async (updates: Partial<FileItem>) => {
			// Use the current file's ID from the panel, not the original item.id
			const currentFileId = FileEditPanel.currentPanel?.messageHandler.getCurrentFile().id || item.id;
			await storage.updateItem(currentFileId, updates);
			treeDataProvider.refresh();
		}, async (testData: FileItem) => {
			await apiTestRunner.runTest(testData);
		}, async () => {
			// Delete the current file
			const currentFileId = FileEditPanel.currentPanel?.messageHandler.getCurrentFile().id || item.id;
			console.log(`Extension: Deleting file with ID: ${currentFileId}`);
			await storage.deleteItem(currentFileId);
			console.log('Extension: File deleted, refreshing tree');
			treeDataProvider.refresh();
			// Close the panel after deletion
			FileEditPanel.currentPanel?.dispose();
			console.log('Extension: Panel disposed');
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
		console.log('Manual refresh triggered');
		await storage.initialize();
		treeDataProvider.refresh();
		vscode.window.showInformationMessage('Postcard data refreshed');
	});

	const clearResultsCommand = vscode.commands.registerCommand('postcard.clearResults', () => {
		ApiTestResultsProvider.clearAllResults(resultsProvider);
		vscode.window.showInformationMessage('All test results cleared');
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
		clearResultsCommand
	);
}

export function deactivate() {}
