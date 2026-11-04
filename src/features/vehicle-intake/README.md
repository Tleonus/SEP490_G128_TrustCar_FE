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

## Nối API

Ưu tiên truyền `onSave` để dùng chung API client, token và cách xử lý lỗi của dự án nhóm. Module không hardcode localhost.

Nếu dùng adapter fetch đi kèm:

```jsx
import { VehicleIntakePage, saveVehicleIntake } from './features/vehicle-intake/index.js';

const saveVehicle = (payload) => saveVehicleIntake(payload, {
  endpoint: '/api/vehicles', // Thay bằng endpoint thực tế của nhóm.
});

export default function VehicleCreateRoute() {
  return <VehicleIntakePage onSave={saveVehicle} />;
}
```

Adapter mặc định giữ endpoint `/api/cpo/vehicles` để tương thích khung chạy cục bộ hiện tại. Khi merge, cấu hình endpoint hoặc truyền API của nhóm qua `onSave`.

Payload gồm:

- Thông tin xe: `licensePlate`, `vin`, `brand`, `model`, `year`, `mileage`, `transmission`, `fuel`, `ownership`, `listedPrice`, `floorPrice`.
- `checklist`: 5 boolean `chassis`, `engine`, `flood`, `odometer`, `safety`.
- `notes`: ghi chú chung, có thể rỗng.

Giá trị từ ô nhập số hiện là chuỗi. Chuyển sang số trong hàm `onSave` nếu API của nhóm yêu cầu. Checklist không quyết định giá hoặc tự gán trạng thái từ chối/mở bán.

## Khung chạy độc lập để kiểm tra tính năng

Các tệp sau nằm ngoài module tích hợp:

- `src/VehicleIntakeApp.jsx`: sidebar, topbar và bộ chọn vai trò cho khung chạy độc lập.
- `src/VehicleIntakeApp.module.css`: giao diện khung ứng dụng.
- `server/vehicle-intake-api.mjs`: API Node.js cục bộ, lưu trong bộ nhớ.
- `src/main.jsx`, `index.html`, `package.json`, `package-lock.json`: điểm chạy và dependency của khung ứng dụng.

Khi đưa tính năng vào ứng dụng nhóm, giữ entry point, layout, manifest và backend đang có của nhóm. Phần đính kèm tệp hiện là giao diện, chưa nối API upload.

Chạy khung ứng dụng tại thư mục gốc bằng hai terminal:

```sh
npm run server
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
- Intake saving remains unchanged: the page adapter selects `VITE_VEHICLE_INTAKE_API_URL` or falls back to `http://localhost:3001/api/cpo/vehicles`. The reusable fetch adapter's own default remains `/api/cpo/vehicles`. It does not automatically use the inventory API client's authentication handling. This workspace integration does not connect intake saving to `/manage/cars` or promise backend persistence or inventory synchronization.

See the [current verification results](../../../docs/features/management-workspace.md#verification-status-and-related-documentation) for completed checks and flows that remain source-reviewed only. Live backend validation, including persistence and inventory synchronization, remains pending.

See [Management workspace](../../../docs/features/management-workspace.md) for route behavior, ownership, API boundaries, and pending checks.
