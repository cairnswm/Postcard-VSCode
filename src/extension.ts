import * as vscode from 'vscode';
import { ApiTreeDataProvider } from './treeProvider';
import { ApiStorage } from './storage/ApiStorage';
import { ApiItem, FolderItem, FileItem } from './models/ApiTreeItem';
import { FolderEditPanel } from './panels/FolderEditPanel';
import { FileEditPanel } from './panels/FileEditPanel';
import { ApiTestResultsProvider, TestResult } from './resultPanels';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

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

	// API Testing function
	async function runApiTest(test: FileItem): Promise<void> {
		// Focus the results panel
		ApiTestResultsProvider.createOrShow();
		
		try {
			// Find the folder to get base URL
			let baseUrl = '';
			if (test.parentId) {
				const parent = storage.getItem(test.parentId);
				if (parent && parent.type === 'folder') {
					baseUrl = (parent as FolderItem).baseUrl || '';
				}
			}

			// Construct full URL
			let fullUrl = test.url;
			if (baseUrl && !test.url.startsWith('http')) {
				// Remove trailing slash from base URL and leading slash from test URL
				const cleanBaseUrl = baseUrl.replace(/\/$/, '');
				const cleanTestUrl = test.url.replace(/^\//, '');
				fullUrl = cleanBaseUrl + '/' + cleanTestUrl;
			}

			if (!fullUrl.startsWith('http')) {
				throw new Error('Invalid URL. Please provide a full URL or ensure the folder has a base URL.');
			}

			// Prepare request headers for result
			const requestHeaders: any = {};
			if (test.headers) {
				test.headers.forEach(header => {
					if (header.enabled && header.key) {
						requestHeaders[header.key] = header.value;
					}
				});
			}

			// Make HTTP request
			const startTime = Date.now();
			const response = await makeHttpRequest(fullUrl, test.method, test.headers, test.body, test.bodyType);
			const endTime = Date.now();
			
			// Create result object
			const result: TestResult = {
				testName: test.name,
				testId: test.id,
				timestamp: new Date(),
				url: fullUrl,
				method: test.method,
				duration: endTime - startTime,
				statusCode: response.statusCode,
				statusMessage: response.statusMessage,
				requestHeaders,
				requestBody: (test.bodyType !== 'none' && test.body) ? test.body : undefined,
				responseHeaders: response.headers,
				responseBody: response.body
			};

			// Add result to panel
			resultsProvider.addResult(result);
			
		} catch (error) {
			// Create error result
			const result: TestResult = {
				testName: test.name,
				testId: test.id,
				timestamp: new Date(),
				url: test.url,
				method: test.method,
				duration: 0,
				requestHeaders: {},
				error: String(error)
			};

			resultsProvider.addResult(result);
			vscode.window.showErrorMessage(`Test failed: ${error}`);
		}
	}

	// HTTP request function
	function makeHttpRequest(url: string, method: string, headers: any[], body: string, bodyType: string): Promise<{statusCode: number, statusMessage: string, headers: any, body: string}> {
		return new Promise((resolve, reject) => {
			try {
				const urlObj = new URL(url);
				const isHttps = urlObj.protocol === 'https:';
				const httpModule = isHttps ? https : http;

				// Prepare request options
				const options = {
					hostname: urlObj.hostname,
					port: urlObj.port || (isHttps ? 443 : 80),
					path: urlObj.pathname + urlObj.search,
					method: method,
					headers: {} as any
				};

				// Add headers
				if (headers) {
					headers.forEach(header => {
						if (header.enabled && header.key) {
							options.headers[header.key] = header.value;
						}
					});
				}

				// Set content length if there's a body
				if (body && bodyType !== 'none') {
					options.headers['Content-Length'] = Buffer.byteLength(body);
					
					// Set content type if not already set
					if (!options.headers['Content-Type'] && !options.headers['content-type']) {
						switch (bodyType) {
							case 'json':
								options.headers['Content-Type'] = 'application/json';
								break;
							case 'form':
								options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
								break;
							case 'xml':
								options.headers['Content-Type'] = 'application/xml';
								break;
							case 'text':
								options.headers['Content-Type'] = 'text/plain';
								break;
						}
					}
				}

				const req = httpModule.request(options, (res) => {
					let responseBody = '';
					
					res.on('data', (chunk) => {
						responseBody += chunk;
					});
					
					res.on('end', () => {
						resolve({
							statusCode: res.statusCode || 0,
							statusMessage: res.statusMessage || '',
							headers: res.headers,
							body: responseBody
						});
					});
				});

				req.on('error', (error) => {
					reject(error);
				});

				// Set timeout
				req.setTimeout(30000, () => {
					req.destroy();
					reject(new Error('Request timeout (30s)'));
				});

				// Write body if present
				if (body && bodyType !== 'none') {
					req.write(body);
				}

				req.end();
				
			} catch (error) {
				reject(error);
			}
		});
	}

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
	}, 100);

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
			await runApiTest(testData);
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
