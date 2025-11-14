export class UrlHelper {
    /**
     * Combines a base URL with an endpoint to create a complete URL
     */
    public static combineUrls(baseUrl: string = '', endpoint: string = ''): string {
        if (!endpoint) {
            return baseUrl || '(no URL specified)';
        }
        
        // If endpoint is already a complete URL, return it as-is
        if (this.isAbsoluteUrl(endpoint)) {
            return endpoint;
        }
        
        // If no base URL, return the endpoint as-is
        if (!baseUrl) {
            return endpoint;
        }
        
        // Clean and combine the URLs
        const cleanBaseUrl = this.cleanTrailingSlash(baseUrl);
        const cleanEndpoint = this.cleanLeadingSlash(endpoint);
        
        return `${cleanBaseUrl}/${cleanEndpoint}`;
    }
    
    /**
     * Checks if a URL is absolute (starts with http:// or https://)
     */
    public static isAbsoluteUrl(url: string): boolean {
        return url.startsWith('http://') || url.startsWith('https://');
    }
    
    /**
     * Validates if a URL is properly formed
     */
    public static isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            // If it's not a complete URL, check if it's a valid relative path
            return this.isValidRelativePath(url);
        }
    }
    
    /**
     * Validates if a relative path is properly formed
     */
    public static isValidRelativePath(path: string): boolean {
        // Basic validation for relative paths
        if (!path || path.trim() === '') {
            return true; // Empty path is valid
        }
        
        // Check for invalid characters that would break URLs
        const invalidChars = /[<>"{}|\\^`\[\]]/;
        return !invalidChars.test(path);
    }
    
    /**
     * Validates if a base URL is properly formed
     */
    public static isValidBaseUrl(baseUrl: string): boolean {
        if (!baseUrl || baseUrl.trim() === '') {
            return true; // Empty base URL is valid
        }
        
        return this.isAbsoluteUrl(baseUrl) && this.isValidUrl(baseUrl);
    }
    
    /**
     * Extracts the protocol from a URL (http or https)
     */
    public static getProtocol(url: string): 'http' | 'https' | null {
        if (url.startsWith('https://')) {
            return 'https';
        } else if (url.startsWith('http://')) {
            return 'http';
        }
        return null;
    }
    
    /**
     * Removes trailing slash from a URL
     */
    private static cleanTrailingSlash(url: string): string {
        return url.replace(/\/$/, '');
    }
    
    /**
     * Removes leading slash from a path
     */
    private static cleanLeadingSlash(path: string): string {
        return path.replace(/^\//, '');
    }
    
    /**
     * Sanitizes URL input by trimming whitespace and removing dangerous characters
     */
    public static sanitizeUrl(url: string): string {
        return url.trim().replace(/[\s<>"{}|\\^`\[\]]/g, '');
    }
    
    /**
     * Gets URL preview text for display purposes
     */
    public static getUrlPreview(baseUrl: string = '', endpoint: string = ''): string {
        const combined = this.combineUrls(baseUrl, endpoint);
        
        if (combined === '(no URL specified)') {
            return combined;
        }
        
        // Truncate very long URLs for display
        if (combined.length > 100) {
            return combined.substring(0, 97) + '...';
        }
        
        return combined;
    }
}