export class JsonFormatter {
    public static formatJson(obj: any, indent: number = 0): string {
        if (obj === null || obj === undefined) {
            return 'null';
        }
        
        if (typeof obj === 'string') {
            return `"${obj.replace(/"/g, '\\"')}"`;
        }
        
        if (typeof obj === 'number' || typeof obj === 'boolean') {
            return obj.toString();
        }
        
        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return '[]';
            }
            
            const items = obj.map(item => 
                '  '.repeat(indent + 1) + this.formatJson(item, indent + 1)
            ).join(',\n');
            
            return `[\n${items}\n${'  '.repeat(indent)}]`;
        }
        
        if (typeof obj === 'object') {
            const keys = Object.keys(obj);
            if (keys.length === 0) {
                return '{}';
            }
            
            const items = keys.map(key => {
                const value = this.formatJson(obj[key], indent + 1);
                return `${'  '.repeat(indent + 1)}"${key}": ${value}`;
            }).join(',\n');
            
            return `{\n${items}\n${'  '.repeat(indent)}}`;
        }
        
        return obj.toString();
    }
    
    public static isValidJson(str: string): boolean {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }
    
    public static prettyPrint(jsonString: string): string {
        try {
            const parsed = JSON.parse(jsonString);
            return this.formatJson(parsed);
        } catch {
            return jsonString; // Return original if not valid JSON
        }
    }
}