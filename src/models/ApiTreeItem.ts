import * as vscode from 'vscode';

export interface ApiItem {
    id: string;
    name: string;
    type: 'folder' | 'file';
    parentId?: string;
}

export interface FolderItem extends ApiItem {
    type: 'folder';
    baseUrl: string;
}

export interface FileItem extends ApiItem {
    type: 'file';
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    url: string;
    headers: { key: string; value: string; enabled: boolean; sensitive?: boolean }[];
    bodyType: 'none' | 'json' | 'form' | 'text' | 'xml' | 'binary';
    body: string;
    description?: string;
}

export class ApiTreeItem extends vscode.TreeItem {
    constructor(
        public readonly item: ApiItem,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(item.name, collapsibleState);
        
        this.id = item.id;
        this.contextValue = item.type;
        
        if (item.type === 'folder') {
            const folderItem = item as FolderItem;
            // Use globe icon for API collections/folders
            this.iconPath = new vscode.ThemeIcon('globe', new vscode.ThemeColor('charts.blue'));
            this.tooltip = `📁 ${folderItem.name}${folderItem.baseUrl ? `\n🌐 ${folderItem.baseUrl}` : ''}`;
            // Add subtle description for folders with base URLs
            if (folderItem.baseUrl) {
                this.description = `🌐 ${this.truncateUrl(folderItem.baseUrl)}`;
            }
        } else {
            const fileItem = item as FileItem;
            // Enhanced file icons and descriptions
            this.iconPath = this.getMethodIcon(fileItem.method);
            this.tooltip = `🧪 ${fileItem.name}\n📡 ${fileItem.method} ${fileItem.url}${fileItem.description ? `\n📝 ${fileItem.description}` : ''}`;
            // Show method and endpoint as description
            this.description = `${fileItem.method} ${this.truncateUrl(fileItem.url)}`;
        }

        this.command = {
            command: item.type === 'folder' ? 'postcard.openFolder' : 'postcard.openFile',
            title: 'Open',
            arguments: [item]
        };
    }

    private getMethodIcon(method: string): vscode.ThemeIcon {
        switch (method) {
            case 'GET': return new vscode.ThemeIcon('arrow-down', new vscode.ThemeColor('charts.green'));
            case 'POST': return new vscode.ThemeIcon('plus-circle', new vscode.ThemeColor('charts.blue'));
            case 'PUT': return new vscode.ThemeIcon('pencil', new vscode.ThemeColor('charts.orange'));
            case 'PATCH': return new vscode.ThemeIcon('edit', new vscode.ThemeColor('charts.yellow'));
            case 'DELETE': return new vscode.ThemeIcon('trash', new vscode.ThemeColor('charts.red'));
            case 'HEAD': return new vscode.ThemeIcon('eye', new vscode.ThemeColor('charts.purple'));
            case 'OPTIONS': return new vscode.ThemeIcon('gear', new vscode.ThemeColor('charts.gray'));
            default: return new vscode.ThemeIcon('circle-large-outline', new vscode.ThemeColor('charts.foreground'));
        }
    }

    private truncateUrl(url: string): string {
        const maxLength = 30;
        if (url.length <= maxLength) {
            return url;
        }
        return url.substring(0, maxLength - 3) + '...';
    }
}