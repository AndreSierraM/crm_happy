#!/usr/bin/env node
// Happy CRM license toolkit — no dependencies, pure node:crypto.
// Keys: HAPPY-<base64url(json)>.<hex-hmac-sha256> firmados con HAPPY_LICENSE_SECRET.
// Uso:
//   node happy/scripts/happy-license.mjs generate --client "Acme" --edition pro --max-users 50 --max-workspaces 10 --days 365
//   node happy/scripts/happy-license.mjs validate --key "HAPPY-..." [--secret ...]
//   node happy/scripts/happy-license.mjs status --key "HAPPY-..." [--secret ...]
//   node happy/scripts/happy-license.mjs list
//   node happy/scripts/happy-license.mjs revoke --id <id>
//   node happy/scripts/happy-license.mjs audit [--repo .]
import { createHmac, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const storePath = join(repoRoot, 'happy', 'licenses.json');

const DEFAULT_SECRET = 'happy-dev-secret-change-me';

const getSecret = (cliSecret) =>
  cliSecret || process.env.HAPPY_LICENSE_SECRET || DEFAULT_SECRET;

const b64uEncode = (obj) =>
  Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url');
const b64uDecode = (s) =>
  JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));

const sign = (payloadB64, secret) =>
  createHmac('sha256', secret).update(payloadB64).digest('hex');

const loadStore = () => {
  if (!existsSync(storePath)) return { licenses: [] };
  try {
    const data = JSON.parse(readFileSync(storePath, 'utf8'));
    return Array.isArray(data.licenses) ? data : { licenses: [] };
  } catch {
    return { licenses: [] };
  }
};

const saveStore = (store) => {
  mkdirSync(dirname(storePath), { recursive: true });
  writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`);
};

const args = (flag, fallback = undefined) => {
  const i = process.argv.indexOf(flag);
  if (i === -1 || i + 1 >= process.argv.length) return fallback;
  return process.argv[i + 1];
};
const has = (flag) => process.argv.includes(flag);
const cmd = process.argv[2];

const isRevoked = (store, id) =>
  store.licenses.find((l) => l.id === id)?.revoked === true;

const validateKey = (key, secret) => {
  if (!key?.startsWith('HAPPY-')) return { ok: false, reason: 'BAD_PREFIX' };
  const parts = key.slice('HAPPY-'.length).split('.');
  if (parts.length !== 2) return { ok: false, reason: 'BAD_FORMAT' };
  const [payloadB64, signature] = parts;
  let payload;
  try {
    payload = b64uDecode(payloadB64);
  } catch {
    return { ok: false, reason: 'BAD_PAYLOAD' };
  }
  if (sign(payloadB64, secret) !== signature)
    return { ok: false, reason: 'BAD_SIGNATURE' };
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp)
    return { ok: false, reason: 'EXPIRED', payload };
  return { ok: true, payload };
};

if (cmd === 'generate') {
  const secret = getSecret(args('--secret'));
  if (secret === DEFAULT_SECRET)
    console.warn(
      'WARN: usando secreto de desarrollo. Define HAPPY_LICENSE_SECRET en producción.',
    );
  const now = Math.floor(Date.now() / 1000);
  const days = Number(args('--days', '365'));
  const payload = {
    v: 1,
    id: randomUUID(),
    client: args('--client', 'happy-client'),
    edition: args('--edition', 'pro'),
    maxUsers: Number(args('--max-users', '50')),
    maxWorkspaces: Number(args('--max-workspaces', '10')),
    iat: now,
    exp: now + days * 86400,
  };
  const payloadB64 = b64uEncode(payload);
  const key = `HAPPY-${payloadB64}.${sign(payloadB64, secret)}`;
  const store = loadStore();
  store.licenses.push({ ...payload, key, revoked: false });
  saveStore(store);
  console.log(JSON.stringify({ key, ...payload }, null, 2));
  console.log(
    `\nEnv:\nHAPPY_EDITION=${payload.edition}\nHAPPY_LICENSE_KEY=${key}\nHAPPY_MAX_USERS=${payload.maxUsers}\nHAPPY_MAX_WORKSPACES=${payload.maxWorkspaces}`,
  );
} else if (cmd === 'validate' || cmd === 'status') {
  const secret = getSecret(args('--secret'));
  const key = args('--key', process.env.HAPPY_LICENSE_KEY);
  if (!key) {
    console.error('Falta --key o HAPPY_LICENSE_KEY');
    process.exit(2);
  }
  const res = validateKey(key, secret);
  const store = loadStore();
  const revoked = res.payload ? isRevoked(store, res.payload.id) : false;
  const out = { ...res, revoked, ok: res.ok && !revoked };
  if (revoked) out.reason = 'REVOKED';
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.ok ? 0 : 1);
} else if (cmd === 'list') {
  const store = loadStore();
  for (const l of store.licenses) {
    console.log(
      `${l.revoked ? 'REVOKED' : 'ACTIVE '} ${l.id} | ${l.client} | ${l.edition} | users:${l.maxUsers} ws:${l.maxWorkspaces} | exp:${new Date(l.exp * 1000).toISOString().slice(0, 10)}`,
    );
  }
  if (store.licenses.length === 0) console.log('(sin licencias — usa generate)');
} else if (cmd === 'revoke') {
  const id = args('--id');
  if (!id) {
    console.error('Falta --id');
    process.exit(2);
  }
  const store = loadStore();
  const lic = store.licenses.find((l) => l.id === id);
  if (!lic) {
    console.error(`Licencia ${id} no encontrada`);
    process.exit(1);
  }
  lic.revoked = true;
  saveStore(store);
  console.log(`Revocada ${id} (${lic.client})`);
} else if (cmd === 'audit') {
  const { execSync } = await import('node:child_process');
  const root = args('--repo', repoRoot);
  let enterpriseFiles = 0;
  try {
    const out = execSync(
      `grep -rl "@license Enterprise" "${root}/packages/twenty-server/src" 2>/dev/null | wc -l`,
      { encoding: 'utf8' },
    );
    enterpriseFiles = Number(out.trim()) || 0;
  } catch {
    enterpriseFiles = -1;
  }
  const billingDefault = readFileSync(
    join(root, 'packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts'),
    'utf8',
  ).includes('IS_BILLING_ENABLED = false');
  console.log(
    JSON.stringify(
      {
        enterpriseFiles,
        enterpriseNote:
          'Archivos bajo Commercial License: solo dev/test sin suscripción EE. Producción con esos archivos requiere suscripción Twenty EE.',
        gatedEntitlements: [
          'SSO',
          'CUSTOM_DOMAIN',
          'RLS',
          'RECORD_SHARING',
          'AUDIT_LOGS',
          'USAGE_LIMIT',
        ],
        billingDisabledByDefault: billingDefault,
        happyLicenses: loadStore().licenses.length,
      },
      null,
      2,
    ),
  );
} else {
  console.log(`Happy CRM license toolkit
Comandos: generate | validate | status | list | revoke | audit
Ej: node happy/scripts/happy-license.mjs generate --client "Acme" --edition pro --max-users 50`);
  process.exit(2);
}
