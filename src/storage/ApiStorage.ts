import * as vscode from 'vscode';
import * as path from 'path';
import { ApiItem, FolderItem, FileItem } from '../models/ApiTreeItem';
import { Config } from '../config/Constants';

export class ApiStorage {
    private static readonly STORAGE_DIR = Config.PATHS.APITESTER_FOLDER;
    private static readonly STORAGE_FILE = 'tests.json';
    private items: Map<string, ApiItem> = new Map();
    // In-memory cache for sensitive header values: maps fileId -> array of header values by index
    private sensitiveHeaderCache: Map<string, (string | undefined)[]> = new Map();
    private workspaceRoot: string;
    private output?: vscode.OutputChannel;
    private _initialized: boolean = false;

    constructor(output?: vscode.OutputChannel) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }
        this.workspaceRoot = workspaceFolders[0].uri.fsPath;
        this.output = output;
    }

    async initialize(): Promise<void> {
        this.log(`initialize() called. workspaceRoot=${this.workspaceRoot}`);
        await this.loadData();
        this._initialized = true;
        this.log(`initialize() finished. items in memory=${this.items.size}`);
    }

    private get storageDir(): string {
        return vscode.Uri.joinPath(vscode.Uri.file(this.workspaceRoot), ApiStorage.STORAGE_DIR).fsPath;
    }

    /**
     * Returns the path to the tests.json file to use. Prefers `.postcard/tests.json`,
     * but if that file does not exist will use `.pitester/tests.json` when present.
     */
    private async resolveStorageFilePath(): Promise<string> {
        const postcardPath = path.join(this.storageDir, ApiStorage.STORAGE_FILE);
        const postcardUri = vscode.Uri.file(postcardPath);

        this.log(`Checking for storage file at: ${postcardPath}`);
        try {
            await vscode.workspace.fs.stat(postcardUri);
            this.log(`Found storage file at: ${postcardPath}`);
            return postcardPath;
        } catch (e) {
            this.log(`No storage file at: ${postcardPath} (${String(e)})`);

            // postcard file not found, check legacy .pitester
            const legacyDir = path.join(this.workspaceRoot, '.pitester');
            const legacyPath = path.join(legacyDir, ApiStorage.STORAGE_FILE);
            const legacyUri = vscode.Uri.file(legacyPath);
            this.log(`Checking legacy path: ${legacyPath}`);
            try {
                await vscode.workspace.fs.stat(legacyUri);
                this.log(`Found legacy storage at: ${legacyPath}`);
                return legacyPath;
            } catch (le) {
                this.log(`No legacy storage at: ${legacyPath} (${String(le)})`);

                // none exist - check for single-file legacy '.apitester' in workspace root
                const apitesterPath = path.join(this.workspaceRoot, '.apitester');
                const apitesterUri = vscode.Uri.file(apitesterPath);
                this.log(`Checking for .apitester file at: ${apitesterPath}`);
                try {
                    const stat = await vscode.workspace.fs.stat(apitesterUri);
                    // If it's a file (legacy single-file storage), use it
                    if (stat.type === vscode.FileType.File) {
                        this.log(`Found .apitester file at: ${apitesterPath}`);
                        return apitesterPath;
                    }

                    // If it's a directory (legacy folder), look for tests.json inside
                    if (stat.type === vscode.FileType.Directory) {
                        const candidate = path.join(apitesterPath, ApiStorage.STORAGE_FILE);
                        const candidateUri = vscode.Uri.file(candidate);
                        try {
                            const cstat = await vscode.workspace.fs.stat(candidateUri);
                            if (cstat.type === vscode.FileType.File) {
                                this.log(`Found tests.json inside .apitester at: ${candidate}`);
                                return candidate;
                            }
                        } catch (inner) {
                            this.log(`No tests.json inside .apitester at: ${candidate} (${String(inner)})`);
                        }
                    }

                    // Not a file or doesn't contain tests.json
                    this.log(`.apitester exists but is not a readable storage file: ${apitesterPath}`);
                } catch (ae) {
                    this.log(`No .apitester file at: ${apitesterPath} (${String(ae)})`);
                }
                // none exist - return postcard path (used for saving/creation)
                return postcardPath;
            }
        }
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
            const storagePath = await this.resolveStorageFilePath();
            this.log(`Resolved storage path: ${storagePath}`);
            const fileUri = vscode.Uri.file(storagePath);
            this.log(`Attempting to read storage file: ${storagePath}`);
            const data = await vscode.workspace.fs.readFile(fileUri);
            this.log(`Read ${data.length} bytes from ${storagePath}`);
            const jsonData = JSON.parse(Buffer.from(data).toString());
            this.log(`Parsed JSON data, found ${Array.isArray(jsonData) ? jsonData.length : 'unknown'} items`);
            
            this.items.clear();
            for (const item of jsonData) {
                this.items.set(item.id, item);
            }
            this.log(`Loaded ${this.items.size} Postcard test items`);
        } catch (error) {
            // File doesn't exist or is invalid, start with empty data
            this.log(`No existing Postcard test data found or failed to read/parse file, starting fresh: ${String(error)}`);
            this.items.clear();
        }
    }

    private async saveData(): Promise<void> {
        try {
            await this.ensureStorageDir();
            const data = Array.from(this.items.values());
            const jsonData = JSON.stringify(data, null, 2);
            // Ensure the postcard directory exists (we always save into the configured storage dir)
            await this.ensureStorageDir();
            const storagePath = path.join(this.storageDir, ApiStorage.STORAGE_FILE);
            const fileUri = vscode.Uri.file(storagePath);
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(jsonData, 'utf8'));
            this.log(`Saved ${data.length} Postcard test items to: ${storagePath}`);
        } catch (error) {
            this.error(`Failed to save Postcard test data: ${String(error)}`);
            vscode.window.showErrorMessage(`Failed to save Postcard test data: ${error}`);
        }
    }

    getChildren(parentId?: string): ApiItem[] {
        if (!this._initialized) {
            this.warn('Storage not initialized, returning empty children');
            return [];
        }

        // Return clones with sensitive header values merged from the in-memory cache
        return Array.from(this.items.values())
            .filter(item => item.parentId === parentId)
            .map(item => this.cloneItemWithSensitiveValues(item));
    }

    getItem(id: string): ApiItem | undefined {
        if (!this._initialized) {
            this.warn('Storage not initialized, returning undefined for item');
            return undefined;
        }

        const item = this.items.get(id);
        if (!item) return undefined;
        return this.cloneItemWithSensitiveValues(item);
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
            // If headers are being updated, handle sensitive values (cache them and avoid persisting values)
            if ((updates as any).headers && Array.isArray((updates as any).headers)) {
                const incomingHeaders = (updates as any).headers as any[];
                const processed = this.processHeadersForSave(id, incomingHeaders);
                // Ensure we assign the processed headers (with sensitive values stripped)
                (updates as any).headers = processed;
            }

            Object.assign(item, updates);
            await this.saveData();
        }
    }

    async duplicateFile(id: string): Promise<FileItem | null> {
        const originalItem = this.items.get(id);
        if (!originalItem || originalItem.type !== 'file') {
            return null;
        }

        const originalFile = originalItem as FileItem;
        const duplicatedFile: FileItem = {
            ...originalFile,
            id: this.generateId(),
            name: `${originalFile.name} (Copy)`
        };

        this.items.set(duplicatedFile.id, duplicatedFile);
        // Copy any cached sensitive header values for the duplicated file
        const cached = this.sensitiveHeaderCache.get(originalFile.id);
        if (cached) {
            this.sensitiveHeaderCache.set(duplicatedFile.id, [...cached]);
        }
        await this.saveData();
        return duplicatedFile;
    }

    async deleteItem(id: string): Promise<void> {
        this.log(`deleteItem called for ID: ${id}`);
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
            this.log(`Found ${children.length} children for item ${currentId}`);
            for (const child of children) {
                toDelete.push(child.id);
            }

            // Delete current item
            this.log(`Deleting item from memory: ${currentId}`);
            this.items.delete(currentId);
            // Remove any cached sensitive header values
            if (this.sensitiveHeaderCache.has(currentId)) {
                this.sensitiveHeaderCache.delete(currentId);
            }
        }

        this.log('Saving data to disk');
        await this.saveData();
        this.log('Delete operation completed');
    }

    private log(message: string) {
        if (this.output) this.output.appendLine(`ApiStorage: ${message}`);
        else console.log(`ApiStorage: ${message}`);
    }

    private warn(message: string) {
        if (this.output) this.output.appendLine(`ApiStorage: WARN: ${message}`);
        else console.warn(`ApiStorage: WARN: ${message}`);
    }

    private error(message: string) {
        if (this.output) this.output.appendLine(`ApiStorage: ERROR: ${message}`);
        else console.error(`ApiStorage: ERROR: ${message}`);
    }

    /**
     * Returns a deep clone of the item with sensitive header values merged from the in-memory cache.
     */
    private cloneItemWithSensitiveValues(item: ApiItem): ApiItem {
        const cloned = JSON.parse(JSON.stringify(item));
        if (cloned.type === 'file') {
            const file = cloned as FileItem;
            const cache = this.sensitiveHeaderCache.get(item.id) || [];
            file.headers = (file.headers || []).map((h: any, idx: number) => {
                const copy = { ...h };
                // Treat `sensitive` as optional; only `true` means sensitive
                if (copy.sensitive === true) {
                    const cached = cache[idx];
                    if (typeof cached === 'string' && cached.length > 0) {
                        copy.value = cached;
                    } else {
                        copy.value = '';
                    }
                }
                return copy;
            });
        }
        return cloned;
    }

    /**
     * Processes incoming headers for saving: caches sensitive values and strips them from headers to persist.
     */
    private processHeadersForSave(itemId: string, headers: any[]): any[] {
        const cache: (string | undefined)[] = this.sensitiveHeaderCache.get(itemId) || [];

        const processed = headers.map((h, idx) => {
            const copy = { ...h };
            if (copy.sensitive === true) {
                // Cache the value in memory and clear it from persisted data
                cache[idx] = copy.value || '';
                copy.value = '';
            } else {
                // Not sensitive - if we have a cached sensitive value for this index, move it into value so it gets persisted
                if (cache[idx]) {
                    copy.value = cache[idx] || copy.value || '';
                    cache[idx] = undefined;
                }
            }
            return copy;
        });

        // Clean up trailing undefined entries in cache if none set
        this.sensitiveHeaderCache.set(itemId, cache);
        return processed;
    }

    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }
}