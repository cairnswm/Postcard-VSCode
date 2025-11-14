import * as vscode from 'vscode';
import { FolderItem } from '../models/ApiTreeItem';
import { BaseWebviewPanel } from './BaseWebviewPanel';
import { FolderEditMessageHandler } from '../handlers/FolderEditMessageHandler';
import { BaseTemplate } from '../templates/BaseTemplate';
import { BaseScript } from '../templates/scripts/BaseScript';
import { BaseStyles } from '../templates/styles/BaseStyles';

export class FolderEditPanel extends BaseWebviewPanel {
    public static currentPanel: FolderEditPanel | undefined;
    private messageHandler: FolderEditMessageHandler;

    public static createOrShow(
        extensionUri: vscode.Uri, 
        folder: FolderItem, 
        onUpdate: (updates: Partial<FolderItem>) => Promise<void>,
        onDelete?: () => Promise<void>
    ) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (FolderEditPanel.currentPanel) {
            FolderEditPanel.currentPanel.reveal(column);
            FolderEditPanel.currentPanel.updateContent(folder, onUpdate, onDelete);
            return;
        }

        const panel = BaseWebviewPanel.createPanel(
            {
                viewType: 'folderEdit',
                title: `📁 ${folder.name}`,
                enableScripts: true
            },
            extensionUri,
            column
        );

        FolderEditPanel.currentPanel = new FolderEditPanel(panel, extensionUri, folder, onUpdate, onDelete);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        private folder: FolderItem,
        private onUpdate: (updates: Partial<FolderItem>) => Promise<void>,
        private onDelete?: () => Promise<void>
    ) {
        super(panel, extensionUri);
        this.messageHandler = new FolderEditMessageHandler(this.folder, this.onUpdate, this.onDelete);
        // Setup webview after all properties are initialized
        this.setupWebview();
    }

    public updateContent(folder: FolderItem, onUpdate: (updates: Partial<FolderItem>) => Promise<void>, onDelete?: () => Promise<void>) {
        this.folder = folder;
        this.onUpdate = onUpdate;
        this.onDelete = onDelete;
        
        this.messageHandler.updateCurrentFolder(folder);
        this.messageHandler = new FolderEditMessageHandler(this.folder, this.onUpdate, this.onDelete);
        this.updateTitle(`📁 ${folder.name}`);
        this.setupWebview(); // This will regenerate the HTML
    }

    protected getHtmlContent(): string {
        const headerContent = `<h2>Edit Folder: ${this.folder.name}</h2>`;
        const formContent = this.generateFormContent();
        const scriptContent = this.generateScriptContent();
        
        // Custom HTML generation for FolderEditPanel to include delete button
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Folder</title>
    <style>
        ${BaseStyles.getCommonStyles()}
        ${BaseStyles.getFormStyles()}
    </style>
</head>
<body>
    <div class="container">
        <div class="form-container">
            <div class="form-header">
                ${headerContent}
            </div>
            
            <form id="folderForm">
                ${formContent}
                
                <div class="form-actions">
                    <button type="submit">Save Changes</button>
                    <button type="button" id="delete-folder" class="danger">🗑️ Delete Folder</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // Prevent form submission from reloading the page
        document.getElementById('folderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            handleFormSubmit();
        });
        
        ${scriptContent}
    </script>
</body>
</html>`;
    }

    protected async handleMessage(message: any): Promise<void> {
        await this.messageHandler.handleMessage(message);
    }

    private generateFormContent(): string {
        const folderName = BaseTemplate.sanitizeForAttribute(this.folder.name);
        const baseUrl = BaseTemplate.sanitizeForAttribute(this.folder.baseUrl || '');
        
        return `
            <div class="form-group">
                <label for="name">Folder Name:</label>
                <input type="text" id="name" name="name" value="${folderName}" required>
            </div>
            <div class="form-group">
                <label for="baseUrl">Base URL:</label>
                <input type="text" id="baseUrl" name="baseUrl" value="${baseUrl}" placeholder="https://api.example.com">
            </div>
        `;
    }

    private generateScriptContent(): string {
        return `
            ${BaseScript.getCommonScripts()}
            
            // Form submission
            function handleFormSubmit() {
                if (!validateRequired('name', 'Folder name')) {
                    return;
                }

                const baseUrl = document.getElementById('baseUrl').value;
                if (baseUrl && !validateUrl(baseUrl)) {
                    showError('Please enter a valid base URL');
                    return;
                }

                vscode.postMessage({
                    command: 'save',
                    name: sanitizeInput(document.getElementById('name').value),
                    baseUrl: sanitizeInput(baseUrl)
                });
            }

            // Delete folder button
            addClickListener('delete-folder', () => {
                console.log('Delete folder button clicked');
                // Skip confirm() as it's not allowed in sandboxed webview
                // VS Code will handle the confirmation dialog
                vscode.postMessage({
                    command: 'delete'
                });
                console.log('Delete message sent to VS Code');
            });
        `;
    }

    public dispose(): void {
        FolderEditPanel.currentPanel = undefined;
        super.dispose();
    }
}