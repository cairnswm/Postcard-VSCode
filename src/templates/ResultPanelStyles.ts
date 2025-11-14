import { BaseStyles } from './styles/BaseStyles';

export class ResultPanelStyles extends BaseStyles {
    public static getStyles(): string {
        const baseStyles = BaseStyles.getCommonStyles();
        
        return `
        ${baseStyles}
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-editor-inactiveSelectionBackground);
        }
        .header h1 {
            margin: 0;
            font-size: 1.1em;
            color: var(--vscode-foreground);
        }
        .clear-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 4px 8px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 0.8em;
        }
        .clear-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .main-content {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        .tests-panel {
            width: 200px;
            border-right: 1px solid var(--vscode-panel-border);
            overflow-y: auto;
            background-color: var(--vscode-sideBar-background);
        }
        .executions-panel {
            width: 250px;
            border-right: 1px solid var(--vscode-panel-border);
            overflow-y: auto;
            background-color: var(--vscode-sideBar-background);
        }
        .details-panel {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background-color: var(--vscode-editor-background);
        }
        .test-item {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .test-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .test-item.selected {
            background-color: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }
        .execution-item {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid var(--vscode-panel-border);
            font-size: 0.85em;
        }
        .execution-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .execution-item.selected {
            background-color: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }
        .status {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.75em;
            font-weight: bold;
        }
        .status.success {
            background-color: #16825d;
            color: #ffffff;
        }
        .status.warning {
            background-color: #ca9800;
            color: #ffffff;
        }
        .status.error {
            background-color: #f85149;
            color: #ffffff;
        }
        .no-tests, .no-executions, .no-selection {
            padding: 16px;
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
        .section {
            margin-bottom: 24px;
            margin-top: 16px;
        }
        .section:first-child {
            margin-top: 0;
        }
        .section h4 {
            margin: 0 0 12px 0;
            font-size: 1em;
            color: var(--vscode-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding: 8px 0 8px 0;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            user-select: none;
        }
        .section h4:hover {
            background-color: var(--vscode-list-hoverBackground);
            margin: 0 -8px 12px -8px;
            padding: 8px 8px 8px 8px;
            border-radius: 4px;
        }
        .section .toggle-icon {
            font-size: 0.8em;
            transition: transform 0.2s;
        }
        .section.collapsed .toggle-icon {
            transform: rotate(-90deg);
        }
        .section-content {
            overflow: hidden;
            transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
        }
        .section.collapsed .section-content {
            max-height: 0;
            opacity: 0;
        }
        .detail-row {
            margin-bottom: 8px;
        }
        .detail-label {
            font-weight: bold;
            color: var(--vscode-foreground);
        }
        .tab-container {
            margin-top: 12px;
        }
        .tab-header {
            display: flex;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .tab-button {
            background-color: transparent;
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            color: var(--vscode-tab-inactiveForeground);
            border-bottom: 2px solid transparent;
        }
        .tab-button:hover {
            background-color: var(--vscode-tab-hoverBackground);
        }
        .tab-button.active {
            color: var(--vscode-tab-activeForeground);
            border-bottom-color: var(--vscode-focusBorder);
        }
        .tab-content {
            background-color: var(--vscode-editor-background);
        }
        .json-formatted {
            font-family: var(--vscode-editor-font-family);
            font-size: 0.85em;
            line-height: 1.4;
            white-space: pre;
            color: var(--vscode-editor-foreground);
        }
        .json-key {
            color: #9CDCFE;
        }
        .json-string {
            color: #CE9178;
        }
        .json-number {
            color: #B5CEA8;
        }
        .json-boolean {
            color: #569CD6;
        }
        .json-null {
            color: #808080;
        }
        .code-block {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 12px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 0.85em;
            line-height: 1.4;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid var(--vscode-panel-border);
        }
        `;
    }
}