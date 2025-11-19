# Code Quality Improvement Tasks

This document tracks the implementation of code quality improvements identified in `CODE_QUALITY_REVIEW.md`.

**Status Legend:**
- ⬜ Not started
- 🔄 In progress  
- ✅ Completed

---

## High Priority (Address First - Impact on Reliability & Maintainability)

### 1. Standardize Error Handling Throughout Codebase

**Goal:** Ensure consistent, comprehensive error handling with proper user feedback

- [ ] Add try-catch blocks around async operations in `extension.ts`
  - [ ] Wrap `storage.addFolder()` calls in try-catch (lines 62-88)
  - [ ] Wrap `storage.addFile()` calls in try-catch (lines 90-116)
  - [ ] Wrap `storage.deleteItem()` calls in try-catch
  - [ ] Add user-friendly error messages via `vscode.window.showErrorMessage()`
- [ ] Fix incomplete error handling in `HttpClient.ts` request method
  - [ ] Wrap response event handlers (`data`, `end`) in try-catch (lines 68-82)
  - [ ] Prevent extension crashes from unhandled errors
- [ ] Document error handling policy
  - [ ] Create `CONTRIBUTING.md` or update existing docs with error handling guidelines
  - [ ] Define when to use Logger vs user-facing error messages

**Affected Files:**
- `src/extension.ts` (lines 62-88, 90-116)
- `src/utils/HttpClient.ts` (lines 68-82)

---

### 2. Extract Inline HTML/JavaScript from FolderEditPanel

**Goal:** Establish consistent template pattern across all panels matching FileEditPanel

- [ ] Create folder edit template classes
  - [ ] Create `src/templates/forms/FolderEditForm.ts`
    - [ ] Extract form generation logic from FolderEditPanel (lines 118-132)
    - [ ] Implement `generate()` method returning form HTML
  - [ ] Create `src/templates/html/FolderEditHtml.ts`
    - [ ] Extract HTML document structure from FolderEditPanel (lines 70-111)
    - [ ] Implement `generate()` method with proper composition
  - [ ] Create `src/templates/scripts/FolderEditScript.ts`
    - [ ] Extract JavaScript code from FolderEditPanel (lines 134-168)
    - [ ] Implement `generate()` method returning script content
- [ ] Refactor FolderEditPanel
  - [ ] Remove inline HTML strings (lines 70-111)
  - [ ] Remove inline script strings (lines 134-168)
  - [ ] Update `getHtmlContent()` to use new template classes
  - [ ] Test folder edit functionality after refactoring

**Affected Files:**
- `src/panels/FolderEditPanel.ts` (lines 64-168)
- New files: `src/templates/forms/FolderEditForm.ts`, `src/templates/html/FolderEditHtml.ts`, `src/templates/scripts/FolderEditScript.ts`

---

### 3. Refactor Large Classes with Multiple Responsibilities

**Goal:** Split large classes into focused, testable components following Single Responsibility Principle

#### 3a. Refactor extension.ts

- [ ] Extract command handlers from `extension.ts`
  - [ ] Create `src/commands/CommandRegistry.ts` or individual command handler functions
  - [ ] Move `addFolder` command handler logic
  - [ ] Move `addFile` command handler logic
  - [ ] Move `openFolder` command handler logic
  - [ ] Move `openFile` command handler logic
  - [ ] Move `deleteItem` command handler logic
  - [ ] Move `refresh` command handler logic
  - [ ] Move `clearResults` command handler logic
  - [ ] Move `importHttp` command handler logic
- [ ] Simplify `activate()` function
  - [ ] Keep only initialization and wiring logic
  - [ ] Register commands via CommandRegistry or imported handlers
  - [ ] Ensure function is under 100 lines

#### 3b. Refactor resultPanels.ts

