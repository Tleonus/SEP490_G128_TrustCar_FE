# Phân tích hệ thống — FE Integrate Vehicle Detail Page & Full Inspection Checklist UI

## 1. Phạm vi và kết luận nhanh

Phân tích này đối chiếu hai luồng hiện có trong frontend TrustCar:

- Trang công khai chi tiết xe: `src/pages/CarDetail/CarDetailPage.jsx`.
- Màn hình nội bộ nhập xe và checklist kiểm định: `src/features/vehicle-intake/`.

Kết luận: hiện tại hai luồng **chưa được tích hợp**. Trang Vehicle Detail đang lấy dữ liệu từ endpoint `/cars/:stock_code` hoặc mock `MOCK_CARS`, trong khi checklist chỉ submit payload riêng tới `/api/cpo/vehicles`. Không có khóa liên kết, API đọc inspection theo xe, DTO public, component read-only, hay route/logic để render checklist trên Vehicle Detail.

Vì vậy, phần việc “Integrate Vehicle Detail Page & Full Inspection Checklist UI” không chỉ là thêm một card UI. Cần hoàn thiện hợp đồng dữ liệu và luồng đọc công khai trước, đồng thời tách dữ liệu nội bộ khỏi dữ liệu được phép hiển thị cho khách hàng.

## 2. Luồng hiện tại

### 2.1. Vehicle Detail Page

Route hiện tại là `/xe/:stockCode`, khai báo tại `src/router/AppRouter.jsx:21-22`. `CarDetailPage` lấy `stockCode` từ URL và gọi `useCarDetail(stockCode)`.

Hook `src/hooks/useCarDetail.js:16-25` gọi tuần tự `getCarByStockCode` rồi `getSimilarCars`. Service `src/services/carService.js:93-109` gọi:

```text
GET /cars/:stock_code
```

Nếu request thất bại, service mặc định rơi về mock (`USE_MOCK_FALLBACK = true`). Mock chỉ lọc các xe có `status === available` và gắn quan hệ brand/model; nó không có trường inspection/checklist.

UI hiện tại hiển thị gallery, giá niêm yết, thông số xe, trang bị nổi bật, mô tả tình trạng, xe tương tự và CTA tư vấn. Các vùng này nằm trong `CarDetailPage.jsx:82-161`. Không có vùng “Inspection”, “TrustCar inspection”, chứng cứ kiểm định hoặc trạng thái từng tiêu chí.

### 2.2. Full Inspection Checklist UI nội bộ

Checklist hiện được render bởi `TrustCarInspectionChecklist.jsx:6-59`. Có đúng 5 tiêu chí cố định trong `vehicleIntakeConstants.js:1-42`:

```text
chassis, engine, flood, odometer, safety
```

Mỗi tiêu chí hiện là checkbox boolean. Ý nghĩa nghiệp vụ là “tick các tiêu chí xe đáp ứng”, không phải mô hình kết quả kiểm định đầy đủ. Có một ghi chú chung cho toàn bộ biên bản, không có ghi chú riêng cho từng mục. Bộ đếm chỉ tính số checkbox đang được tick.

`VehicleIntakePage.jsx:54-58` tạo payload:

```js
{
  ...car,
  checklist: { ...checks },
  notes: notes.trim()
}
```

Sau đó adapter mặc định gửi `POST /api/cpo/vehicles`. README của module xác nhận đây là payload nội bộ và phần upload tài liệu hiện chỉ là giao diện, chưa có API (`src/features/vehicle-intake/README.md:68-85`).

### 2.3. API local hiện tại

`server/vehicle-intake-api.mjs` chỉ có:

- `POST /api/cpo/vehicles`: lưu record vào mảng trong memory.
- `GET /api/cpo/vehicles`: trả toàn bộ record.

Không có endpoint lấy một xe theo `stockCode`, không có endpoint inspection public, không có mapping từ record CPO sang record `Car`, không có publication flag và không có DTO loại bỏ trường nội bộ.

## 3. Khoảng trống tích hợp

