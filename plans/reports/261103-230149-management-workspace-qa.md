---
date: 2026-11-03
scope: shared management layout
mode: report-only; full existing test suite explicitly requested
---
# Shared management layout QA report

Build and existing unit suite pass. Exact requested lint command fails on local Chrome extension files. Excluding the browser profile produces a clean lint result. Management behavior has no direct coverage in the existing unit suite; browser verification belongs to the parent agent.

## Execution results

| Command | Exit | Result | Timing |
| --- | --- | --- | --- |
| npm.cmd run lint | 1 | 724 errors, 0 warnings; Chrome extension JavaScript under .verification.local/chrome/Default/Extensions | 36.844 s wall |
| npm.cmd run lint -- --ignore-pattern '.verification.local/**' | 0 | 0 errors, 0 warnings; diagnostic exclusion only | Final 8.477 s wall |
| npm.cmd run build | 0 | 3,288 modules transformed; one chunk-size warning | Final 1.73 s Vite; 3.099 s wall |
| npm.cmd test | 0 | 6/6 files, 44/44 tests passed; 0 failed, 0 skipped | Final 694 ms Vitest; 167 ms test bodies; 2.187 s wall |

Initial build also passed (2.33 s Vite); initial tests also passed (44 tests, 1.91 s Vitest). Overview JSX/CSS changed during verification, so build, filtered lint, and tests were rerun. SHA-256 checks over the 11 current implementation files found no changes during the final build. Two passing test runs show no observed intermittency; not a dedicated flakiness audit. No individual slow-test timings were emitted. No load, memory, or browser benchmarks performed.

Required page and route dependency files existed before build. No source edits, dependency installations, reverts, or browser actions performed. Build generated dist artifacts. Report is the only intentional authored file.

## Diff scope and mapping

Analyzed 16 changed/new files: 13 source/style entries and 3 documentation/plan entries.

- Deleted: src/VehicleIntakeApp.jsx; src/VehicleIntakeApp.module.css.
- Modified: src/layouts/AdminLayout.jsx; src/layouts/AdminLayout.module.css; src/pages/Admin/AdminCarsPage.jsx; src/pages/Admin/AdminCarsPage.module.css; src/pages/Login/LoginPage.jsx; src/router/AppRouter.jsx.
- New: src/pages/Admin/AdminOverviewPage.jsx; src/pages/Admin/AdminOverviewPage.module.css; src/pages/Admin/AdminVehicleIntakePage.jsx; src/router/LegacyRedirect.jsx; src/router/paths.js.
- Documentation/plan: src/features/vehicle-intake/README.md; docs/features/management-workspace.md; plans/2026-11-03-management-workspace.md.

Mapped: none using co-location, mirrored directory, or direct test-import searches. Ran full suite because explicitly requested: 44/44 tests, all passed. All six files are under src/features/vehicle-compare: constants/compareConstants.test.js, constants/compareLabels.test.js, store/useCompareStore.test.js, utils/compareErrors.test.js, utils/compareRows.test.js, utils/compareSelection.test.js.

[!] No tests found for current management route/layout/page modules or LoginPage. No direct tests found for associated CSS or deletion compatibility. Existing passing tests do not establish management acceptance.

## Lint failure and attribution

Raw lint reports 724 errors, 0 warnings, with 4 errors potentially autofixable. Examples from the extension sources: no-undef ('global', 'chrome', 'ActiveXObject'), no-unused-vars, no-cond-assign, no-empty. Babel also emits a generator deoptimization note for craw_background.js exceeding 500 KB. These are actual raw-command failures; the filtered diagnostic does not replace that result.

Evidence: error paths are .verification.local/chrome/Default/Extensions/...; excluding only .verification.local/** yields zero errors/warnings. eslint.config.js is unchanged from HEAD and ignores dist only. .gitignore excludes *.local, but the lint command still traverses the browser profile. This is workspace browser-artifact contamination, not an evidenced management-source lint regression. The time these artifacts were created was not established; do not claim the raw failure predates this task.

Git read operations also emitted permission warnings for C:/Users/Admin/.config/git/ignore and LF/CRLF notices. Git still returned the requested diffs. Required npm commands did not fail from sandbox access; no escalation needed.

## Build warning

Exact warning: "Some chunks are larger than 500 kB after minification."

Final main JavaScript chunk: 720.42 kB, gzip 227.70 kB. StateBlock chunk: 475.29 kB, gzip 159.16 kB. Overview and intake lazy chunks generated successfully. No unresolved-import or compilation errors. No baseline HEAD build executed; whether the size warning is pre-existing or introduced remains unproven.

## Scope review and coverage gaps

Static source inspection confirms the following wiring; runtime behavior remains for browser checks:

- AppRouter nests overview, inventory, and vehicle-intake under AdminRoute/AdminLayout; /admin redirects to overview. Canonical constants match /admin/overview, /admin/inventory, /admin/vehicle-intake.
- LegacyRedirect copies search/hash and uses replace for /admin/kho-xe and /quan-ly/nhap-xe destinations.
- AdminRoute allows ADMIN/SALES_STAFF, stores the requested location before login, and redirects other roles home. Guard is unchanged from HEAD.
- Password login preserves an /admin/ destination with query/hash; otherwise management roles default to overview.
- Inventory derives search from the URL, debounces API search by 400 ms, resets page on filter/search changes, and falls back to page 1 for invalid/nonpositive/noninteger page values.
- Overview uses four independent metadata-total requests plus a five-item recent request, with separate loading/error/empty handling and status-filter links.
- Intake adapter retains the prior feature integration and configurable save endpoint.

Line, branch, function coverage: unavailable. No coverage script/configuration or installed @vitest/coverage-v8 / @vitest/coverage-istanbul provider. No dependency installation attempted; no percentage or threshold compliance claimed. Vitest includes src/**/*.test.js in node environment, without a DOM setup.

Pre-existing scope limitation: LoginPage handleGoogleLogin still navigates completed profiles to '/' and incomplete profiles to '/hoan-tat-ho-so'; it does not preserve the admin destination. git show HEAD:src/pages/Login/LoginPage.jsx contains the same branch. Thus preservation is implemented for password login only; Google behavior is not introduced by this diff.

## Recommendations

1. Keep the raw lint gate marked failed until browser artifacts are kept outside ESLint's scan or explicitly excluded by the owning agent. Do not delete another agent's profile during active browser testing.
2. Add route tests for both roles, guest and denied-role access, both legacy URLs with query/hash, index navigation, replacement history, and password-login destination restoration.
3. Add inventory tests for reload/back/forward URL restoration, special-character search/clear, debounce and stale responses, filter/page interactions, invalid pages, and API 401/403/network/empty states.
4. Add overview tests for totals differing from returned row count, one metric failing independently, zero totals, recent ordering/limit, empty/error/loading states, and missing vehicle fields.
5. Parent browser checks should verify responsive shell, active navigation, account/logout actions, intake rendering, and inventory controls/styles. Unit/build results cannot certify these.
6. Resolve whether destination preservation must also cover Google login; if so, update that existing branch in a separate owned change. Assess bundle splitting with a baseline comparison before assigning regression ownership.

## Unresolved questions

- Does acceptance require preserving admin destination for Google login as well as password login?
- What are the parent agent's browser verification results?
- Was the >500 kB warning present in a baseline production build?
