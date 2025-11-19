import * as vscode from 'vscode';
import { BaseMessageHandler } from './BaseMessageHandler';
import { FileItem, FolderItem } from '../models/ApiTreeItem';

export class FileEditMessageHandler extends BaseMessageHandler<FileItem> {
    constructor(
        private currentFile: FileItem,
        onUpdate: (updates: Partial<FileItem>) => Promise<void>,
        private onTest?: (test: FileItem) => Promise<void>,
        private onDelete?: () => Promise<void>
    ) {
        super(onUpdate, {
            successMessage: 'Postcard test updated successfully!',
            errorMessagePrefix: 'Failed to update Postcard test'
        });
    }

    protected validateSaveData(message: any): { isValid: boolean; error?: string } {
        // Validate required fields
        const nameValidation = this.validateRequired(message.name, 'Test name');
        if (!nameValidation.isValid) {
            return nameValidation;
        }

        // Validate name length
        const lengthValidation = this.validateLength(message.name, 1, 100, 'Test name');
        if (!lengthValidation.isValid) {
            return lengthValidation;
        }

        // Validate URL if provided
        if (message.url) {
            const urlValidation = this.validateUrl(message.url, 'URL');
            if (!urlValidation.isValid) {
                return urlValidation;
            }
        }

        // Validate method
        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
        if (!validMethods.includes(message.method)) {
            return { isValid: false, error: 'Invalid HTTP method' };
        }

        // Validate body type
        const validBodyTypes = ['none', 'json', 'form', 'text', 'xml', 'binary'];
        if (!validBodyTypes.includes(message.bodyType)) {
            return { isValid: false, error: 'Invalid body type' };
        }

        // Validate headers array
        if (message.headers && Array.isArray(message.headers)) {
            for (const header of message.headers) {
                if (typeof header !== 'object' || 
                    typeof header.key !== 'string' || 
                    typeof header.value !== 'string' || 
                    typeof header.enabled !== 'boolean') {
                    return { isValid: false, error: 'Invalid header format' };
                }
            }
        }

        return { isValid: true };
    }

    protected generateUpdates(message: any): Partial<FileItem> {
        const updates: Partial<FileItem> = {};

        if (this.compareValues(this.currentFile.name, message.name)) {
            updates.name = this.sanitizeString(message.name);
        }

        if (this.compareValues(this.currentFile.method, message.method)) {
            updates.method = message.method;
        }

        if (this.compareValues(this.currentFile.url, message.url)) {
            updates.url = this.sanitizeString(message.url || '');
        }

        if (this.compareValues(this.currentFile.headers, message.headers)) {
            updates.headers = message.headers || [];
        }

        if (this.compareValues(this.currentFile.bodyType, message.bodyType)) {
            updates.bodyType = message.bodyType;
        }

        if (this.compareValues(this.currentFile.body, message.body)) {
            updates.body = message.body || '';
        }

        if (this.compareValues(this.currentFile.description, message.description)) {
            updates.description = this.sanitizeString(message.description || '');
        }

        return updates;
    }

    protected async handleTestMessage(message: any): Promise<void> {
        if (!this.onTest) {
            return;
        }

        // Validate test data
        const validationResult = this.validateSaveData(message);
        if (!validationResult.isValid) {
            this.showErrorMessage(`Cannot run test: ${validationResult.error}`);
            return;
        }

        try {
            // Create test object with current form data
            const testData: FileItem = {
                ...this.currentFile,
                name: this.sanitizeString(message.name),
                method: message.method,
                url: this.sanitizeString(message.url || ''),
                headers: message.headers || [],
                bodyType: message.bodyType,
                body: message.body || '',
                description: this.sanitizeString(message.description || '')
            };

            await this.onTest(testData);
        } catch (error) {
            this.showErrorMessage(`Failed to run Postcard test: ${error}`);
        }
    }

    public updateCurrentFile(file: FileItem): void {
        this.currentFile = file;
    }

