#!/bin/bash
# Stop hook: blocks stopping if the assistant introduced uncommitted changes
# Compares current git status against a baseline saved at session start

baseline="/tmp/checklist-git-baseline.txt"

cd "$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0

# If no baseline exists, allow stop (session didn't capture one)
if [ ! -f "$baseline" ]; then
  exit 0
fi

current="$(git status --porcelain)"
saved="$(cat "$baseline")"

if [ "$current" != "$saved" ]; then
  echo "Uncommitted code changes detected. Run tests and commit with [B] or [S] prefix before stopping."
  exit 1
fi

exit 0
