export class BaseStyles {
    public static getCommonStyles(): string {
        return `
            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                padding: 20px;
                margin: 0;
            }
            
            h1, h2, h3, h4, h5, h6 {
                color: var(--vscode-editor-foreground);
                margin: 0 0 15px 0;
            }
            
            h2 {
                font-size: 1.2em;
                font-weight: 600;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-row {
                display: flex;
                gap: 15px;
                margin-bottom: 10px;
                align-items: center;
            }
            
            .inline-group {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
            }
            
            .inline-group.full-width {
                flex: 2;
            }
            
            .inline-group label {
                display: inline-block;
                margin: 0;
                font-weight: 500;
                white-space: nowrap;
                min-width: 80px;
            }
            
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
                color: var(--vscode-input-foreground);
            }
            
            input, textarea, select {
                width: 100%;
                padding: 8px;
                border: 1px solid var(--vscode-input-border);
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border-radius: 2px;
                font-family: inherit;
                font-size: inherit;
                box-sizing: border-box;
            }
            
            input:focus, textarea:focus, select:focus {
                outline: 1px solid var(--vscode-focusBorder);
                border-color: var(--vscode-focusBorder);
            }
            
            input:disabled, textarea:disabled, select:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            textarea {
                min-height: 100px;
                resize: vertical;
                font-family: var(--vscode-editor-font-family);
            }
            
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 2px;
                cursor: pointer;
                font-family: inherit;
                font-size: inherit;
                margin-right: 8px;
                transition: background-color 0.2s ease;
            }
            
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            
            button:focus {
                outline: 1px solid var(--vscode-focusBorder);
            }
            
            button.secondary {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }
            
            button.secondary:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
            }
            
            button.danger {
                background-color: #333333;
                color: #ffffff;
                border: 1px solid #555555;
            }
            
            button.danger:hover {
                background-color: #222222;
                border-color: #666666;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            
            .error-message {
                color: var(--vscode-errorForeground);
                background-color: var(--vscode-inputValidation-errorBackground);
                border: 1px solid var(--vscode-inputValidation-errorBorder);
                padding: 8px 12px;
                border-radius: 2px;
                margin-bottom: 15px;
            }
            
            .success-message {
                color: var(--vscode-foreground);
                background-color: var(--vscode-inputValidation-infoBackground);
                border: 1px solid var(--vscode-inputValidation-infoBorder);
                padding: 8px 12px;
                border-radius: 2px;
                margin-bottom: 15px;
            }
            
            .preview-container {
                padding: 8px 12px;
                border: 1px solid var(--vscode-focusBorder);
                border-radius: 3px;
                background-color: var(--vscode-editor-background);
                font-family: var(--vscode-editor-font-family);
                color: var(--vscode-focusBorder);
                word-break: break-all;
                font-size: 0.9em;
                margin-bottom: 15px;
            }
            
            /* Responsive adjustments */
            @media (max-width: 600px) {
                .form-row {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .inline-group {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 5px;
                }
                
                .inline-group label {
                    min-width: unset;
                }
            }
        `;
    }
    
    public static getFormStyles(): string {
        return `
            .form-container {
                background-color: var(--vscode-editor-background);
                border-radius: 4px;
                padding: 20px;
            }
            
            .form-header {
                border-bottom: 1px solid var(--vscode-input-border);
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            
            .form-actions {
                border-top: 1px solid var(--vscode-input-border);
                padding-top: 15px;
                margin-top: 20px;
                text-align: right;
            }
            
            .form-actions button:last-child {
                margin-right: 0;
            }
        `;
    }
}