- [ ] Split ApiTestResultsProvider into focused classes
  - [ ] Create `src/services/ResultsStateManager.ts`
    - [ ] Move result storage and grouping logic
    - [ ] Manage `results` array and `groupedResults` Map
    - [ ] Implement result selection and clearing
  - [ ] Create `src/templates/ResultsRenderer.ts`
    - [ ] Move HTML generation methods
    - [ ] Extract `_getTestNameHtml()`, `_getExecutionItemHtml()`, `_getResultDetailsHtml()`
    - [ ] Use ResultPanelTemplate for composition
  - [ ] Update `src/resultPanels.ts`
    - [ ] Keep only coordination logic
    - [ ] Delegate to ResultsStateManager and ResultsRenderer
    - [ ] Implement WebviewViewProvider interface

**Affected Files:**
- `src/extension.ts` (263 lines)
- `src/resultPanels.ts` (238 lines)
- New files: `src/commands/CommandRegistry.ts`, `src/services/ResultsStateManager.ts`, `src/templates/ResultsRenderer.ts`

---

## Medium Priority (Next Steps - Code Quality & Maintainability)

### 4. Eliminate Code Duplication

**Goal:** Apply DRY principle to reduce maintenance burden

- [ ] Extract parent folder detection helper in `extension.ts`
  - [ ] Create `getParentFolderIdFromSelection(currentSelection: ApiItem | undefined): string | undefined`
  - [ ] Replace duplicated logic in `addFolder` command (lines 70-78)
  - [ ] Replace duplicated logic in `addFile` command (lines 98-106)
  - [ ] Replace duplicated logic in `importHttp` command (lines 212-217)
- [ ] Create shared HTTP constants file
  - [ ] Create `src/config/HttpConstants.ts`
  - [ ] Define `HTTP_METHODS` array: `['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']`
  - [ ] Define `BODY_TYPES` array: `['none', 'json', 'form', 'text', 'xml', 'binary']`
  - [ ] Export as constants
- [ ] Import HTTP constants where needed
  - [ ] Update `src/handlers/FileEditMessageHandler.ts` (line 44)
  - [ ] Update `src/templates/forms/FileEditForm.ts` (lines 127, 137-144)
  - [ ] Remove hardcoded arrays
- [ ] Consolidate URL validation
  - [ ] Review validation in `src/handlers/BaseMessageHandler.ts` (lines 122-138)
  - [ ] Review validation in `src/handlers/FolderEditMessageHandler.ts` (lines 37-40)
  - [ ] Move common validation to `src/utils/UrlHelper.ts`
  - [ ] Import and use shared validation
- [ ] Standardize message handler creation in panels
  - [ ] Remove redundant `updateCurrentFile()` call in `FileEditPanel.ts` (line 91)
  - [ ] Remove redundant `updateCurrentFolder()` call in `FolderEditPanel.ts` (line 58)
  - [ ] Create handler only once in `updateContent()` methods

**Affected Files:**
- `src/extension.ts` (lines 70-78, 98-106, 212-217)
- `src/handlers/FileEditMessageHandler.ts` (line 44)
- `src/handlers/FolderEditMessageHandler.ts` (lines 37-40)
- `src/templates/forms/FileEditForm.ts` (lines 127, 137-144)
- `src/panels/FileEditPanel.ts` (line 91)
- `src/panels/FolderEditPanel.ts` (line 58)
- New file: `src/config/HttpConstants.ts`

---

### 5. Improve TypeScript Type Safety

**Goal:** Eliminate `any` usage and improve type definitions throughout

- [ ] Define base message interface
  - [ ] Create `src/types/Messages.ts` or add to existing types file
  - [ ] Define `BaseMessage` interface with `command: string` property
  - [ ] Define specific message types (SaveMessage, TestMessage, etc.)
- [ ] Update message handlers to use typed messages
  - [ ] Update `BaseMessageHandler.ts` to use generic constraints (line 22)
    - `handleMessage<T extends BaseMessage>(message: T): Promise<void>`
  - [ ] Update `validateSaveData()`, `handleTestMessage()`, etc. with proper types
