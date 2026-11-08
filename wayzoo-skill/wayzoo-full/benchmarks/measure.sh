#!/usr/bin/env bash
# Reproduces the numbers in the README.
# Usage: bash benchmarks/measure.sh
# Needs: Node.js 18+, npm, internet (to install roblox-ts). Sizes are bytes of text;
# tokens scale roughly with bytes, so percentages are a good proxy.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
SK="$ROOT/skills/wayzoo/scripts"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT

bash "$SK/setup.sh" "$T" >/dev/null
mkdir -p "$T/src/server"

# A realistic-ish server file: 12 small functions
{
  echo 'import { Players } from "@rbxts/services";'
  echo 'interface PlayerData { coins: number; gems: number; pets: string[]; world: number; }'
  echo 'const store = new Map<number, PlayerData>();'
  for i in $(seq 1 12); do
    cat <<TS

function addCoins$i(player: Player, amount: number): number {
	const data = store.get(player.UserId);
	if (data === undefined) return 0;
	data.coins += amount * $i;
	for (const pet of data.pets) {
		if (pet === "Nova$i") data.gems += 1;
	}
	return data.coins;
}
TS
  done
  echo 'Players.PlayerAdded.Connect((p) => print(p.Name));'
} > "$T/src/server/economy.ts"

# 25 deliberate type errors
for i in $(seq 1 25); do echo "const e$i: number = \"oops$i\";"; done > "$T/src/server/bad.ts"

strip() { sed 's/\x1b\[[0-9;]*m//g'; }

RAW_ERR=$( (cd "$T" && npx --no-install rbxtsc 2>&1 || true) | strip | wc -c)
WAY_ERR=$( (bash "$SK/build.sh" "$T" 25 2>&1 || true) | wc -c)

rm "$T/src/server/bad.ts"
bash "$SK/build.sh" "$T" >/dev/null
TS=$(wc -c < "$T/src/server/economy.ts")
LUAU=$(wc -c < "$T/out/server/economy.luau")
touch "$T/src/server/economy.ts"
OK_LINE=$(bash "$SK/build.sh" "$T" | wc -c)

NAIVE=$((TS + LUAU + LUAU))      # write TS + read Luau back + push Luau to Studio
MCP=$((TS + LUAU))               # write TS + push changed Luau once
ROJO=$((TS + OK_LINE))           # write TS + one status line

pct() { awk -v a="$1" -v b="$2" 'BEGIN { printf "%.0f%%", (a - b) / a * 100 }'; }

echo "TypeScript source : $TS B"
echo "Compiled Luau     : $LUAU B"
echo
printf "%-48s %8s %8s %7s\n" "Scenario" "Naive" "Wayzoo" "Saving"
printf "%-48s %8s %8s %7s\n" "Compiler output, 25 errors" "$RAW_ERR" "$WAY_ERR" "$(pct "$RAW_ERR" "$WAY_ERR")"
printf "%-48s %8s %8s %7s\n" "Code to Studio via Rojo" "$NAIVE" "$ROJO" "$(pct "$NAIVE" "$ROJO")"
printf "%-48s %8s %8s %7s\n" "Code to Studio via MCP (no Rojo)" "$NAIVE" "$MCP" "$(pct "$NAIVE" "$MCP")"
