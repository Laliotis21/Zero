#!/usr/bin/env node
// Upload the high-res app icon + a minimal en-US store listing to Play.
// This is what makes the app icon appear in the Play Console app list
// (the grey-robot placeholder = no high-res icon uploaded yet).
// Usage: node scripts/play/upload-listing.mjs <icon512.png>
import { readFileSync } from 'node:fs';
import { getAccessToken } from './token.mjs';

const PKG = 'app.zerofinance.mobile';
const LANG = 'en-US';
const ICON = process.argv[2] || '/tmp/play-icon-512.png';
const BASE = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;
const UPLOAD = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PKG}`;

const listing = {
  language: LANG,
  title: 'Zero',
  shortDescription: 'Simple, private personal finance — budgets and insights.',
  fullDescription:
    'Zero is a clean, privacy-first personal finance app. Track spending, set budgets, and see clear insights into where your money goes. Upgrade to Zero Pro for unlimited budgets, advanced insights, and priority support.',
};

const token = await getAccessToken();
const auth = { Authorization: `Bearer ${token}` };

async function j(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url}\n${res.status} ${text}`);
  return text ? JSON.parse(text) : {};
}

// 1. open edit
const edit = await j('POST', `${BASE}/edits`);
const editId = edit.id;
console.log('editId', editId);

// 2. set listing text (required to commit)
await j('PUT', `${BASE}/edits/${editId}/listings/${LANG}`, listing);
console.log('listing set');

// 3. upload high-res icon (binary media upload)
const iconRes = await fetch(
  `${UPLOAD}/edits/${editId}/listings/${LANG}/icon?uploadType=media`,
  { method: 'POST', headers: { ...auth, 'Content-Type': 'image/png' }, body: readFileSync(ICON) },
);
const iconText = await iconRes.text();
if (!iconRes.ok) throw new Error(`icon upload ${iconRes.status} ${iconText}`);
console.log('icon uploaded');

// 4. commit
const committed = await j('POST', `${BASE}/edits/${editId}:commit`);
console.log('committed', committed.id || 'ok');