- [ ] Create HTTP method union type
  - [ ] Define in `src/types/Http.ts`: `type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'`
  - [ ] Replace `any` cast in `src/extension.ts` (line 226)
  - [ ] Use `HttpMethod` type in FileItem interface
- [ ] Fix HttpClient header typing
  - [ ] Change headers type from `any` to `Record<string, string | string[] | undefined>` (line 46)
  - [ ] Update related code to handle typed headers
- [ ] Review and fix remaining `any` usage
  - [ ] Document any remaining `any` usage with justification comments

**Affected Files:**
- `src/handlers/BaseMessageHandler.ts` (lines 22, 55, 73, etc.)
- `src/extension.ts` (line 226)
- `src/utils/HttpClient.ts` (line 46)
- New file: `src/types/Messages.ts`, `src/types/Http.ts`

---

### 6. Standardize Logging Approach

**Goal:** Use Logger class consistently throughout codebase

- [ ] Add Logger instances to handlers
  - [ ] Add Logger to `BaseMessageHandler.ts`
    - [ ] Replace `console.warn` with Logger (line 47)
    - [ ] Create logger instance: `private readonly logger = Logger.create('BaseMessageHandler')`
  - [ ] Add Logger to `FolderEditMessageHandler.ts`
    - [ ] Replace all `console.log` statements (lines 65-67, 73-74, 83, 87, 90)
    - [ ] Create logger instance: `private readonly logger = Logger.create('FolderEditMessageHandler')`
- [ ] Add Logger to ApiStorage
  - [ ] Add Logger to `src/storage/ApiStorage.ts`
  - [ ] Replace all `console.log` statements (lines 43-55, 131-157)
  - [ ] Create logger instance: `private readonly logger = Logger.create('ApiStorage')`
- [ ] Remove remaining console usage
  - [ ] Search codebase for `console.log`, `console.warn`, `console.error`
  - [ ] Replace with appropriate Logger calls
- [ ] Consider VS Code OutputChannel support
  - [ ] Add OutputChannel to Logger class for production visibility
  - [ ] Create channel in extension activation
  - [ ] Pass channel reference to Logger

**Affected Files:**
- `src/handlers/BaseMessageHandler.ts` (line 47)
- `src/handlers/FolderEditMessageHandler.ts` (lines 65-90)
- `src/storage/ApiStorage.ts` (lines 43-55, 131-157)
- `src/utils/Logger.ts` (enhancement for OutputChannel)

---

### 7. Add Comprehensive Validation

**Goal:** Improve input validation and error reporting

- [ ] Validate parsed HTTP file data
  - [ ] Update `src/utils/HttpFileParser.ts` parse method
  - [ ] Add validation after parsing each request
  - [ ] Ensure method and URL are present and valid
  - [ ] Return validation errors instead of creating invalid test objects
  - [ ] Show user-friendly error messages for malformed .http files
- [ ] Strengthen URL validation
  - [ ] Review `src/handlers/BaseMessageHandler.ts` validateUrl method (lines 122-138)
  - [ ] Consider security implications of user-provided URLs
  - [ ] Be more specific about allowed relative paths
  - [ ] Add tests for edge cases
- [ ] Add response size limits to HttpClient
  - [ ] Update `src/utils/HttpClient.ts` request method
  - [ ] Add `maxResponseSize` configuration option (default 50MB)
  - [ ] Track response size as chunks arrive
  - [ ] Reject promise if size exceeds limit
  - [ ] Show appropriate error message to user

**Affected Files:**
- `src/utils/HttpFileParser.ts` (lines 21-80)
- `src/handlers/BaseMessageHandler.ts` (lines 122-138)
- `src/utils/HttpClient.ts` (lines 69-72)
- `src/config/Constants.ts` (add MAX_RESPONSE_SIZE)

---

