#!/usr/bin/env bash
# Usage: setup.sh <project-dir>
# Creates a minimal non-interactive roblox-ts project. Safe to re-run (won't overwrite existing files).
set -euo pipefail
DIR="${1:-.}"
mkdir -p "$DIR/src/server" "$DIR/src/client" "$DIR/src/shared"
cd "$DIR"

[ -f package.json ] || npm init -y >/dev/null 2>&1
npm i -D roblox-ts typescript @rbxts/types @rbxts/compiler-types >/dev/null 2>&1
npm i @rbxts/services >/dev/null 2>&1

[ -f tsconfig.json ] || cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "downlevelIteration": true,
    "module": "commonjs",
    "moduleResolution": "Node",
    "moduleDetection": "force",
    "noLib": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "target": "ESNext",
    "typeRoots": ["node_modules/@rbxts"],
    "rootDir": "src",
    "outDir": "out",
    "baseUrl": "src",
    "incremental": true,
    "tsBuildInfoFile": "out/tsconfig.tsbuildinfo"
  }
}
EOF

[ -f default.project.json ] || cat > default.project.json <<'EOF'
{
  "name": "game",
  "globIgnorePaths": ["**/package.json", "**/tsconfig.json"],
  "tree": {
    "$className": "DataModel",
    "ReplicatedStorage": {
      "$className": "ReplicatedStorage",
      "rbxts_include": {
        "$path": "include",
        "node_modules": {
          "$className": "Folder",
          "@rbxts": { "$path": "node_modules/@rbxts" }
        }
      },
      "TS": { "$path": "out/shared" }
    },
    "ServerScriptService": {
      "$className": "ServerScriptService",
      "TS": { "$path": "out/server" }
    },
    "StarterPlayer": {
      "$className": "StarterPlayer",
      "StarterPlayerScripts": {
        "$className": "StarterPlayerScripts",
        "TS": { "$path": "out/client" }
      }
    },
    "SoundService": {
      "$className": "SoundService",
      "$properties": { "RespectFilteringEnabled": true }
    }
  }
}
EOF

echo "OK setup done in $(pwd)"
