// KAN-92: bảng màu theo nhóm hành động (tạo = xanh lá, cập nhật = xanh dương, xóa = đỏ, đổi trạng thái = cam, xác thực = tím).

const TONES = {
  CREATE: { bg: '#ecfdf3', fg: '#067647', dot: '#12b76a' },
  UPDATE: { bg: '#eff8ff', fg: '#175cd3', dot: '#2e90fa' },
  DELETE: { bg: '#fef3f2', fg: '#b42318', dot: '#f04438' },
  STATUS_CHANGE: { bg: '#fff7ed', fg: '#b54708', dot: '#f79009' },
  AUTH: { bg: '#f4f3ff', fg: '#5925dc', dot: '#7a5af8' },
  OTHER: { bg: '#f2f4f7', fg: '#475467', dot: '#98a2b3' },
}

/**
 * Màu của một nhóm hành động; mã lạ/thiếu dùng màu xám "Khác".
 * @param {string|null|undefined} action
 * @returns {{ bg: string, fg: string, dot: string }}
 */
export function actionTone(action) {
  return (action && Object.hasOwn(TONES, action) ? TONES[action] : TONES.OTHER)
}
