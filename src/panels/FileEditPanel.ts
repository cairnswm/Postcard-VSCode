import * as vscode from 'vscode';
import { FileItem, FolderItem } from '../models/ApiTreeItem';
import { BaseWebviewPanel } from './BaseWebviewPanel';
import { FileEditMessageHandler } from '../handlers/FileEditMessageHandler';
import { UrlHelper } from '../utils/UrlHelper';
import { BaseTemplate } from '../templates/BaseTemplate';
import { FileEditStyles } from '../templates/styles/FileEditStyles';
import { BaseScript } from '../templates/scripts/BaseScript';
import { BaseStyles } from '../templates/styles/BaseStyles';

export class FileEditPanel extends BaseWebviewPanel {
    public static currentPanel: FileEditPanel | undefined;
    public messageHandler: FileEditMessageHandler;

    public static createOrShow(
        extensionUri: vscode.Uri, 
        file: FileItem, 
        parentFolder: FolderItem | undefined, 
        onUpdate: (updates: Partial<FileItem>) => Promise<void>, 
        onTest?: (test: FileItem) => Promise<void>,
        onDelete?: () => Promise<void>
    ) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (FileEditPanel.currentPanel) {
            FileEditPanel.currentPanel.reveal(column);
            FileEditPanel.currentPanel.updateContent(file, parentFolder, onUpdate, onTest, onDelete);
            return;
        }

        const panel = BaseWebviewPanel.createPanel(
            {
                viewType: 'fileEdit',
                title: `📡 ${file.method} ${file.name}`,
                enableScripts: true
            },
            extensionUri,
            column
        );

