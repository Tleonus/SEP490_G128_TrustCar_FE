/**
 * KAN-69 – Khung mô phỏng bài đăng Facebook: ảnh chia sẻ + caption + hashtag.
 *
 * Chỉ là bản xem trước. Ảnh thật khi chia sẻ do Backend quyết định (KAN-64 / KAN-66),
 * nên URL ưu tiên lấy từ imageSuggestion.url mà API caption trả về.
 */

import { getCarTitle } from '../../../utils/car'
import { truncateCaption } from '../utils/captionText'
import styles from '../styles/CaptionComposer.module.css'

export default function FacebookPostPreview({ car, imageUrl, caption, hashtags, placeholder }) {
  const pageName = getCarTitle(car) || 'TrustCar'
  const previewText = caption ? truncateCaption(caption) : ''

  return (
    <figure className={styles.fbCard} aria-label="Xem trước bài đăng Facebook">
      <div className={styles.fbHead}>
        <span className={styles.fbAvatar} aria-hidden="true">T</span>
        <div>
          <strong className={styles.fbPage}>TrustCar</strong>
          <span className={styles.fbMeta}>Bài đăng quảng cáo xe · Công khai</span>
        </div>
      </div>

      {previewText
        ? <p className={styles.fbCaption}>{previewText}</p>
        : <p className={styles.fbEmpty}>{placeholder || 'Chọn giọng điệu rồi bấm "Tạo caption" để xem trước bài đăng.'}</p>}

      {hashtags?.length > 0 && <p className={styles.fbTags}>{hashtags.join(' ')}</p>}

      <div className={styles.fbImage}>
        {imageUrl
          ? <img src={imageUrl} alt={`Ảnh chia sẻ xe ${pageName}`} />
          : <span className={styles.fbImageEmpty}>Chưa có ảnh chia sẻ</span>}
      </div>
    </figure>
  )
}