## Low Priority (Quality Improvements - Polish & Optimization)

### 8. Extract Magic Numbers and Strings to Constants

**Goal:** Improve code readability with named constants

- [ ] Extract URL truncation length
  - [ ] Add `MAX_DESCRIPTION_LENGTH = 30` to Config class
  - [ ] Update `src/models/ApiTreeItem.ts` (line 74)
- [ ] Extract tree refresh delay
  - [ ] Verify `TREE_REFRESH_DELAY` is used (already exists in Config)
  - [ ] Add comment explaining why delay is needed
  - [ ] Update `src/extension.ts` (line 44)
- [ ] Extract CSS dimension constants
  - [ ] Review `src/templates/styles/ResultPanelStyles.ts`
  - [ ] Create CSS variable definitions or TypeScript constants
  - [ ] Document rationale for specific values
- [ ] Create shared HTTP constants (duplicate of task 4)
  - [ ] Already covered in task 4
  - [ ] Verify constants are used consistently

**Affected Files:**
- `src/models/ApiTreeItem.ts` (line 74)
- `src/extension.ts` (line 44)
- `src/templates/styles/ResultPanelStyles.ts` (various)
- `src/config/Constants.ts`

---

### 9. Improve CSS/JavaScript Template Organization

**Goal:** Better organize template code for maintainability

- [ ] Document template string approach
  - [ ] Add documentation explaining decision to use template strings vs separate files
  - [ ] Document in `src/templates/README.md` or similar
- [ ] Ensure consistent formatting
  - [ ] Review all template string formatting
  - [ ] Apply consistent indentation
  - [ ] Consider using a formatter for embedded languages
- [ ] Evaluate alternatives
  - [ ] Research CSS-in-JS libraries compatible with VSCode extensions
  - [ ] Evaluate feasibility of actual .css/.js resource files
  - [ ] Document findings and recommendations
- [ ] Implement chosen approach (if changing)
  - [ ] Create migration plan
  - [ ] Update template classes
  - [ ] Test all UI components

**Affected Files:**
- `src/templates/scripts/*.ts`
- `src/templates/styles/*.ts`
- New file: `src/templates/README.md`

---

### 10. Optimize Performance Where Needed

**Goal:** Improve performance in identified hot paths

- [ ] Implement partial DOM updates in results panel
  - [ ] Update `src/resultPanels.ts` `_update()` method (lines 99-103)
  - [ ] Use VS Code's webview messaging for incremental updates
  - [ ] Send only changed data to webview
  - [ ] Update client-side JavaScript to handle partial updates
  - [ ] Only regenerate full HTML on major state changes
- [ ] Replace custom JSON formatter
  - [ ] Review `src/utils/JsonFormatter.ts` usage
  - [ ] Replace with `JSON.stringify(obj, null, 2)` where appropriate
  - [ ] Keep custom formatter only if specific formatting is needed
  - [ ] Add custom replacer function if needed for special handling
- [ ] Update to modern JavaScript methods
  - [ ] Replace `substr` with `substring` in `src/storage/ApiStorage.ts` (line 161)
  - [ ] Search for other deprecated methods
  - [ ] Update to modern equivalents

**Affected Files:**
- `src/resultPanels.ts` (lines 99-103)
- `src/utils/JsonFormatter.ts` (entire file)
- `src/storage/ApiStorage.ts` (line 161)

---

### 11. Enhance Robustness

**Goal:** Improve code reliability and maintainability

- [ ] Improve JSON formatting
  - [ ] Replace manual JSON formatting with `JSON.stringify` (if not already done in task 10)
  - [ ] Handle circular references if needed
  - [ ] Update `src/utils/JsonFormatter.ts`
- [ ] Use crypto.randomUUID() for ID generation
  - [ ] Update `src/storage/ApiStorage.ts` (line 161)
  - [ ] Replace `Date.now() + Math.random()` with `crypto.randomUUID()`
  - [ ] Add fallback for environments without crypto.randomUUID
