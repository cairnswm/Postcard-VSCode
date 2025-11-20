export class BaseScript {
    public static getCommonScripts(): string {
        return `
        // Common form validation and utility functions
        function validateRequired(elementId, fieldName) {
            const element = document.getElementById(elementId);
            if (!element || !element.value.trim()) {
                showError(fieldName + ' is required');
                if (element) element.focus();
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
                // Check if it's a valid relative path
                return !url.includes('<') && !url.includes('>') && !url.includes('"');
            }
        }
        
        function sanitizeInput(value) {
            return value.trim().replace(/[<>]/g, '');
        }
        
        function showError(message) {
            hideMessages();
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            
            const form = document.querySelector('form');
            if (form) {
                form.insertBefore(errorDiv, form.firstChild);
            }
        }
        
        function showSuccess(message) {
            hideMessages();
            
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.textContent = message;
            
            const form = document.querySelector('form');
            if (form) {
                form.insertBefore(successDiv, form.firstChild);
            }
            
            // Remove success message after 3 seconds
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 3000);
        }
        
        function hideMessages() {
            const existingError = document.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            const existingSuccess = document.querySelector('.success-message');
            if (existingSuccess) {
                existingSuccess.remove();
            }
        }
        
        function getFormData(formId) {
            const form = document.getElementById(formId);
            if (!form) return {};
            
            const formData = new FormData(form);
            const data = {};
            
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            return data;
        }
        
        function setFormData(data) {
            for (const [key, value] of Object.entries(data)) {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = Boolean(value);
                    } else {
                        element.value = value || '';
                    }
                }
            }
        }
        
        function enableForm(enabled = true) {
            const form = document.querySelector('form');
            if (!form) return;
            
            const inputs = form.querySelectorAll('input, textarea, select, button');
            inputs.forEach(input => {
                input.disabled = !enabled;
            });
        }
        
        function addInputListener(elementId, callback) {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener('input', callback);
            }
        }
        
        function addChangeListener(elementId, callback) {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener('change', callback);
            }
        }
        
        function addClickListener(elementId, callback) {
            const element = document.getElementById(elementId);
            if (element) {
                console.log('📎 BaseScript: Adding click listener to element:', elementId);
                element.addEventListener('click', callback);
            } else {
                console.log('📎 BaseScript: Element not found for click listener:', elementId);
            }
        }
        
        // Form submission helper
        function createFormSubmissionHandler(formId, validationCallback, dataCallback) {
            return function(e) {
                e.preventDefault();
                
                // Validate form if validation callback provided
                if (validationCallback && !validationCallback()) {
                    return;
                }
                
                // Get form data
                const data = dataCallback ? dataCallback() : getFormData(formId);
                
                // Send to VS Code
                vscode.postMessage({
                    command: 'save',
                    ...data
                });
            };
        }
        `;
    }
    
    public static getTabScripts(): string {
        return `
        // Tab switching functionality
        function initializeTabs() {
            document.querySelectorAll('.tab-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const tab = button.dataset.tab;
                    switchToTab(tab);
                });
            });
        }
        
        function switchToTab(tabName) {
            // Update button states
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            const activeButton = document.querySelector('[data-tab="' + tabName + '"]');
            if (activeButton) {
                activeButton.classList.add('active');
            }
            
            // Update tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            const activeContent = document.getElementById(tabName + '-tab');
            if (activeContent) {
                activeContent.style.display = 'block';
            }
        }
        `;
    }
    
    public static getArrayManagementScripts(): string {
        return `
        // Array management for dynamic lists (like headers)
        function renderArray(containerId, array, itemRenderer) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            container.innerHTML = '';
            
            array.forEach((item, index) => {
                const element = itemRenderer(item, index);
                container.appendChild(element);
            });
        }
        
        function addArrayItem(array, defaultItem) {
            array.push(defaultItem || {});
            return array.length - 1;
        }
        
        function removeArrayItem(array, index) {
            if (index >= 0 && index < array.length) {
                array.splice(index, 1);
            }
        }
        
        function updateArrayItem(array, index, updates) {
            if (index >= 0 && index < array.length) {
                Object.assign(array[index], updates);
            }
        }
        `;
    }
}