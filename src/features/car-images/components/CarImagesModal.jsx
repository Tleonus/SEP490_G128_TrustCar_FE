/**
 * Modal "Nhập ảnh xe" trong bảng kho xe của Admin.
 *
 * Hai cách thêm ảnh: bấm chọn file hoặc kéo-thả vào khung. File được gửi lên
 * POST /manage/cars/:id/images (tối đa 10 file/lần, 5 MB/file, 20 ảnh/xe).
 * Ảnh chính (isPrimary) là ảnh Backend dùng cho trang chia sẻ / OG image — thay cho
 * màn "Ảnh chia sẻ mạng xã hội" cũ vốn cần endpoint Backend chưa có.
 */

import { useRef, useState } from 'react'
import { Alert, App, Button, Modal, Popconfirm, Spin, Tag } from 'antd'
import {
  DeleteOutlined,
  InboxOutlined,
  PictureOutlined,
  StarFilled,
} from '@ant-design/icons'
import { useCarImages } from '../hooks/useCarImages'
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILES_PER_REQUEST,
  MAX_FILE_BYTES,
  MAX_IMAGES_PER_CAR,
} from '../constants/carImageConstants'
import { getCarTitle } from '../../../utils/car'
import styles from '../styles/CarImagesModal.module.css'

const MB = Math.round(MAX_FILE_BYTES / (1024 * 1024))

export default function CarImagesModal({ open, car, onClose, onImagesChange }) {
  const { message } = App.useApp()
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const carId = car?._id || null
  const {
    images, primaryImage, total, canUploadMore, uploading, deletingId,
    errors, upload, remove, clearErrors,
  } = useCarImages(carId, car?.images)

  async function handleFiles(fileList) {
    if (!fileList?.length) return
    clearErrors()
    const result = await upload(Array.from(fileList))
    if (result.ok) {
      const count = result.added?.length || 0
      message.success(
        count > 0 ? `Đã thêm ${count} ảnh vào gallery của xe.` : 'Đã tải ảnh lên.',
      )
      onImagesChange?.()
    }
  }

  function handleInputChange(event) {
    handleFiles(event.target.files)
    event.target.value = ''
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    if (!canUploadMore || uploading) return
    handleFiles(event.dataTransfer?.files)
  }

  async function handleRemove(image) {
    const result = await remove(image)
    if (result.ok) {
      message.success('Đã xoá ảnh khỏi gallery.')
      onImagesChange?.()
    } else if (result.message) {
      message.error(result.message)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={(
        <span className={styles.modalTitle}>
          <PictureOutlined className={styles.modalIcon} aria-hidden="true" /> Nhập ảnh xe
        </span>
      )}
      width={880}
      centered
      destroyOnHidden
      footer={(
        <div className={styles.footer}>
          <span className={styles.counter}>
            {total}/{MAX_IMAGES_PER_CAR} ảnh · tối đa {MAX_FILES_PER_REQUEST} ảnh mỗi lần, {MB} MB/ảnh
          </span>
          <Button type="primary" onClick={onClose}>Xong</Button>
        </div>
      )}
    >
      <div className={styles.head}>
        <strong className={styles.carName}>{getCarTitle(car) || 'Xe đang cập nhật'}</strong>
        <span className={styles.carCode}>Mã xe {car?.vehicleCode || '—'}</span>
      </div>


      <div
        className={[
          styles.dropzone,
          dragging ? styles.dropzoneActive : '',
          (!canUploadMore || uploading) ? styles.dropzoneDisabled : '',
        ].filter(Boolean).join(' ')}
        onDragOver={(event) => { event.preventDefault(); if (canUploadMore && !uploading) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => { if (canUploadMore && !uploading) inputRef.current?.click() }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (canUploadMore && !uploading) inputRef.current?.click()
          }
        }}
        aria-label="Chọn hoặc kéo-thả ảnh để tải lên"
      >
        {uploading ? <Spin /> : <InboxOutlined className={styles.dropIcon} />}
        <p className={styles.dropTitle}>
          {uploading
            ? 'Đang tải ảnh lên...'
            : canUploadMore
              ? 'Kéo thả ảnh vào đây, hoặc bấm để chọn file'
              : `Đã đủ ${MAX_IMAGES_PER_CAR} ảnh`}
        </p>
        <p className={styles.dropHint}>JPG, PNG, WEBP · tối đa {MB} MB mỗi ảnh</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          multiple
          hidden
          onChange={handleInputChange}
          aria-label="Chọn file ảnh để tải lên"
        />
      </div>

      {errors.length > 0 && (
        <Alert
          type="error"
          showIcon
          className={styles.errorBox}
          title="Không thêm được ảnh"
          description={(
            <ul className={styles.errorList}>
              {errors.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
        />
      )}

      {images.length === 0 ? (
        <p className={styles.emptyNote}>Xe chưa có ảnh nào trong gallery.</p>
      ) : (
        <div className={styles.grid}>
          {images.map((image, index) => (
            <figure key={image._id || image.url} className={styles.tile}>
              <img src={image.url} alt={image.caption || `Ảnh xe ${index + 1}`} loading="lazy" />
              {image.isPrimary && (
                <Tag color="blue" className={styles.primaryTag} icon={<StarFilled />}>
                  Ảnh chính
                </Tag>
              )}
              <Popconfirm
                title="Xoá ảnh này?"
                description={image.isPrimary ? 'Ảnh chính sẽ được thay bằng ảnh kế tiếp.' : 'Ảnh bị xoá khỏi gallery của xe.'}
                okText="Xoá"
                cancelText="Huỷ"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleRemove(image)}
              >
                <Button
                  danger
                  type="primary"
                  size="small"
                  icon={<DeleteOutlined />}
                  className={styles.deleteBtn}
                  loading={deletingId === image._id}
                  aria-label={`Xoá ảnh ${index + 1}`}
                  title="Xoá ảnh"
                />
              </Popconfirm>
              <figcaption className={styles.tileIndex}>{index + 1}</figcaption>
            </figure>
          ))}
        </div>
      )}

      {primaryImage && (
        <p className={styles.primaryNote}>
          Ảnh chính hiện tại sẽ là ảnh đầu tiên trong gallery khi xe được chia sẻ lên mạng xã hội.
        </p>
      )}
    </Modal>
  )
}
