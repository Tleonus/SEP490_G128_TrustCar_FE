# Management workspace

Updated: November 3, 2026. This document describes the current frontend implementation. The final build, existing comparison tests, normal repository lint, and the fixture browser checks listed below passed. Additional flows remain source-reviewed only, and live backend validation remains pending.

## Shared shell and naming

Overview, inventory, and vehicle intake share [AdminLayout](../../src/layouts/AdminLayout.jsx), based on the original `VehicleIntakeApp` visual shell. The layout owns the sidebar, topbar, authenticated profile, account menu, and React Router `Outlet`. Shared shell styling lives in [AdminLayout.module.css](../../src/layouts/AdminLayout.module.css); each page keeps its own content styles.

The sidebar uses real `NavLink` destinations with active states. The profile uses `useAuthStore` user data and displays the authenticated name or email and role. The account menu provides home, password change, and logout actions. The old local role selector, fabricated navigation count, and notification indicator are no longer rendered.

The shared admin layout displays [logo-transparent.png](../../src/assets/logo-transparent.png), a 400 × 375 RGBA version of the existing `logo.jpg`. Its outer charcoal background was removed while preserving the original car, shield, and text. The image is 154 px wide on desktop and 44 px wide at viewport widths up to 760 px. The original [logo.jpg](../../src/assets/logo.jpg) remains in use by the public site header and footer.

Source names were already English. Canonical management URLs now use English; visible interface labels remain Vietnamese. Public URLs are unchanged, including `/xe`, `/xe/:stockCode`, `/dang-nhap`, `/ve-chung-toi`, and `/lien-he`.

## Routes and access

[AppRouter](../../src/router/AppRouter.jsx) nests the three pages under `/admin`, with `AdminRoute` wrapping `AdminLayout`. Canonical destinations are defined in [ADMIN_PATHS](../../src/router/paths.js).

| URL | Current behavior |
| --- | --- |
| `/admin` | Replaces the current history entry with `/admin/overview`. |
| `/admin/overview` | Renders `AdminOverviewPage` in the shared layout. |
| `/admin/inventory` | Renders the existing inventory page, `AdminCarsPage`, in the shared layout. |
| `/admin/vehicle-intake` | Renders `AdminVehicleIntakePage`, the intake adapter, in the shared layout. |
| `/admin/kho-xe` | Compatibility redirect to `/admin/inventory`. |
| `/quan-ly/nhap-xe` | Compatibility redirect to `/admin/vehicle-intake`; the destination requires management access. |

[AdminRoute](../../src/router/AdminRoute.jsx) allows authenticated users whose `user.roleName` is `ADMIN` or `SALES_STAFF`. Unauthenticated visitors are redirected to `/dang-nhap`, with the requested location stored in navigation state. Authenticated users with other roles are redirected to `/`. Intake is now covered by this guard, rather than exposed through a standalone page.

Both compatibility routes use [LegacyRedirect](../../src/router/LegacyRedirect.jsx), which replaces the history entry and preserves the query string and hash. For example, `/admin/kho-xe?status=AVAILABLE#results` becomes `/admin/inventory?status=AVAILABLE#results`; `/quan-ly/nhap-xe?source=legacy#form` becomes `/admin/vehicle-intake?source=legacy#form`. These examples describe URL preservation; they do not imply page behavior for arbitrary query parameters or anchors.

## Overview data

[AdminOverviewPage](../../src/pages/Admin/AdminOverviewPage.jsx) uses the existing `useAdminCars` hook and `getAdminCars` service. It makes separate list requests to `/manage/cars`, relative to the shared API client's configured base URL:

| Content | Request parameters | Displayed data |
| --- | --- | --- |
| All vehicles | `page=1`, `limit=1` | `meta.total` across all statuses. |
| Available vehicles | `page=1`, `limit=1`, `status=AVAILABLE` | `meta.total` for that status. |
| Incoming vehicles | `page=1`, `limit=1`, `status=INCOMING` | `meta.total` for that status. |
| Reserved vehicles | `page=1`, `limit=1`, `status=RESERVED` | `meta.total` for that status. |
| Recently listed vehicles | `page=1`, `limit=5`, `sortBy=listedDate`, `sortDir=desc` | Up to five vehicles from the response list. |

Totals come from pagination metadata, rather than the number of rows returned. Metric links open inventory, with the corresponding `status` query when applicable. The recent list shows vehicle identity, year, mileage, price, status, and listed date; it provides loading, error, and empty states.

Each metric resolves independently. Loading and failed requests show explicit messages; failed requests are not presented as zero vehicles. A successful response reporting a zero total can display zero.

## Inventory behavior retained

