import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchCarHoldStatus } from '../api/depositApi'
import { useAuthStore } from '../../../store/useAuthStore'

const POLL_MS = 30_000

/**
 * Trạng thái giữ xe lấy từ backend (nguồn sự thật duy nhất).
 * - Tự tải lại định kỳ (30s) và khi tab được mở lại, để thấy xe vừa bị người khác giữ / được mở lại.
 * - Tải lại khi đăng nhập / đăng xuất (BE trả isMine khác nhau).
 * - clockOffsetMs = giờ server − giờ máy khách, dùng cho đồng hồ đếm ngược.
 */
export function useCarHoldStatus(carKey) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(Boolean(carKey))
  const [error, setError] = useState(null)
  const [clockOffsetMs, setClockOffsetMs] = useState(0)
  const controllerRef = useRef(null)

  const refresh = useCallback(async () => {
    if (!carKey) return null
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const startedAt = Date.now()
    try {
      const data = await fetchCarHoldStatus(carKey, controller.signal)
      if (controller.signal.aborted) return null
      const receivedAt = Date.now()
      if (data?.serverTime) {
        // Giả định server trả lời ở giữa khoảng request → bù nửa độ trễ mạng.
        const midpoint = startedAt + (receivedAt - startedAt) / 2
        setClockOffsetMs(new Date(data.serverTime).getTime() - midpoint)
      }
      setStatus(data)
      setError(null)
      return data
    } catch (err) {
      if (controller.signal.aborted || err?.code === 'ERR_CANCELED') return null
      setError(err)
      return null
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [carKey])

  useEffect(() => {
    // Tải dữ liệu từ backend khi mount (cùng cách với hooks/useCarDetail.js).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      controllerRef.current?.abort()
    }
  }, [refresh, isAuthenticated])

  return { status, loading, error, clockOffsetMs, refresh }
}

export default useCarHoldStatus
