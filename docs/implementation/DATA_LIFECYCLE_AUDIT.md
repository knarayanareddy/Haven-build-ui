# HAVEN Data Lifecycle Audit

Last updated: 2026-06-13

## Scope

This audit tracks the current state of:

- elder data export coverage (`export_elder_data`)
- right-to-erasure coverage (`fn-right-to-erasure`)
- intentionally excluded internal/operational records

## Export coverage

The expanded export RPC now includes the main elder-facing domains:

- profile and elder profile
- family and carer relationships
- consent records and contacts
- medications, reminders, refill events, OCR jobs
- tasks, wellness, hydration, nutrition, vitals
- financial accounts and transactions
- family messages, notifications
- life stories and memory-lane photos
- documents and document-analysis jobs
- scam events, browser-shield events, call-reputation lookups
- location, cognitive check-ins, voice interactions, companion memory
- neighbourhood profile and interest mappings
- appointments, transport, telehealth
- care plans, care-plan items, visit logs, incidents, safeguarding reports
- safety digests
- driving, wandering, wearable data
- legacy accounts
- bereavement events
- grandchild profiles
- device sessions, notification preferences, push tokens
- FHIR import jobs, health-record imports, external care sync jobs
- app events
- emergency access tokens and access logs
- audit log

## Erasure coverage

The erasure workflow now covers:

### Soft-deleted where the schema supports `deleted_at`

- contacts
- medications
- tasks
- family messages
- life stories
- memory-lane photos
- documents
- companion memory
- scam events
- location events
- neighbourhood profiles
- financial accounts
- financial transactions
- nutrition logs
- browser-shield events
- care plans and care-plan items
- carer visit logs
- appointments
- transport requests
- telehealth sessions
- driving events
- wandering events
- wearable devices
- legacy accounts
- bereavement events
- grandchild profiles
- medication OCR jobs
- document analysis jobs
- FHIR import jobs
- external care sync jobs
- medication refill events

### Direct deletes / deactivations where records do not support `deleted_at`

- wellness check-ins
- hydration logs
- vital signs
- cognitive check-ins
- incidents
- safeguarding reports
- device sessions
- notification preferences
- push tokens (`is_active = false`)
- notifications
- call reputation lookups
- health record imports
- safety digests
- elder interest tags
- event interests
- emergency access tokens
- emergency profile access log
- app events
- idempotency keys

### Relationship shutdown

- family relationships are deactivated and de-consented
- carer relationships are deactivated and de-consented
- neighbourhood connections are ended with an erasure-specific reason

## Intentionally excluded from export

The export RPC currently excludes these internal-only / operational records by design:

- `idempotency_keys`
- `perf_metrics`
- `integration_connections`
- `webhook_receipts`

Rationale:
- they are operational controls rather than user-content records
- they may expose internal secrets, signatures, or platform-only observability metadata
- they are not required for the user-facing portability package

## Remaining caveats

Even after the expansion, production launch still needs:

- execution against a real Supabase instance
- legal confirmation of export package scope
- deletion verification with live RLS and storage objects
- storage/blob lifecycle validation outside SQL row deletion
- retention-policy sign-off for audit/security records that may be legally retained
