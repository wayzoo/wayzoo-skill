#!/usr/bin/env bash
# Usage: build.sh <project-dir> [max-error-lines]
# Compiles TS -> Luau with rbxtsc. Prints ONE line on success (with the list of
# changed .luau files), or only the first N lines of errors on failure.
# Goal: never flood the conversation with compiler output.
set -uo pipefail
DIR="${1:-.}"
MAX="${2:-25}"
cd "$DIR" || { echo "ERR: directory not found: $DIR"; exit 2; }

[ -d node_modules/roblox-ts ] || { echo "ERR: roblox-ts not installed, run scripts/setup.sh first"; exit 2; }

mkdir -p out
BEFORE=$(mktemp)
# remember the state of out/ to list what changed afterwards
find out -name '*.luau' -o -name '*.lua' 2>/dev/null | sort | xargs -r md5sum > "$BEFORE" 2>/dev/null || true

LOG=$(mktemp)
if npx --no-install rbxtsc >"$LOG" 2>&1; then
  AFTER=$(mktemp)
  find out \( -name '*.luau' -o -name '*.lua' \) 2>/dev/null | sort | xargs -r md5sum > "$AFTER" 2>/dev/null || true
  CHANGED=$(diff "$BEFORE" "$AFTER" | grep '^>' | awk '{print $3}' | tr '\n' ' ')
  N=$(echo "$CHANGED" | wc -w)
  echo "OK build ($N file(s) changed): ${CHANGED:-none}"
  rm -f "$BEFORE" "$AFTER" "$LOG"
  exit 0
else
  echo "ERR build failed (first $MAX lines):"
  # strip ANSI colors, keep the useful part
  sed 's/\x1b\[[0-9;]*m//g' "$LOG" | grep -v '^\s*$' | head -n "$MAX"
  TOTAL=$(wc -l < "$LOG")
  [ "$TOTAL" -gt "$MAX" ] && echo "... ($((TOTAL - MAX)) more lines hidden)"
  rm -f "$BEFORE" "$LOG"
  exit 1
fi
