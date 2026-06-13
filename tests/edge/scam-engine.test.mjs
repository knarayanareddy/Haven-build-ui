import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { scamRules, scoreScamText } from '../../packages/scam-engine/src/catalog.mjs';

const rulesJson = JSON.parse(readFileSync(new URL('../../ml/heuristics/rules.json', import.meta.url), 'utf8'));
assert.deepEqual(rulesJson, scamRules, 'rules.json should mirror the shared scam rule catalog');
const core = readFileSync(new URL('../../supabase/functions/_shared/core.ts', import.meta.url), 'utf8');
assert.ok(core.includes('packages/scam-engine/src/catalog.mjs'), 'edge runtime should import the shared scam rule catalog');

const bankScam = scoreScamText('Dit is de bank. Deel uw pincode nu direct en vertel niemand iets. Installeer AnyDesk.');
assert.equal(bankScam.level, 'rood');
assert.ok(bankScam.hits.length >= 3);

const benign = scoreScamText('Uw afspraak bij de huisarts is donderdag om 10 uur. Bel ons op het bekende nummer als u vragen heeft.');
assert.equal(benign.level, 'none');

console.log('scam-engine tests passed');
