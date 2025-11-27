import { FileItem, FolderItem } from '../../models/ApiTreeItem';
import { BaseTemplate } from '../BaseTemplate';
import { UrlHelper } from '../../utils/UrlHelper';

export interface FileEditFormConfig {
	file: FileItem;
	parentFolder?: FolderItem;
}

export class FileEditForm {
	/**
	 * Generates the complete form HTML content for the file edit panel
	 * @param config Configuration object containing file and parent folder data
	 * @returns The generated HTML form content
	 */
	public static generate(config: FileEditFormConfig): string {
		const { file, parentFolder } = config;
		const description = BaseTemplate.sanitizeForAttribute(file.description || '');
		const url = BaseTemplate.sanitizeForAttribute(file.url || '');
		const body = BaseTemplate.sanitizeForAttribute(file.body || '');

		return `
			${this.generateNameAndMethodRow(file)}
			${this.generateDescriptionRow(description)}
			${this.generateUrlRow(url, parentFolder)}
			${this.generateUrlPreview(file, parentFolder)}
			${this.generateTabContainer(file, body)}
		`;
	}

	/**
	 * Generates the name and method input row
	 */
	private static generateNameAndMethodRow(file: FileItem): string {
		return `
			<div class="form-row">
				<div class="inline-group">
					<label for="name">Name:</label>
					<input type="text" id="name" name="name" value="${file.name}" required>
				</div>
				<div class="inline-group">
					<label for="method">Method:</label>
					<select id="method" name="method" class="method-select">
						${this.generateMethodOptions(file.method)}
					</select>
				</div>
			</div>
		`;
	}

	/**
	 * Generates the description input row
	 */
	private static generateDescriptionRow(description: string): string {
		return `
			<div class="form-row">
				<div class="inline-group full-width">
					<label for="description">Description:</label>
					<input type="text" id="description" name="description" value="${description}" placeholder="Optional description">
				</div>
			</div>
		`;
	}

	/**
	 * Generates the URL input row
	 */
	private static generateUrlRow(url: string, parentFolder?: FolderItem): string {
		const placeholder = this.getUrlPlaceholder(parentFolder);
		return `
			<div class="form-row">
				<div class="inline-group full-width">
					<label for="url">Endpoint:</label>
					<input type="text" id="url" name="url" value="${url}" placeholder="${placeholder}">
				</div>
			</div>
		`;
	}

	/**
	 * Generates the URL preview section
	 */
	private static generateUrlPreview(file: FileItem, parentFolder?: FolderItem): string {
		const completeUrl = UrlHelper.combineUrls(parentFolder?.baseUrl, file.url);
		return `
			<div class="url-preview" id="urlPreview">
				${completeUrl}
			</div>
		`;
	}

	/**
	 * Generates the tab container with headers and body sections
	 */
	private static generateTabContainer(file: FileItem, body: string): string {
		return `
			<div class="tab-container">
				<div class="tab-header">
					<button type="button" class="tab-button active" data-tab="headers">Headers</button>
					<button type="button" class="tab-button" data-tab="body">Body</button>
				</div>
				
				<div id="headers-tab" class="tab-content">
					<div class="headers-container">
						<div id="headers-list"></div>
						<button type="button" id="add-header" class="secondary">Add Header</button>
					</div>
				</div>
				
				<div id="body-tab" class="tab-content" style="display: none;">
					<div class="body-type-select">
						<label for="bodyType">Body Type:</label>
						<select id="bodyType" name="bodyType">
							${this.generateBodyTypeOptions(file.bodyType)}
						</select>
					</div>
					<textarea id="body" name="body" placeholder="Request body content..." ${file.bodyType === 'none' ? 'disabled' : ''}>${body}</textarea>
				</div>
			</div>
		`;
	}

	/**
	 * Generates method options for the select dropdown
	 */
	private static generateMethodOptions(currentMethod: string): string {
		const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
		return methods.map(method => 
			`<option value="${method}" ${currentMethod === method ? 'selected' : ''}>${method}</option>`
		).join('');
	}

	/**
	 * Generates body type options for the select dropdown
	 */
	private static generateBodyTypeOptions(currentBodyType: string): string {
		const types = [
			{ value: 'none', label: 'No Body' },
			{ value: 'json', label: 'JSON' },
			{ value: 'form', label: 'Form Data' },
			{ value: 'text', label: 'Plain Text' },
			{ value: 'xml', label: 'XML' },
			{ value: 'binary', label: 'Binary' }
		];
		
		return types.map(type => 
			`<option value="${type.value}" ${currentBodyType === type.value ? 'selected' : ''}>${type.label}</option>`
		).join('');
	}

	/**
	 * Gets the appropriate URL placeholder text
	 */
	private static getUrlPlaceholder(parentFolder?: FolderItem): string {
		return parentFolder?.baseUrl ? '/api/endpoint' : 'https://api.example.com/endpoint';
	}

	/**
	 * Generates the form actions (buttons) section
	 */
	public static generateFormActions(): string {
		return `
			<div class="form-actions">
				<button type="button" id="test-api" class="secondary">Test API</button>
				<button type="submit">Save Changes</button>
				<button type="button" id="delete-file" class="danger">🗑️ Delete File</button>
				<button type="button" id="export-button" class="secondary">Export</button>
			</div>
			<div id="export-panel" class="export-panel" style="display: none;">
				<div class="export-options">
					<div class="export-option">
						<input type="radio" name="export-option" value="download" id="export-download" checked>
						<label for="export-download">Download</label>
					</div>
					<div class="export-option">
						<input type="radio" name="export-option" value="local-save" id="export-local">
						<label for="export-local">Save Locally</label>
					</div>
					<div class="export-option">
						<input type="radio" name="export-option" value="clipboard" id="export-clipboard">
						<label for="export-clipboard">Clipboard</label>
					</div>
				</div>
				<div class="export-actions">
					<button type="button" id="export-http" class="secondary">Export Rest Client .http</button>
				</div>
			</div>
		`;
	}
}