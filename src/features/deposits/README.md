# KAN-22 + KAN-99 – Car Deposit & Online Hold (Frontend)

Toàn bộ logic nằm trong `src/features/deposits/`; các file ngoài feature (router, trang chi tiết xe, menu) đã được nối ngày 27/11 – xem mục "Tích hợp".

```
features/deposits/
├── api/depositApi.js                 # /api/v1/deposits qua axios `api` có sẵn (tự gắn JWT, tự refresh)
├── constants/depositConstants.js     # status, paymentStatus, provider, mã lỗi VNPay, nhãn, đường dẫn, chính sách
├── hooks/
│   ├── useCarHoldStatus.js           # trạng thái giữ xe từ BE, poll 30s, bù lệch giờ theo serverTime
│   ├── useVnpayPolicy.js             # KAN-99 – cổng VNPay đã cấu hình chưa (503 = tắt, FE ẩn lựa chọn)
│   ├── useCountdown.js               # đếm ngược theo expiresAt của BE
│   └── usePaymentPolling.js          # poll trạng thái cọc sau khi VNPay redirect về
├── components/
│   ├── CarDepositPanel.jsx           # khối hoàn chỉnh cho trang chi tiết xe
│   ├── DepositButton.jsx             # nút "Đặt cọc giữ xe" (khóa khi RESERVED/SOLD)
│   ├── DepositConfirmModal.jsx       # tiền cọc + chọn phương thức (VNPay / chuyển khoản), chính sách, xác nhận
│   ├── PaymentProviderSelector.jsx   # KAN-99 – radio VNPay khuyến nghị / MANUAL
│   ├── CountdownTimer.jsx            # giờ : phút : giây; khi về 0 thì tải lại trạng thái từ BE
│   ├── DepositStatusBadge.jsx        # CarStateBadge, DepositStatusBadge, PaymentStatusBadge
│   └── PaymentInstructions.jsx       # hướng dẫn chuyển khoản (phương án MANUAL)
├── pages/
│   ├── CarDepositPage.jsx            # /xe/:carKey/dat-coc – xem xe đang RESERVED + countdown
│   ├── MyDepositsPage.jsx            # /dat-coc-cua-toi – lịch sử + nút "Thanh toán VNPay" cho lượt chưa trả
│   ├── AdminDepositsPage.jsx         # /admin/deposits – xác nhận cọc / thanh toán đủ / hoàn cọc / hủy, xem phương thức
│   ├── DepositSuccessPage.jsx        # /dat-coc/:id/thanh-cong – poll tới khi DEPOSIT_PAID
│   ├── DepositCancelPage.jsx         # /dat-coc/:id/da-huy, /dat-coc/:id/that-bai, /dat-coc/that-bai
│   └── VnpayReturnPage.jsx           # /dat-coc/vnpay-return – fallback khi VNPay gọi thẳng FE
├── styles/Deposit.module.css
├── utils/depositErrors.js, depositFormat.js
└── index.js
```

## Tích hợp vào file cũ — ✅ đã hoàn tất (27/11)

1. `src/pages/CarDetail/CarDetailPage.jsx` – `<CarDepositPanel car={car} />` nằm trong khối `styles.info`, ngay sau `ShareButtons`.
2. `src/router/AppRouter.jsx` – 3 route lazy `/xe/:carKey/dat-coc`, `/dat-coc-cua-toi` (PrivateRoute), `deposits` trong `/admin`; kèm 4 route kết quả VNPay: `/dat-coc/vnpay-return`, `/dat-coc/:id/thanh-cong`, `/dat-coc/:id/da-huy`, `/dat-coc/:id/that-bai`, `/dat-coc/that-bai`.
3. `src/router/paths.js` – `ADMIN_PATHS.deposits = '/admin/deposits'`.
4. `src/layouts/AdminLayout.jsx` – mục "Quản lý đặt cọc" (icon `WalletOutlined`) trong nhóm Kinh doanh, dưới Bán hàng.
5. `src/components/layout/Header.jsx` – mục "Đặt cọc của tôi" trong dropdown, chỉ hiện với `roleName === 'CUSTOMER'`.

### Vì sao có `/xe/:carKey/dat-coc`
`GET /public/cars/:id` **chỉ trả xe AVAILABLE**. Khi xe RESERVED, trang chi tiết báo "Không tìm thấy". Trang `/xe/:carKey/dat-coc` lấy dữ liệu từ `/deposits/cars/:carKey/hold-status` nên luôn hiển thị được trạng thái + countdown.

## KAN-99 – thanh toán qua VNPay

- Modal xác nhận có `PaymentProviderSelector`: VNPay (khuyến nghị) hoặc chuyển khoản. Lựa chọn VNPay chỉ bật khi `useVnpayPolicy()` thấy `GET /deposits/vnpay-policy` trả `enabled: true`; BE trả 503 khi `.env` thiếu cấu hình nên FE tự ẩn, không để khách bấm rồi nhận lỗi.
- Tạo cọc với `paymentProvider: 'VNPAY'` → gọi `POST /deposits/:id/vnpay-url` → `window.location.assign(paymentUrl)`. Nếu tạo URL thất bại, lượt giữ vẫn được tạo và hiện nút "Thanh toán qua VNPay" để thử lại (hoặc chuyển khoản dự phòng).
- Khách quay về: VNPay → `GET /api/v1/deposits/vnpay-return` (BE xác minh chữ ký rồi 302) → `/dat-coc/:id/thanh-cong` và poll tới `DEPOSIT_PAID`. DB chỉ đổi trạng thái bởi IPN server-to-server, trang kết quả không ghi DB.
- Trang "Đặt cọc của tôi" hiện phương thức và nút "Thanh toán VNPay" cho lượt `PENDING_PAYMENT / UNPAID` còn hạn, nên khách đóng tab giữa chừng vẫn trả tiếp được.
- Backend cần: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_RETURN_URL` (URL HTTPS trỏ về BE `/api/v1/deposits/vnpay-return`); đặt `FRONTEND_BASE_URL` để BE redirect về đúng origin của FE. Thiếu bất kỳ biến nào → cổng bị coi là tắt.

## Đăng nhập rồi quay lại
Nút đặt cọc chuyển tới `/dang-nhap` kèm `state.from`, giống cách `PrivateRoute` đang làm. `LoginPage` hiện tại đã đọc `location.state.from`.
