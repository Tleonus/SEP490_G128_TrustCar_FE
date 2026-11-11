/**
 * KAN-66 – Khung preview mô phỏng thẻ chia sẻ Facebook, tỷ lệ chuẩn 1200x630.
 * Chỉ là bản xem trước: ảnh crawler thật dùng do Backend (KAN-64) quyết định
 * từ car.socialImage.url, nên bản xem trước chỉ khớp sau khi lưu thành công.
 */

import { getCarTitle } from '../../../utils/car'
import { formatPrice } from '../../../utils/format'
import { PREVIEW_HEIGHT, PREVIEW_WIDTH, SHARE_DOMAIN_LABEL } from '../constants/socialImageConstants'
import styles from '../styles/SocialImagePage.module.css'

export default function SharePreviewCard({ car, imageUrl }) {
  const title = [getCarTitle(car), car?.year, formatPrice(car?.price)].filter(Boolean).join(' · ')

  return (
    <figure className={styles.preview} aria-label="Xem trước thẻ chia sẻ Facebook">
      <div
        className={styles.previewImage}
        style={{ width: PREVIEW_WIDTH, maxWidth: '100%', aspectRatio: `${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}` }}
      >
        {imageUrl
          ? <img src={imageUrl} alt="Ảnh sẽ hiển thị khi chia sẻ" />
          : <span className={styles.previewEmpty}>Chưa chọn ảnh chia sẻ</span>}
      </div>
      <figcaption className={styles.previewCaption}>
        <span className={styles.previewDomain}>{SHARE_DOMAIN_LABEL}</span>
        <strong className={styles.previewTitle}>{title || 'TrustCar'}</strong>
      </figcaption>
    </figure>
  )
}
