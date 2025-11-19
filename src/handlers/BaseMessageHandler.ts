import * as vscode from 'vscode';

export interface MessageHandlerConfig {
    successMessage: string;
    errorMessagePrefix: string;
}

export abstract class BaseMessageHandler<TItem, TUpdate = Partial<TItem>> {
    protected config: MessageHandlerConfig;

    constructor(
        protected onUpdate: (updates: TUpdate) => Promise<void>,
        config: Partial<MessageHandlerConfig> = {}
    ) {
        this.config = {
            successMessage: 'Item updated successfully!',
            errorMessagePrefix: 'Failed to update item',
            ...config
        };
    }

    public async handleMessage(message: any): Promise<void> {
        console.log('BaseMessageHandler: Received message:', message);
        try {
            switch (message.command) {
                case 'save':
                    console.log('BaseMessageHandler: Routing to handleSaveMessage');
                    await this.handleSaveMessage(message);
                    break;
                case 'test':
                    console.log('BaseMessageHandler: Routing to handleTestMessage');
                    await this.handleTestMessage(message);
                    break;
                case 'validate':
                    console.log('BaseMessageHandler: Routing to handleValidateMessage');
                    await this.handleValidateMessage(message);
                    break;
                case 'delete':
                    console.log('BaseMessageHandler: Routing to handleDeleteMessage');
                    await this.handleDeleteMessage(message);
                    break;
                case 'export-http':
                    console.log('BaseMessageHandler: Routing to handleExportHttpMessage');
                    await this.handleExportHttpMessage(message);
                    break;
                default:
                    console.warn('Unknown message command:', message.command);
            }
        } catch (error) {
            console.error('Error handling message:', error);
            this.showErrorMessage(`${this.config.errorMessagePrefix}: ${error}`);
        }
    }

    protected async handleSaveMessage(message: any): Promise<void> {
        // Validate the message data
        const validationResult = this.validateSaveData(message);
        if (!validationResult.isValid) {
            this.showErrorMessage(validationResult.error || 'Invalid data');
            return;
        }

        // Generate updates
        const updates = this.generateUpdates(message);
        if (this.hasUpdates(updates)) {
            await this.onUpdate(updates);
            this.showSuccessMessage(this.config.successMessage);
        } else {
            this.showSuccessMessage('No changes detected');
        }
    }

    protected async handleTestMessage(message: any): Promise<void> {
        // Base implementation - subclasses can override
        console.log('Test message received:', message);
    }

    protected async handleValidateMessage(message: any): Promise<void> {
        // Base implementation - subclasses can override
        const isValid = this.validateSaveData(message).isValid;
        console.log('Validation result:', isValid);
    }

    protected showSuccessMessage(message: string): void {
        vscode.window.showInformationMessage(message);
    }

    protected showErrorMessage(message: string): void {
        vscode.window.showErrorMessage(message);
    }

    protected hasUpdates(updates: TUpdate): boolean {
        if (!updates || typeof updates !== 'object') {
            return false;
        }
        return Object.keys(updates).length > 0;
    }

    // Abstract methods that subclasses must implement
    protected abstract validateSaveData(message: any): { isValid: boolean; error?: string };
    protected abstract generateUpdates(message: any): TUpdate;

    // Optional method that subclasses can override for delete functionality
    protected async handleDeleteMessage(message: any): Promise<void> {
        // Default implementation - subclasses should override this
        console.warn('Delete command not implemented for this handler');
    }

    // Base implementation - subclasses can override
    protected async handleExportHttpMessage(message: any): Promise<void> {
        console.log('Export HTTP message received:', message);
    }

    // Utility methods for common validations
    protected validateRequired(value: any, fieldName: string): { isValid: boolean; error?: string } {
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
            return { isValid: false, error: `${fieldName} is required` };
        }
        return { isValid: true };
    }

    protected validateUrl(url: string, fieldName: string): { isValid: boolean; error?: string } {
        if (!url) {
            return { isValid: true }; // Empty URL is valid
        }

        try {
            new URL(url);
            return { isValid: true };
        } catch {
            // Check if it's a valid relative path
            const invalidChars = /[<>"{}|\\^`\[\]]/;
            if (invalidChars.test(url)) {
                return { isValid: false, error: `${fieldName} contains invalid characters` };
            }
            return { isValid: true }; // Relative path is valid
        }
    }

    protected validateLength(value: string, minLength: number, maxLength: number, fieldName: string): { isValid: boolean; error?: string } {
        if (value.length < minLength) {
            return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
        }
        if (value.length > maxLength) {
            return { isValid: false, error: `${fieldName} must be no more than ${maxLength} characters` };
        }
        return { isValid: true };
    }

    protected sanitizeString(value: string): string {
        return value.trim().replace(/[<>]/g, '');
    }

    protected compareValues(oldValue: any, newValue: any): boolean {
        // Deep comparison for objects and arrays
        if (typeof oldValue === 'object' && typeof newValue === 'object') {
            return JSON.stringify(oldValue) !== JSON.stringify(newValue);
        }
        return oldValue !== newValue;
    }
}