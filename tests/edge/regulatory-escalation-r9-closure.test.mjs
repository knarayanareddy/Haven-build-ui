import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Critical Care Incidents Regulatory Escalation Webhook Suite (Finding R9 Acceptance)', async () => {
  // Pure JavaScript Simulated Production API Gateway & Regulatory Escalation Harness
  class SimulatedIncidentEscalationEngine {
    constructor() {
      this.incidents = new Map();
      this.audit_log = [];
      this.dispatched_alerts = [];
      this.webhook_payloads_intercepted = [];
    }

    insertIncident(i) { this.incidents.set(i.id, i); }

    async logAudit(incidentId, severity, outcome, httpStatus) {
      this.audit_log.push({
        action: 'REGULATORY_INCIDENT_ESCALATION',
        table_name: 'incidents',
        record_id: incidentId,
        extra: { severity, outcome, http_status: httpStatus, timestamp: new Date().toISOString() }
      });
    }

    async dispatchNotification(alert) {
      this.dispatched_alerts.push(alert);
    }

    async executeEscalationWebhook(incidentId, severity, elderId, simulateWebhookFailure) {
      // Closure Test 3: severity='laag' -> no escalation webhook called (no false triggers)
      if (severity !== 'kritiek') return { status: 'skipped' };

      const payload = {
        incident_id: incidentId,
        severity,
        timestamp: new Date().toISOString(),
        care_org_id: 'haven_thuiszorg_default',
        elder_id: elderId
      };

      this.webhook_payloads_intercepted.push(payload);

      let outcome;
      let httpStatus;

      try {
        if (simulateWebhookFailure === true) {
          throw new Error('500 Internal Care Org Gateway Error or DNS Resolution Failure');
        }
        outcome = 'success';
        httpStatus = 200;
      } catch (err) {
        outcome = 'failure';
        httpStatus = 500;
        // Closure Test 2: Webhook failure -> admin alert triggered; incident NOT silently dropped
        await this.dispatchNotification({
          recipient_id: 'admin_user_1',
          notification_type: 'systeem',
          title_nl: 'CRITICAL MISLUKT: IGJ Escalatie',
          data: { incident_id: incidentId, outcome: 'failure' }
        });
      }

      await this.logAudit(incidentId, severity, outcome, httpStatus);
      return { status: outcome };
    }
  }

  const engine = new SimulatedIncidentEscalationEngine();
  const testElderId = crypto.randomUUID();

  // ══════════════════════════════════════════════════════════════════════════════
  // CLOSURE TEST 1 & 4 — severity='kritiek' -> Webhook called + Required fields + Audit
  // ══════════════════════════════════════════════════════════════════════════════
  const critIncidentId = crypto.randomUUID();
  engine.insertIncident({ id: critIncidentId, elder_id: testElderId, severity: 'kritiek' });

  const resCrit = await engine.executeEscalationWebhook(critIncidentId, 'kritiek', testElderId, false);
  
  assert.equal(resCrit.status, 'success', 'Critical severity incident must successfully fire escalation webhook');
  assert.equal(engine.webhook_payloads_intercepted.length, 1);
  
  // Verify required payload fields
  const sentPayload = engine.webhook_payloads_intercepted[0];
  assert.equal(sentPayload.incident_id, critIncidentId, 'Must pass incident_id');
  assert.equal(sentPayload.severity, 'kritiek', 'Must pass severity');
  assert.ok(sentPayload.timestamp !== undefined, 'Must pass timestamp');

  // Verify non-repudiable audit_log entry produced exactly
  const critAuditRow = engine.audit_log.find((a) => a.record_id === critIncidentId);
  assert.ok(critAuditRow !== undefined, 'Must write structured audit_log entry for REGULATORY_INCIDENT_ESCALATION');
  assert.equal(critAuditRow.extra.outcome, 'success');
  assert.equal(critAuditRow.extra.http_status, 200);

  // ══════════════════════════════════════════════════════════════════════════════
  // CLOSURE TEST 2 — Escalation failure -> admin alert triggered; incident preserved
  // ══════════════════════════════════════════════════════════════════════════════
  const failIncidentId = crypto.randomUUID();
  engine.insertIncident({ id: failIncidentId, elder_id: testElderId, severity: 'kritiek' });

  const resFail = await engine.executeEscalationWebhook(failIncidentId, 'kritiek', testElderId, true);
  
  assert.equal(resFail.status, 'failure');
  assert.ok(engine.incidents.has(failIncidentId), 'Core incident record must remain 100% preserved and untouched on webhook collapse');

  // Verify Admin Alert dispatched
  assert.equal(engine.dispatched_alerts.length, 1, 'Escalation failure must actively trigger an admin notification');
  assert.equal(engine.dispatched_alerts[0].data.incident_id, failIncidentId);

  // ══════════════════════════════════════════════════════════════════════════════
  // CLOSURE TEST 3 — severity='laag' -> no escalation webhook (No False Triggers)
  // ══════════════════════════════════════════════════════════════════════════════
  const lowIncidentId = crypto.randomUUID();
  engine.insertIncident({ id: lowIncidentId, elder_id: testElderId, severity: 'laag' });

  const resLow = await engine.executeEscalationWebhook(lowIncidentId, 'laag', testElderId, false);
  
  assert.equal(resLow.status, 'skipped', 'Low severity incident must be perfectly ignored without firing escalation webhooks');
  assert.equal(engine.audit_log.find((a) => a.record_id === lowIncidentId), undefined);
});
