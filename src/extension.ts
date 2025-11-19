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
			const tests = parseHttpFile(content, filePath);

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

	// Function to parse .http file content
	function parseHttpFile(content: string, filePath: string): { name: string; method: string; url: string; headers: { key: string; value: string }[]; body: string }[] {
		const lines = content.split(/\r?\n/);
		const tests: { name: string; method: string; url: string; headers: { key: string; value: string }[]; body: string }[] = [];
		let currentTest: { name: string; method: string; url: string; headers: { key: string; value: string }[]; body: string } | null = null;
		let inBody = false;
		let bodyLines: string[] = [];

		for (const line of lines) {
			const trimmedLine = line.trim();
			
			// Check if this is a new HTTP request
			if (/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+/.test(trimmedLine)) {
				// Save previous test if it exists
				if (currentTest) {
					currentTest.body = bodyLines.join('\n').trim();
					tests.push(currentTest);
				}
				
				// Start new test
				const [method, url] = trimmedLine.split(/\s+/, 2);
				const fileName = filePath.split(/\\|\//).pop()?.split('.')[0] || 'Unnamed Test';
				currentTest = {
					name: fileName,
					method: method,
					url: url || '',
					headers: [],
					body: ''
				};
				inBody = false;
				bodyLines = [];
			} else if (currentTest && !inBody && trimmedLine.includes(':') && !trimmedLine.startsWith('{')) {
				// This is a header line
				const colonIndex = trimmedLine.indexOf(':');
				if (colonIndex > 0) {
					const key = trimmedLine.substring(0, colonIndex).trim();
					const value = trimmedLine.substring(colonIndex + 1).trim();
					currentTest.headers.push({ key, value });
				}
			} else if (currentTest && (trimmedLine === '' || trimmedLine.startsWith('{'))) {
				// Empty line or start of JSON body indicates transition to body
				if (trimmedLine.startsWith('{')) {
					inBody = true;
					bodyLines.push(line);
				} else if (inBody || bodyLines.length > 0) {
					bodyLines.push(line);
				} else {
					inBody = true; // Empty line after headers
				}
			} else if (currentTest && inBody) {
				// We're in the body section
				bodyLines.push(line);
			}
		}

		// Don't forget the last test
		if (currentTest) {
			currentTest.body = bodyLines.join('\n').trim();
			tests.push(currentTest);
		}

		return tests;
	}

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
