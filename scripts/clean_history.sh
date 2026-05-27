#!/usr/bin/env bash
# clean_history.sh
# Usage: Review then run locally. This script uses git-filter-repo to remove a file/path from history.
# IMPORTANT: This rewrites history. Coordinate with your team before pushing.

set -euo pipefail
if ! command -v git-filter-repo >/dev/null 2>&1 && ! command -v git-filter-repo.py >/dev/null 2>&1; then
  echo "git-filter-repo not found. Install with: pip install git-filter-repo"
  exit 1
fi

REPO_URL="git@github.com:YOUR_ORG/YOUR_REPO.git"
TARGET_PATHS=("dev-logs/auth-smoke-test.log")

# 1) Create a mirror clone
git clone --mirror "$REPO_URL" repo-mirror.git
cd repo-mirror.git

# 2) Remove the paths from history
# Use --invert-paths to KEEP everything except the given paths
for p in "${TARGET_PATHS[@]}"; do
  echo "Removing path: $p"
  git filter-repo --invert-paths --path "$p"
done

# 3) Cleanup and aggressive GC
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4) Verify
echo "History rewritten. Review the refs now."
# 5) Push back to remote (manual step — commented out for safety)
# git push --force --all
# git push --force --tags

echo "Done. To push cleaned history, run the commented git push commands after coordinating with your team."
