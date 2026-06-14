import { admin, corsHeaders, dispatchNotification, json, readJsonBody, readRequestBody, recordMetric, requireFields, safeErrorMessage, sha256 } from "../_shared/core.ts";
import { withIdempotency } from "../_shared/idempotency.ts";
import { captureException } from "../_shared/sentry.ts";
import { verifyHmacSha256 } from "../_shared/webhook.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  const started = Date.now();
  try {
    const raw = await readRequestBody(req);
    const body = JSON.parse(raw) as Record<string, unknown>;

    // ─── P0-5 FIX: Always verify webhook signature for non-internal calls,
    // and NEVER allow internal header to bypass HMAC for PSD2 webhooks.
    // Internal calls still go through (for testing/admin) but they are
    // explicitly logged and flagged differently.
    const isInternalCall = !!(req.headers.get('x-haven-internal-key') || req.headers.get('x-internal-key'));
    const secret = Deno.env.get('PSD2_WEBHOOK_SECRET');
    const isLocal = Deno.env.get('HAVEN_ENV') === 'local' || Deno.env.get('ENVIRONMENT') === 'local';

    if (isInternalCall) {
      // Internal call: require the internal key AND still log the receipt.
      // This path exists for admin-triggered transaction review, not for
      // bypassing PSD2 signature verification. Internal calls do NOT skip
      // the verification audit trail.
      const { requireInternalAccess } = await import("../_shared/internal.ts");
      requireInternalAccess(req);
      await admin().from('webhook_receipts').insert({
        integration_key: 'psd2',
        signature_valid: null, // internal path — not a real webhook
        body_hash: await sha256(raw),
        event_type: 'transaction_internal',
      });
    } else {
      // External PSD2 webhook path — HMAC verification is MANDATORY
      if (!secret && !isLocal) {
        throw new Error('PSD2_WEBHOOK_SECRET must be configured for non-local transaction webhooks');
      }
      if (secret) {
        const valid = await verifyHmacSha256(raw, req.headers.get('x-haven-signature') ?? req.headers.get('x-tink-signature'), secret);
        await admin().from('webhook_receipts').insert({
          integration_key: 'psd2',
          signature_valid: valid,
          body_hash: await sha256(raw),
          event_type: 'transaction',
        });
        if (!valid) throw new Error('Invalid PSD2 webhook signature');
      }
    }

    requireFields(body, ["elder_id", "account_id_masked", "amount_cents", "transaction_date"]);
    const idem = (req.headers.get('idempotency-key') ?? body.idempotency_key ?? body.raw_reference) as string | undefined;
    const result = await withIdempotency({
      key: idem,
      functionName: 'fn-transaction-intercept',
      elderId: body.elder_id as string,
      requestBody: body,
      run: async () => {
        const db = admin();
        const amount = Number(body.amount_cents);
        const newPayee = Boolean(body.is_new_payee) || !body.counterparty_iban_masked;
        const anomaly = Math.min(100, (Math.abs(amount) > Number(body.alert_threshold_cents ?? 20000) ? 45 : 0) + (newPayee ? 35 : 0) + (body.scam_event_id ? 35 : 0));
        const flagged = anomaly >= 70;
        const { data: tx, error } = await db.from("financial_transactions").insert({
          elder_id: body.elder_id, financial_account_id: body.financial_account_id,
          account_id_masked: body.account_id_masked, bank_name: body.bank_name,
          amount_cents: amount, currency: body.currency ?? "EUR",
          counterparty_name: body.counterparty_name,
          counterparty_iban_masked: body.counterparty_iban_masked,
          description: body.description, transaction_date: body.transaction_date,
          anomaly_score: anomaly, flagged,
          linked_scam_event_id: body.scam_event_id, intercepted: flagged,
          source_provider: body.source_provider ?? "psd2",
          raw_reference_hash: body.raw_reference ? await sha256(String(body.raw_reference)) : null,
          is_internal: isInternalCall,
        }).select().single();
        if (error) throw error;
        if (flagged) {
          const { data: family } = await db.from("family_relationships").select("family_member_id").eq("elder_id", body.elder_id).eq("elder_consented", true).eq("is_active", true).eq("can_view_financials", true);
          await Promise.all((family ?? []).map((f) => dispatchNotification({
            recipient_id: f.family_member_id, elder_id: body.elder_id as string,
            notification_type: "scam_zwart", title_nl: "Ongewone betaling", title_en: "Unusual payment",
            body_nl: "HAVEN ziet een ongewone betaling. Bel rustig even mee.",
            body_en: "HAVEN sees an unusual payment. Please calmly check in.",
            data: { transaction_id: tx.id },
          })));
        }
        return { body: { success: true, transaction_id: tx.id, anomaly_score: anomaly, flagged, intercepted: flagged } };
      },
    });
    await recordMetric("fn-transaction-intercept", started, "success");
    return json(result.body, result.status ?? 200, req);
  } catch (e) {
    await captureException(e, { fn: 'fn-transaction-intercept' });
    await recordMetric("fn-transaction-intercept", started, "error");
    return json({ error: safeErrorMessage(e) }, 400, req);
  }
});