import { useState } from 'react'
import { Button, Image } from 'antd'
import { PictureOutlined, ReloadOutlined } from '@ant-design/icons'
import styles from '../styles/CpoCertificateDetailPage.module.css'

// Thêm tham số chống cache khi tải lại; chỉ với URL http(s), không đụng URL asset/data.
const withRetry = (src, attempt) => {
  if (!attempt || !/^https?:\/\//.test(src)) return src
  return `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}`
}

/** Ảnh bằng chứng có xem phóng to; ảnh lỗi hiện ô thay thế với nút "Tải lại". */
export default function EvidencePhoto({ src, alt }) {
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={styles.photoFailed} role="group" aria-label={`Không tải được ${alt}`}>
        <PictureOutlined />
        <span>Không tải được ảnh</span>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          className={styles.touch}
          onClick={() => {
            setFailed(false)
            setAttempt((n) => n + 1)
          }}
        >
          Tải lại
        </Button>
      </div>
    )
  }

  return (
    <Image
      key={attempt}
      src={withRetry(src, attempt)}
      alt={alt}
      className={styles.photo}
      rootClassName={styles.photoRoot}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
