export class FileEditStyles {
    public static getStyles(): string {
        return `
            .method-select {
                min-width: 100px;
                width: 100px;
            }
            
            .url-preview {
                padding: 6px 10px;
                border: 1px solid var(--vscode-focusBorder);
                border-radius: 3px;
                background-color: var(--vscode-editor-background);
                font-family: var(--vscode-editor-font-family);
                color: var(--vscode-focusBorder);
                word-break: break-all;
                font-size: 0.9em;
                margin-bottom: 15px;
            }
            
            .tab-container {
                border: 1px solid var(--vscode-input-border);
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 15px;
            }
            
            .tab-header {
                display: flex;
                background-color: var(--vscode-tab-inactiveBackground);
            }
            
            .tab-button {
                padding: 8px 12px;
                border: none;
                background-color: transparent;
                color: var(--vscode-tab-inactiveForeground);
                cursor: pointer;
                border-bottom: 2px solid transparent;
                margin: 0;
                font-size: 0.9em;
            }
            
            .tab-button.active {
                background-color: var(--vscode-tab-activeBackground);
                color: var(--vscode-tab-activeForeground);
                border-bottom-color: var(--vscode-focusBorder);
            }
            
            .tab-content {
                padding: 15px;
                background-color: var(--vscode-editor-background);
            }
            
            .header-row {
                display: flex;
                gap: 8px;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .header-checkbox {
                width: auto !important;
                margin-right: 5px;
            }
            
            .headers-container {
                border: 1px solid var(--vscode-input-border);
                border-radius: 2px;
                padding: 15px;
                background-color: var(--vscode-input-background);
            }
            
            .body-type-select {
                margin-bottom: 10px;
            }
            
            .body-type-select select {
                width: 150px;
            }
            
            .method-GET { color: #4CAF50; }
            .method-POST { color: #2196F3; }
            .method-PUT { color: #FF9800; }
            .method-DELETE { color: #F44336; }
            .method-PATCH { color: #9C27B0; }
            .method-HEAD { color: #607D8B; }
            .method-OPTIONS { color: #795548; }
        `;
    }
}