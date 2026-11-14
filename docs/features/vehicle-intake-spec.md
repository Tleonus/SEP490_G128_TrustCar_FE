# Vehicle Intake — Nhập xe & Biên bản thẩm định TrustCar

Cập nhật theo yêu cầu của chủ dự án ngày 26/10/2026.

## Mục đích

Chủ cửa hàng và nhân viên ghi lại hồ sơ, giá xe, tình trạng thẩm định và ghi chú để quản lý xe trên hệ thống.

## Quy tắc nghiệp vụ

- Form giữ các thông tin định danh, vận hành, sở hữu, giá niêm yết và giá sàn.
- Biên bản có 5 ô checkbox. Mặc định chưa tick; người dùng tick các tiêu chí xe đáp ứng.
- Checklist chỉ ghi nhận thông tin. Mọi tổ hợp từ 0 đến 5 ô tick đều được lưu.
- Checklist không tự quyết định nhập kho, giá xe, trạng thái mở bán hay từ chối; quyết định thuộc chủ cửa hàng.
- Không hiển thị chứng nhận Certified CPO hoặc tự gán trạng thái Available/Rejected.
- Mục “Ghi chú thẩm định” luôn hiển thị, nhập tuỳ chọn và được lưu với mọi tổ hợp checklist.
- Giữ kiểm tra dữ liệu hồ sơ và quan hệ giá sàn không lớn hơn giá niêm yết.
- Chỉ thông báo lưu thành công khi API trả về thành công.

## Dữ liệu lưu

Payload gồm thông tin xe, `checklist` chứa 5 giá trị boolean và `notes` chứa ghi chú chung. Không suy ra `status` hoặc `rejectionReason` từ checklist.

## Trường hợp cần kiểm tra

1. Lưu hồ sơ hợp lệ khi chưa tick mục nào, có hoặc không có ghi chú.
2. Lưu khi tick một phần; giá giữ đúng giá người dùng nhập.
3. Lưu khi tick cả 5 mục, ghi chú vẫn được lưu.
4. Bỏ tick một mục đã tick, hồ sơ vẫn lưu được.
5. Ghi chú luôn có trên màn hình; tick/bỏ tick không xoá nội dung đã nhập.
6. Lỗi kết nối hiển thị lỗi và cho phép thử lưu lại.
