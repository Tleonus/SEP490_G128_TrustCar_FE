import { useRef, useState } from 'react'

/**
 * Chạy một thao tác ghi đúng MỘT lần tại một thời điểm. Cờ khóa là `ref` đặt đồng bộ trước `await`, nên bấm đúp
 * (hai lần gọi trong cùng một lượt render, khi `state` chưa kịp cập nhật) vẫn chỉ gửi một yêu cầu.
 * `busy` dùng để hiện trạng thái đang gửi và khóa nút. Không tự thử lại.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F37
 * @returns {{ busy: boolean, run: (task: () => Promise<void>) => Promise<void> }}
 */
export function useRunOnce() {
  const locked = useRef(false)
  const [busy, setBusy] = useState(false)

  async function run(task) {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    try {
      await task()
    } finally {
      locked.current = false
      setBusy(false)
    }
  }

  return { busy, run }
}
