# Thiết kế lại giao diện TrustCar theo một design system thống nhất

Status: Giai đoạn 2 đang làm: đã có biến màu và trang bảng màu trong Figma; còn chữ, khoảng cách, bo góc, bóng, motion
Công cụ: Figma Desktop + plugin "Figma UI MCP Bridge" (`figma-ui-mcp`, port 38451)

## Vì sao giao diện bị nhận là "AI"

Số liệu đo từ `src/` (84 file CSS, ~22.400 dòng):

| Vấn đề | Số đo | Hệ quả |
|---|---|---|
| Màu viết cứng | 442 mã hex khác nhau | Mỗi trang một tông, token trong `index.css` gần như bị bỏ qua |
| Hai bảng màu đánh nhau | Navy/vàng `#0b1f3a`/`#c9a227` cùng xanh Tailwind `#1d4ed8` (40 lần), `#38bdf8`, slate `#475569` | Không rõ màu thương hiệu |
| Gradient | 248 lần dùng | Dấu hiệu rõ nhất của UI sinh bằng AI |
| Đổ bóng | 97 kiểu `box-shadow` | Thẻ xe có "cạnh 3D" (`0 6px 0`) lệch với phần còn lại |
| Bo góc | 39 giá trị | Không có thang chuẩn |
| Font | Inter (antd), Be Vietnam Pro, Plus Jakarta Sans, Segoe UI, Consolas | Chữ không đồng nhất giữa antd và CSS riêng |
| Chuyển động | 128 `transition`, 28 `@keyframes` | Mỗi chỗ một tốc độ/easing, không có "nhịp" chung |

Hướng sửa: định nghĩa token một lần (Figma Variables = CSS variables = antd theme token), rồi thay các giá trị viết cứng bằng token.

## Các giai đoạn

| # | Giai đoạn | Đầu ra | Phụ thuộc |
|---|---|---|---|
| 0 | Kết nối Figma | Plugin báo Connected, `figma_status` OK | — |
| 1 | Chốt hướng thiết kế | 1 trang moodboard trong Figma, 2 phương án hero + thẻ xe | 0 |
| 2 | Design tokens | Figma Variables (Light/Dark): màu, chữ, khoảng cách, bo góc, bóng, motion | 1 |
| 3 | Thư viện component | Trang "Components" trong Figma có variants | 2 |
| 4 | Thiết kế màn hình chính | 6 màn hình desktop + mobile | 3 |
| 5 | Đưa token vào code | `src/styles/tokens.css`, `src/theme/antdTheme.js` | 2 |
| 6 | Áp dụng theo khu vực | Từng khu vực một PR, giữ nguyên hành vi | 4, 5 |
| 7 | Kiểm tra | So ảnh chụp trước/sau, light/dark, mobile, `npm run build`/`lint`/`test` | 6 |

### 0. Kết nối Figma
- Đã chạy: `claude mcp add --scope user figma-ui -- npx -y figma-ui-mcp` (Connected, dùng được ở mọi thư mục).
- Việc của bạn: mở một session Claude Code mới, trong Figma Desktop mở file thiết kế, chạy plugin "Figma UI MCP Bridge" và bấm **Reconnect** đến khi hiện Connected.
- Kiểm tra: gọi `figma_status`, đọc `figma_docs`.

### 1. Chốt hướng thiết kế
- Chụp màn hình các trang hiện tại vào trang Figma "00 Audit" để so sánh.
- Đã quyết định: thay bảng màu navy + vàng bằng bảng màu mới, bỏ hẳn xanh Tailwind và slate.
- Đã chọn: **Xanh cobalt & Trắng ngà**. Vòng 1 (Than chì & Cam, Xanh dầu & Bạc hà, Đỏ rượu & Kem) bị loại vì nhìn gắt.
  - Thông số OKLCH: chính L 0.47 / C 0.16 / H 262, nhấn L 0.93 / C 0.04 / H 262, nền xám ngả ấm H 80 / C 0.004.
  - Light: nền `#F8F6F5`, thẻ `#FEFEFD`, chữ `#181613`, chữ phụ `#66635E`, chính `#2454B3` (hover `#12429F`), nhấn `#DCE9FF` + chữ `#181613`.
  - Dark: nền `#0F0E0C`, thẻ `#181715`, chữ `#F3F2F0`, chữ phụ `#ADAAA7`, chính `#7CAAFF` + chữ `#0F0E0C`.
  - Trạng thái (light / dark): thành công `#007835` / `#6FD087`, cảnh báo `#9D6300` / `#FEB354`, lỗi `#B32322` / `#FF7266`.
  - Thang 50–900 và biến CSS: `palette-options/final-palette.css`, `final-palette.json`. Sinh lại bằng `node palette-options/build-final.mjs cobalt`; script báo lỗi nếu cặp nào dưới chuẩn AA.
  - Chỉnh thử bằng `palette-options/tuner.html` (mở trực tiếp từ ổ đĩa).
  - Chữ trắng chỉ đặt trên `primary-500` trở lên.