        FileEditPanel.currentPanel = new FileEditPanel(panel, extensionUri, file, parentFolder, onUpdate, onTest, onDelete);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        private file: FileItem,
        private parentFolder: FolderItem | undefined,
        private onUpdate: (updates: Partial<FileItem>) => Promise<void>,
        private onTest?: (test: FileItem) => Promise<void>,
        private onDelete?: () => Promise<void>
    ) {
        super(panel, extensionUri);
        this.messageHandler = new FileEditMessageHandler(this.file, this.onUpdate, this.onTest, this.onDelete);
        // Setup webview after all properties are initialized
        this.setupWebview();
    }

    public updateContent(
        file: FileItem, 
        parentFolder: FolderItem | undefined, 
        onUpdate: (updates: Partial<FileItem>) => Promise<void>, 
        onTest?: (test: FileItem) => Promise<void>,
        onDelete?: () => Promise<void>
    ) {
        this.file = file;
        this.parentFolder = parentFolder;
        this.onUpdate = onUpdate;
        this.onTest = onTest;
        this.onDelete = onDelete;
        
        this.messageHandler.updateCurrentFile(file);
        this.messageHandler = new FileEditMessageHandler(this.file, this.onUpdate, this.onTest, this.onDelete);
        this.updateTitle(`📡 ${file.method} ${file.name}`);
        this.setupWebview(); // This will regenerate the HTML
    }

    protected getHtmlContent(): string {
        const headerContent = `<h2>Postcard: ${this.file.name}</h2>`;
        const formContent = this.generateFormContent();
        const scriptContent = this.generateScriptContent();
        
        // Custom HTML generation for FileEditPanel to include both Test API and Save buttons
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Postcard</title>
    <style>
        ${BaseStyles.getCommonStyles()}
        ${BaseStyles.getFormStyles()}
        ${FileEditStyles.getStyles()}
    </style>
</head>
<body>
    <div class="container">
        <div class="form-container">
            <div class="form-header">
                ${headerContent}
            </div>
            
            <form id="apiForm">
                ${formContent}
                
                <div class="form-actions">
                    <button type="button" id="test-api" class="secondary">Test API</button>
                    <button type="submit">Save Changes</button>
                    <button type="button" id="delete-file" class="danger">🗑️ Delete File</button>
                    <button type="button" id="export-button" class="secondary">Export</button>
                </div>
                <div id="export-panel" class="export-panel" style="display: none;">
                    <div>
                        <label><input type="radio" name="export-option" value="download" checked> Download</label>
                        <label><input type="radio" name="export-option" value="local-save"> Save Locally</label>
                    </div>
                    <button type="button" id="export-http" class="secondary">Export Rest Client .http</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // Prevent form submission from reloading the page
        document.getElementById('apiForm').addEventListener('submit', (e) => {
            e.preventDefault();
            handleFormSubmit();
        });
        
        ${scriptContent}
    </script>
</body>
</html>`;
    }

    protected async handleMessage(message: any): Promise<void> {
        console.log('FileEditPanel: handleMessage invoked with message:', message);
        await this.messageHandler.handleMessage(message);
    }

    private generateFormContent(): string {
        const description = BaseTemplate.sanitizeForAttribute(this.file.description || '');
        const url = BaseTemplate.sanitizeForAttribute(this.file.url || '');
        const body = BaseTemplate.sanitizeForAttribute(this.file.body || '');
        
        return `
            <div class="form-row">
                <div class="inline-group">
                    <label for="name">Name:</label>
                    <input type="text" id="name" name="name" value="${this.file.name}" required>
                </div>
                <div class="inline-group">
                    <label for="method">Method:</label>
                    <select id="method" name="method" class="method-select">
                        ${this.generateMethodOptions()}
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="inline-group full-width">
                    <label for="description">Description:</label>
                    <input type="text" id="description" name="description" value="${description}" placeholder="Optional description">
                </div>
            </div>

            <div class="form-row">
                <div class="inline-group full-width">
                    <label for="url">Endpoint:</label>
                    <input type="text" id="url" name="url" value="${url}" placeholder="${this.getUrlPlaceholder()}">
                </div>
            </div>

            <div class="url-preview" id="urlPreview">
                ${this.getCompleteUrl()}
            </div>

            <div class="tab-container">
                <div class="tab-header">
                    <button type="button" class="tab-button active" data-tab="headers">Headers</button>
                    <button type="button" class="tab-button" data-tab="body">Body</button>
                </div>
                
                <div id="headers-tab" class="tab-content">
                    <div class="headers-container">
                        <div id="headers-list"></div>
                        <button type="button" id="add-header" class="secondary">Add Header</button>
                    </div>
                </div>
                
                <div id="body-tab" class="tab-content" style="display: none;">
                    <div class="body-type-select">
                        <label for="bodyType">Body Type:</label>
                        <select id="bodyType" name="bodyType">
                            ${this.generateBodyTypeOptions()}
                        </select>
                    </div>
                    <textarea id="body" name="body" placeholder="Request body content..." ${this.file.bodyType === 'none' ? 'disabled' : ''}>${body}</textarea>
                </div>
            </div>
        `;
    }

    private generateMethodOptions(): string {
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
        return methods.map(method => 
            `<option value="${method}" ${this.file.method === method ? 'selected' : ''}>${method}</option>`
        ).join('');
    }

    private generateBodyTypeOptions(): string {
        const types = [
            { value: 'none', label: 'No Body' },
            { value: 'json', label: 'JSON' },
            { value: 'form', label: 'Form Data' },
            { value: 'text', label: 'Plain Text' },
            { value: 'xml', label: 'XML' },
            { value: 'binary', label: 'Binary' }
        ];
        
        return types.map(type => 
            `<option value="${type.value}" ${this.file.bodyType === type.value ? 'selected' : ''}>${type.label}</option>`
        ).join('');
    }

    private getUrlPlaceholder(): string {
        return this.parentFolder?.baseUrl ? '/api/endpoint' : 'https://api.example.com/endpoint';
    }

    private getCompleteUrl(): string {
        return UrlHelper.combineUrls(this.parentFolder?.baseUrl, this.file.url);
    }

    private generateScriptContent(): string {
        const headersJson = JSON.stringify(this.file.headers || []);
        
        return `
            ${BaseScript.getCommonScripts()}
            ${BaseScript.getTabScripts()}
            ${BaseScript.getArrayManagementScripts()}
            
            let headers = ${headersJson};

            // Initialize tabs
            initializeTabs();

            // Body type handling
            addChangeListener('bodyType', (e) => {
                const bodyTextarea = document.getElementById('body');
                if (e.target.value === 'none') {
                    bodyTextarea.disabled = true;
                    bodyTextarea.value = '';
                } else {
                    bodyTextarea.disabled = false;
                    if (e.target.value === 'json' && !bodyTextarea.value) {
                        bodyTextarea.value = '{\\n  \\n}';
                    }
                }
            });

            // Headers management
            function renderHeaders() {
                renderArray('headers-list', headers, (header, index) => {
                    const row = document.createElement('div');
                    row.className = 'header-row';
                    row.innerHTML = \`
                        <input type="checkbox" class="header-checkbox" \${header.enabled ? 'checked' : ''} onchange="toggleHeader(\${index})">
                        <input type="text" placeholder="Header name" value="\${header.key}" onchange="updateHeaderKey(\${index}, this.value)">
                        <input type="text" placeholder="Header value" value="\${header.value}" onchange="updateHeaderValue(\${index}, this.value)">
                        <button type="button" onclick="removeHeader(\${index})" class="secondary">×</button>
                    \`;
                    return row;
                });
            }

            function addHeader() {
                addArrayItem(headers, { key: '', value: '', enabled: true });
                renderHeaders();
            }

            function removeHeader(index) {
                removeArrayItem(headers, index);
                renderHeaders();
            }

            function toggleHeader(index) {
                updateArrayItem(headers, index, { enabled: !headers[index].enabled });
            }

            function updateHeaderKey(index, value) {
                updateArrayItem(headers, index, { key: value });
            }

            function updateHeaderValue(index, value) {
                updateArrayItem(headers, index, { value: value });
            }

            // URL preview update
            addInputListener('url', () => {
                const baseUrl = '${this.parentFolder?.baseUrl || ''}';
                const endpoint = document.getElementById('url').value;
                const preview = document.getElementById('urlPreview');
                if (preview) {
                    preview.textContent = endpoint ? 
                        (baseUrl ? baseUrl.replace(/\\/$/, '') + '/' + endpoint.replace(/^\\//, '') : endpoint) :
                        (baseUrl || '(no URL specified)');
                }
            });

            // Form submission
            function handleFormSubmit() {
                const formData = {
                    name: document.getElementById('name').value,
                    description: document.getElementById('description').value,
                    method: document.getElementById('method').value,
                    url: document.getElementById('url').value,
                    headers: headers,
                    bodyType: document.getElementById('bodyType').value,
                    body: document.getElementById('body').value
                };

                vscode.postMessage({
                    command: 'save',
                    ...formData
                });
            }

            // Test API button
            addClickListener('test-api', () => {
                const formData = {
                    name: document.getElementById('name').value,
                    description: document.getElementById('description').value,
                    method: document.getElementById('method').value,
                    url: document.getElementById('url').value,
                    headers: headers,
                    bodyType: document.getElementById('bodyType').value,
                    body: document.getElementById('body').value
                };

                vscode.postMessage({
                    command: 'test',
                    ...formData
                });
            });

            // Delete file button
            addClickListener('delete-file', () => {
                console.log('Delete file button clicked');
                // Skip confirm() as it's not allowed in sandboxed webview
                // VS Code will handle the confirmation dialog
                vscode.postMessage({
                    command: 'delete'
                });
                console.log('Delete message sent to VS Code');
            });

            // Add event listener for Export button to toggle export panel visibility
            addClickListener('export-button', () => {
                const exportPanel = document.getElementById('export-panel');
                if (exportPanel) {
                    exportPanel.style.display = exportPanel.style.display === 'none' ? 'block' : 'none';
                }
            });

            // Add event listener for Export HTTP button
            addClickListener('export-http', () => {
                const exportPanel = document.getElementById('export-panel');
                if (exportPanel) {
                    exportPanel.style.display = 'none';
                }

                const selectedOption = document.querySelector('input[name="export-option"]:checked')?.value;
                console.log('Selected export option:', selectedOption);

                const formData = {
                    method: document.getElementById('method')?.value || '',
                    url: document.getElementById('url')?.value || '',
                    headers: headers,
                    body: document.getElementById('body')?.value || '',
                    name: document.getElementById('name')?.value || ''
                };

                console.log('Form data for export:', formData);
                console.log('Sending export-http command with data:', { command: 'export-http', exportOption: selectedOption, ...formData });
                vscode.postMessage({
                    command: 'export-http',
                    exportOption: selectedOption,
                    ...formData
                });
            });

            // Event listeners
            addClickListener('add-header', addHeader);

            // Initial render
            renderHeaders();


        `;
    }

    public dispose(): void {
        FileEditPanel.currentPanel = undefined;
        super.dispose();
    }
}