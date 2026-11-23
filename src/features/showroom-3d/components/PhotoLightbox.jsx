import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import styles from '../gallery.module.css'

const SWIPE_PX = 50

/**
 * Xem ảnh phóng to giữa màn hình: nút trước / sau, phím ← →, vuốt trên điện thoại, Esc hoặc bấm nền để đóng.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F07
 */
export default function PhotoLightbox({ photos, index, title, onIndex, onClose }) {
  const touch = useRef(null)
  const count = photos.length

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onIndex(index - 1)
      else if (e.key === 'ArrowRight') onIndex(index + 1)
      else return
      e.preventDefault()
      e.stopPropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [index, onIndex, onClose])

  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - (touch.current ?? 0)
    if (Math.abs(dx) > SWIPE_PX) onIndex(index + (dx < 0 ? 1 : -1))
  }

  return createPortal(
    <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={`Ảnh ${title}`} onClick={onClose}>
      <img
        src={photos[index]}
        alt={`${title} – ảnh ${index + 1}`}
        className={styles.big}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
        onTouchEnd={onTouchEnd}
      />
      <button type="button" className={styles.close} aria-label="Đóng" onClick={onClose}><CloseOutlined /></button>
      {count > 1 && (
        <>
          <button type="button" className={styles.bigPrev} aria-label="Ảnh trước"
            onClick={(e) => { e.stopPropagation(); onIndex(index - 1) }}><LeftOutlined /></button>
          <button type="button" className={styles.bigNext} aria-label="Ảnh sau"
            onClick={(e) => { e.stopPropagation(); onIndex(index + 1) }}><RightOutlined /></button>
        </>
      )}
      <span className={styles.bigCount}>{index + 1} / {count}</span>
    </div>,
    document.body,
  )
}
