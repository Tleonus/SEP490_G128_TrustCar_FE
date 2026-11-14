const DAY_MS = 24 * 60 * 60 * 1000

// Số ngày tròn kể từ khi xe được nhập; không âm khi đồng hồ máy lệch so với máy chủ.
export function getWaitingDays(createdAt, now = Date.now()) {
  const start = new Date(createdAt).getTime()
  if (!createdAt || Number.isNaN(start)) return null
  return Math.max(0, Math.floor((now - start) / DAY_MS))
}
