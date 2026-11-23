import { DOOR } from './layout'

const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))

/**
 * Cửa cuốn mở theo vị trí camera (đi đường cố định, bay thẳng hay đi tự do đều đúng);
 * studio chỉ vẽ khi camera gần cửa. Trả về true nếu phần hiển thị của studio vừa đổi.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F03
 */
export function updateDoor({ camera, door, studio, studioTable }) {
  const z = camera.position.z
  door.position.y = DOOR.height / 2 + smooth((-z - 2.5) / 2.5) * (DOOR.height - 0.15)
  const inStudio = z < 4
  if (studio.visible === inStudio) return false
  studio.visible = inStudio
  studioTable.visible = inStudio
  return true
}
