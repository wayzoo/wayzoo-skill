#!/usr/bin/env bash
# Optional wrapper for Linux/macOS. The benchmark itself is measure.mjs (runs natively on Windows too).
exec node "$(dirname "$0")/measure.mjs" "$@"
