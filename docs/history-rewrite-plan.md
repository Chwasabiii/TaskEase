History Rewrite & Push Plan (safe procedure)

Goal: remove `dev-logs/auth-smoke-test.log` from repo history using `git-filter-repo`, verify the cleaned mirror, and then coordinate a controlled force-push.

1) Preparation (do not run on main clone)
- Inform team and schedule a 15-30 minute window.
- Ensure all developers save local work and push branches.
- Create backups: `git bundle create repo-backup.bundle --all`.

2) Mirror clone
```
git clone --mirror git@github.com:YOUR_ORG/YOUR_REPO.git repo-mirror.git
cd repo-mirror.git
```

3) Run filter-repo to remove paths
```
# Example for one path
git filter-repo --invert-paths --path dev-logs/auth-smoke-test.log
```

4) Verify the mirror
- Inspect log and refs:
```
git log --all --pretty=format:'%h %an %ad %s' -- dev-logs/auth-smoke-test.log || echo 'No history for file'
```
- Run `git fsck` to check repository integrity.
- Optionally inspect `git show <commit>` where the file appeared previously.

5) Cleanup and GC
```
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

6) Coordinate push
- Announce 5 minutes before push.
- Push cleaned history:
```
git push --force --all
git push --force --tags
```

7) Post-push developer instructions
- All developers must run:
```
# safe reset to remote main
git fetch --all
git reset --hard origin/main
# for branches: rebase or re-push if needed
```
- Alternatively, clone fresh: `git clone git@github.com:YOUR_ORG/YOUR_REPO.git`.

8) Additional steps
- Rotate any secrets that may have been exposed.
- Verify CI/CD pipelines and deploy a test build.
- Monitor for issues and revert using `repo-backup.bundle` if severe problems occur.

Notes:
- This is destructive; ensure team buy-in and backups.
- If multiple paths or many files need removal, adapt `--paths-from-file` with a list.
