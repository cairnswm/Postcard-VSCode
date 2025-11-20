import * as vscode from 'vscode';
import { ApiStorage } from '../storage/ApiStorage';
import { ApiTestResultsProvider, TestResult } from '../resultPanels';
import { FileItem, FolderItem } from '../models/ApiTreeItem';
import { HttpClient, HttpRequestOptions } from '../utils/HttpClient';

export class ApiTestRunner {
	constructor(
		private storage: ApiStorage,
		private resultsProvider: ApiTestResultsProvider
	) {}

	/**
	 * Runs an API test for the given file item
	 * @param test The file item containing the test configuration
	 */
	public async runTest(test: FileItem): Promise<void> {
		console.log('🚀 ApiTestRunner: runTest called for:', test.name);
		// Focus the results panel
		ApiTestResultsProvider.createOrShow();
		
		try {
			// Find the folder to get base URL
			const fullUrl = this.constructFullUrl(test);

			if (!fullUrl.startsWith('http')) {
				throw new Error('Invalid URL. Please provide a full URL or ensure the folder has a base URL.');
			}

			// Prepare request headers for result
			const requestHeaders = this.prepareRequestHeaders(test);

			// Make HTTP request
			const startTime = Date.now();
			const requestOptions: HttpRequestOptions = {
				url: fullUrl,
				method: test.method,
				headers: test.headers,
				body: test.body,
				bodyType: test.bodyType
			};
			
			const response = await HttpClient.request(requestOptions);
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
			this.resultsProvider.addResult(result);
			
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

			this.resultsProvider.addResult(result);
			vscode.window.showErrorMessage(`Test failed: ${error}`);
		}
	}

	/**
	 * Constructs the full URL by combining base URL from parent folder with test URL
	 * @param test The file item containing the test configuration
	 * @returns The constructed full URL
	 */
	private constructFullUrl(test: FileItem): string {
		let baseUrl = '';
		if (test.parentId) {
			const parent = this.storage.getItem(test.parentId);
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

		return fullUrl;
	}

	/**
	 * Prepares request headers from the test configuration
	 * @param test The file item containing the test configuration
	 * @returns Object containing the prepared headers
	 */
	private prepareRequestHeaders(test: FileItem): any {
		const requestHeaders: any = {};
		if (test.headers) {
			test.headers.forEach(header => {
				if (header.enabled && header.key) {
					requestHeaders[header.key] = header.value;
				}
			});
		}
		return requestHeaders;
	}
}