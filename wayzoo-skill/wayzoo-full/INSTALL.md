# Install

## As a Claude skill

1. Download `dist/wayzoo.skill` from this repo.
2. Open it in Claude and click **Save skill**.
3. Ask Claude to write your Roblox code in TypeScript.

## As plain scripts

Requirements: Node.js 18+, npm. Optional: [Rojo](https://rojo.space) for live sync.

```bash
git clone https://github.com/wayzoo/wayzoo.git
cd wayzoo-skill
bash skills/wayzoo/scripts/setup.sh my-game
bash skills/wayzoo/scripts/build.sh my-game
cd my-game && rojo serve
```

## Commands

| Command | What it does |
|---|---|
| `setup.sh <dir>` | Creates a roblox-ts project (server, client, shared) |
| `build.sh <dir> [N]` | Compiles; prints one line, or the first N error lines (default 25) |
| `rojo serve` | Syncs `out/` into Studio |
| `bash benchmarks/measure.sh` | Reproduces the token benchmark |

## Upgrade

Pull the repo and re-download `dist/wayzoo.skill`.
