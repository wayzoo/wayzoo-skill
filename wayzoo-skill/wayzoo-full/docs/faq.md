# FAQ

**Does this work without Claude?** Yes. `setup.sh` and `build.sh` are plain shell scripts.

**Do I need Rojo?** No, but it is the biggest saving. Without it you push changed Luau files by hand or through an MCP.

**Which Roblox Studio MCP works?** Untested so far. Tell us what you tried in an issue.

**Why not plain Luau?** TypeScript gives you types and refactoring tools. Wayzoo makes that cheap to use with an AI.

**Windows?** The scripts are bash. Use WSL or Git Bash.

**Is the percentage real?** It is measured on a synthetic file by `benchmarks/measure.sh`. Run it yourself.