- Màu nhấn chỉ dùng cho CTA chính và huy hiệu "Đã kiểm định".
- Bỏ gradient trang trí, dùng nền phẳng + ảnh xe thật làm điểm nhấn. Gradient chỉ còn ở hero overlay.

### Trạng thái Figma (2026-11-24)
- Đã kết nối (plugin v2.5.25). Trang bảng màu: frame `10:106` "Bảng màu · Xanh cobalt" ở Page 1.
- Gói Figma miễn phí chỉ cho 1 mode mỗi bộ biến, nên Light/Dark là **2 bộ riêng cùng tên biến**:
  - `Primitives` (`VariableCollectionId:9:2`): `primary/50…900`, `accent/50…900`, `neutral/0…950`.
  - `Theme Light` (`VariableCollectionId:10:70`) và `Theme Dark` (`VariableCollectionId:10:88`): 17 biến `bg, surface, surfaceAlt, border, text, muted, primary, onPrimary, primaryHover, link, accent, onAccent, accentHover, accentText, success, warning, danger`.
  - Đổi theme một khung: đổi biến Light sang biến Dark cùng tên (Swap library/variable), hoặc nâng gói để gộp thành 1 bộ 2 mode.
- Cần xoá tay trong Local variables: bộ `Primitives` thừa (mode "value", `10:36`) và bộ `Theme` rỗng (`10:69`). API của plugin không xoá được bộ biến.

### 2. Design tokens (Figma Variables, 2 mode Light/Dark)
- Màu: `brand/primary-50…900`, `brand/accent-50…900` (lấy từ `final-palette.json`), `neutral/0…950`, `success|warning|danger|info`; lớp ngữ nghĩa `bg`, `surface`, `surface-raised`, `text`, `text-muted`, `border`, `primary`, `accent`, `focus-ring`.
- Chữ: 1 font giao diện (Be Vietnam Pro, hỗ trợ tiếng Việt tốt) + 1 font số/mono; thang 12/14/16/18/20/24/30/36/48.
- Khoảng cách: lưới 4px (4, 8, 12, 16, 24, 32, 48, 64, 96).
- Bo góc: 4 / 8 / 12 / 20 / full.
- Bóng: 3 mức `sm`, `md`, `lg` (bỏ "cạnh 3D").
- Motion: thời lượng 120 / 200 / 320ms, easing `standard` và `emphasized`; tôn trọng `prefers-reduced-motion`.

### 3. Thư viện component trong Figma
Button (primary/secondary/ghost/danger × sm/md/lg × states), Input/Select/Search, Tag/Badge (CPO, trạng thái xe), CarCard, PriceBlock, Header, Footer, Breadcrumb, Tabs, Table, Modal/Drawer, Toast, EmptyState/StateBlock, Sidebar admin, StatCard.

### 4. Màn hình ưu tiên
1. Trang chủ (`/`), 2. Danh sách xe (`/xe`), 3. Chi tiết xe (`/xe/:stockCode`), 4. Đăng nhập/Đăng ký, 5. Admin layout + Dashboard, 6. Đặt cọc/Lịch hẹn.
Mỗi màn hình có bản desktop 1440 và mobile 390, light/dark.

### 5. Đưa token vào code
- Tạo `src/styles/tokens.css` (sinh từ Figma Variables bằng `figma_rules`), import trong `src/index.css`.
- Tạo `src/theme/antdTheme.js`, dùng trong `src/App.jsx` thay cho token đang viết cứng (`colorPrimary`, `borderRadius`, `fontFamily`).
- Giữ alias cho các biến cũ (`--color-primary`, `--color-accent`…) để không vỡ trang chưa chuyển.

### 6. Áp dụng theo khu vực (thứ tự)
1. Layout chung: `components/layout/Header`, `Footer`, `layouts/AdminLayout`
2. `components/car/CarCard`, `pages/Cars`, `pages/CarDetail`
3. `pages/Home/sections/*`
4. Auth: `components/auth/*`
5. Admin: `pages/Admin/*`, `features/admin-dashboard`, `features/sales-crm`, `features/audit-logs`
6. Còn lại trong `features/*`

Mỗi khu vực: thay hex/shadow/radius/gradient bằng token, kiểm tra light/dark, chụp ảnh so sánh.

### 7. Tiêu chí hoàn thành
- Số mã hex viết cứng ngoài `tokens.css` giảm từ 442 xuống dưới 20 (đo bằng grep).
- Chỉ còn 3 kiểu bóng, 5 bo góc, 1 font giao diện.
- Không đổi hành vi: `npm run build`, `npm run lint`, `npm test` đều qua.
- Tương phản chữ đạt WCAG AA ở cả hai theme.

## Rủi ro
- Đổi nhiều file CSS cùng lúc dễ gây xung đột với nhánh khác: chia PR theo khu vực.
- antd v6 và CSS module có thể lệch màu nếu không map token: làm bước 5 trước bước 6.
- Showroom 3D (`features/showroom-3d`) dùng three.js, chỉ chỉnh khung UI quanh canvas.
