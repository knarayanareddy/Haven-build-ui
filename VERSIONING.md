# Versioning

HAVEN uses semantic versioning for repository releases.

## Version format

`MAJOR.MINOR.PATCH`

- MAJOR: incompatible schema/API changes or new regulatory scope.
- MINOR: new production feature or phase coverage.
- PATCH: bug fixes, hardening and documentation updates.

## Migration versioning

Supabase migrations use timestamped filenames:

```text
YYYYMMDDHHMMSS_description.sql
```

Never edit an applied migration. Add a new migration instead.

## App release versioning

- Elder app, family dashboard and Edge Functions should share a release tag.
- Feature flags gate staged rollouts.
- Production DB migrations require human approval.
