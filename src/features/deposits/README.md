# KAN-22 – Car Deposit & Online Hold (Frontend)

Toàn bộ code nằm trong `src/features/deposits/`. **Đây đều là file mới; không file cũ nào bị sửa.**

```
features/deposits/
├── api/depositApi.js                 # /api/v1/deposits qua axios `api` có sẵn (tự gắn JWT, tự refresh)
├── constants/depositConstants.js     # status, paymentStatus, nhãn, đường dẫn, nội dung chính sách
├── hooks/useCarHoldStatus.js         # trạng thái giữ xe từ BE, poll 30s, bù lệch giờ theo serverTime
├── hooks/useCountdown.js             # đếm ngược theo expiresAt của BE
├── components/
│   ├── CarDepositPanel.jsx           # khối hoàn chỉnh cho trang chi tiết xe
│   ├── DepositButton.jsx             # nút "Đặt cọc giữ xe" (khóa khi RESERVED/SOLD)
│   ├── DepositConfirmModal.jsx       # ảnh, tên, giá, tiền cọc, chính sách cọc/hoàn cọc, thời hạn, Xác nhận/Hủy
│   ├── CountdownTimer.jsx            # giờ : phút : giây; khi về 0 thì tải lại trạng thái từ BE
│   ├── DepositStatusBadge.jsx        # CarStateBadge, DepositStatusBadge, PaymentStatusBadge
│   └── PaymentInstructions.jsx       # hướng dẫn chuyển khoản (không giả lập thanh toán)
├── pages/
│   ├── CarDepositPage.jsx            # /xe/:carKey/dat-coc – xem xe đang RESERVED + countdown
│   ├── MyDepositsPage.jsx            # /dat-coc-cua-toi – lịch sử đặt cọc của khách
│   └── AdminDepositsPage.jsx         # /admin/deposits – danh sách, chi tiết, xác nhận cọc / thanh toán đủ / hoàn cọc / hủy
├── styles/Deposit.module.css
├── utils/depositErrors.js, depositFormat.js
└── index.js
```

## ⚠️ Tích hợp vào file cũ (CHƯA sửa, chờ bạn cho phép)

### 1. `src/pages/CarDetail/CarDetailPage.jsx` (bắt buộc: nút đặt cọc + countdown)
```jsx
// thêm cạnh các import feature khác
import { CarDepositPanel } from '../../features/deposits'

// trong <div className={styles.info}>, ngay SAU khối <div className={styles.ctaRow}>...</div>
<CarDepositPanel car={car} />
```

### 2. `src/router/AppRouter.jsx` (bắt buộc: các trang mới)
```jsx
const CarDepositPage = lazy(() => import('../features/deposits/pages/CarDepositPage.jsx'))
const MyDepositsPage = lazy(() => import('../features/deposits/pages/MyDepositsPage.jsx'))
const AdminDepositsPage = lazy(() => import('../features/deposits/pages/AdminDepositsPage.jsx'))

// trong <Route element={<MainLayout />}>, TRƯỚC <Route path="*" ...>
<Route path="/xe/:carKey/dat-coc" element={<Suspense fallback={<LoadingState />}><CarDepositPage /></Suspense>} />
<Route path="/dat-coc-cua-toi" element={<PrivateRoute><Suspense fallback={<LoadingState />}><MyDepositsPage /></Suspense></PrivateRoute>} />

// trong <Route path="/admin" ...> (đã được AdminRoute bảo vệ), TRƯỚC <Route path="*" ...>
<Route path="deposits" element={<Suspense fallback={<LoadingState />}><AdminDepositsPage /></Suspense>} />
```

### 3. Vì sao cần `/xe/:carKey/dat-coc`
`GET /public/cars/:id` (của thành viên khác) **chỉ trả xe AVAILABLE**. Vì vậy khi xe RESERVED, `CarDetailPage` báo "Không tìm thấy", và countdown trong trang chi tiết gốc chỉ thấy được cho tới lúc tải lại trang. Có hai cách xử lý:
- **Không sửa code cũ:** dùng trang mới `/xe/:carKey/dat-coc`. Trang này lấy dữ liệu từ `/deposits/cars/:carKey/hold-status` nên luôn hiển thị được trạng thái và countdown. Lịch sử đặt cọc đã liên kết sẵn tới trang này.
- **Tích hợp sâu hơn (cần cho phép):** trong `CarDetailPage`, khi lỗi 404 thì gọi `navigate(\`/xe/${stockCode}/dat-coc\`, { replace: true })`. Hoặc sửa BE `getPublicCarDetail` để trả cả xe RESERVED (xem tài liệu BE, mục 9.6).

### 4. Menu (tùy chọn)
- `src/components/layout/Header.jsx`: thêm mục "Đặt cọc của tôi" trỏ tới `/dat-coc-cua-toi` cho CUSTOMER.
- `src/router/paths.js` + `src/layouts/AdminLayout.jsx`: thêm `deposits: '/admin/deposits'` và mục menu "Đặt cọc".

### 5. Đăng nhập rồi quay lại
Nút đặt cọc chuyển tới `/dang-nhap` kèm `state.from`, giống cách `PrivateRoute` đang làm. `LoginPage` hiện tại đã đọc `location.state.from`.
