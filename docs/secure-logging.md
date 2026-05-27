Secure Logging Guide — S3 or Managed Service

Goal: stop writing sensitive logs to disk; instead use protected storage with RBAC and encryption.

Option A — AWS S3 (private bucket)
1) Create bucket
- AWS Console → S3 → Create bucket
- Block public access, enable default encryption (SSE-S3 or SSE-KMS)
- Set lifecycle rules for retention and archival

2) Create minimal IAM role/user for uploads
- Grant `s3:PutObject` and `s3:PutObjectAcl` only for the bucket path.
- Example policy (least privilege):
```
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject","s3:ListBucket"],
    "Resource": ["arn:aws:s3:::your-bucket-name","arn:aws:s3:::your-bucket-name/*"]
  }]
}
```

3) Server-side uploader (recommended)
- Use a server or Netlify function to accept logs, scrub/redact them, then upload to S3.
- Use presigned URLs for direct client uploads if needed (short expiry).

Node example (upload-redacted-log.js)
```js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function upload(bucket, key, body) {
  await s3.putObject({Bucket: bucket, Key: key, Body: body, ServerSideEncryption: 'AES256'}).promise();
}

function redact(text){ return text.replace(/(access_token|refresh_token|id_token)\s*[:=]\s*[^\s]+/gi, '$1=[REDACTED]'); }
```

4) Access controls and monitoring
- Enable CloudTrail for S3 access logs and alerts for unusual access.
- Use bucket policies to restrict writes to only the uploader principal.

Option B — Managed logging (Sentry, Datadog, Logflare)
- Use provider's SDK with project keys stored in secrets vault.
- Configure sensitive-data-scrubbing rules (Sentry has PII scrubbing).
- Set role-based access for team members.

Best practices
- Never log full tokens, credentials, or PII. Always redact before writing.
- Control log verbosity via environment variable (`LOG_LEVEL=info` in prod, `debug` only in dev).
- Rotate credentials used by logging pipeline and keep them out of code.
- Retention: keep logs only as long as needed for debugging/audit.

Migration steps for repo
1) Remove local dev-logs (done).
2) Add `dev-logs/` to `.gitignore` (done).
3) Implement a server-side uploader or configure SDK to send logs to managed service.
4) Audit codebase for other places writing files or printing secrets.
