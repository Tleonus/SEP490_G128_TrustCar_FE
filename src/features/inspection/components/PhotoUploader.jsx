/**
 * KAN-55 – Khu vực upload ảnh bằng chứng.
 *
 * Tự quản lý input file + danh sách ảnh đang lên để không phụ thuộc fileList nội bộ của
 * antd Upload (khó đồng bộ khi tải nhiều ảnh song song). Ảnh tải xong được báo về cha
 * qua onAdd(url) — cha là người giữ mảng ảnh trong state biên bản.
 */

import { useRef, useState } from 'react'
import { Button, Image, Progress, Tooltip } from 'antd'
import { DeleteOutlined, PictureOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import styles from '../styles/InspectionDetailPage.module.css'

let pendingSeq = 0

export default function PhotoUploader({
  photos = [],
  onAdd,
  onRemove,
  uploadEvidence,
  max = 10,
  disabled = false,
  emptyHint = 'Chưa có ảnh bằng chứng.',
  label = 'Thêm ảnh',
  accept = '.jpg,.jpeg,.png,.webp',
  compact = false,
}) {
  const inputRef = useRef(null)
  const [pending, setPending] = useState([])
  const [failed, setFailed] = useState({})
  const [error, setError] = useState(null)

  const full = photos.length >= max
  const locked = disabled || full

  function updatePending(id, patch) {
    setPending((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)))
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || [])
    if (files.length === 0) return
    setError(null)

    const room = Math.max(0, max - photos.length - pending.length)
    if (room === 0) {
      setError(`Khu vực này tối đa ${max} ảnh.`)
      return
    }
    const accepted = files.slice(0, room)
    if (files.length > accepted.length) {
      setError(`Chỉ tải lên ${accepted.length}/${files.length} ảnh vì khu vực này tối đa ${max} ảnh.`)
    }

    await Promise.all(accepted.map(async (file) => {
      pendingSeq += 1
      const id = `upload-${pendingSeq}`
      setPending((current) => [...current, { id, name: file.name, percent: 0 }])
      try {
        const url = await uploadEvidence(file, {
          onProgress: (percent) => updatePending(id, { percent }),
        })
        setPending((current) => current.filter((entry) => entry.id !== id))
        onAdd(url)
      } catch (uploadError) {
        setPending((current) => current.filter((entry) => entry.id !== id))
        setError(uploadError?.response?.data?.error?.message
          || uploadError?.message
          || `Không tải được ảnh "${file.name}".`)
      }
    }))
  }

  return (
    <div className={styles.uploader}>
      <div className={compact ? styles.photoGridCompact : styles.photoGrid}>
        {photos.map((url, index) => (
          <figure className={styles.photoCard} key={`${url}-${index}`}>
            {failed[url] ? (
              <div className={styles.photoBroken}>
                <PictureOutlined />
                <span>Không tải được ảnh</span>
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => setFailed((current) => ({ ...current, [url]: false }))}
                >
                  Thử lại
                </Button>
              </div>
            ) : (
              <Image
                src={url}
                alt={`Ảnh bằng chứng ${index + 1}`}
                className={styles.photoImage}
                loading="lazy"
                onError={() => setFailed((current) => ({ ...current, [url]: true }))}
              />
            )}
            {!disabled && (
              <Tooltip title="Gỡ ảnh khỏi biên bản">
                <button
                  type="button"
                  className={styles.photoRemove}
                  aria-label={`Gỡ ảnh bằng chứng ${index + 1}`}
                  onClick={() => onRemove(index)}
                >
                  <DeleteOutlined />
                </button>
              </Tooltip>
            )}
          </figure>
        ))}

        {pending.map((entry) => (
          <div className={styles.photoCard} key={entry.id} aria-label={`Đang tải ${entry.name}`}>
            <div className={styles.photoPending}>
              <Progress type="circle" percent={entry.percent} size={44} />
              <span className={styles.photoPendingName}>{entry.name}</span>
            </div>
          </div>
        ))}

        {!locked && (
          <button
            type="button"
            className={styles.photoAdd}
            onClick={() => inputRef.current?.click()}
            aria-label={label}
          >
            <PlusOutlined />
            <span>{label}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={max > 1}
        className={styles.fileInput}
        onChange={(event) => {
          handleFiles(event.target.files)
          // Cho phép chọn lại chính file vừa rồi.
          event.target.value = ''
        }}
      />

      <div className={styles.uploaderMeta}>
        <span className={styles.muted}>
          {photos.length}/{max} ảnh · JPG, PNG hoặc WEBP, tối đa 10 MB
        </span>
        {photos.length === 0 && pending.length === 0 && !error && (
          <span className={styles.muted}>{emptyHint}</span>
        )}
      </div>

      {error && (
        <p className={styles.fieldError} role="alert">
          {error}
          <Button type="link" size="small" onClick={() => setError(null)}>Bỏ qua</Button>
        </p>
      )}
    </div>
  )
}
