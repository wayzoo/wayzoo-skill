# FAQ

**Does this work without Claude?** Yes. `setup`, `build`, `deps` and `doctor` are plain Node scripts.

**How do I install it in the Claude desktop app?** Customize > Skills > **+** > Create skill > Upload a skill, then pick `dist/wayzoo.skill`. Same steps in the browser. See [INSTALL.md](../INSTALL.md).

**Windows?** Native since 0.2.0, no WSL or Git Bash: `install.cmd`, then `.\wayzoo.cmd setup|build|deps|doctor`. Only Node 18+ is needed.

**Do I need Rojo?** No, but it is the biggest saving. Without it you push changed Luau files by hand or through an MCP.

**What does the Roblox Studio MCP do with Wayzoo?** Live telemetry only: reading Output, inspecting instances during playtests, starting and stopping playtests. Code always goes TypeScript -> `build` -> Rojo. The skill never reads compiled Luau back out of Studio. MCP tool names differ between servers; tell us which one you tried in an issue.

**Why not plain Luau?** TypeScript gives you types and refactoring tools. Wayzoo makes that cheap to use with an AI.

**How does the AI know which packages exist?** `wayzoo deps <dir>` prints the installed `@rbxts` packages and their types entry in a few lines.

**Wally?** Wally packages have no automatic types in roblox-ts. Wayzoo warns when it sees `wally.toml`; you write the `.d.ts` declarations. Fuller support is planned.

**Is the percentage real?** It is measured on a synthetic file by `benchmarks/measure.mjs`. Run it yourself.
