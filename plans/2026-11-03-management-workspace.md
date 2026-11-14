# Unify management workspace

Status: complete
Date: 2026-11-03

## Scope and acceptance
- Use the existing vehicle intake visual shell as the single AdminLayout for overview, inventory and intake.
- Provide English management URLs: /admin/overview, /admin/inventory, /admin/vehicle-intake.
- Preserve /admin/kho-xe and /quan-ly/nhap-xe as redirects, including query/hash.
- Protect all management pages with existing ADMIN / SALES_STAFF access rules.
- Keep Vietnamese UI copy and existing API/payload contracts; source identifiers and filenames use English.
- Keep inventory filters/pagination and intake validation/save behavior working.
- Show real management totals on overview, with loading and error states; do not invent financial metrics.
- No backend changes, public-site URL migration, sales/settings implementations, commits or deployment.

## Implementation plan
- [x] Extract the intake shell into AdminLayout with real NavLinks, authenticated profile and page-aware breadcrumb. Replace root intake app with a page adapter under pages/Admin.
- [x] Route all three pages through AdminRoute/AdminLayout, add compatibility redirects and English route constants. Integrate inventory styling/actions with the shared shell.
- [x] Add overview using the current management list endpoint and state handling.
- [x] Review changes, run lint, build and existing unit tests, and verify routing/auth/navigation and responsive UI with browser tooling if available.
- [x] Update feature documentation and mark this plan complete with validation results.

## Plan review
Reviewed against router, layout, auth store, inventory service/hook and intake exports. The shared shell owns presentation and Outlet only. Existing inventory and intake APIs remain unchanged. The legacy intake URL intentionally joins the existing authenticated management area.

## Follow-up completed
- [x] Use the supplied logo.jpg artwork in the management sidebar after removing its exterior background. Store optimized RGBA PNG in src/assets/logo-transparent.png; keep public-site original asset intact.

## Verification and limits
- Normal npm run lint passed after removing generated browser profile artifacts. ESLint configuration was not changed.
- npm run build passed. Main JavaScript chunk remains about 720 kB; Vite reports its size warning.
- npm test passed all 44 existing comparison tests across 6 files; this is regression coverage, not a management-specific unit suite.
- Isolated Chrome with intercepted fixture APIs passed shared layout/navigation, both aliases with query/hash, inventory search restoration/API parameters, intake checklist and invalid-submit validation, overview status requests, empty/error states, desktop/mobile overflow checks, unauthenticated and CUSTOMER denial, SALES_STAFF intake access, and no runtime exceptions.
- Code review reported no actionable defects. Additional pagination/filter-reset/password-return and valid-save browser checks could not run because the isolated CDP endpoint was unavailable; these flows were source-reviewed only.
- PNG alpha verified transparent corners and full 0..255 alpha range; artwork visually reviewed against the admin navy background.
- Live backend persistence and intake-to-inventory synchronization were not changed or verified. The existing intake adapter remains separate from /manage/cars.
- All implementation steps in this single-file plan reconciled; no phase files exist. No commit or deployment performed.
