import * as vscode from 'vscode';

interface ResultPanelMessage {
    command: 'clearResults' | 'selectTest' | 'selectExecution';
    testName?: string;
    index?: number;
}

export class ResultPanelMessageHandler {
    constructor(
        private provider: {
            clearResults(): void;
            selectTest(testName: string): void;
            selectExecution(index: number): void;
        }
    ) {}

    public setupMessageListener(webview: vscode.Webview): void {
        webview.onDidReceiveMessage((message: ResultPanelMessage) => {
            this.handleMessage(message);
        });
    }

    private handleMessage(message: ResultPanelMessage): void {
        switch (message.command) {
            case 'clearResults':
                this.provider.clearResults();
                break;
            case 'selectTest':
                if (message.testName) {
                    this.provider.selectTest(message.testName);
                }
                break;
            case 'selectExecution':
                if (typeof message.index === 'number') {
                    this.provider.selectExecution(message.index);
                }
                break;
        }
    }
}