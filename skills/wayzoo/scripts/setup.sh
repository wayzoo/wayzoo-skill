#!/usr/bin/env bash
# Optional wrapper for Linux/macOS. The real logic is in setup.mjs (Node 18+), which also runs natively on Windows.
exec node "$(dirname "$0")/setup.mjs" "$@"
