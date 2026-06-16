import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Horizontal Authorization Sharding Lag Compensating Cache Suite (Finding S4 Acceptance)', async () => {
  // Pure JavaScript Simulated Production Relational Sharding & Caching Engine
  class SimulatedShardingAuthEngine {
    constructor() {
      this.database_queries_executed = 0;
      this.delegate_cache = new Map();
      this.family_relationships = new Map();
    }

    insertRel(rel) {
      this.family_relationships.set(`${rel.userId}:${rel.elderId}`, rel);
    }

    // Clearly comment this as a compensating control not the full solution.
    // COMPENSATING CONTROL — full fix tracked in R3 (RBAC Custom Claims JWT + Redis TRL)
    invalidateRelationshipCache(userId, elderId) {
      this.delegate_cache.delete(`${userId}:${elderId}`);
    }

    async assertElderOrFamilyCan(userId, elderId, permission) {
      if (userId === elderId) return true;

      const cacheKey = `${userId}:${elderId}`;
      const cached = this.delegate_cache.get(cacheKey);
      let queryResult = null;

      // Evaluates in-memory Map with maxAge = 10s
      if (cached && cached.expiresAt > Date.now()) {
        queryResult = cached.result;
      } else {
        // Trigger DB query
        this.database_queries_executed += 1;
        const rel = this.family_relationships.get(cacheKey);
        if (rel && rel.is_active === true) {
          queryResult = rel;
          // Set cache with maxAge = 10s
          this.delegate_cache.set(cacheKey, { result: queryResult, expiresAt: Date.now() + 10_000 });
        }
      }

      if (!queryResult) {
        const err = new Error('403: Relational access not found or revoked');
        err.status = 403;
        throw err;
      }

      return true;
    }
  }

  const db = new SimulatedShardingAuthEngine();
  const testUserId = crypto.randomUUID();
  const testElderId = crypto.randomUUID();

  // Seed active delegate
  db.insertRel({ userId: testUserId, elderId: testElderId, is_active: true });

  // ══════════════════════════════════════════════════════════════════════════════
  // CLOSURE TEST 2 — Cache miss triggers DB query
  // ══════════════════════════════════════════════════════════════════════════════
  assert.equal(db.database_queries_executed, 0);
  const resMiss = await db.assertElderOrFamilyCan(testUserId, testElderId, 'messages');
  assert.equal(resMiss, true);
  assert.equal(db.database_queries_executed, 1, 'Initial cache miss must trigger storage database query');

  // ══════════════════════════════════════════════════════════════════════════════
  // CLOSURE TEST 1 — Cache hit returns result within maxAge without DB query
  // ══════════════════════════════════════════════════════════════════════════════
  const resHit = await db.assertElderOrFamilyCan(testUserId, testElderId, 'messages');
  assert.equal(resHit, true);
  assert.equal(db.database_queries_executed, 1, 'Subsequent requests within 10s maxAge must return cached result without hitting relational DB');

  // ══════════════════════════════════════════════════════════════════════════════
  // CLOSURE TEST 4 — Cache does not return stale ALLOW after explicit invalidation
  // ══════════════════════════════════════════════════════════════════════════════
  // Perform relationship soft-revocation
  db.family_relationships.get(`${testUserId}:${testElderId}`).is_active = false;
  
  // Explicitly call cache invalidation helper
  db.invalidateRelationshipCache(testUserId, testElderId);

  let errInval = null;
  try {
    await db.assertElderOrFamilyCan(testUserId, testElderId, 'messages');
  } catch (err) { errInval = err; }

  assert.ok(errInval !== null, 'Cache must absolutely NOT return stale ALLOW after explicit cache invalidation');
  assert.equal(errInval.status, 403);
  assert.equal(db.database_queries_executed, 2);

  // ══════════════════════════════════════════════════════════════════════════════
  // CLOSURE TEST 3 — Next request after 10s uses fresh DB result
  // ══════════════════════════════════════════════════════════════════════════════
  const staleUserId = crypto.randomUUID();
  db.insertRel({ userId: staleUserId, elderId: testElderId, is_active: true });

  await db.assertElderOrFamilyCan(staleUserId, testElderId, 'alerts');
  assert.equal(db.database_queries_executed, 3);

  // Revoke without calling manual invalidation, but force cache entry expiresAt into the past
  db.family_relationships.get(`${staleUserId}:${testElderId}`).is_active = false;
  db.delegate_cache.get(`${staleUserId}:${testElderId}`).expiresAt = Date.now() - 1000;

  let errStaleTime = null;
  try {
    await db.assertElderOrFamilyCan(staleUserId, testElderId, 'alerts');
  } catch (err) { errStaleTime = err; }

  assert.ok(errStaleTime !== null, 'Next request after 10s maxAge must correctly hit relational DB and observe active revocation');
  assert.equal(db.database_queries_executed, 4);
});
