// Kích thước và vị trí trong showroom (mét). Gốc tọa độ ở giữa sảnh, trục -Z là vách sau (cửa cuốn).
// @ears .sdd/features/showroom-3d/SPEC.md#REQ-F03

export const HALL = { minX: -9.5, maxX: 9.5, minZ: -8, maxZ: 9.2, height: 5.2 }
export const STUDIO = { minX: -8, maxX: 8, minZ: -22, maxZ: -8, height: 6 }
export const DOOR = { width: 4.4, height: 3.8 }

export const TURNTABLE_RADIUS = 2.8
export const SLOTS = {
  // yaw: góc quay ban đầu để thấy đầu xe chéo 3/4 (mô hình đã xoay cho chiều dài theo trục X)
  left: { x: -3.4, z: -2.4, yaw: -0.6 },
  right: { x: 3.4, z: -2.4, yaw: -2.5 },
  studio: { x: 1.2, z: -15, yaw: -0.55 },
}
export const LOUNGE = { x: -6.0, z: 4.3 }

export const STOPS = [
  {
    key: 'hall',
    label: 'Sảnh trưng bày',
    eyebrow: '01 / Sảnh trưng bày',
    title: 'Mời anh chị vào showroom',
    text: 'Xe thật trong kho TRUST CAR, dựng 3D. Bấm "Tiếp theo" hoặc vuốt để đi tiếp.',
    pos: [0, 2.15, 7.7],
    target: [0, 1.55, -3.6],
    fov: 62,
  },
  {
    key: 'cars',
    label: 'Dàn xe',
    eyebrow: '02 / Dàn xe',
    title: 'Dàn xe đang bán',
    text: 'Kéo để xoay bàn xoay, bấm vào xe để xem ảnh và thông số.',
    pos: [0, 2.0, 7.5],
    target: [0, 0.75, -2.4],
    fov: 54,
  },
  {
    key: 'lounge',
    label: 'Bàn tư vấn',
    eyebrow: '03 / Bàn tư vấn',
    title: 'Ngồi xuống nói chuyện',
    text: 'Trả lời 5 câu, TRUST CAR gợi ý xe hợp với anh chị.',
    pos: [-1.6, 1.55, 7.6],
    target: [-6.0, 0.75, 3.5],
  },
  {
    key: 'studio',
    label: 'Studio màu sơn',
    eyebrow: '04 / Studio màu sơn',
    title: 'Thử màu khác',
    text: 'Kéo ngang để xoay xe. Chọn một màu sơn bên dưới.',
    pos: [5.6, 1.75, -8.6],
    target: [0.4, 1.15, -15.4],
    fov: 54,
    // Đường camera từ bàn tư vấn đi qua cửa cuốn vào studio.
    via: [
      { pos: [0, 1.75, -4.8], target: [0, 1.5, -10] },
      { pos: [0.6, 1.75, -8.9], target: [0, 1.1, -15] },
    ],
  },
]
