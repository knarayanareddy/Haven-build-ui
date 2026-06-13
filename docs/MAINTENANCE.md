# HAVEN Maintenance Plan

## Dependency maintenance

- Review dependencies weekly for security updates.
- Apply critical security patches immediately.
- Run `corepack pnpm test` after every update.

## Database maintenance

- Do not edit applied migrations.
- Run migration linting before production deployment.
- Review RLS changes with security owner.
- Review retention jobs monthly.

## Model/rule maintenance

- Review scam heuristic rules monthly.
- Update rule catalog when new Dutch scam patterns emerge.
- Track false positives and false negatives.
- Keep benign samples in the dataset to avoid over-alerting.

## Operational maintenance

- Review SLO alerts weekly.
- Review vendor/DPIA due dates monthly.
- Test right-to-erasure quarterly.
- Test data export quarterly.