| Hạng mục | Hiện trạng | Tác động |
|---|---|---|
| Khóa liên kết | Intake có `licensePlate`/`vin`, Detail dùng `stock_code` | Không biết checklist nào thuộc xe nào trên trang detail |
| API đọc inspection | Chưa có | Frontend không thể lấy checklist |
| Public DTO | Chưa có | Có nguy cơ trả nhầm `floorPrice`, ghi chú nội bộ hoặc dữ liệu tùy ý từ client |
| UI read-only | Chưa có | Checkbox hiện tại là form nhập liệu, không phù hợp cho khách xem |
| Publication | Chưa có | Không biết khi nào inspection được phép hiển thị công khai |
| Model kết quả | 5 boolean | Không biểu diễn failed, unknown, not-inspected, severity, evidence |
| Evidence | Nút “Thêm tệp” không có handler/input/API | Không thể hiển thị ảnh hoặc tài liệu chứng minh |
| Metadata | Không có inspector, timestamp, version, approval | Không tạo được biên bản kiểm định đáng tin cậy |
| Fallback | Detail rơi về mock khi API lỗi | Có thể hiển thị trang xe nhưng thiếu inspection mà không báo rõ |

## 4. Phát hiện kỹ thuật theo mức độ

### Blocker — chưa thể coi là đã tích hợp

**B1. Hai nguồn dữ liệu không có quan hệ đọc được.** Intake lưu `licensePlate`, `vin`, `brand`, `model` và checklist; Detail nhận `stock_code`. `server/vehicle-intake-api.mjs:26-29` tạo ID dạng `CPO-xxxx` nhưng không tạo hoặc cập nhật `stock_code`. Không có hàm service nào gọi `/api/cpo/vehicles/:id/inspection` hoặc tương đương.

**B2. Chưa có component hiển thị checklist trên Vehicle Detail.** `CarDetailPage.jsx` chỉ render các section tới “Tình trạng xe” và “Xe tương tự” (`:131-161`). Việc “full checklist UI” hiện mới tồn tại trong màn nhập liệu nội bộ, không phải UI xem chi tiết.

**B3. Chưa có quy tắc publish.** Đặc tả hiện tại nói checklist chỉ ghi nhận thông tin, không tự quyết định trạng thái xe (`docs/features/vehicle-intake-spec.md:11-16`). Điều này hợp lý cho màn nội bộ, nhưng để render công khai phải có quyết định riêng: inspection nào được publish và ai duyệt.

### High — rủi ro dữ liệu và nghiệp vụ

**H1. API server tin toàn bộ payload từ client.** Record được tạo bằng `{ id: generatedId, ...payload, createdAt }` (`server/vehicle-intake-api.mjs:27`), nên `payload.id`, `payload.status` hoặc trường tùy ý có thể ghi đè/thêm vào record. Nếu record này được dùng làm nguồn public, client có thể làm sai trạng thái hoặc dữ liệu hiển thị.

**H2. Checklist không được validate phía server.** Server chỉ kiểm tra `payload.checklist` là truthy (`server/vehicle-intake-api.mjs:26`). Chuỗi, object rỗng hoặc object thiếu key vẫn có thể được lưu. Đây là vấn đề trực tiếp với “full checklist” vì public UI có thể nhận dữ liệu không đúng schema.

**H3. Thông tin nội bộ chưa được phân tách khỏi public.** Intake có `floorPrice`, ghi chú thẩm định và thông tin sở hữu. Service public hiện chủ động ghi chú không trả `floor_price` (`src/services/carService.js:66-71`), nhưng chưa có inspection public DTO để đảm bảo notes, VIN, biển số và dữ liệu nội bộ được lọc.

**H4. Không có persistence thật trong API local.** `savedVehicles` là array trong process (`server/vehicle-intake-api.mjs:4`), restart là mất dữ liệu. Đây có thể là giới hạn của demo server, nhưng không thể dùng làm nguồn thật cho trang detail.

**H5. Phân quyền của route nhập xe chưa được áp dụng.** `PrivateRoute` tồn tại nhưng `AppRouter.jsx:29-36` mở trực tiếp `/quan-ly/nhap-xe` mà không bọc `PrivateRoute`. `VehicleIntakeApp.jsx:11-12` còn có role selector UI local, không phải authorization. Đây là rủi ro khi tích hợp checklist vào dữ liệu vận hành.

### Medium — chất lượng và khả năng mở rộng

**M1. Mô hình boolean không đủ cho inspection công khai.** `false` hiện đồng nghĩa “chưa tick”, nhưng UI public cần phân biệt ít nhất `PASS`, `FAIL`, `NOT_INSPECTED` hoặc `UNKNOWN`. Nếu chỉ đổi checkbox thành icon đạt/không đạt, người dùng có thể hiểu sai `false` là xe thất bại thay vì chưa kiểm tra.

