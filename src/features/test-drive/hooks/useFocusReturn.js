import { useCallback, useRef } from 'react'

/**
 * Ngăn chi tiết và hộp thoại bị gỡ khỏi DOM ngay khi đóng nên antd không kịp trả focus;
 * ghi nhớ phần tử đã mở và trả focus lại để người dùng bàn phím không mất vị trí.
 */
export function useFocusReturn() {
  const triggerRef = useRef(null)

  const remember = useCallback(() => {
    triggerRef.current = document.activeElement
  }, [])

  const restore = useCallback(() => {
    const trigger = triggerRef.current
    triggerRef.current = null
    // Chờ lớp phủ được gỡ, nếu không bẫy focus của nó sẽ giành lại focus.
    window.requestAnimationFrame(() => trigger?.focus?.())
  }, [])

  return { remember, restore }
}
