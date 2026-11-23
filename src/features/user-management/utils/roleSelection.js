/**
 * Logic thuần cho màn gán role nhân sự (KAN-93). Tách khỏi component để test được
 * không cần render. Backend là nguồn chân lý cuối cùng; ở đây chỉ dựng payload
 * và kiểm tra sớm cho UI.
 */

/**
 * Dựng mảng roleIds gửi lên PUT /users/:id/roles.
 * Thứ tự quan trọng: phần tử đầu là role chính. Role đang là role chính được giữ
 * ở đầu nếu người dùng vẫn chọn nó; nếu không, role được chọn đầu tiên trong danh
 * sách hiển thị lên đầu.
 *
 * @param {string[]} selectedNames  Tên các role đang tick (vd ['SALES_STAFF','INSPECTOR']).
 * @param {string}   primaryName    Role chính hiện tại (có thể null).
 * @param {Array<{_id:string,name:string}>} roles  Danh sách role gán được từ API.
 * @returns {string[]} roleIds theo thứ tự gửi lên.
 */
export function buildRoleIdsPayload(selectedNames, primaryName, roles) {
  const byName = new Map(roles.map((r) => [r.name, r._id]))
  const names = selectedNames.filter((n) => byName.has(n))

  if (names.length === 0) return []

  const ordered = primaryName && names.includes(primaryName)
    ? [primaryName, ...names.filter((n) => n !== primaryName)]
    : names

  return ordered.map((n) => byName.get(n))
}

/**
 * Các role người dùng đã bỏ tick so với tập hiện tại — dùng để cảnh báo trước khi lưu
 * (bỏ role có thể thu hồi quyền truy cập ngay lập tức vì BE tăng tokenVersion).
 */
export function removedRoles(currentNames, selectedNames) {
  return (currentNames || []).filter((n) => !selectedNames.includes(n))
}

/** Tên các role mới được thêm so với hiện tại. */
export function addedRoles(currentNames, selectedNames) {
  return selectedNames.filter((n) => !(currentNames || []).includes(n))
}

/**
 * Kiểm tra sớm trước khi gọi API. Trả về chuỗi lỗi tiếng Việt hoặc null nếu hợp lệ.
 * Backend vẫn kiểm lại (400/409), đây chỉ để phản hồi nhanh trên UI.
 */
export function validateRoleSelection(selectedNames) {
  if (!selectedNames || selectedNames.length === 0) {
    return 'Phải chọn ít nhất một vai trò.'
  }
  return null
}
