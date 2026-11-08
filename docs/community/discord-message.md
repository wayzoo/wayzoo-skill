<!--
roblox-ts Discord, channel #tools or #showcase. Under Discord's 2000-character limit; paste everything below this comment.
-->

**Wayzoo: roblox-ts + Claude, without burning your tokens** 🛠️

Open-source (MIT) Claude skill + tiny Node scripts. Claude writes the TS, `rbxtsc` compiles, Rojo syncs. The AI never reads or retypes the compiled Luau.

**What it does**
• `build`: one line on success, first N errors on failure, TS2307 import errors first with a path hint
• `deps`: lists installed `@rbxts` packages so the AI stops inventing imports
• Studio MCP is used for telemetry only (Output, playtest instance inspection), never to read Luau back
• Native Windows (cmd/PowerShell, no WSL), macOS, Linux. Node 18+ only

**Per build cycle (synthetic 3.3 KB TS file)**
```
Naive AI loop      [████████████████████] 10.6 KB
Wayzoo + MCP       [█████████████       ]  7.0 KB  -34%
Wayzoo + Rojo      [██████              ]  3.4 KB  -68%
```
Reproduce with `node benchmarks/measure.mjs`. One synthetic file, so real numbers welcome!

**Install**
• Claude Desktop / web: import `dist/wayzoo.skill` in Customize > Skills
• Claude Code: `node install.mjs --claude-code`

https://github.com/wayzoo/wayzoo-skill

Feedback on Studio MCP servers and Windows setups especially welcome 🙏
