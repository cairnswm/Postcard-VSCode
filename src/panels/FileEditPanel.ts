import * as vscode from "vscode";
import { FileItem, FolderItem } from "../models/ApiTreeItem";
import { BaseWebviewPanel } from "./BaseWebviewPanel";
import { FileEditMessageHandler } from "../handlers/FileEditMessageHandler";
import { FileEditHtml } from "../templates/html/FileEditHtml";
import { FileEditForm } from "../templates/forms/FileEditForm";
import { FileEditScript } from "../templates/scripts/FileEditScript";

export class FileEditPanel extends BaseWebviewPanel {
  public static currentPanel: FileEditPanel | undefined;
  public messageHandler: FileEditMessageHandler;

  public static createOrShow(
    extensionUri: vscode.Uri,
    file: FileItem,
    parentFolder: FolderItem | undefined,
    onUpdate: (updates: Partial<FileItem>) => Promise<void>,
    onTest?: (test: FileItem) => Promise<void>,
    onDelete?: () => Promise<void>
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (FileEditPanel.currentPanel) {
      FileEditPanel.currentPanel.reveal(column);
      FileEditPanel.currentPanel.updateContent(
        file,
        parentFolder,
        onUpdate,
        onTest,
        onDelete
      );
      return;
    }

    const panel = BaseWebviewPanel.createPanel(
      {
        viewType: "fileEdit",
        title: `📡 ${file.method} ${file.name}`,
        enableScripts: true,
      },
      extensionUri,
      column
    );

    FileEditPanel.currentPanel = new FileEditPanel(
      panel,
      extensionUri,
      file,
      parentFolder,
      onUpdate,
      onTest,
      onDelete
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    private file: FileItem,
    private parentFolder: FolderItem | undefined,
    private onUpdate: (updates: Partial<FileItem>) => Promise<void>,
    private onTest?: (test: FileItem) => Promise<void>,
    private onDelete?: () => Promise<void>
  ) {
    console.log('🚀 FileEditPanel: Constructor called for file:', file.name);
    super(panel, extensionUri);
    this.messageHandler = new FileEditMessageHandler(
      this.file,
      this.onUpdate,
      this.onTest,
      this.onDelete
    );
    console.log('🚀 FileEditPanel: MessageHandler created, calling setupWebview');
    // Setup webview after all properties are initialized
    this.setupWebview();
  }

  public updateContent(
    file: FileItem,
    parentFolder: FolderItem | undefined,
    onUpdate: (updates: Partial<FileItem>) => Promise<void>,
    onTest?: (test: FileItem) => Promise<void>,
    onDelete?: () => Promise<void>
  ) {
    console.log('🔄 FileEditPanel: updateContent called for file:', file.name);
    this.file = file;
    this.parentFolder = parentFolder;
    this.onUpdate = onUpdate;
    this.onTest = onTest;
    this.onDelete = onDelete;

    // Update the existing message handler instead of creating a new one
    console.log('🔄 FileEditPanel: Updating message handler callbacks');
    this.messageHandler.updateCurrentFile(file);
    this.messageHandler.updateCallbacks(this.onUpdate, this.onTest, this.onDelete);
    
    this.updateTitle(`📡 ${file.method} ${file.name}`);
    console.log('🔄 FileEditPanel: Calling setupWebview from updateContent');
    this.setupWebview(); // This will regenerate the HTML but won't duplicate message listeners
  }

  protected getHtmlContent(): string {
    const headerContent = FileEditHtml.generateHeader(this.file.name);
    const formContent = FileEditForm.generate({
      file: this.file,
      parentFolder: this.parentFolder,
    });
    const formActions = FileEditForm.generateFormActions();
    const scriptContent = FileEditScript.generate({
      headers: this.file.headers || [],
      baseUrl: this.parentFolder?.baseUrl,
    });

    return FileEditHtml.generate({
      title: "Postcard",
      headerContent,
      formContent,
      formActions,
      scriptContent,
    });
  }

  protected async handleMessage(message: any): Promise<void> {
    console.log("🔥 FileEditPanel: handleMessage invoked with message:", message);
    console.log("🔥 FileEditPanel: About to call messageHandler.handleMessage");
    await this.messageHandler.handleMessage(message);
    console.log("🔥 FileEditPanel: messageHandler.handleMessage completed");
  }

  public dispose(): void {
    FileEditPanel.currentPanel = undefined;
    super.dispose();
  }
}
