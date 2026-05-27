Team Notification Template — History Rewrite

Subject: [Action Required] Repository history rewrite scheduled — <REPO>

Hi team,

We discovered sensitive dev logs in the repo history and will rewrite history to remove them.

What we're doing
- We'll run `git filter-repo` on a mirror of the repo to remove `dev-logs/auth-smoke-test.log` from all history, then force-push the cleaned history to `origin`.

When
- Scheduled: <DATE & TIME> UTC
- Estimated downtime for pushes: ~10-20 minutes

What you must do BEFORE the window
1. Commit and push any local changes to avoid loss.
2. Note any unpushed branches (you may rebase them after the rewrite).
3. Do not push during the rewrite window.

What we'll do
- Create a backup bundle and a mirror clone.
- Run `git filter-repo` and verify the cleaned mirror.
- Force-push cleaned refs to `origin`.
- Announce when done.

What you must do AFTER the rewrite
Option A (recommended): Fresh clone
- Delete local copy and clone again:
  `git clone git@github.com:ORG/REPO.git`

Option B (if you must keep local repo): Reset to remote
```
git fetch --all
git reset --hard origin/main
```

Need help?
- If you have local changes you can't push before the rewrite, please contact me immediately.

Thanks,
[Your Name]
