import * as vscode from 'vscode';
import { BaseMessageHandler } from './BaseMessageHandler';
import { FolderItem } from '../models/ApiTreeItem';

export class FolderEditMessageHandler extends BaseMessageHandler<FolderItem> {
    constructor(
        private currentFolder: FolderItem,
        onUpdate: (updates: Partial<FolderItem>) => Promise<void>,
        private onDelete?: () => Promise<void>
    ) {
        super(onUpdate, {
            successMessage: 'Folder updated successfully!',
            errorMessagePrefix: 'Failed to update folder'
        });
    }

    protected validateSaveData(message: any): { isValid: boolean; error?: string } {
        // Validate required fields
        const nameValidation = this.validateRequired(message.name, 'Folder name');
        if (!nameValidation.isValid) {
            return nameValidation;
        }

        // Validate name length
        const lengthValidation = this.validateLength(message.name, 1, 100, 'Folder name');
        if (!lengthValidation.isValid) {
            return lengthValidation;
        }

        // Validate base URL if provided
        if (message.baseUrl) {
            const urlValidation = this.validateUrl(message.baseUrl, 'Base URL');
            if (!urlValidation.isValid) {
                return urlValidation;
            }

            // Additional validation for base URL - must be absolute
            if (!message.baseUrl.startsWith('http://') && !message.baseUrl.startsWith('https://')) {
                return { isValid: false, error: 'Base URL must start with http:// or https://' };
            }
        }

        return { isValid: true };
    }

    protected generateUpdates(message: any): Partial<FolderItem> {
        const updates: Partial<FolderItem> = {};

        if (this.compareValues(this.currentFolder.name, message.name)) {
            updates.name = this.sanitizeString(message.name);
        }

        if (this.compareValues(this.currentFolder.baseUrl, message.baseUrl)) {
            updates.baseUrl = this.sanitizeString(message.baseUrl || '');
        }

        return updates;
    }

    public updateCurrentFolder(folder: FolderItem): void {
        this.currentFolder = folder;
    }

    protected async handleDeleteMessage(message: any): Promise<void> {
        console.log('FolderEditMessageHandler: handleDeleteMessage called');
        if (!this.onDelete) {
            console.log('FolderEditMessageHandler: onDelete callback not configured');
            this.showErrorMessage('Delete functionality not configured');
            return;
        }

        try {
            console.log(`FolderEditMessageHandler: Showing confirmation dialog for folder "${this.currentFolder.name}"`);
            // Show confirmation dialog in VS Code (not in webview)
            const answer = await vscode.window.showWarningMessage(
                `Are you sure you want to delete "${this.currentFolder.name}" and all its contents? This action cannot be undone.`,
                { modal: true },
                'Yes',
                'No'
            );

            if (answer === 'Yes') {
                console.log(`FolderEditMessageHandler: Calling onDelete for folder "${this.currentFolder.name}"`);
                await this.onDelete();
                vscode.window.showInformationMessage(`Folder "${this.currentFolder.name}" has been deleted.`);
            } else {
                console.log('FolderEditMessageHandler: Delete cancelled by user');
            }
        } catch (error) {
            console.log(`FolderEditMessageHandler: Delete failed:`, error);
            this.showErrorMessage(`Failed to delete folder: ${error}`);
        }
    }
}