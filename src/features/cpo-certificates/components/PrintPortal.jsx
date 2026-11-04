import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import '../styles/certificatePrint.css'

/**
 * In một nội dung riêng bằng window.print() và stylesheet in riêng.
 * Nội dung gắn thẳng vào <body> (ngoài #root); khi in, body.cpo-printing ẩn mọi thứ khác.
 * Chỉ gọi print sau khi mọi ảnh bên trong đã tải xong (hoặc lỗi), để bản in không thiếu ảnh.
 * Gỡ nội dung sau sự kiện afterprint (Safari iOS không chặn luồng khi print()).
 *
 * @param {{ onDone: () => void, children: React.ReactNode }} props
 */
export default function PrintPortal({ onDone, children }) {
  const rootRef = useRef(null)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    let cancelled = false
    const finish = () => onDoneRef.current()
    document.body.classList.add('cpo-printing')

    const images = [...(rootRef.current?.querySelectorAll('img') ?? [])]
    const loaded = images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true })
            img.addEventListener('error', resolve, { once: true })
          }),
    )
    Promise.all(loaded).then(() => {
      if (cancelled) return
      window.addEventListener('afterprint', finish, { once: true })
      window.print()
    })

    return () => {
      cancelled = true
      window.removeEventListener('afterprint', finish)
      document.body.classList.remove('cpo-printing')
    }
  }, [])

  return createPortal(
    <div className="cpo-print-root" ref={rootRef} aria-hidden="true">
      {children}
    </div>,
    document.body,
  )
}