[AdminCarsPage](../../src/pages/Admin/AdminCarsPage.jsx) retains the existing inventory list API, status and brand filters, sorting, pagination, vehicle details, and stock aging display. Requests continue through [useAdminCars](../../src/hooks/useAdminCars.js) and [getAdminCars](../../src/services/adminCarService.js) to `/manage/cars`; this shell change introduces no replacement inventory endpoint.

| URL parameter | Behavior |
| --- | --- |
| `search` | Controls the search input; the API search value is debounced by 400 ms. |
| `status` | Selects the vehicle status filter. |
| `make` | Selects the brand filter. |
| `sort` | Selects sorting, mapped to API `sortBy` and `sortDir` parameters. |
| `page` | Selects the page; a missing value or a value that is not a positive integer falls back to page 1. |

Search is now synchronized with the URL, alongside the existing filters and pagination. Changing search, a filter, or sorting removes `page` to return to the first page. Search changes replace the current browser history entry. The page size remains 10, and pagination uses the response total. The filtered total displays a dash during loading or an error.

## Vehicle intake integration boundary

[AdminVehicleIntakePage](../../src/pages/Admin/AdminVehicleIntakePage.jsx) imports `VehicleIntakePage` and `saveVehicleIntake` through the feature's public exports and supplies the save callback. The old root files `src/VehicleIntakeApp.jsx` and `src/VehicleIntakeApp.module.css` have been removed. The shared layout now supplies their shell responsibilities.

The intake form, validation, five-checkbox inspection checklist, notes, and save payload remain owned by `src/features/vehicle-intake/`. Checklist selections record inspection information; they do not automatically assign a vehicle status or price. See the [intake specification](./vehicle-intake-spec.md) and [feature README](../../src/features/vehicle-intake/README.md).

The save flow connects directly to the real Backend using the shared authenticated Axios client (`src/services/api.js`):

| Step | Endpoint |
| --- | --- |
| 1. Create / update vehicle | `POST /api/v1/manage/cars` (or `PUT /api/v1/manage/cars/:id` when re-saving the same vehicle in the current session). |
| 2. Record 5-criteria inspection | `POST /api/v1/inspections/cars/:id/inspect`. |

The [intake API adapter](../../src/features/vehicle-intake/api/vehicleIntakeApi.js) maps the intake form fields (`brand -> make`, uppercase enums, numeric prices/mileage/year, ownership) and the 5-boolean checklist into the real Backend DTOs, automatically attaching the user's Bearer token and refresh handling via `src/services/api.js`. The standalone mock server on port 3001 (`server/vehicle-intake-api.mjs`) has been removed.

## Verification status and related documentation

The following final results were reported by the integration task on November 3, 2026:

| Check | Result and scope |
| --- | --- |
| Production build | Final logo build passed: 3,289 modules processed; the transparent logo PNG is 192.77 kB. The chunk-size warning remains, with the main bundle reported at approximately 720 kB. |
| Existing comparison tests | Passed: 44 of 44 tests across 6 files. There is no management-specific unit suite. |
| Source lint | Passed for application source. |
| Normal repository lint | `npm run lint` passed after browser cleanup. Initial false failures came from a generated Chrome extension profile; no ESLint configuration changes were needed. |

### Browser validation with fixture APIs

Browser checks used isolated headless Chrome with intercepted fixture API responses. The following checks passed within that environment:

- Unauthenticated management access redirects to login.
- The legacy inventory route preserves the query string and hash when redirecting.
- The workspace renders one sidebar and the active navigation state follows the current route.
- Inventory restores search from the URL and sends the corresponding API parameters.
- Intake retains its five inspection checkboxes; invalid submission sends no save request.
- The legacy intake route preserves the query string and hash when redirecting.
- Overview requests totals for the relevant vehicle statuses.
- Desktop and mobile layouts have no overflow in the checked viewports.
- Inventory renders empty and error states, and overview renders its error state.
- `SALES_STAFF` can access intake; `CUSTOMER` is blocked from management access.
- No runtime exceptions occurred during these checks.

These results validate frontend behavior against controlled fixtures. They do not verify a live backend, real authentication sessions, production data, or persistence.

### Source-reviewed flows and pending live validation

Further debugger-driven browser attempts could not run because the Chrome DevTools Protocol (CDP) connection was unavailable. Pagination, filter reset, return navigation after password login, and valid intake save success and error handling remain source-reviewed only. These flows were not runtime verified, and no passing browser results are claimed for them.

Live backend validation remains pending for authentication and authorization, `/manage/cars` totals and list responses, and intake saving through its configured endpoint. Backend persistence and any connection between intake records and inventory, overview, or public vehicle details remain unverified.

The earlier [vehicle detail inspection analysis](./vehicle-detail-inspection-analysis.md) describes the former standalone intake route and local role selector in finding H5. The routing and shell details in this document supersede that historical finding; the workspace change does not establish the backend or public inspection integration discussed in that analysis.
