Supabase & CI Secrets Rotation Checklist

1) Inventory keys and secrets
- Supabase Project Settings → API: note `anon`/`service_role` keys and JWT secret.
- Any other API keys in `.env` or config (Deepgram, SENTRY_DSN, AWS keys, etc.).
- CI secrets: GitHub Actions, Netlify, Vercel, Heroku, GitHub Pages deploy tokens.

2) Prepare new keys
- In Supabase Console, generate new `service_role` key and new JWT secret if supported.
- Create new service credentials for any third-party services.

3) Update all environments (do not delete old keys yet)
- Local: update `.env` files (do not commit).
- Netlify: Site → Settings → Build & deploy → Environment → Update variables.
- Vercel/Heroku: Update env vars/secrets in dashboard.
- GitHub Actions: `Settings → Secrets and variables → Actions` or use `gh secret set`.

Example: update GitHub secret via CLI
```
gh secret set SUPABASE_URL --body "https://<project>.supabase.co"
gh secret set SUPABASE_KEY --body "<new_key>"
```

4) Redeploy and test
- Redeploy staging first; run smoke tests (auth flow, API calls, DB reads/writes).
- Verify no failures and that new keys are used.

5) Revoke old keys
- Once verified, revoke old Supabase keys in the console.
- Update any long-lived tokens for third-party services.

6) Audit and monitoring
- Review Supabase audit logs for suspicious access during and after rotation.
- Increase monitoring/alerts temporarily for auth failures or unusual traffic.

7) Team communication
- Notify team of rotation, updated secrets, and required local updates.
- Share updated instructions for developers (how to get new secrets securely).

8) Post-rotation cleanup
- Remove any accidental key exposures from repos (use filter-repo/BFG if required).
- Rotate any other keys that may have been derived from the compromised secrets.

Notes:
- Rotate `service_role` first only if you can quickly update all server-side envs; otherwise rotate JWT or rotate in a rolling manner.
- Use short-lived tokens where possible and centralized secret stores (Vault, GitHub Secrets, Parameter Store).
