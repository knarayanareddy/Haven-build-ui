# HAVEN Risk Register

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---:|---:|---|---|
| Broken RLS exposes elder data | Medium | Critical | Forced RLS, RLS tests, security review | Security/backend |
| Family misuse of monitoring | Medium | High | Granular consent, fuzzed location, revocation | Product/privacy |
| BSN accidentally uploaded in documents | Medium | High | UI warning, rejection triggers, document analysis flag | Product/backend |
| Scam false positives reduce trust | Medium | High | Calm copy, false-positive target, elder agency | ML/product |
| Scam false negatives miss fraud | Medium | High | Rule/LLM layers, reputation cache, family alerts | ML/security |
| Voice vendor outage | Medium | Medium | fallback response and offline queue | Backend/mobile |
| Push delivery delay | Medium | High | local med notifications, SLO monitoring | Mobile/backend |
| MedMij/PSD2 delays | High | Medium | feature flags, mock/sandbox status tracking | Integrations |
| Older adults find UI patronising | Medium | High | usability sessions, copy review, formal `u/uw` Dutch | Product/design |
| Location re-identification | Low | High | PC4/fuzzing, 24h precise TTL, no route history | Security/backend |
