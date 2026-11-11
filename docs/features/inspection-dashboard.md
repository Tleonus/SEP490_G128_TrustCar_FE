# Inspection dashboard (KAN-34)

`/admin/inspection-dashboard` ("Tổng quan kiểm định" in the admin menu) gives ADMIN and SALES_STAFF an overview of CPO inspection work. The backend merged the INSPECTOR role into SALES_STAFF, so there is no separate inspector account. The page only reads data and links to the screens that do the work: the inspection queue and checklist from KAN-55 (`/admin/inspection`) and the sale approval screen from KAN-56 (`/admin/approval`). The code lives in `src/features/inspection-dashboard/`.

## Stage cards

| Card | Car status | Opens |
| --- | --- | --- |
| Mới nhập | `INCOMING` | `/admin/inventory?status=INCOMING` |
| Bản nháp | `DRAFT` | `/admin/inspection?status=DRAFT` |
| Đang kiểm định | `UNDER_INSPECTION` | `/admin/inspection?status=UNDER_INSPECTION` |
| Không đạt | `REJECTED` | `/admin/inspection?status=REJECTED` |
| Chờ mở bán | `APPROVED_CPO` | ADMIN: `/admin/approval`. SALES_STAFF: not a link, because that screen is ADMIN only |

The KAN-55 queue does not list `INCOMING` cars, so that card opens the inventory filtered to them.

## Oldest pending cars

Below the cards, the five cars with the earliest intake among `INCOMING`, `DRAFT`, `UNDER_INSPECTION` and `REJECTED` are listed with how many days they have waited. "Mở kiểm định" opens `/admin/inspection/:carId`, where KAN-55 loads the open draft or lets the user start one.

## Requests

Each load sends six `GET /manage/cars` requests: one `limit=1` request per card for its count, and one for the oldest list. The oldest list repeats the `status` parameter (`status=A&status=B`), which the backend turns into an `$in` filter. It reuses `listInspectionQueueCars` from the KAN-55 code, which gained an optional `sortDir` argument for this; its default stays `desc`.

## Known gaps

| Gap | Effect | Needed from |
| --- | --- | --- |
| No list or summary endpoint for inspection records | No per-inspector statistics and no draft owner | Backend |
| `AdminLayout` below 767 px | The content area of every admin page shrinks to about 144 px at a 390 px viewport | Shared layout fix |

## Verification

`npm test`, lint on the changed paths and `npm run build` pass. A headless Chrome check against intercepted API responses covered ADMIN and SALES_STAFF at 1440 px and ADMIN at 390 px: counts, card links by role, the oldest-list request and order, navigation from a card to the filtered queue and from a row to the inspection screen, and no horizontal page scroll. The live backend was not exercised.
