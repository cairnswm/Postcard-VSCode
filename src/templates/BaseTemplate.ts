import { BaseStyles } from './styles/BaseStyles';

export interface TemplateConfig {
    title: string;
    formId: string;
    additionalStyles?: string;
    additionalScripts?: string;
}

export class BaseTemplate {
    public static generateHtml(
        config: TemplateConfig,
        headerContent: string,
        formContent: string,
        scriptContent: string
    ): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}</title>
    <style>
        ${BaseStyles.getCommonStyles()}
        ${BaseStyles.getFormStyles()}
        ${config.additionalStyles || ''}
    </style>
</head>
<body>
    <div class="container">
        <div class="form-container">
            <div class="form-header">
                ${headerContent}
            </div>
            
            <form id="${config.formId}">
                ${formContent}
                
                <div class="form-actions">
                    <button type="submit">Save Changes</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // Common form handling
        document.getElementById('${config.formId}').addEventListener('submit', (e) => {
            e.preventDefault();
            handleFormSubmit();
        });
        
        // Error handling
        function showError(message) {
            const existingError = document.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            
            const form = document.getElementById('${config.formId}');
            form.insertBefore(errorDiv, form.firstChild);
        }
        
        // Success handling
        function showSuccess(message) {
            const existingSuccess = document.querySelector('.success-message');
            if (existingSuccess) {
                existingSuccess.remove();
            }
            
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.textContent = message;
            
            const form = document.getElementById('${config.formId}');
            form.insertBefore(successDiv, form.firstChild);
            
            // Remove success message after 3 seconds
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 3000);
        }
        
        // Validation helpers
        function validateRequired(elementId, fieldName) {
            const element = document.getElementById(elementId);
            if (!element.value.trim()) {
                showError(\`\${fieldName} is required\`);
                element.focus();
                return false;
            }
            return true;
        }
        
        function validateUrl(url) {
            if (!url) return true; // Empty URL is valid
            
            try {
                new URL(url);
                return true;
            } catch {
                // Check if it's a valid relative path - simplified check
                return !url.includes('<') && !url.includes('>');
            }
        }
        
        // Sanitization helpers
        function sanitizeInput(value) {
            return value.trim().replace(/[<>]/g, '');
        }
        
        // Custom script content
        ${scriptContent}
        ${config.additionalScripts || ''}
    </script>
</body>
</html>`;
    }
    
    public static escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    public static sanitizeForAttribute(value: string): string {
        return value
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}