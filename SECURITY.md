# Security Policy

HAVEN handles vulnerable-user, health-adjacent, voice, location and family-access data. Treat security issues as urgent.

## Reporting a vulnerability

Do not open public issues for vulnerabilities. Email security@haven.nl with:

- affected component
- reproduction steps
- impact
- suggested remediation if known
- whether any personal data may be involved

## Response targets

| Severity | First response | Target fix/mitigation |
|---|---:|---:|
| Critical | 24 hours | 72 hours |
| High | 48 hours | 7 days |
| Medium | 5 business days | 30 days |
| Low | 10 business days | next planned release |

## Security boundaries

- No BSN collection, storage, processing or transmission.
- Service role key must never be exposed to clients.
- Family access must always be consent-scoped.
- Companion memory is elder-private.
- Precise location is short-lived and never shown to family.
- BUURT identities are hidden until double opt-in.

## Supported branches

Security fixes are applied to the active production branch and current staging branch.