**M2. Ghi chú chung không phù hợp cho hiển thị theo tiêu chí.** `notes` áp dụng cho toàn bộ checklist (`TrustCarInspectionChecklist.jsx:57`). Khi khách mở từng mục, không có mô tả finding, severity hoặc khuyến nghị sửa chữa tương ứng.

**M3. Upload chưa hoạt động.** `VehicleDetailsForm.jsx:14` chỉ render button “Thêm tệp”; không có `<input type="file">`, state, upload request hoặc field evidence trong payload. Không nên thiết kế UI public có “Xem hồ sơ” cho đến khi có nguồn evidence thật.

**M4. Validation client có thể cho qua giá trị không hợp lệ.** `vehicleIntakeValidation.js:8-10` dùng `Number(...)` nhưng không kiểm tra `Number.isFinite`; vì vậy chuỗi không phải số có thể lọt qua các điều kiện range. Giá âm cũng chưa bị chặn cho `listedPrice` và `floorPrice`. Đây không phải lỗi trực tiếp của detail UI nhưng ảnh hưởng chất lượng dữ liệu inspection gắn với xe.

**M5. Mock fallback làm che mất thiếu dữ liệu tích hợp.** Khi `/cars/:stock_code` lỗi, service dùng mock (`carService.js:95-109`). Khi triển khai inspection, nếu chỉ lấy `car.inspection` từ response thì mock vẫn render detail thành công nhưng không có checklist. Cần trạng thái rõ: `inspection unavailable`, `not published`, hoặc `not inspected`, không nên im lặng bỏ section.

## 5. Đề xuất kiến trúc tích hợp

### 5.1. Hợp đồng dữ liệu nên chốt trước

Nên giữ record nội bộ và response public tách biệt.

**Internal inspection record** có thể gồm:

```js
{
  inspectionId,
  vehicleId,              // khóa thật liên kết tới Car, không dùng biển số làm khóa duy nhất
  stockCode,
  checklist: {
    chassis: { result, note, evidenceIds },
    engine: { result, note, evidenceIds },
    flood: { result, note, evidenceIds },
    odometer: { result, note, evidenceIds },
    safety: { result, note, evidenceIds }
  },
  overallNote,
  inspector: { id, displayName },
  inspectedAt,
  updatedAt,
  status,                 // DRAFT | PENDING_REVIEW | APPROVED | REJECTED
  isPublished
}
```

**Public response** chỉ nên trả dữ liệu đã được duyệt và đã lọc:

```js
{
  inspection: {
    status: 'APPROVED',
    inspectedAt,
    inspectorName,
    criteria: [
      { id, title, result: 'PASS', note, evidence: [{ url, type, caption }] }
    ],
    summary
  }
}
```

Không trả `floorPrice`, ghi chú nội bộ chưa duyệt, lịch sử thay đổi nội bộ, token upload, thông tin tài khoản nhân viên hoặc toàn bộ raw intake payload.

### 5.2. API đề xuất

Tối thiểu cần một trong hai cách sau:

```text
GET /cars/:stock_code
```

trả thêm `inspection` đã public hóa; hoặc:

```text
GET /cars/:stock_code/inspection
```

trả `{ data: PublicInspection | null }`.

Khuyến nghị dùng endpoint riêng để giảm coupling và cho phép cache/authorization khác với thông tin xe. Response phải phân biệt:

- `404`: xe không tồn tại.
- `200 { data: null }`: xe tồn tại nhưng chưa có inspection public.
- `200 { data: inspection }`: có biên bản đã publish.
- `403`: inspection tồn tại nhưng người dùng hiện tại không có quyền xem, nếu hệ thống có private mode.

### 5.3. FE component nên tách riêng

Không tái sử dụng trực tiếp `TrustCarInspectionChecklist` cho public detail vì component này có checkbox, callback thay đổi và ngữ nghĩa nhập liệu. Nên tạo:

```text
src/features/vehicle-inspection/
├── components/
│   ├── PublicInspectionChecklist.jsx
│   ├── InspectionCriterionCard.jsx
│   └── InspectionStatusBadge.jsx
├── hooks/useVehicleInspection.js
├── services/vehicleInspectionService.js
├── constants/inspectionCriteria.js
└── styles/PublicInspectionChecklist.module.css
```

