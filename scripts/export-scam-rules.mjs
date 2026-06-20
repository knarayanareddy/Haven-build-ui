import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { scamRules } from '../packages/scam-engine/src/catalog.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const out = join(repoRoot, 'ml', 'heuristics', 'rules.json');
writeFileSync(out, `${JSON.stringify(scamRules, null, 2)}\n`);
console.log(`Updated ${out}`);
