import * as vscode from 'vscode';
import { FileItem } from './models/ApiTreeItem';
import { TestResult } from './models/TestResult';
import { JsonFormatter } from './utils/JsonFormatter';
import { ResponseFormatter } from './utils/ResponseFormatter';
import { ResultPanelTemplate } from './templates/ResultPanelTemplate';
import { ResultPanelMessageHandler } from './handlers/ResultPanelMessageHandler';

// Re-export TestResult for backward compatibility
export { TestResult } from './models/TestResult';

export class ApiTestResultsProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'postcard-results.view';
    private _view?: vscode.WebviewView;
    private results: TestResult[] = [];
    private selectedTestName: string = '';
    private selectedResultIndex: number = 0;
    private groupedResults: Map<string, TestResult[]> = new Map();
    private messageHandler: ResultPanelMessageHandler;

    constructor(private readonly _extensionUri: vscode.Uri) { 
        this.messageHandler = new ResultPanelMessageHandler({
            clearResults: () => this.clearResults(),
            selectTest: (testName: string) => this.selectTest(testName),
            selectExecution: (index: number) => this.selectExecution(index)
        });
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview();
        this.messageHandler.setupMessageListener(webviewView.webview);
    }

    public static createOrShow(): void {
        // The view will be automatically shown when we add results
        // VS Code handles the view lifecycle for panel views
        vscode.commands.executeCommand('postcard-results.view.focus');
    }

    public selectTest(testName: string): void {
        this.selectedTestName = testName;
        this.selectedResultIndex = 0; // Reset to first execution
        this._update();
    }

    public selectExecution(index: number): void {
        this.selectedResultIndex = index;
        this._update();
    }

    public addResult(result: TestResult): void {
        this.results.unshift(result); // Add to beginning of array (newest first)
        
        // Update grouped results
        if (!this.groupedResults.has(result.testName)) {
            this.groupedResults.set(result.testName, []);
        }
        const testResults = this.groupedResults.get(result.testName)!;
        testResults.unshift(result); // Add newest first
        
        // Keep only last 20 results per test to prevent memory issues
        if (testResults.length > 20) {
            this.groupedResults.set(result.testName, testResults.slice(0, 20));
        }
        
        // Auto-select the new result's test and execution
        this.selectedTestName = result.testName;
        this.selectedResultIndex = 0;
        
        // Update panel title
        if (this._view) {
            this._view.title = `Postcard Results`;
        }
        
        this._update();
        // Auto-focus the results view when a new result is added
        vscode.commands.executeCommand('postcard-results.view.focus');
    }

    public clearResults(): void {
        this.results = [];
        this.groupedResults.clear();
        this.selectedTestName = '';
        this.selectedResultIndex = 0;
        this._update();
    }

    private _update(): void {
        if (this._view) {
            this._view.webview.html = this._getHtmlForWebview();
        }
    }

    private _getTestNameHtml(testName: string): string {
        const selectedClass = testName === this.selectedTestName ? 'selected' : '';
        const testResults = this.groupedResults.get(testName) || [];
        const executionCount = testResults.length;
        const escapedTestName = testName.replace(/'/g, "\\'");
        
        return `
        <div class="test-item ${selectedClass}" onclick="selectTest('${escapedTestName}')">
            <div class="test-name">${testName}</div>
            <div class="execution-count">${executionCount} execution${executionCount !== 1 ? 's' : ''}</div>
        </div>`;
    }

    private _getExecutionItemHtml(result: TestResult, index: number): string {
        const statusClass = result.error ? 'error' : 'success';
        const statusIcon = result.error ? '❌' : '✅';
        const selectedClass = index === this.selectedResultIndex ? 'selected' : '';
        
        return `
        <div class="execution-item ${selectedClass}" onclick="selectExecution(${index})">
            <div class="execution-time">${result.timestamp.toLocaleString()}</div>
            <div class="execution-status ${statusClass}">
                ${statusIcon}
                <span class="method-tag method-${result.method}">${result.method}</span>
                <span>${result.duration}ms</span>
                ${result.statusCode ? `• ${result.statusCode}` : ''}
            </div>
        </div>`;
    }

    private _getResultDetailsHtml(result: TestResult, index: number): string {
        const statusClass = result.error ? 'error' : 'success';
        const statusIcon = result.error ? '❌' : '✅';
        
        const formattedRequestHeaders = result.requestHeaders ? 
            Object.entries(result.requestHeaders)
                .filter(([key, value]) => value && key !== 'Content-Length')
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n') : '';

        const formattedResponseHeaders = result.responseHeaders ? 
            Object.entries(result.responseHeaders)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n') : '';

        const responseBodyTabs = ResponseFormatter.getResponseBodyTabs(result.responseBody || '', `result-${index}`);

        return `
        <div class="result-header">
            <div class="result-status ${statusClass}">
                ${statusIcon}
                <span class="method-tag method-${result.method}">${result.method}</span>
                <span>${result.timestamp.toLocaleTimeString()} • ${result.duration}ms</span>
                ${result.statusCode ? ` • ${result.statusCode} ${result.statusMessage || ''}` : ''}
            </div>
            <div class="result-url">${result.url}</div>
        </div>

        ${result.error ? `
        <div class="section" id="error-section">
            <h4 onclick="toggleSection('error-section')">❌ Error <span class="toggle-icon">▼</span></h4>
            <div class="section-content">${result.error}</div>
        </div>` : ''}

        ${formattedRequestHeaders ? `
        <div class="section collapsed" id="request-headers-section">
            <h4 onclick="toggleSection('request-headers-section')">📤 Request Headers <span class="toggle-icon">▼</span></h4>
            <div class="section-content">${formattedRequestHeaders}</div>
        </div>` : ''}

        ${result.requestBody ? `
        <div class="section collapsed" id="request-body-section">
            <h4 onclick="toggleSection('request-body-section')">📝 Request Body <span class="toggle-icon">▼</span></h4>
            <div class="section-content">${result.requestBody}</div>
        </div>` : ''}

        ${formattedResponseHeaders ? `
        <div class="section collapsed" id="response-headers-section">
            <h4 onclick="toggleSection('response-headers-section')">📥 Response Headers <span class="toggle-icon">▼</span></h4>
            <div class="section-content">${formattedResponseHeaders}</div>
        </div>` : ''}

        ${result.responseBody ? `
        <div class="section" id="response-body-section">
            <h4 onclick="toggleSection('response-body-section')">📄 Response Body <span class="toggle-icon">▼</span></h4>
            <div class="section-content">${responseBodyTabs}</div>
        </div>` : ''}`;
    }

    private _getHtmlForWebview(): string {
        // Auto-select first test if none selected but tests exist
        if (!this.selectedTestName && this.groupedResults.size > 0) {
            this.selectedTestName = Array.from(this.groupedResults.keys())[0];
        }

        const testNamesHtml = this.groupedResults.size > 0 
            ? Array.from(this.groupedResults.keys()).map(testName => this._getTestNameHtml(testName)).join('\n')
            : '<div class="no-tests">No tests executed yet</div>';

        const executionsHtml = this.selectedTestName && this.groupedResults.has(this.selectedTestName)
            ? this.groupedResults.get(this.selectedTestName)!.map((result, index) => this._getExecutionItemHtml(result, index)).join('\n')
            : '<div class="no-executions">Select a test to view executions</div>';

        const selectedTestResults = this.selectedTestName ? this.groupedResults.get(this.selectedTestName) : undefined;
        const selectedResult = selectedTestResults && selectedTestResults[this.selectedResultIndex] 
            ? selectedTestResults[this.selectedResultIndex] 
            : undefined;
        const detailsHtml = selectedResult 
            ? this._getResultDetailsHtml(selectedResult, this.selectedResultIndex)
            : '<div class="no-selection">Select an execution to view details</div>';

        return ResultPanelTemplate.generate({
            testNamesHtml,
            executionsHtml,
            detailsHtml
        });
    }







    public static clearAllResults(provider: ApiTestResultsProvider): void {
        provider.clearResults();
    }

    public static disposeAll(): void {
        // For webview views, dispose is handled by VS Code
        // We just need to clear the results if needed
    }
}

