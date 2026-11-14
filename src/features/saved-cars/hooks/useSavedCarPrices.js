import { useCallback, useEffect, useRef, useState } from 'react'
import { getCarByStockCode } from '../../../services/carService'
import { useSavedCarsStore } from '../store/useSavedCarsStore'

/**
 * Lấy giá mới nhất của các xe đã lưu từ API công khai.
 * 404 nghĩa là xe đã bán hoặc gỡ khỏi website; lỗi mạng giữ nguyên giá cũ.
 */
export function useSavedCarPrices() {
  const syncPrice = useSavedCarsStore((state) => state.syncPrice)
  const markUnavailable = useSavedCarsStore((state) => state.markUnavailable)
  const [status, setStatus] = useState('idle')
  const [failed, setFailed] = useState(0)
  const runningRef = useRef(false)

  const refresh = useCallback(async () => {
    if (runningRef.current) return
    const items = useSavedCarsStore.getState().items
    if (items.length === 0) return
    runningRef.current = true
    setStatus('loading')

    const results = await Promise.allSettled(items.map((item) => getCarByStockCode(item.routeKey)))
    let failures = 0
    results.forEach((result, index) => {
      const { id } = items[index]
      if (result.status === 'fulfilled' && result.value) {
        syncPrice(id, result.value)
      } else if (result.status === 'rejected' && result.reason?.response?.status === 404) {
        markUnavailable(id)
      } else {
        failures += 1
      }
    })

    setFailed(failures)
    setStatus(failures === items.length ? 'error' : 'success')
    runningRef.current = false
  }, [syncPrice, markUnavailable])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh])

  return { status, failed, refresh }
}
