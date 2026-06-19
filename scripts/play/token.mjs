#!/usr/bin/env node
// Mint a Google OAuth2 access token from the Play service-account key.
// As a module: import { getAccessToken } from './token.mjs'
// As a CLI:    node scripts/play/token.mjs  -> prints access_token
// Scope: androidpublisher (Play Developer API). Key path is gitignored.
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';

const SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

export async function getAccessToken(
  keyPath = process.env.PLAY_KEY || 'android/fastlane/play-store-key.json',
) {
  const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const header = b64({ alg: 'RS256', typ: 'JWT' });
  const claim = b64({
    iss: sa.client_email,
    scope: SCOPE,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  });
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claim}`);
  const sig = signer.sign(sa.private_key).toString('base64url');
  const jwt = `${header}.${claim}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`token error ${JSON.stringify(json)}`);
  return json.access_token;
}

// CLI mode
if (import.meta.url === `file://${process.argv[1]}`) {
  getAccessToken()
    .then((t) => process.stdout.write(t))
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
