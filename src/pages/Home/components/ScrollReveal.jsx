import { useEffect, useRef, useState } from 'react'
import styles from './ScrollReveal.module.css'

/**
 * Hiệu ứng chuyển động vào/ra mượt mà khi cuộn trang (reversible IntersectionObserver).
 * Khi phần tử vào khung nhìn: trượt vào theo đường cong lò xo iOS; khi cuộn qua hẳn: thu gọn nhẹ để sẵn sàng trượt lại.
 */
function shouldStartVisible() {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return true
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
}

export default function ScrollReveal({
  children,
  variant = 'up',
  delay = 0,
  className = '',
  as: Tag = 'div',
  once = false,
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(shouldStartVisible)

  useEffect(() => {
    const node = ref.current
    if (!node || shouldStartVisible()) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) observer.unobserve(node)
          } else if (!once) {
            // Chỉ ẩn lại khi phần tử đã rời hẳn khỏi viewport để hiệu ứng vào/ra không bị nhấp nháy ở mép
            setVisible(false)
          }
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -6% 0px',
      },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [once])

  const variantClass = styles[variant] || styles.up
  const classes = [styles.reveal, variantClass, visible ? styles.visible : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <Tag
      ref={ref}
      className={classes}
      style={delay ? { '--reveal-delay': `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
