# Notes for AI agents working on this repo

- Never print compiled `.luau`; use `node skills/wayzoo/scripts/wayzoo.mjs build <dir>`.
- Use `node`, never `bash`, in commands and docs: the project must work on native Windows.
- Keep script output short. Do not add verbose logging.
- Edit TS files with small diffs.
- No dependencies in the scripts or tools (Node 18+ built-ins only).
- After changing `skills/wayzoo/`, run `node tools/pack.mjs` to rebuild `dist/wayzoo.skill`, then `node tools/test.mjs`.
- `.cmd` files must keep CRLF line endings (see `.gitattributes`).
