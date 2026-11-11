import { useEffect, useRef, useState } from 'react'

/**
 * Đếm ngược tới `expiresAt` (do backend trả về), đã bù lệch giờ máy khách bằng clockOffsetMs.
 * Gọi onExpire đúng một lần khi về 0 (để tải lại trạng thái thật từ backend).
 */
export function useCountdown(expiresAt, { clockOffsetMs = 0, onExpire } = {}) {
  const target = expiresAt ? new Date(expiresAt).getTime() : null
  const [now, setNow] = useState(() => Date.now())
  const onExpireRef = useRef(onExpire)
  const firedForRef = useRef(null)

  const remainingMs = target == null ? null : Math.max(0, target - (now + clockOffsetMs))
  const expired = remainingMs === 0

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  // Nhịp 1 giây; dừng khi đã hết giờ hoặc không có mốc hết hạn.
  useEffect(() => {
    if (target == null || expired) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [target, expired])

  // Báo hết giờ một lần cho mỗi mốc expiresAt.
  useEffect(() => {
    if (remainingMs === 0 && firedForRef.current !== target) {
      firedForRef.current = target
      onExpireRef.current?.()
    }
  }, [remainingMs, target])

  return remainingMs
}

export default useCountdown
