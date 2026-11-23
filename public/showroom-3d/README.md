# Mô hình cho Showroom 3D (`/showroom-3d`)

- `env/`: kệ xoay (`tron_colored`), nội thất góc tư vấn, logo TRUST CAR. Đã nén.
- `cars/<vehicleCode>.glb`: mô hình xe đã nén. Tên file là mã xe trong database, ví dụ `TC-2026-0001.glb`.

Xe chỉ lên showroom khi xe đó đang bán (`AVAILABLE`) và có file mô hình. Thứ tự hiển thị theo mã xe.

## Thêm xe mới

1. Đặt file gốc vào `D:\Ky 9\Đồ án\3D\glb\gg\xe\` (có thể để trong thư mục con). Tên file phải đúng mã xe, ví dụ
   `xe\Tc-2026-0002\TC-2026-0002.glb`.
2. Trong thư mục FE, chạy:

       node scripts/showroom-3d/prepare-assets.mjs --cars

   Script nén mỗi xe, ví dụ từ 93 MB xuống khoảng 4 MB (meshopt + ảnh webp), và ghi kết quả vào `public/showroom-3d/cars/`. Lần đầu
   chạy cần mạng, vì `npx` phải tải `@gltf-transform/cli`. Công cụ này không thêm vào `package.json`.
3. Tải lại trang showroom.

Không cần sửa code. Hướng, kích thước và vị trí xe được tự căn:
- chiều dài xe đặt theo kiểu dáng, ví dụ SUV 4,85 m;
- đáy xe đặt chạm mặt kệ.

Đổi màu sơn: mô hình AI chỉ có một vật liệu, nên màu được nhuộm theo vùng ước lượng. Kết quả gần đúng. Nếu mô hình có vật liệu thân xe
riêng (tên chứa `paint` hoặc `body`), chỉ vật liệu đó được nhuộm.
