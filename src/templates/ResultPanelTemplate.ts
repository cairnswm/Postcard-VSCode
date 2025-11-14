import { ResultPanelStyles } from './ResultPanelStyles';

export class ResultPanelTemplate {
    public static generate(data: {
        testNamesHtml: string;
        executionsHtml: string;
        detailsHtml: string;
    }): string {
        const styles = ResultPanelStyles.getStyles();
        
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Postcard Results</title>
            <style>
            ${styles}
            </style>
        </head>
        <body>
            ${this.getBodyContent(data)}
            <script>
            ${this.getScripts()}
            </script>
        </body>
        </html>`;
    }

    private static getBodyContent(data: {
        testNamesHtml: string;
        executionsHtml: string;
        detailsHtml: string;
    }): string {
        return `
            <div class="header">
                <h1>📮 Postcard Results</h1>
                <button class="clear-button" onclick="clearResults()">Clear All</button>
            </div>
            <div class="main-content">
                <div class="tests-panel">
                    ${data.testNamesHtml}
                </div>
                <div class="executions-panel">
                    ${data.executionsHtml}
                </div>
                <div class="details-panel">
                    ${data.detailsHtml}
                </div>
            </div>
        `;
    }

    private static getScripts(): string {
        return `
            const vscode = acquireVsCodeApi();
            
            function clearResults() {
                vscode.postMessage({ command: 'clearResults' });
            }
            
            function selectTest(testName) {
                vscode.postMessage({ command: 'selectTest', testName: testName });
            }
            
            function selectExecution(index) {
                vscode.postMessage({ command: 'selectExecution', index: index });
            }
            
            function switchTab(tabId) {
                // Find the container for this specific tab group
                const container = document.querySelector('[data-tab="' + tabId + '"]').closest('.tab-container');
                if (!container) return;
                
                // Hide all tab contents in this container
                const contents = container.querySelectorAll('.code-block');
                contents.forEach(content => {
                    content.style.display = 'none';
                });
                
                // Remove active class from all tabs in this container
                const tabs = container.querySelectorAll('.tab-button');
                tabs.forEach(tab => {
                    tab.classList.remove('active');
                });
                
                // Show selected tab content and mark tab as active
                const selectedContent = document.getElementById(tabId);
                const selectedTab = document.querySelector('.tab-button[data-tab="' + tabId + '"]');
                
                if (selectedContent) {
                    selectedContent.style.display = 'block';
                }
                if (selectedTab) {
                    selectedTab.classList.add('active');
                }
            }
            
            // Toggle section visibility
            function toggleSection(sectionId) {
                const section = document.getElementById(sectionId);
                if (section) {
                    section.classList.toggle('collapsed');
                }
            }
            
            // Add click listeners to tab buttons
            document.addEventListener('click', function(event) {
                if (event.target.classList.contains('tab-button')) {
                    const tabId = event.target.getAttribute('data-tab');
                    if (tabId) {
                        switchTab(tabId);
                    }
                }
            });
        `;
    }
}