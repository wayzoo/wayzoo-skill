#!/usr/bin/env bash
# Optional wrapper for Linux/macOS. The real logic is in build.mjs (Node 18+), which also runs natively on Windows.
exec node "$(dirname "$0")/build.mjs" "$@"
