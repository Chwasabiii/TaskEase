<#
clean_history.ps1
PowerShell variant to prepare and run git-filter-repo on Windows.
#>
param(
  [string]$RepoUrl = 'git@github.com:YOUR_ORG/YOUR_REPO.git',
  [string[]]$TargetPaths = @('dev-logs/auth-smoke-test.log')
)

if (-not (Get-Command git-filter-repo -ErrorAction SilentlyContinue)) {
  Write-Error "git-filter-repo not found. Install with: pip install git-filter-repo"
  exit 1
}

git clone --mirror $RepoUrl repo-mirror.git
Set-Location repo-mirror.git

foreach ($p in $TargetPaths) {
  Write-Output "Removing path: $p"
  git filter-repo --invert-paths --path $p
}

Write-Output "Running reflog expire and gc"
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Output "Done. Review the mirror repo under repo-mirror.git. Push only after coordination."
