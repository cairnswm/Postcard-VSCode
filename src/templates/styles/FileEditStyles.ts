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

            /* Header with shortcut buttons */
            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .header-content h2 {
                margin: 0;
                flex-grow: 1;
            }

            .shortcut-buttons {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .shortcut-btn {
                width: 36px;
                height: 36px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: all 0.2s ease;
                position: relative;
            }

            .shortcut-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }

            .shortcut-btn:active {
                transform: translateY(0);
            }

            .test-btn {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }

            .test-btn:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
            }

            .save-btn {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }

            .save-btn:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            .shortcut-btn .icon {
                display: block;
                line-height: 1;
            }

            /* Export Panel Styles */
            .export-panel {
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                background-color: var(--vscode-input-background);
                padding: 16px;
                margin-top: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .export-options {
                display: flex;
                flex-direction: column;
                gap: 6px;
                margin-bottom: 16px;
            }

            .export-option {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 8px;
                border-radius: 3px;
                transition: background-color 0.2s ease;
            }

            .export-option:hover {
                background-color: var(--vscode-list-hoverBackground);
            }

            .export-option input[type="radio"] {
                margin: 0;
                width: 16px;
                height: 16px;
                cursor: pointer;
            }

            .export-option label {
                margin: 0;
                cursor: pointer;
                color: var(--vscode-foreground);
                font-size: 14px;
                user-select: none;
                flex: 1;
            }

            .export-actions {
                border-top: 1px solid var(--vscode-input-border);
                padding-top: 12px;
            }

            .export-actions button {
                width: 100%;
                padding: 10px 16px;
                font-weight: 500;
                border-radius: 4px;
                transition: all 0.2s ease;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: 1px solid var(--vscode-button-background);
            }

            .export-actions button:hover {
                background-color: var(--vscode-button-hoverBackground);
                border-color: var(--vscode-button-hoverBackground);
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            .export-actions button:active {
                transform: translateY(0);
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            }

            /* Responsive design for smaller screens */
            @media (max-width: 600px) {
                .header-content {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 12px;
                }

                .shortcut-buttons {
                    align-self: flex-end;
                }

                .export-options {
                    gap: 4px;
                }

                .export-option {
                    padding: 4px 6px;
                }
            }
        `;
    }
}