# Architecture Overview

**Entry point**
- `src/extension.ts` — activates the extension, registers commands, and wires top-level components.

**Major subsystems & responsibilities**
- `src/panels/` — Webview panel classes (file edit, folder edit, result panels); responsible for rendering UI and sending/receiving messages.
- `src/handlers/` — Message handlers that mediate webview messages and extension host operations (one handler per panel/feature).
- `src/services/` — Business logic: test runner, HTTP export, orchestration of requests and test execution.
- `src/storage/` — Persistent storage abstraction (reading/saving API tree and settings).
- `src/models/` — Domain models (API tree items, test results).
- `src/templates/`, `src/scripts/`, `src/styles/` — Webview asset generators (HTML, scripts, styles) and their helpers.
- `src/utils/` — Small utilities used across subsystems (HTTP client, parsers, formatters).

**Data flow (high level)**
- Webview UI → `handlers` (message) → `services` (business logic) → `storage` / `models` → respond back via `handlers` → Webview UI.

**Where to add new code**
- Feature UI/webviews: `src/panels/` + matching `src/handlers/` and templates.
- New business logic: `src/services/` and add small helpers to `src/utils/` or `src/models/` as needed.
- Persistent changes: `src/storage/` (keep storage shape backward-compatible).
- Tests: `test/` (mirror important behaviors and handlers).

**Assumptions**
- The extension is bundled by `webpack` for publishing; local development uses TypeScript build and npm scripts.
- Keep public APIs stable; prefer additive changes over breaking changes.
