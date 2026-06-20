import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migrations = [
  '../../supabase/migrations/20260611000001_haven_v121_production_schema.sql',
  '../../supabase/migrations/20260611000002_storage_rpc_security.sql',
  '../../supabase/migrations/20260611000003_full_feature_domain_tables.sql',
  '../../supabase/migrations/20260611000004_production_automation_realtime.sql',
  '../../supabase/migrations/20260611000005_compliance_care_release_ops.sql',
  '../../supabase/migrations/20260611000006_integrations_observability_grandchild.sql',
  '../../supabase/migrations/20260611000007_grandchild_unique_fix.sql',
  '../../supabase/migrations/20260611000008_phase3_safety_community_legacy.sql',
  '../../supabase/migrations/20260611000009_hardening_idempotency_integration_status.sql',
  '../../supabase/migrations/20260613000010_edge_authz_hardening.sql',
  '../../supabase/migrations/20260613000011_voice_interactions_self_write.sql',
].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8')).join('\n');

for (const table of ['profiles', 'medications', 'scam_events', 'location_events', 'companion_memory', 'audit_log', 'neighbourhood_profiles', 'carer_visit_logs', 'care_plans', 'vendor_register', 'browser_shield_events', 'grandchild_profiles', 'wearable_devices', 'driving_events', 'legacy_accounts']) {
  assert.ok(migrations.includes(`alter table ${table} enable row level security`), `${table} should enable RLS`);
  assert.ok(migrations.includes(`alter table ${table} force row level security`), `${table} should force RLS`);
}
assert.ok(migrations.includes('revoke select (location_precise)'), 'precise location column should be revoked');
assert.ok(migrations.includes('document_vault_elder_only'), 'document vault storage policy exists');
assert.ok(migrations.includes('create policy memory_elder_insert'), 'companion memory write policy exists');
assert.ok(migrations.includes('create policy audit_log_self_select'), 'audit log read policy exists');
assert.ok(migrations.includes('create policy voice_elder_insert'), 'voice interaction write policy exists');
console.log('rls-policy audit passed');
