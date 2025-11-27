import * as vscode from 'vscode';
import { BaseMessageHandler } from './BaseMessageHandler';
import { FileItem, FolderItem } from '../models/ApiTreeItem';
import { Logger } from '../utils/Logger';
import { HttpFileExporter, ExportData } from '../services/HttpFileExporter';

export class FileEditMessageHandler extends BaseMessageHandler<FileItem> {
    private readonly logger = Logger.create('FileEditMessageHandler');

    constructor(
        private currentFile: FileItem,
        onUpdate: (updates: Partial<FileItem>) => Promise<void>,
        private onTest?: (test: FileItem) => Promise<void>,
        private onDelete?: () => Promise<void>
    ) {
        console.log('🛠️ FileEditMessageHandler: Constructor called for file:', currentFile.name);
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
        console.log('🧪 FileEditMessageHandler: handleTestMessage called for:', this.currentFile.name);
        if (!this.onTest) {
            console.log('🧪 FileEditMessageHandler: No onTest callback, returning');
            return;
        }

        console.log('🧪 FileEditMessageHandler: Validating test data');
        // Validate test data
        const validationResult = this.validateSaveData(message);
        if (!validationResult.isValid) {
            console.log('🧪 FileEditMessageHandler: Validation failed:', validationResult.error);
            this.showErrorMessage(`Cannot run test: ${validationResult.error}`);
            return;
        }

        try {
            console.log('🧪 FileEditMessageHandler: Creating test object');
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

            console.log('🧪 FileEditMessageHandler: Calling onTest callback');
            await this.onTest(testData);
            console.log('🧪 FileEditMessageHandler: onTest callback completed');
        } catch (error) {
            console.log('🧪 FileEditMessageHandler: Test failed with error:', error);
            this.showErrorMessage(`Failed to run Postcard test: ${error}`);
        }
    }

    public updateCurrentFile(file: FileItem): void {
        this.currentFile = file;
    }

    public getCurrentFile(): FileItem {
        return this.currentFile;
    }

    public updateCallbacks(
        onUpdate: (updates: Partial<FileItem>) => Promise<void>,
        onTest?: (test: FileItem) => Promise<void>,
        onDelete?: () => Promise<void>
    ): void {
        console.log('🔄 FileEditMessageHandler: updateCallbacks called for:', this.currentFile.name);
        this.onUpdate = onUpdate;
        this.onTest = onTest;
        this.onDelete = onDelete;
        console.log('🔄 FileEditMessageHandler: Callbacks updated');
    }

    protected async handleDeleteMessage(message: any): Promise<void> {
        this.logger.debug('handleDeleteMessage called');
        if (!this.onDelete) {
            this.logger.warn('onDelete callback not configured');
            this.showErrorMessage('Delete functionality not configured');
            return;
        }

        try {
            this.logger.info(`Showing confirmation dialog for file "${this.currentFile.name}"`);
            // Show confirmation dialog in VS Code (not in webview)
            const answer = await vscode.window.showWarningMessage(
                `Are you sure you want to delete "${this.currentFile.name}"? This action cannot be undone.`,
                { modal: true },
                'Yes',
                'No'
            );

            if (answer === 'Yes') {
                this.logger.info(`Calling onDelete for file "${this.currentFile.name}"`);
                await this.onDelete();
                vscode.window.showInformationMessage(`File "${this.currentFile.name}" has been deleted.`);
            } else {
                this.logger.debug('Delete cancelled by user');
            }
        } catch (error) {
            this.logger.error('Delete failed', error);
            this.showErrorMessage(`Failed to delete file: ${error}`);
        }
    }

    protected async handleExportHttpMessage(message: any): Promise<void> {
        const { method, url, headers, body, name, exportOption } = message;
        this.logger.info('Export process started', { name, method, exportOption });

        try {
            // Prepare export data
            const exportData: ExportData = {
                name: name || 'untitled',
                method,
                url,
                headers: headers || [],
                body: body || ''
            };

            // Validate export data
            const validation = HttpFileExporter.validateExportData(exportData);
            if (!validation.isValid) {
                this.logger.error('Export validation failed', validation.error);
                this.showErrorMessage(`Export failed: ${validation.error}`);
                return;
            }

            // Perform export based on option
            const exportOptions = { type: exportOption as 'download' | 'local-save' | 'clipboard' };
            await HttpFileExporter.export(exportData, exportOptions);
            
            this.logger.info('Export completed successfully');
        } catch (error) {
            this.logger.error('Export failed', error);
            this.showErrorMessage(`Export failed: ${error}`);
        }
    }
}