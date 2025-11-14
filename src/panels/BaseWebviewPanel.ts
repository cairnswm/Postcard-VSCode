import * as vscode from 'vscode';

export interface WebviewPanelConfig {
    viewType: string;
    title: string;
    enableScripts?: boolean;
    localResourceRoots?: vscode.Uri[];
}

export abstract class BaseWebviewPanel {
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    constructor(
        panel: vscode.WebviewPanel,
        protected extensionUri: vscode.Uri
    ) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Don't call setupWebview here - let subclasses call it after their initialization
    }

    public static createPanel(
        config: WebviewPanelConfig,
        extensionUri: vscode.Uri,
        column?: vscode.ViewColumn
    ): vscode.WebviewPanel {
        const targetColumn = column || vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

        return vscode.window.createWebviewPanel(
            config.viewType,
            config.title,
            targetColumn,
            {
                enableScripts: config.enableScripts ?? true,
                localResourceRoots: config.localResourceRoots || [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );
    }

    protected get panel(): vscode.WebviewPanel {
        return this._panel;
    }

    protected get webview(): vscode.Webview {
        return this._panel.webview;
    }

    public reveal(column?: vscode.ViewColumn): void {
        this._panel.reveal(column);
    }

    public updateTitle(title: string): void {
        this._panel.title = title;
    }

    protected setupWebview(): void {
        this.webview.html = this.getHtmlContent();
        this.setupMessageListener();
    }

    protected setupMessageListener(): void {
        this.webview.onDidReceiveMessage(
            (message) => this.handleMessage(message),
            null,
            this._disposables
        );
    }

    protected showSuccessMessage(message: string): void {
        vscode.window.showInformationMessage(message);
    }

    protected showErrorMessage(message: string): void {
        vscode.window.showErrorMessage(message);
    }

    protected addDisposable(disposable: vscode.Disposable): void {
        this._disposables.push(disposable);
    }

    // Abstract methods that subclasses must implement
    protected abstract getHtmlContent(): string;
    protected abstract handleMessage(message: any): Promise<void>;

    public dispose(): void {
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}