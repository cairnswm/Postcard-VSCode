import * as vscode from 'vscode';
import { ApiItem, ApiTreeItem } from './models/ApiTreeItem';
import { ApiStorage } from './storage/ApiStorage';

export class ApiTreeDataProvider implements vscode.TreeDataProvider<ApiItem>, vscode.TreeDragAndDropController<ApiItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ApiItem | undefined | null | void> = new vscode.EventEmitter<ApiItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ApiItem | undefined | null | void> = this._onDidChangeTreeData.event;

    dropMimeTypes = ['application/vnd.code.tree.postcard'];
    dragMimeTypes = ['application/vnd.code.tree.postcard'];

    constructor(private storage: ApiStorage) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ApiItem): vscode.TreeItem {
        const isFolder = element.type === 'folder';
        return new ApiTreeItem(
            element,
            isFolder ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
        );
    }

    getChildren(element?: ApiItem): Thenable<ApiItem[]> {
        if (!element) {
            // Return root items (items without parentId)
            return Promise.resolve(this.storage.getChildren());
        } else if (element.type === 'folder') {
            // Return children of the folder
            return Promise.resolve(this.storage.getChildren(element.id));
        } else {
            // Files don't have children
            return Promise.resolve([]);
        }
    }

    getParent(element: ApiItem): vscode.ProviderResult<ApiItem> {
        // If the item has no parentId, it's a root item with no parent
        if (!element.parentId) {
            return null;
        }
        
        // Get the parent item from storage
        const parent = this.storage.getItem(element.parentId);
        return parent || null;
    }

    async handleDrag(source: ApiItem[], treeDataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        treeDataTransfer.set('application/vnd.code.tree.postcard', new vscode.DataTransferItem(source));
    }

    async handleDrop(target: ApiItem | undefined, sources: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        const transferItem = sources.get('application/vnd.code.tree.postcard');
        if (!transferItem) {
            return;
        }
        
        const items: ApiItem[] = transferItem.value;
        for (const item of items) {
            // Determine new parent ID
            let newParentId: string | undefined;
            if (target) {
                // If target is a folder, move into it; if it's a file, move to its parent
                newParentId = target.type === 'folder' ? target.id : target.parentId;
            }
            // If target is undefined, move to root (parentId = undefined)

            // Update the item's parent
            await this.storage.updateItem(item.id, { parentId: newParentId });
        }
        
        this.refresh();
    }
}

