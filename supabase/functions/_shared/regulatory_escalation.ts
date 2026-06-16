import { admin, dispatchNotification, sha256 } from "./core.ts";
import { captureException } from "./sentry.ts";

export interface RegulatoryEscalationPayload {
  incident_id: string;
  severity: string;
  timestamp: string;
  care_org_id: string;
  elder_id?: string;
}

export async function executeRegulatoryEscalation(
  incidentId: string,
  severity: string,
  elderId: string,
  careOrgId = "haven_thuiszorg_default"
): Promise<void> {
  // Closure Test 3: severity='laag' -> no escalation webhook called
  if (severity !== "kritiek") return;

  const db = admin();

  const payload: RegulatoryEscalationPayload = {
    incident_id: incidentId,
    severity,
    timestamp: new Date().toISOString(),
    care_org_id: careOrgId,
    elder_id: elderId,
  };

  const payloadString = JSON.stringify(payload);

  // Send signed JSON webhook to configurable endpoint in integration_connections
  const escalationTask = async () => {
    let webhookOutcome: "success" | "failure" = "failure";
    let httpStatus: number | null = null;
    let endpointUrl = "https://igj.haven.internal/webhook/v1/escalate";
    let vendorSecret = "secret_hmac_default";

    try {
      const { data: conn } = await db
        .from("integration_connections")
        .select("legal_gate, secret_names")
        .eq("integration_key", "igj_escalation")
        .maybeSingle();

      if (conn?.legal_gate) endpointUrl = conn.legal_gate;
      if (conn?.secret_names?.[0]) vendorSecret = conn.secret_names[0];

      const signature = await sha256(`${payloadString}:${vendorSecret}`);

      const res = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Haven-Regulatory-Signature": signature,
        },
        body: payloadString,
      });

      httpStatus = res.status;
      if (res.ok) {
        webhookOutcome = "success";
      } else {
        throw new Error(`Escalation endpoint returned HTTP ${res.status}`);
      }
    } catch (webhookErr) {
      webhookOutcome = "failure";
      await captureException(webhookErr, { fn: "executeRegulatoryEscalation", incident_id: incidentId });
      
      // On failure: dispatch admin alert via existing notification path
      const { data: admins } = await db.from("profiles").select("id").eq("role", "admin");
      for (const a of admins ?? []) {
        await dispatchNotification({
          recipient_id: String(a.id),
          elder_id: elderId,
          notification_type: "systeem",
          title_nl: "CRITICAL MISLUKT: IGJ Escalatie",
          title_en: "CRITICAL FAILED: IGJ Escalation",
          body_nl: `Het automatische escalatie-webhook voor zorgincident ${incidentId} is mislukt. Onderneem direct actie.`,
          body_en: `The automated regulatory escalation webhook for care incident ${incidentId} failed. Manual intervention required.`,
          data: { incident_id: incidentId, outcome: "failure" },
        }).catch(() => undefined);
      }
    }

    // Log outcome to audit_log
    await db.from("audit_log").insert({
      actor_id: "00000000-0000-0000-0000-000000000001",
      actor_role: "system",
      action: "REGULATORY_INCIDENT_ESCALATION",
      table_name: "incidents",
      record_id: incidentId,
      elder_id: elderId,
      extra: {
        severity,
        care_org_id: careOrgId,
        outcome: webhookOutcome,
        http_status: httpStatus,
        timestamp: payload.timestamp,
      },
    }).catch(() => undefined);
  };

  // Execute with a bounded 1500ms timeout so it never blocks the response waiting for escalation
  await Promise.race([
    escalationTask(),
    new Promise((_, resolve) => setTimeout(resolve, 1500)), // Non-blocking
  ]).catch(() => undefined);
}
