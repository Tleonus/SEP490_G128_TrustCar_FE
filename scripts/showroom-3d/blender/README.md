# Tách bộ phận xe bằng Blender

Mô hình xe tạo bằng AI chỉ có **một vật liệu**: sơn, kính, lốp, logo... nằm chung một ảnh texture. Vì vậy web không đổi màu
được đúng như sơn xe thật. `split_car.py` chạy Blender ở chế độ nền (không mở giao diện), xếp từng mặt của mô hình vào một bộ
phận, rồi xuất GLB mới gồm 7 vật liệu:

| Vật liệu | Bộ phận |
| :--- | :--- |
| `TC_Body_Paint` | Sơn thân xe. Chỉ vật liệu này đổi màu |
| `TC_Glass` | Kính, nóc kính |
| `TC_Tire` / `TC_Rim` | Lốp, mâm |
| `TC_Chrome` | Viền crôm, logo, ốp gương mạ |
| `TC_Trim` | Nhựa đen, lưới tản nhiệt, gầm |
| `TC_Light` | Đèn pha, đèn hậu |

## Cách phân loại

- **Bánh xe:** dò từ hình khối mô hình (chỗ lốp chạm đất và khe hở phía trên lốp).
- **Màu sơn:** đo trên tấm cửa hông. Mặt cùng màu thân xe thì là sơn.
- **Kính:**
  - mặt đứng phía trên đường eo;
  - xe sơn tối: tính theo vị trí;
  - xe sơn sáng: tính theo màu và độ nhám.
- **Đèn:** đèn hậu là chỗ đỏ/cam; đèn pha là chỗ sáng ở đầu xe.
- **Làm mượt:** bỏ các đốm lẻ.

## Cấu hình từng xe

File cấu hình nằm ở `cars/<MÃ XE>.json`. Các trường:

| Trường | Ý nghĩa |
| :--- | :--- |
| `front` | Đầu xe nằm ở phía `-y` hay `+y` |
| `length` | Chiều dài thật (m) |
| `belt` | Độ cao đường eo, tính theo tỉ lệ chiều cao xe |
| `rear_belt` | Đường eo ở đuôi xe |
| `regions` | Các hộp chỉnh tay, ví dụ lưới tản nhiệt hay ốp gương |

Xem trước kết quả phân loại (mỗi bộ phận một màu):

    "C:/Program Files/Blender Foundation/Blender 5.3/blender.exe" -b --factory-startup --python split_car.py -- <vào.glb> <ra.glb> <dài> cars/<MÃ>.json <thư mục ảnh>

`node scripts/showroom-3d/prepare-assets.mjs --cars` tự gọi script này cho mọi xe có file cấu hình, rồi nén bằng gltf-transform.
Xe mới chưa có cấu hình thì vẫn dùng được: web đổi màu bằng mặt nạ ước lượng. Nên tạo cấu hình cho xe mới, xem ảnh xem trước,
chỉnh `front`/`belt` cho đúng, rồi chạy lại.

Script không sửa file GLB gốc.
