# Vehicle Intake — Nhập xe & thẩm định TrustCar

Module frontend dùng chung cho **admin/chủ cửa hàng** và **staff**. Mỗi tính năng có tên theo nghiệp vụ; vai trò được quản lý bằng routing và phân quyền của dự án nhóm.

## Thư mục cần ghép vào dự án nhóm

Chép hoặc merge nguyên thư mục `src/features/vehicle-intake/`. Module tự chứa giao diện, CSS, validation và API adapter; không phụ thuộc sidebar, router hay thư viện UI của khung chạy độc lập.

```text
vehicle-intake/
├── index.js                              # Điểm import công khai
├── pages/
│   └── VehicleIntakePage.jsx              # Màn hình nhập xe & thẩm định
├── components/
│   ├── VehicleDetailsForm.jsx             # Định danh, vận hành, sở hữu, giá xe
│   ├── TrustCarInspectionChecklist.jsx    # 5 ô tick và ghi chú luôn hiển thị
│   ├── VehicleIntakeSummary.jsx           # Tóm tắt và nút lưu
│   ├── VehicleIntakeField.jsx             # Ô nhập liệu trong tính năng
│   └── VehicleIntakeIcon.jsx              # Icon SVG nội bộ
├── constants/
│   └── vehicleIntakeConstants.js          # Tiêu chí và giá trị ban đầu
├── utils/
│   └── vehicleIntakeValidation.js         # Validation hồ sơ xe
├── api/
│   └── vehicleIntakeApi.js                # Adapter lưu hồ sơ
└── styles/
    └── VehicleIntake.module.css           # CSS Modules, giới hạn theo tính năng
```

Component React dùng PascalCase; file logic dùng camelCase; thư mục tính năng dùng kebab-case. Một module dùng chung cho cả hai vai trò để tránh hai bản giao diện bị lệch nghiệp vụ.

## Gắn vào layout admin/staff

```jsx
import { VehicleIntakePage } from './features/vehicle-intake/index.js';

// createVehicle là hàm API sẵn có của dự án nhóm.
// Hàm này nhận payload và trả Promise; reject/throw khi lưu thất bại.
export default function VehicleCreateRoute({ createVehicle }) {
  return <VehicleIntakePage onSave={createVehicle} />;
}
```

Gắn component vào route tạo xe trong layout và cơ chế phân quyền admin/staff hiện có của nhóm. Module không tạo router, sidebar hoặc bộ đăng nhập riêng.

CSS đã được import từ component và giới hạn trong CSS Modules. Font, biến màu, reset và selector thẻ HTML đều nằm trong phần tử gốc của tính năng, tránh áp dụng sang màn hình khác.

## Nối API Backend thật

Module sử dụng trực tiếp Axios instance có xác thực (`src/services/api.js`) để lưu hồ sơ nhập xe và biên bản thẩm định 5 tiêu chí lên Backend thật:

1. `POST /api/v1/manage/cars`: tạo hồ sơ xe mới trong kho (hoặc `PUT /api/v1/manage/cars/:id` khi cập nhật lại cùng xe trong phiên hiện tại).
2. `POST /api/v1/inspections/cars/:id/inspect`: ghi nhận biên bản thẩm định nhanh 5 tiêu chí CPO kèm số ODO và ghi chú.

```jsx
import { VehicleIntakePage, saveVehicleIntake } from '../../features/vehicle-intake';

export default function AdminVehicleIntakePage() {
  return <VehicleIntakePage onSave={saveVehicleIntake} />;
}
```

Payload từ form gồm:

- Thông tin xe: `licensePlate`, `vin`, `brand`, `model`, `year`, `mileage`, `transmission`, `fuel`, `ownership`, `listedPrice`, `floorPrice`.
- `checklist`: 5 boolean `chassis`, `engine`, `flood`, `odometer`, `safety`.
- `notes`: ghi chú chung, có thể rỗng.

Adapter `saveVehicleIntake` tự động chuẩn hoá kiểu dữ liệu số, enum chữ HOA (`make`, `transmission`, `fuelType`, `inventoryType`, `ownerType`, `price`, `listedPrice`, `floorPrice`) và ánh xạ 5 tiêu chí sang `criteria` (`noMajorAccident`, `noWaterDamage`, `engineGearboxIntact`, `verifiedOdo`, `electricalSystemPassed`).

## Chạy ứng dụng

Chạy frontend kết nối với Backend thật (`VITE_API_BASE_URL`, mặc định `http://localhost:5000/api/v1`):

```sh
npm run dev
```

## Phạm vi Git khi tích hợp

Đưa vào PR tích hợp:

- `src/features/vehicle-intake/`
- `docs/features/vehicle-intake-spec.md` nếu nhóm muốn lưu đặc tả cùng mã nguồn.

Tên nhánh gợi ý: `feat/vehicle-intake`. Commit gợi ý: `feat(vehicle-intake): add vehicle intake and TrustCar inspection form`.

Không đưa `node_modules/` hoặc `dist/` vào Git. Khi tích hợp vào ứng dụng nhóm, chỉ cần đưa module nghiệp vụ vào route dành cho admin/staff.

## Management workspace integration — November 3, 2026

This note supersedes the standalone-shell and routing instructions above for this repository's current application. The reusable feature remains in `src/features/vehicle-intake/`; its business rules are unchanged.

- `AdminLayout` in `src/layouts/AdminLayout.jsx` now provides the shared shell, based on the original intake shell, with styles in `src/layouts/AdminLayout.module.css`. The root `src/VehicleIntakeApp.jsx` and `src/VehicleIntakeApp.module.css` files have been removed.
- `src/pages/Admin/AdminVehicleIntakePage.jsx` supplies the feature's `onSave` callback. Intake lives at `/admin/vehicle-intake`, alongside `/admin/overview` and `/admin/inventory`; `/admin` redirects to overview. All three pages are nested behind `AdminRoute` for authenticated `ADMIN` and `SALES_STAFF` users.
- `/quan-ly/nhap-xe` redirects to `/admin/vehicle-intake`; `/admin/kho-xe` redirects to `/admin/inventory`. Both use `LegacyRedirect` to preserve query strings and hashes while replacing the history entry.
- Sidebar navigation uses real `NavLink` routes, and the profile reflects the authenticated account. The former local role selector, fabricated count, and notification indicator are no longer rendered. Source names remain English, canonical management URLs use English, and the UI remains Vietnamese. Public URLs are unchanged.
- Inventory retains its existing filters, pagination, and `/manage/cars` API; search now follows the URL. Overview reads totals from `/manage/cars` response `meta.total`, including per-status totals, and requests up to five vehicles sorted by `listedDate` descending. Request errors display error states rather than zero totals.
- Intake saving connects directly to the real Backend via the shared authenticated Axios client (`src/services/api.js`): it calls `POST /manage/cars` (or `PUT /manage/cars/:id` when updating the same vehicle in the current session) followed by `POST /inspections/cars/:id/inspect`. The standalone mock server on port 3001 (`server/vehicle-intake-api.mjs`) has been removed.

See the [current verification results](../../../docs/features/management-workspace.md#verification-status-and-related-documentation) for completed checks and flows that remain source-reviewed only. Live backend validation, including persistence and inventory synchronization, remains pending.

See [Management workspace](../../../docs/features/management-workspace.md) for route behavior, ownership, API boundaries, and pending checks.
