import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function redact(text) {
  if (!text) return text;
  return String(text)
    .replace(/(access_token|refresh_token|id_token|token)\s*[:=]\s*[^\s,\n\"]+/gi, '$1=[REDACTED]')
    .replace(/([A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})/g, '[REDACTED_JWT]')
    .replace(/Bearer\s+[A-Za-z0-9._-]{20,}/gi, 'Bearer [REDACTED]');
}

export const handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const body = event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body) : '';
    let parsed;
    try { parsed = JSON.parse(body); } catch (e) { parsed = { raw: body }; }

    // Redact known sensitive fields
    const content = redact(JSON.stringify(parsed, null, 2));

    // S3 client config from env
    const bucket = process.env.S3_BUCKET;
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
    if (!bucket) return { statusCode: 500, body: 'S3_BUCKET not configured' };

    const client = new S3Client({ region });
    const key = `dev-logs/${new Date().toISOString()}-${Math.random().toString(36).slice(2,8)}.log`;

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: 'text/plain',
      ServerSideEncryption: 'AES256'
    }));

    return { statusCode: 200, body: JSON.stringify({ ok: true, key }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
