# Test-drive booking and timeslot management (KAN-28)

Frontend for the test-drive API on the backend `develop` branch. The code lives in `src/features/test-drive/`. The backend contract is `.sdd/features/kan-28-test-drive-timeslot-management/SPEC.md` in the backend repository.

## Screens

| URL | Who | Purpose |
| --- | --- | --- |
| `/admin/test-drives` | ADMIN, SALES_STAFF | Daily schedule grouped by slot; confirm, complete, no-show, reassign, cancel. |
| `/admin/base-settings`, section 04 | ADMIN edits, SALES_STAFF reads | Test-drive hours, lunch break, slot length, capacity. |
| `/xe/:stockCode`, "Đặt lịch lái thử" | CUSTOMER; visitors go to login first | Pick a date and slot, then book. Hidden for staff. |
| `/lich-lai-thu` | CUSTOMER | Own bookings with cancellation. Linked from the account menu. |

`/admin/test-drives` keeps its state in the URL: `date`, `status`, `staffId`, `attention=1`, `page`. With `attention=1` the date is dropped, so overdue bookings from earlier days stay visible.

## Rules the interface applies

All dates and times use `Asia/Ho_Chi_Minh`, whatever the device time zone. The backend remains the final authority; `getStaffActions` only hides buttons that would be refused.

| Status | Condition | Actions |
| --- | --- | --- |
| `PENDING` | Before slot end | Confirm, reassign, cancel |
| `PENDING` | After slot end | Reassign, cancel |
| `CONFIRMED` | Before start | Reassign, cancel |
| `CONFIRMED` | After start | Complete, no-show, reassign, cancel |
| `NO_SHOW` | ADMIN only | Correct to completed |
| `COMPLETED`, `CANCELLED` | | None |

If a request returns `INVALID_TRANSITION` or `TEST_DRIVE_NOT_FOUND`, someone else changed the booking first: the page shows a warning and reloads the list.

The staff filter and reassign list come from `GET /test-drives/staff`, open to ADMIN and SALES_STAFF. It returns only `id` and `fullName`.

Section 04 saves on its own through the API. `PUT /admin/base-settings` requires `contact`, `businessHours` and `testDrive`, so `saveTestDriveSettings` reads the latest values immediately before saving, sends back the first two unchanged and overlays only the test-drive fields edited in the form.

## Known gaps

| Gap | Effect | Needed from |
| --- | --- | --- |
| List response has no vehicle code or plate | Staff identify cars by make, model and year; no link to the car | Backend |
| `GET /test-drives` has no search | No search by booking code or customer | Backend |
| Showroom sections 01–03 save to `localStorage` only | Opening hours and days off set there do not affect slots; the backend reads `businessHours` from its own settings | KAN-38 frontend |
| Seat count groups bookings by exact start time | After a slot-length change, older bookings overlapping a slot are not counted in its label; the backend still blocks correctly | Accepted |
| `AdminLayout` CSS below 767 px | The content area of every admin page shrinks to about 144 px at a 390 px viewport | Shared layout fix |

## Verification

`npm run lint` on the changed paths, `npm test` and `npm run build` pass. Browser checks ran in headless Chrome against intercepted API responses written from the backend contract, with the clock fixed and the device time zone set to New York. They cover staff actions, conflict handling, role differences, settings validation and saving, booking with the nearest-slot fallback, and customer cancellation.

These checks do not exercise the live backend, real sessions or emails. Run the flows once against the backend `develop` branch before merging.
