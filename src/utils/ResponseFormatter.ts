import { JsonFormatter } from './JsonFormatter';

export class ResponseFormatter {
    /**
     * Creates tabbed response body view with JSON and Raw tabs
     */
    public static getResponseBodyTabs(responseBody: string, testId: string): string {
        if (!responseBody) {
            return '<div class="code-block">(empty)</div>';
        }

        let formattedJson = '';
        let isJson = false;
        
        try {
            const parsed = JSON.parse(responseBody);
            formattedJson = JsonFormatter.formatJson(parsed);
            isJson = true;
        } catch {
            // Not JSON, use raw view only
            isJson = false;
        }

        const tabId = `tabs-${testId}`;
        
        return `
        <div class="tab-container">
            <div class="tab-header">
                ${isJson ? `<button class="tab-button active" data-tab="${tabId}-formatted">JSON</button>` : ''}
                <button class="tab-button ${!isJson ? 'active' : ''}" data-tab="${tabId}-raw">Raw</button>
            </div>
            <div class="tab-content">
                ${isJson ? `<div id="${tabId}-formatted" class="code-block json-formatted" style="display: block;">${formattedJson}</div>` : ''}
                <div id="${tabId}-raw" class="code-block" style="display: ${isJson ? 'none' : 'block'};">${responseBody}</div>
            </div>
        </div>`;
    }

    /**
     * Formats response status with appropriate styling
     */
    public static formatStatus(status: number): string {
        const statusClass = status >= 400 ? 'error' : status >= 300 ? 'warning' : 'success';
        return `<span class="status ${statusClass}">${status}</span>`;
    }

    /**
     * Formats response time with units
     */
    public static formatResponseTime(responseTime: number): string {
        return responseTime < 1000 
            ? `${responseTime}ms` 
            : `${(responseTime / 1000).toFixed(2)}s`;
    }

    /**
     * Formats response size in human-readable format
     */
    public static formatResponseSize(size: number): string {
        if (size < 1024) {
            return `${size} B`;
        }
        if (size < 1024 * 1024) {
            return `${(size / 1024).toFixed(1)} KB`;
        }
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
}