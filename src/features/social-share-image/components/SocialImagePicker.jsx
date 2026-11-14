/**
 * KAN-66 – Lưới thumbnail ảnh hiện có của xe: tick chọn đúng 1 ảnh làm ảnh chia sẻ,
 * hoặc upload ảnh mới (POST /manage/cars/:id/images). Ảnh vừa upload được chọn sẵn.
 */

import { useRef } from 'react'
import { Button } from 'antd'
import { CheckOutlined, PlusOutlined } from '@ant-design/icons'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGES_PER_CAR } from '../constants/socialImageConstants'
import styles from '../styles/SocialImagePage.module.css'

export default function SocialImagePicker({ images, selectedUrl, savedUrl, canUploadMore, uploading, onSelect, onUpload }) {
  const inputRef = useRef(null)

  function handleFiles(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onUpload(file)
  }

  return (
    <div className={styles.picker}>
      <div className={styles.grid} role="radiogroup" aria-label="Chọn ảnh chia sẻ">
        {images.map((image) => {
          const selected = image.url === selectedUrl
          return (
            <button
              key={image._id || image.url}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? styles.tileSelected : styles.tile}
              onClick={() => onSelect(image.url)}
            >
              <img src={image.url} alt={image.caption || 'Ảnh xe'} />
              {image.isPrimary && <span className={styles.badge}>Ảnh chính</span>}
              {image.url === savedUrl && <span className={styles.badgeSaved}>Đang dùng</span>}
              {selected && <span className={styles.check}><CheckOutlined /></span>}
            </button>
          )
        })}

        <button
          type="button"
          className={styles.uploadTile}
          disabled={!canUploadMore || uploading}
          onClick={() => inputRef.current?.click()}
        >
          <PlusOutlined />
          <span>{uploading ? 'Đang tải lên...' : 'Tải ảnh mới'}</span>
          {!canUploadMore && <small>Đã đủ {MAX_IMAGES_PER_CAR} ảnh</small>}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        hidden
        onChange={handleFiles}
        aria-label="Chọn file ảnh để tải lên"
      />

      {images.length === 0 && (
        <p className={styles.emptyNote}>Xe chưa có ảnh nào. Tải một ảnh lên để dùng làm ảnh chia sẻ.</p>
      )}
      <div className={styles.pickerHint}>
        <Button type="link" size="small" onClick={() => onSelect(null)} disabled={!selectedUrl}>
          Bỏ chọn
        </Button>
        <span>Chỉ chọn được một ảnh. Ảnh mới tải lên được thêm vào gallery của xe ngay.</span>
      </div>
    </div>
  )
}
