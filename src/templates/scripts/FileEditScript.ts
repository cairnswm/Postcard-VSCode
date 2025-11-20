import { BaseScript } from './BaseScript';

export interface FileEditScriptConfig {
	headers: { key: string; value: string; enabled: boolean }[];
	baseUrl?: string;
}

export class FileEditScript {
	/**
	 * Generates the complete script content for the file edit panel
	 * @param config Configuration object containing headers and baseUrl
	 * @returns The generated JavaScript code as a string
	 */
	public static generate(config: FileEditScriptConfig): string {
		const headersJson = JSON.stringify(config.headers || []);
		const baseUrl = config.baseUrl || '';

		return `
			${BaseScript.getCommonScripts()}
			${BaseScript.getTabScripts()}
			${BaseScript.getArrayManagementScripts()}
			
			let headers = ${headersJson};

			// Initialize tabs
			initializeTabs();

			${this.getBodyTypeHandling()}
			${this.getHeadersManagement()}
			${this.getUrlPreviewHandler(baseUrl)}
			${this.getFormHandlers()}
			${this.getButtonHandlers()}
			${this.getInitialization()}
		`;
	}

	/**
	 * Generates body type handling script
	 */
	private static getBodyTypeHandling(): string {
		return `
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
		`;
	}

	/**
	 * Generates headers management functions
	 */
	private static getHeadersManagement(): string {
		return `
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
		`;
	}

	/**
	 * Generates URL preview handler
	 */
	private static getUrlPreviewHandler(baseUrl: string): string {
		return `
			// URL preview update
			addInputListener('url', () => {
				const baseUrlValue = '${baseUrl}';
				const endpoint = document.getElementById('url').value;
				const preview = document.getElementById('urlPreview');
				if (preview) {
					preview.textContent = endpoint ? 
						(baseUrlValue ? baseUrlValue.replace(/\\/$/, '') + '/' + endpoint.replace(/^\\//, '') : endpoint) :
						(baseUrlValue || '(no URL specified)');
				}
			});
		`;
	}

	/**
	 * Generates form handling functions
	 */
	private static getFormHandlers(): string {
		return `
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

			// Get form data utility function
			function getFormData() {
				return {
					name: document.getElementById('name').value,
					description: document.getElementById('description').value,
					method: document.getElementById('method').value,
					url: document.getElementById('url').value,
					headers: headers,
					bodyType: document.getElementById('bodyType').value,
					body: document.getElementById('body').value
				};
			}
		`;
	}

	/**
	 * Generates button event handlers
	 */
	private static getButtonHandlers(): string {
		return `
			// Test API button
			addClickListener('test-api', () => {
				console.log('🖱️ JavaScript: Test API button clicked');
				vscode.postMessage({
					command: 'test',
					...getFormData()
				});
				console.log('🖱️ JavaScript: Test message sent to VS Code');
			});

			// Delete file button
			addClickListener('delete-file', () => {
				vscode.postMessage({
					command: 'delete'
				});
			});

			// Export button to toggle panel visibility
			addClickListener('export-button', () => {
				const exportPanel = document.getElementById('export-panel');
				if (exportPanel) {
					exportPanel.style.display = exportPanel.style.display === 'none' ? 'block' : 'none';
				}
			});

			// Export HTTP button
			addClickListener('export-http', () => {
				const exportPanel = document.getElementById('export-panel');
				if (exportPanel) {
					exportPanel.style.display = 'none';
				}

				const selectedOption = document.querySelector('input[name="export-option"]:checked')?.value;
				const formData = getFormData();

				vscode.postMessage({
					command: 'export-http',
					exportOption: selectedOption,
					...formData
				});
			});

			// Add header button
			addClickListener('add-header', addHeader);

			// Shortcut buttons
			addClickListener('shortcut-test', () => {
				console.log('🖱️ JavaScript: Shortcut test button clicked');
				vscode.postMessage({
					command: 'test',
					...getFormData()
				});
				console.log('🖱️ JavaScript: Shortcut test message sent to VS Code');
			});

			addClickListener('shortcut-save', () => {
				// Trigger form submission
				handleFormSubmit();
			});
		`;
	}

	/**
	 * Generates initialization code
	 */
	private static getInitialization(): string {
		return `
			// Initial render
			renderHeaders();
		`;
	}
}