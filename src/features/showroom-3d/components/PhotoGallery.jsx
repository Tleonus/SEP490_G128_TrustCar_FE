import { useEffect, useRef, useState } from 'react'
import { LeftOutlined, PictureOutlined, RightOutlined } from '@ant-design/icons'
import PhotoLightbox from './PhotoLightbox'
import styles from '../gallery.module.css'

/**
 * Ảnh xe ở đầu bảng thông số: ảnh lớn có nút trước / sau và số thứ tự, dải ảnh nhỏ bên dưới.
 * Bấm ảnh lớn -> phóng to giữa màn hình (vẫn chuyển ảnh được).
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F07
 */
export default function PhotoGallery({ photos, title }) {
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState(false)
  const strip = useRef(null)
  const count = photos.length
  const go = (i) => setIndex((i + count) % count)

  useEffect(() => {
    strip.current?.children[index]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [index])

  if (!count) {
    return (
      <div className={styles.empty}>
        <PictureOutlined />
        <span>Xe chưa có ảnh</span>
      </div>
    )
  }
  return (
    <div className={styles.gallery}>
      <div className={styles.stage}>
        <button type="button" className={styles.main} onClick={() => setZoom(true)} aria-label="Phóng to ảnh">
          <img src={photos[index]} alt={`${title} – ảnh ${index + 1}`} />
        </button>
        {count > 1 && (
          <>
            <button type="button" className={styles.prev} aria-label="Ảnh trước" onClick={() => go(index - 1)}><LeftOutlined /></button>
            <button type="button" className={styles.next} aria-label="Ảnh sau" onClick={() => go(index + 1)}><RightOutlined /></button>
          </>
        )}
        <span className={styles.count}>{index + 1} / {count}</span>
      </div>
      {count > 1 && (
        <div className={styles.thumbs} ref={strip}>
          {photos.map((src, i) => (
            <button key={src} type="button" className={i === index ? styles.thumbOn : styles.thumb} onClick={() => setIndex(i)}
              aria-label={`Ảnh ${i + 1}`}>
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {zoom && <PhotoLightbox photos={photos} index={index} title={title} onIndex={go} onClose={() => setZoom(false)} />}
    </div>
  )
}
