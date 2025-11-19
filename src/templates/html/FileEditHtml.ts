import { BaseStyles } from '../styles/BaseStyles';
import { FileEditStyles } from '../styles/FileEditStyles';

export interface FileEditHtmlConfig {
	title: string;
	headerContent: string;
	formContent: string;
	formActions: string;
	scriptContent: string;
}

export class FileEditHtml {
	/**
	 * Generates the complete HTML document for the file edit panel
	 * @param config Configuration object containing all HTML sections
	 * @returns The complete HTML document as a string
	 */
	public static generate(config: FileEditHtmlConfig): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${config.title}</title>
	<style>
		${BaseStyles.getCommonStyles()}
		${BaseStyles.getFormStyles()}
		${FileEditStyles.getStyles()}
	</style>
</head>
<body>
	<div class="container">
		<div class="form-container">
			<div class="form-header">
				${config.headerContent}
			</div>
			
			<form id="apiForm">
				${config.formContent}
				${config.formActions}
			</form>
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		
		// Prevent form submission from reloading the page
		document.getElementById('apiForm').addEventListener('submit', (e) => {
			e.preventDefault();
			handleFormSubmit();
		});
		
		${config.scriptContent}
	</script>
</body>
</html>`;
	}

	/**
	 * Generates the header content for the panel
	 * @param fileName The name of the file being edited
	 * @returns The header HTML content
	 */
	public static generateHeader(fileName: string): string {
		return `<h2>Postcard: ${fileName}</h2>`;
	}
}