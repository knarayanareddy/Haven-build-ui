# HAVEN Operations Guide

## Daily checks

- `fn-health-check` returns `status: ok`.
- SLO p95 checks are within budget.
- No open P0/P1 `slo_alerts`.
- No unprocessed critical `webhook_receipts`.
- No failed integration jobs in the last 24 hours.

## Weekly checks

- Confirm weekly digest generation.
- Review error trends.
- Review medication escalation volume.
- Review scam false-positive feedback.
- Review right-to-erasure queue.
- Review vendor and DPIA due dates.

## Monthly checks

- Refresh scam heuristic rules.
- Review drift in scam event patterns.
- Review accessibility feedback.
- Review incident response readiness.
- Review Supabase RLS changes.
- Confirm backups and restore process.

## Incident response

See:

- `docs/runbooks/PRODUCTION_RUNBOOK.md`
- `docs/release/PENTEST_SCOPE.md`
- `docs/implementation/HARDENING_CLOSURE_REPORT.md`

## SLOs

| SLO | Target |
|---|---|
| Voice pipeline p95 | <= 3s |
| Push delivery p95 | <= 5s |
| Safe-zone notification p95 | <= 15s |
| Medication reminder generation | daily job succeeds |
| Weekly digest | Monday morning job succeeds |

## Rollback

1. Disable affected feature flag.
2. Disable affected Edge Function route or secret.
3. Revert app rollout if needed.
4. Apply rollback migration only if reviewed.
5. Record incident if user data was affected.
