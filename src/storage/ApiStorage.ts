import * as vscode from 'vscode';
import { ApiItem, FolderItem, FileItem } from '../models/ApiTreeItem';

export class ApiStorage {
    private static readonly STORAGE_DIR = '.apitester';
    private static readonly STORAGE_FILE = 'tests.json';
    private items: Map<string, ApiItem> = new Map();
    private workspaceRoot: string;
    private _initialized: boolean = false;

    constructor() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }
        this.workspaceRoot = workspaceFolders[0].uri.fsPath;
    }

    async initialize(): Promise<void> {
        await this.loadData();
        this._initialized = true;
    }

    private get storageDir(): string {
        return vscode.Uri.joinPath(vscode.Uri.file(this.workspaceRoot), ApiStorage.STORAGE_DIR).fsPath;
    }

    private get storageFile(): string {
        return vscode.Uri.joinPath(vscode.Uri.file(this.storageDir), ApiStorage.STORAGE_FILE).fsPath;
    }

    private async ensureStorageDir(): Promise<void> {
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(this.storageDir));
        } catch {
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(this.storageDir));
        }
    }

    private async loadData(): Promise<void> {
        try {
            const fileUri = vscode.Uri.file(this.storageFile);
            console.log(`Loading Postcard test data from: ${this.storageFile}`);
            const data = await vscode.workspace.fs.readFile(fileUri);
            const jsonData = JSON.parse(Buffer.from(data).toString());
            
            this.items.clear();
            for (const item of jsonData) {
                this.items.set(item.id, item);
            }
            console.log(`Loaded ${this.items.size} Postcard test items`);
        } catch (error) {
            // File doesn't exist or is invalid, start with empty data
            console.log('No existing Postcard test data found, starting fresh:', error);
            this.items.clear();
        }
    }

    private async saveData(): Promise<void> {
        try {
            await this.ensureStorageDir();
            const data = Array.from(this.items.values());
            const jsonData = JSON.stringify(data, null, 2);
            const fileUri = vscode.Uri.file(this.storageFile);
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(jsonData, 'utf8'));
            console.log(`Saved ${data.length} Postcard test items to: ${this.storageFile}`);
        } catch (error) {
            console.error('Failed to save Postcard test data:', error);
            vscode.window.showErrorMessage(`Failed to save Postcard test data: ${error}`);
        }
    }

    getChildren(parentId?: string): ApiItem[] {
        if (!this._initialized) {
            console.warn('Storage not initialized, returning empty children');
            return [];
        }
        return Array.from(this.items.values()).filter(item => item.parentId === parentId);
    }

    getItem(id: string): ApiItem | undefined {
        if (!this._initialized) {
            console.warn('Storage not initialized, returning undefined for item');
            return undefined;
        }
        return this.items.get(id);
    }

    async addFolder(name: string, baseUrl: string = '', parentId?: string): Promise<FolderItem> {
        const folder: FolderItem = {
            id: this.generateId(),
            name,
            type: 'folder',
            baseUrl,
            parentId
        };
        this.items.set(folder.id, folder);
        await this.saveData();
        return folder;
    }

    async addFile(name: string, url: string = '', parentId?: string): Promise<FileItem> {
        const file: FileItem = {
            id: this.generateId(),
            name,
            type: 'file',
            method: 'GET',
            url,
            headers: [
                { key: 'Content-Type', value: 'application/json', enabled: true }
            ],
            bodyType: 'none',
            body: '',
            description: '',
            parentId
        };
        this.items.set(file.id, file);
        await this.saveData();
        return file;
    }

    async updateItem(id: string, updates: Partial<ApiItem>): Promise<void> {
        const item = this.items.get(id);
        if (item) {
            Object.assign(item, updates);
            await this.saveData();
        }
    }

    async deleteItem(id: string): Promise<void> {
        console.log(`Storage: deleteItem called for ID: ${id}`);
        // Delete the item and all its children recursively
        const toDelete = [id];
        const processed = new Set<string>();

        while (toDelete.length > 0) {
            const currentId = toDelete.pop()!;
            if (processed.has(currentId)) {
                continue;
            }
            processed.add(currentId);

            // Find children of current item
            const children = Array.from(this.items.values()).filter(item => item.parentId === currentId);
            console.log(`Storage: Found ${children.length} children for item ${currentId}`);
            for (const child of children) {
                toDelete.push(child.id);
            }

            // Delete current item
            console.log(`Storage: Deleting item from memory: ${currentId}`);
            this.items.delete(currentId);
        }

        console.log('Storage: Saving data to disk');
        await this.saveData();
        console.log('Storage: Delete operation completed');
    }

    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }
}