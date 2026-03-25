# Superadmin Hardening TODO

This tracks the superadmin hardening work discovered during the production-readiness audit.

## Property Actions

- [x] Require CSRF validation on single-property approval and rejection
- [x] Require CSRF validation on single-property activate and suspend
- [x] Require CSRF validation on bulk property actions
- [x] Make single-property reject refresh compatibility, snapshots, shortlist artifacts, and cache versions
- [x] Make single-property suspend refresh compatibility, snapshots, shortlist artifacts, and cache versions
- [x] Make single-property activate refresh compatibility, snapshots, shortlist artifacts, and cache versions
- [x] Make bulk approve, reject, activate, and suspend all use the same artifact refresh path
- [x] Align dynamic route param handling with Next.js async `params` usage

## User Management Actions

- [x] Keep CSRF validation on user-role changes
- [x] Prevent silent DB/auth metadata drift when changing superadmin role
- [x] Roll back DB role changes if auth metadata sync fails
- [x] Make superadmin authorization rely on the canonical `users.is_superadmin` row
- [x] Keep self-revoke and last-superadmin safeguards in place
- [ ] Add dedicated user suspension / ban tooling once the product has a canonical account-status field

## Notes

- There is currently no safe schema-backed user suspension model in the codebase. That remains a separate feature, not part of this hardening pass.