    public getCurrentFile(): FileItem {
        return this.currentFile;
    }

    protected async handleDeleteMessage(message: any): Promise<void> {
        console.log('FileEditMessageHandler: handleDeleteMessage called');
        if (!this.onDelete) {
            console.log('FileEditMessageHandler: onDelete callback not configured');
            this.showErrorMessage('Delete functionality not configured');
            return;
        }

        try {
            console.log(`FileEditMessageHandler: Showing confirmation dialog for file "${this.currentFile.name}"`);
            // Show confirmation dialog in VS Code (not in webview)
            const answer = await vscode.window.showWarningMessage(
                `Are you sure you want to delete "${this.currentFile.name}"? This action cannot be undone.`,
                { modal: true },
                'Yes',
                'No'
            );

            if (answer === 'Yes') {
                console.log(`FileEditMessageHandler: Calling onDelete for file "${this.currentFile.name}"`);
                await this.onDelete();
                vscode.window.showInformationMessage(`File "${this.currentFile.name}" has been deleted.`);
            } else {
                console.log('FileEditMessageHandler: Delete cancelled by user');
            }
        } catch (error) {
            console.log(`FileEditMessageHandler: Delete failed:`, error);
            this.showErrorMessage(`Failed to delete file: ${error}`);
        }
    }

    protected async handleExportHttpMessage(message: any): Promise<void> {
        const { method, url, headers, body, name, exportOption } = message;
        console.log('FileEditMessageHandler: Export process started');
        console.log('Received data:', { method, url, headers, body, name, exportOption });

        const headerLines = (headers as { key: string; value: string }[]).map(header => `${header.key}: ${header.value}`).join('\n');
        const httpContent = `${method} ${url}\n${headerLines}\n\n${body}`;

        console.log('Generated HTTP content:', httpContent);

        if (exportOption === 'download') {
            console.log('User selected download option');
            const defaultUri = vscode.Uri.file(`${require('os').homedir()}/Downloads/${name}.http`);
            console.log('Default download location:', defaultUri.fsPath);

            vscode.window.showSaveDialog({
                defaultUri,
                filters: { 'HTTP Files': ['http'] },
                saveLabel: 'Export Rest Client .http'
            }).then(async fileUri => {
                if (fileUri) {
                    console.log('Save dialog returned file URI:', fileUri.fsPath);
                    console.log('Writing file content:', httpContent);
                    await vscode.workspace.fs.writeFile(fileUri, Buffer.from(httpContent, 'utf8'));
                    console.log('File written successfully to:', fileUri.fsPath);
                    vscode.window.showInformationMessage('Rest Client .http file downloaded successfully!');
                } else {
                    console.log('Save dialog cancelled');
                }
            });
        } else if (exportOption === 'local-save') {
            console.log('User selected local save option');
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const apitesterFolder = vscode.Uri.joinPath(workspaceFolders[0].uri, '.apitester');
                const httpFileUri = vscode.Uri.joinPath(apitesterFolder, `${name}.http`);

                console.log('Ensuring .apitester folder exists at:', apitesterFolder.fsPath);
                console.log('Writing file content:', httpContent);
                await vscode.workspace.fs.createDirectory(apitesterFolder);
                await vscode.workspace.fs.writeFile(httpFileUri, Buffer.from(httpContent, 'utf8'));
                console.log('File written successfully to:', httpFileUri.fsPath);

                console.log('Opening file in editor');
                const document = await vscode.workspace.openTextDocument(httpFileUri);
                await vscode.window.showTextDocument(document);

                vscode.window.showInformationMessage(`Rest Client .http file saved to .apitester/${name}.http and opened in the editor.`);
            } else {
                console.log('No workspace folder found');
                vscode.window.showErrorMessage('No workspace folder found to save the .http file.');
            }
        } else {
            console.log('Invalid export option selected');
        }
        console.log('Export process completed');
    }
}