`CarDetailPage` gọi hook đọc inspection và render section sau thông tin xe, trước xe tương tự. Section nên có header tổng quan, ngày kiểm tra, trạng thái, bộ đếm kết quả, 5 card tiêu chí, ghi chú đã được public hóa và evidence nếu có.

UI public nên dùng trạng thái read-only:

- PASS: biểu tượng/check và màu tích cực.
- FAIL: cảnh báo rõ ràng, không dùng màu đỏ đơn độc.
- NOT_INSPECTED/UNKNOWN: trung tính, giải thích ngắn.
- Loading/error/empty: có state riêng, không làm biến mất cả trang detail.

## 6. Acceptance criteria đề xuất

1. Mở `/xe/:stockCode` thì frontend gọi được API lấy inspection bằng đúng `stockCode` hoặc `vehicleId`.
2. Inspection của xe A không thể hiển thị trên xe B khi chuyển route hoặc khi request chạy chậm; hook phải xử lý race/unmount.
3. Chỉ inspection có trạng thái public/approved mới hiển thị cho guest.
4. Không hiển thị `floorPrice`, raw internal notes, token, hoặc dữ liệu CPO không thuộc public DTO.
5. Đủ 5 tiêu chí theo thứ tự và title thống nhất với checklist nội bộ.
6. UI phân biệt rõ pass, fail và chưa kiểm tra; không suy diễn `false` thành fail nếu backend không nói vậy.
7. Có loading, empty, error và retry cho section inspection; lỗi inspection không làm mất thông tin xe chính.
8. Có responsive layout cho desktop/mobile và keyboard-readable labels/aria state.
9. Backend validate schema checklist, không cho client ghi đè `id`, `status`, `createdAt` hoặc trường hệ thống.
10. Có test cho: inspection đã publish, chưa có inspection, dữ liệu thiếu tiêu chí, lỗi API, chuyển nhanh giữa hai `stockCode`, và lọc trường nội bộ.

## 7. Kế hoạch triển khai theo thứ tự an toàn

**Phase 1 — Contract.** Chốt mapping `Car` ↔ `Inspection`, enum result/status, publication rule, field visibility và API response. Không bắt đầu bằng JSX vì hiện chưa có nguồn dữ liệu chắc chắn.

**Phase 2 — Backend/data adapter.** Tạo endpoint đọc một inspection hoặc mở rộng public car DTO. Validate schema ở server và map từ record nội bộ sang public DTO. Bổ sung persistence thật khi rời demo server.

**Phase 3 — Frontend read-only UI.** Tạo service/hook/component public riêng. Gắn section vào `CarDetailPage`, giữ fallback và state độc lập với similar cars.

**Phase 4 — Data quality/security.** Sửa validation số, chặn route nhập xe bằng `PrivateRoute` và quyền backend, loại bỏ client-controlled system fields, quyết định xử lý VIN/biển số/notes.

**Phase 5 — Verification.** Chạy lint/build, test API contract, test component/hook và kiểm tra thủ công responsive/accessibility. Không coi feature hoàn tất nếu chỉ có UI với mock data.

## 8. Kết luận review

Ở trạng thái hiện tại, code đã có nền tảng tốt cho **màn nhập xe + checklist nội bộ**, nhưng chưa đáp ứng yêu cầu **tích hợp checklist đầy đủ vào Vehicle Detail Page**. Khoảng thiếu lớn nhất là contract và read path, không phải styling.

Đề xuất ưu tiên: chốt public inspection contract và khóa liên kết trước; sau đó xây một read-only component riêng. Không nên đưa nguyên `TrustCarInspectionChecklist` vào `CarDetailPage`, không nên dùng `GET /api/cpo/vehicles` làm public API, và không nên hiển thị trực tiếp raw record do server hiện đang tin payload client.

## 9. Bằng chứng kiểm tra hiện tại

- `npm run build`: **FAIL** trước khi bundle do thiếu native binding của Rolldown trong `node_modules` (`@rolldown/binding-linux-x64-gnu`/WASI).
- `npm run lint`: **FAIL**, 14 lỗi hiện có; gồm import `React` không dùng trong nhiều component intake, import không dùng ở `CarCard`, và empty catch trong `tokenStorage.js`.
- Không chỉnh sửa source trong quá trình phân tích; chỉ tạo tài liệu này.
