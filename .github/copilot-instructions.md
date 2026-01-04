# Copilot instructions for Postcard

Purpose:
- Provide strict, short rules to generate code consistent with this repository.

Global rules:
- Produce TypeScript code only; follow the repository's existing coding patterns.
- Do not add new runtime dependencies, tools, or frameworks.
- Do not refactor existing code or change public APIs without explicit user approval.
- Keep changes minimal and focused to satisfy the requested task.

Language & style constraints:
- Prefer classes and `Base*` inheritance where present in existing code.
- Use explicit types and interfaces; follow the repository's naming conventions.
- Reuse existing utilities in `src/utils`, `src/services`, and `src/templates`.

Testing & build:
- Use the existing `test/` folder and the repo's npm scripts; do not introduce new test frameworks.
- Assume bundling is handled by `webpack.config.js`; do not change build tooling unless requested.

Where to add new code:
- Place new extension features under `src/` in the appropriate subfolder (`handlers`, `panels`, `services`, `storage`, `models`, `templates`).
- Put tests in `test/`.

What you must never do in this repo:
- DO NOT introduce new npm dependencies or external services.
- DO NOT reorganize or rename core folders (src/, panels/, handlers/, services/, storage/, templates/).
- DO NOT change `package.json` scripts or `webpack.config.js` unless explicitly requested.
- DO NOT add secrets, credentials, or environment-specific config into the repo.

If something is ambiguous, ask the user instead of guessing.