- [ ] Fix non-null assertion operator usage
  - [ ] Update `src/storage/ApiStorage.ts` (line 137)
  - [ ] Replace `toDelete.pop()!` with explicit check:
    ```typescript
    const currentId = toDelete.pop();
    if (!currentId) continue;
    ```
- [ ] Improve deep equality comparison
  - [ ] Review `src/handlers/BaseMessageHandler.ts` compareValues (lines 156-157)
  - [ ] Replace `JSON.stringify` comparison with proper deep equality
  - [ ] Use library or write specific comparison logic for headers arrays
- [ ] Improve string escaping
  - [ ] Update `src/utils/JsonFormatter.ts` escapeString method
  - [ ] Handle all JSON escape sequences: `\n`, `\r`, `\t`, `\\`, etc.

**Affected Files:**
- `src/utils/JsonFormatter.ts`
- `src/storage/ApiStorage.ts` (lines 137, 161)
- `src/handlers/BaseMessageHandler.ts` (lines 156-157)

---

### 12. Separate Model and View Concerns

**Goal:** Improve testability by separating data models from presentation logic

- [ ] Split ApiTreeItem class
  - [ ] Keep pure data interfaces in `src/models/ApiTreeItem.ts`
    - [ ] Keep `ApiItem`, `FolderItem`, `FileItem` interfaces
  - [ ] Create views directory
    - [ ] Create `src/views/` directory
    - [ ] Create `src/views/ApiTreeItemView.ts`
  - [ ] Move presentation logic to view class
    - [ ] Move icon mapping (lines 36-70)
    - [ ] Move tooltip generation
    - [ ] Move description formatting
    - [ ] Move command attachment
  - [ ] Update tree provider
    - [ ] Update `src/treeProvider.ts` to use ApiTreeItemView
    - [ ] Ensure proper separation between data and view

**Affected Files:**
- `src/models/ApiTreeItem.ts` (lines 25-80)
- `src/treeProvider.ts`
- New directory: `src/views/`
- New file: `src/views/ApiTreeItemView.ts`

---

## Additional Issues to Track

### Minor Issues from File Reviews

- [ ] Add JSDoc comments to public methods
  - [ ] Review all public APIs in handlers, services, utilities
  - [ ] Add comprehensive JSDoc comments
  - [ ] Document parameters, return values, and exceptions

- [ ] Improve two-phase initialization pattern
  - [ ] Review `src/panels/BaseWebviewPanel.ts` (line 20)
  - [ ] Consider explicit `initialize()` method
  - [ ] Or use static factory method for complete initialization
  - [ ] Document chosen pattern

- [ ] Aggressive character filtering in sanitizeUrl
  - [ ] Review `src/utils/UrlHelper.ts` sanitizeUrl method (line 102)
  - [ ] Consider if `[]` characters should be allowed for query parameters
  - [ ] Be more selective about which URL parts to sanitize
  - [ ] Document sanitization policy

---

## Progress Tracking

### Summary Statistics

**Total Tasks:** ~150 individual items
- High Priority: ~30 tasks
- Medium Priority: ~60 tasks  
- Low Priority: ~60 tasks

**Completion Status:**
- Not Started: 150 ⬜
- In Progress: 0 🔄
- Completed: 0 ✅

**Last Updated:** 2025-11-19

---

## Notes

- Tasks are organized by priority based on impact to reliability and maintainability
- Some tasks may depend on others - review dependencies before starting
- Test thoroughly after completing each task
- Update this document as tasks are completed
- Consider creating separate issues/PRs for each high-priority task
- Group related low-priority tasks for efficiency

---

## Related Documentation

- [CODE_QUALITY_REVIEW.md](CODE_QUALITY_REVIEW.md) - Detailed code quality analysis
- [README.md](README.md) - Project overview and setup
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines (create if doesn't exist)
