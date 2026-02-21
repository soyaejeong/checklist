#!/bin/bash
# SessionStart hook: capture git status baseline for stop-guard comparison
cd "$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
git status --porcelain > /tmp/checklist-git-baseline.txt
