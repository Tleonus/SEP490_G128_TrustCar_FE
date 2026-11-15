/**
 * KAN-69 – Một phương án caption: nội dung, hashtag đi kèm và nút Copy.
 *
 * Nút Copy chép cả hashtag (xem utils/captionText.js) vì Backend trả hashtag tách riêng
 * khỏi caption — dán mỗi caption sẽ thiếu phần cuối bài đăng.
 */

import { useState } from 'react'
import { App, Button } from 'antd'
import { CheckOutlined, CopyOutlined } from '@ant-design/icons'
import { copyText } from '../../../utils/clipboardText'
import { captionToClipboard, normalizeHashtags } from '../utils/captionText'
import styles from '../styles/CaptionComposer.module.css'

export default function CaptionOptionCard({ index, caption, hashtags, selected, onSelect }) {
  const { message } = App.useApp()
  const [copied, setCopied] = useState(false)
  const tags = normalizeHashtags(hashtags)

  async function handleCopy() {
    try {
      await copyText(captionToClipboard(caption, tags))
      setCopied(true)
      message.success('Đã copy caption')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      message.error('Không copy được caption. Vui lòng thử lại.')
    }
  }

  return (
    <article className={selected ? styles.optionSelected : styles.option} aria-label={`Phương án ${index + 1}`}>
      <header className={styles.optionHead}>
        <span className={styles.optionLabel}>Phương án {index + 1}</span>
        <div className={styles.optionActions}>
          <Button size="small" onClick={onSelect} aria-pressed={selected}>
            {selected ? 'Đang xem trước' : 'Xem trước'}
          </Button>
          <Button
            size="small"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
            aria-label={`Copy phương án ${index + 1}`}
          >
            {copied ? 'Đã copy' : 'Copy'}
          </Button>
        </div>
      </header>

      <p className={styles.optionText}>{caption}</p>

      {tags.length > 0 && (
        <p className={styles.optionTags}>{tags.join(' ')}</p>
      )}
    </article>
  )
}
