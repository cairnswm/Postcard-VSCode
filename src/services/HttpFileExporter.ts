import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import { Config } from '../config/Constants';

export interface ExportData {
	name: string;
	method: string;
	url: string;
	headers: { key: string; value: string }[];
	body: string;
}

export interface ExportOptions {
	type: 'download' | 'local-save';
}

export class HttpFileExporter {
	/**
	 * Exports HTTP request data based on the specified options
	 * @param data The HTTP request data to export
	 * @param options Export options
	 */
	public static async export(data: ExportData, options: ExportOptions): Promise<void> {
		const httpContent = this.generateHttpContent(data);

		switch (options.type) {
			case 'download':
				await this.exportToDownload(data, httpContent);
				break;
			case 'local-save':
				await this.exportToLocalSave(data, httpContent);
				break;
			default:
				throw new Error(`Unsupported export type: ${options.type}`);
		}
	}

	/**
	 * Exports HTTP file to user-selected download location
	 * @param data The export data containing the file name
	 * @param httpContent The generated HTTP content
	 */
	public static async exportToDownload(data: ExportData, httpContent: string): Promise<void> {
		const defaultFileName = `${data.name}${Config.FILE_EXTENSIONS.HTTP}`;
		const defaultUri = vscode.Uri.file(path.join(os.homedir(), Config.PATHS.DOWNLOADS_FOLDER, defaultFileName));

		const fileUri = await vscode.window.showSaveDialog({
			defaultUri,
			filters: { 'HTTP Files': ['http'] },
			saveLabel: 'Export Rest Client .http'
		});

		if (!fileUri) {
			return; // User cancelled
		}

		await vscode.workspace.fs.writeFile(fileUri, Buffer.from(httpContent, 'utf8'));
		vscode.window.showInformationMessage('Rest Client .http file downloaded successfully!');
	}

	/**
	 * Exports HTTP file to workspace .apitester folder
	 * @param data The export data containing the file name
	 * @param httpContent The generated HTTP content
	 */
	public static async exportToLocalSave(data: ExportData, httpContent: string): Promise<void> {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			throw new Error('No workspace folder found to save the .http file.');
		}

		const apitesterFolder = vscode.Uri.joinPath(workspaceFolders[0].uri, Config.PATHS.APITESTER_FOLDER);
		const httpFileUri = vscode.Uri.joinPath(apitesterFolder, `${data.name}${Config.FILE_EXTENSIONS.HTTP}`);

		// Ensure the .apitester directory exists
		await vscode.workspace.fs.createDirectory(apitesterFolder);
		
		// Write the file
		await vscode.workspace.fs.writeFile(httpFileUri, Buffer.from(httpContent, 'utf8'));

		// Open the file in the editor
		const document = await vscode.workspace.openTextDocument(httpFileUri);
		await vscode.window.showTextDocument(document);

		vscode.window.showInformationMessage(`Rest Client .http file saved to ${Config.PATHS.APITESTER_FOLDER}/${data.name}${Config.FILE_EXTENSIONS.HTTP} and opened in the editor.`);
	}

	/**
	 * Generates HTTP file content from export data
	 * @param data The export data
	 * @returns The formatted HTTP content
	 */
	private static generateHttpContent(data: ExportData): string {
		const headerLines = data.headers
			.filter(header => header.key && header.value) // Only include headers with both key and value
			.map(header => `${header.key}: ${header.value}`)
			.join('\n');

		const sections = [
			`${data.method} ${data.url}`,
			headerLines,
			'', // Empty line before body
			data.body || ''
		].filter(section => section !== undefined);

		return sections.join('\n');
	}

	/**
	 * Validates export data before processing
	 * @param data The data to validate
	 * @returns Validation result
	 */
	public static validateExportData(data: ExportData): { isValid: boolean; error?: string } {
		if (!data.name || data.name.trim() === '') {
			return { isValid: false, error: 'Export name is required' };
		}

		if (!data.method || data.method.trim() === '') {
			return { isValid: false, error: 'HTTP method is required' };
		}

		if (!data.url || data.url.trim() === '') {
			return { isValid: false, error: 'URL is required' };
		}

		// Validate filename characters
		const invalidChars = /[<>:"/\\|?*]/g;
		if (invalidChars.test(data.name)) {
			return { isValid: false, error: 'Export name contains invalid characters for filename' };
		}

		return { isValid: true };
	}
}