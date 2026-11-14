/**
 * KAN-67 – Nút chia sẻ xe (Facebook, Zalo, Copy link) trên trang chi tiết xe công khai.
 *
 * Mọi nút dùng link Backend /share/car/:code (xem utils/shareUrl.js) để Facebook/Zalo
 * lấy được ảnh OG (KAN-64). Backend chỉ render trang chia sẻ cho xe đang bán (AVAILABLE)
 * có mã TC-YYYY-NNNN, nên các trường hợp khác bị khoá nút kèm lý do.
 */

import { App, Button } from 'antd'
import { FacebookFilled, LinkOutlined, ShareAltOutlined } from '@ant-design/icons'
import { buildShareUrl, facebookShareUrl, zaloShareUrl } from '../utils/shareUrl'
import { copyToClipboard } from '../utils/clipboard'
import styles from '../styles/ShareButtons.module.css'

export default function ShareButtons({ car }) {
  const { message } = App.useApp()
  const shareUrl = buildShareUrl(car?.vehicleCode)
  const notAvailable = Boolean(car?.status) && car.status !== 'AVAILABLE'

  let disabledReason = null
  if (!shareUrl) disabledReason = 'Xe chưa có mã hợp lệ nên chưa tạo được link chia sẻ.'
  else if (notAvailable) disabledReason = 'Chỉ xe đang mở bán mới chia sẻ được.'
  const disabled = Boolean(disabledReason)

  /** Nút mở tab mới khi dùng được; khi bị khoá thì là <button> thường, không có href. */
  function linkProps(buildHref) {
    return disabled ? {} : { href: buildHref(shareUrl), target: '_blank', rel: 'noopener noreferrer' }
  }

  async function handleCopy() {
    try {
      await copyToClipboard(shareUrl)
      message.success('Đã copy link')
    } catch {
      message.error('Không copy được link. Vui lòng thử lại.')
    }
  }

  return (
    <section className={styles.share} aria-label="Chia sẻ xe">
      <span className={styles.label}>
        <ShareAltOutlined aria-hidden="true" /> Chia sẻ
      </span>

      <div className={styles.buttons}>
        <Button
          className={styles.btn}
          icon={<FacebookFilled className={styles.facebookIcon} />}
          {...linkProps(facebookShareUrl)}
          disabled={disabled}
          aria-label="Chia sẻ lên Facebook"
        >
          Facebook
        </Button>
        <Button
          className={styles.btn}
          icon={<span className={styles.zaloMark} aria-hidden="true">Z</span>}
          {...linkProps(zaloShareUrl)}
          disabled={disabled}
          aria-label="Chia sẻ qua Zalo"
        >
          Zalo
        </Button>
        <Button
          className={styles.btn}
          icon={<LinkOutlined />}
          onClick={handleCopy}
          disabled={disabled}
          aria-label="Copy link chia sẻ"
        >
          Copy link
        </Button>
      </div>

      {disabledReason && <p className={styles.hint}>{disabledReason}</p>}
    </section>
  )
}
