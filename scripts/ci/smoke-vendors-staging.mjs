#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const envFileArg = process.argv.find((arg) => arg.startsWith('--env-file='));
const envFile = envFileArg ? envFileArg.split('=').slice(1).join('=') : '.env.staging';

function cleanValue(value) {
  return String(value ?? '').replace(/^[\s.-]+/, '').replace(/\s+$/, '');
}

function loadEnv(path) {
  const values = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    values[line.slice(0, idx).trim()] = cleanValue(line.slice(idx + 1));
  }
  return values;
}

function projectRef(values) {
  const fromId = values.STAGING_PROJECT_ID?.match(/[a-z0-9]{20}/)?.[0];
  if (fromId) return fromId;
  const fromUrl = values.STAGING_SUPABASE_URL?.match(/https:\/\/([a-z0-9]{20})\.supabase\.co/)?.[1];
  if (fromUrl) return fromUrl;
  throw new Error('Could not determine staging project ref');
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function check(name, fn) {
  try {
    const result = await fn();
    console.log(`ok ${name}${result ? ` - ${result}` : ''}`);
    return { name, ok: true };
  } catch (error) {
    console.log(`not ok ${name} - ${error.message}`);
    return { name, ok: false };
  }
}

function requireValue(values, name) {
  if (!values[name]) throw new Error(`${name} is missing`);
  return values[name];
}

function sentryEnvelopeEndpoint(dsn) {
  const url = new URL(dsn);
  const projectId = url.pathname.replace(/^\//, '').split('/').pop();
  const key = url.username;
  if (!projectId || !key) throw new Error('SENTRY_DSN is not parseable');
  return {
    endpoint: `${url.protocol}//${url.host}/api/${projectId}/envelope/`,
    key,
  };
}

const values = loadEnv(envFile);
const ref = projectRef(values);
const supabaseUrl = `https://${ref}.supabase.co`;
const anonKey = requireValue(values, 'STAGING_SUPABASE_ANON_KEY');
const elderJwt = requireValue(values, 'STAGING_ELDER_JWT');
const elderId = requireValue(values, 'STAGING_ELDER_ID');

const results = [];

results.push(await check('OpenAI models API', async () => {
  const key = requireValue(values, 'OPENAI_API_KEY');
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return `models=${Array.isArray(json.data) ? json.data.length : 'unknown'}`;
}));

results.push(await check('ElevenLabs models API', async () => {
  const key = requireValue(values, 'ELEVENLABS_API_KEY');
  const res = await fetch('https://api.elevenlabs.io/v1/models', {
    headers: { 'xi-api-key': key },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return `models=${Array.isArray(json) ? json.length : Array.isArray(json.models) ? json.models.length : 'reachable'}`;
}));

results.push(await check('MedMij/FHIR import Edge Function', async () => {
  const secret = requireValue(values, 'MEDMIJ_IMPORT_SECRET');
  const res = await fetch(`${supabaseUrl}/functions/v1/fn-medmij-fhir-import`, {
    method: 'POST',
    headers: {
      'x-medmij-secret': secret,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      elder_id: elderId,
      provider: 'codex-staging-smoke',
      resources: [{
        resourceType: 'MedicationRequest',
        id: `codex-med-${Date.now()}`,
        medicationCodeableConcept: { text: 'Codex staging smoke medication' },
        dosageInstruction: [{ text: 'Once daily for smoke test' }],
      }],
    }),
  });
  const json = await readJson(res);
  if (!res.ok || !json?.success) throw new Error(`HTTP ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
  return `job=${json.fhir_job_id}`;
}));

results.push(await check('Tink bank-connect initiate', async () => {
  const res = await fetch(`${supabaseUrl}/functions/v1/fn-bank-connect`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${elderJwt}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ action: 'initiate', elder_id: elderId }),
  });
  const json = await readJson(res);
  if (!res.ok || !json?.success || !String(json.tink_url ?? '').startsWith('https://link.tink.com/')) {
    throw new Error(`HTTP ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
  }
  return 'oauth_url_created';
}));

results.push(await check('WhatsApp webhook verification', async () => {
  const token = requireValue(values, 'WHATSAPP_VERIFY_TOKEN');
  const url = new URL(`${supabaseUrl}/functions/v1/fn-whatsapp-webhook`);
  url.searchParams.set('hub.mode', 'subscribe');
  url.searchParams.set('hub.verify_token', token);
  url.searchParams.set('hub.challenge', 'vendor_smoke_challenge');
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok || text !== 'vendor_smoke_challenge') throw new Error(`HTTP ${res.status} ${text.slice(0, 120)}`);
  return 'challenge_echoed';
}));

results.push(await check('WhatsApp Graph phone reachability', async () => {
  const phoneId = values.WHATSAPP_BUSINESS_PHONE_ID || values.WHATSAPP_PHONE_NUMBER_ID;
  const token = requireValue(values, 'WHATSAPP_ACCESS_TOKEN');
  if (!phoneId) throw new Error('WHATSAPP_BUSINESS_PHONE_ID/WHATSAPP_PHONE_NUMBER_ID missing');
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}?fields=id,verified_name,display_phone_number`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const json = await readJson(res);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
  return `verified_name=${json.verified_name ?? 'unknown'}`;
}));

results.push(await check('WhatsApp inbound webhook no-message payload', async () => {
  const res = await fetch(`${supabaseUrl}/functions/v1/fn-whatsapp-webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ entry: [] }),
  });
  const json = await readJson(res);
  if (!res.ok || json?.message !== 'no_messages') throw new Error(`HTTP ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
  return 'accepted';
}));

const whatsappRecipient = values.WHATSAPP_TEST_RECIPIENT_PHONE || values.WHATSAPP_TEST_TO_PHONE;
if (whatsappRecipient) {
  results.push(await check('WhatsApp outbound test message', async () => {
    const phoneId = values.WHATSAPP_BUSINESS_PHONE_ID || values.WHATSAPP_PHONE_NUMBER_ID;
    const token = requireValue(values, 'WHATSAPP_ACCESS_TOKEN');
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: whatsappRecipient,
        type: 'text',
        text: { preview_url: false, body: 'HAVEN staging smoke test.' },
      }),
    });
    const json = await readJson(res);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
    return 'message_api_accepted';
  }));
} else {
  console.log('skip WhatsApp outbound test message - WHATSAPP_TEST_RECIPIENT_PHONE not set');
}

results.push(await check('Sentry envelope event capture', async () => {
  const dsn = requireValue(values, 'SENTRY_DSN');
  const { endpoint, key } = sentryEnvelopeEndpoint(dsn);
  const eventId = crypto.randomUUID().replace(/-/g, '');
  const now = new Date().toISOString();
  const envelope = [
    JSON.stringify({ event_id: eventId, sent_at: now, dsn }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify({
      event_id: eventId,
      timestamp: now,
      platform: 'javascript',
      level: 'info',
      logger: 'haven.staging.vendor_smoke',
      message: 'HAVEN staging Sentry smoke event',
      environment: 'staging',
    }),
  ].join('\n');
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-sentry-envelope',
      'x-sentry-auth': `Sentry sentry_version=7, sentry_key=${key}, sentry_client=haven-vendor-smoke/1.0`,
    },
    body: envelope,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return `event_id=${eventId}`;
}));

const failures = results.filter((result) => !result.ok);
if (failures.length) {
  console.error(`vendor staging smoke failed: ${failures.map((f) => f.name).join(', ')}`);
  process.exit(1);
}

console.log('vendor staging smoke checks passed');
