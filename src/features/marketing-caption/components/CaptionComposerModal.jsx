/**
 * KAN-69 – Modal "Tạo bài đăng Facebook" mở từ cột Thao tác của bảng kho xe.
 *
 * Luồng: mở modal → tự gọi Backend (KAN-68) một lần để soạn 3 phương án caption
 * → xem trước khung bài đăng (ảnh + caption + hashtag) → Copy từng phương án,
 * hoặc "Mở Facebook" để mở facebook.com ở tab mới rồi tự dán bài.
 *
 * Chỉ tự gọi đúng một lần cho mỗi lần mở: mỗi lượt gọi tính vào hạn mức 20 lượt/ngày của
 * Backend, nên người dùng muốn tạo lại phải bấm nút "Tạo lại caption".
 */

import { useEffect, useRef, useState } from 'react'
import { App, Alert, Button, Modal, Radio, Segmented } from 'antd'
import { FacebookFilled, ReloadOutlined, SendOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useCaptionSuggestions } from '../hooks/useCaptionSuggestions'
import CaptionOptionCard from './CaptionOptionCard'
import FacebookPostPreview from './FacebookPostPreview'
import AiDisclaimer from '../../../components/common/AiDisclaimer'
import { AI_DISCLAIMER_CAPTION } from '../../../constants/aiDisclaimer'
import { normalizeHashtags } from '../utils/captionText'
import { getCoverImage } from '../../../utils/car'
import {
  FACEBOOK_COMPOSER_URL,
  LENGTH_OPTIONS,
  SOURCE_NOTE,
  TONE_PRESETS,
} from '../constants/captionConstants'
import styles from '../styles/CaptionComposer.module.css'

/**
 * Ảnh cho khung preview: ảnh truyền vào (ảnh chính trong gallery của xe) → gợi ý của AI → ảnh bìa.
 * Không còn ảnh chia sẻ riêng vì Backend chưa có endpoint lưu; ảnh chính là ảnh crawler dùng.
 */
function previewImageUrl(car, imageSuggestion, preferredUrl) {
  const preferred = typeof preferredUrl === 'string' ? preferredUrl.trim() : ''
  if (preferred) return preferred
  const suggested = imageSuggestion?.url
  if (typeof suggested === 'string' && suggested.trim()) return suggested.trim()
  return getCoverImage(car)?.url || null
}

export default function CaptionComposerModal({ open, car, onClose, imageUrl: preferredImageUrl }) {
  const { message } = App.useApp()
  const {
    presetId, setPresetId, length, setLength, lengthLocked,
    options, hashtags, imageSuggestion, source, cached,
    loading, error, generate,
  } = useCaptionSuggestions(car?._id)
  const [chosenIndex, setChosenIndex] = useState(0)

  // Không cần effect đồng bộ: nếu danh sách mới ngắn hơn thì kẹp lại khi đọc.
  const selectedIndex = options.length ? Math.min(chosenIndex, options.length - 1) : 0

  const imageUrl = previewImageUrl(car, imageSuggestion, preferredImageUrl)
  const tags = normalizeHashtags(hashtags)

  // Tự soạn caption ngay khi mở modal để không phải bấm thêm một bước.
  // Chỉ chạy một lần cho mỗi lần mở (StrictMode gọi effect 2 lần, và mỗi lượt gọi tốn một
  // suất trong hạn mức 20 lượt/ngày của Backend), nên chặn bằng ref và reset khi đóng.
  const autoRunRef = useRef(false)
  useEffect(() => {
    if (!open) {
      autoRunRef.current = false
      return
    }
    if (autoRunRef.current || !car?._id) return
    autoRunRef.current = true
    generate()
  }, [open, car?._id, generate])

  async function handleGenerate() {
    setChosenIndex(0)
    const result = await generate()
    if (result.ok) message.success(`Đã tạo ${result.count} phương án caption`)
  }

  // Chỉ mở Facebook ở tab mới. Caption đã soạn sẵn để người dùng bấm Copy ở phương án muốn đăng.
  function handleOpenFacebook() {
    window.open(FACEBOOK_COMPOSER_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={(
        <span className={styles.modalTitle}>
          <FacebookFilled className={styles.modalIcon} aria-hidden="true" /> Tạo bài đăng Facebook
        </span>
      )}
      width={1080}
      centered
      destroyOnHidden
      footer={null}
    >
      <div className={styles.layout}>
        <div className={styles.controls}>
          <div className={styles.field}>
            <span className={styles.fieldLabel} id="caption-tone-label">Giọng điệu</span>
            <Segmented
              aria-labelledby="caption-tone-label"
              block
              value={presetId}
              onChange={setPresetId}
              options={TONE_PRESETS.map((item) => ({ value: item.presetId, label: item.label }))}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel} id="caption-length-label">Độ dài</span>
            <Radio.Group
              aria-labelledby="caption-length-label"
              optionType="button"
              buttonStyle="solid"
              value={lengthLocked ? 'short' : length}
              disabled={lengthLocked}
              onChange={(event) => setLength(event.target.value)}
              options={LENGTH_OPTIONS}
            />
            {lengthLocked && (
              <span className={styles.fieldHint}>Giọng "Ngắn gọn" luôn dùng độ dài ngắn.</span>
            )}
          </div>

          <Button
            type="primary"
            icon={loading ? <ReloadOutlined /> : <ThunderboltOutlined />}
            loading={loading}
            onClick={handleGenerate}
            className={styles.generateBtn}
          >
            {options.length ? 'Tạo lại caption' : 'Tạo caption'}
          </Button>

          {error && <Alert type="error" showIcon title="Không tạo được caption" description={error} />}

          {options.length > 0 && (
            <>
              <AiDisclaimer variant="strip" text={AI_DISCLAIMER_CAPTION} />
              <p className={styles.resultNote}>
                {SOURCE_NOTE[source] || 'Ba phương án do Backend trả về.'}
                {cached ? ' Nội dung lấy từ bản đã lưu vì thông tin xe chưa đổi.' : ''}
              </p>
              <div className={styles.options}>
                {options.map((caption, index) => (
                  <CaptionOptionCard
                    key={`${index}-${caption.slice(0, 24)}`}
                    index={index}
                    caption={caption}
                    hashtags={tags}
                    selected={index === selectedIndex}
                    onSelect={() => setChosenIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <aside className={styles.previewPane}>
          <span className={styles.previewLabel}>Xem trước bài đăng</span>
          <FacebookPostPreview
            car={car}
            imageUrl={imageUrl}
            caption={options[selectedIndex]}
            hashtags={tags}
          />
          <Button
            icon={<SendOutlined />}
            onClick={handleOpenFacebook}
            className={styles.openFbBtn}
          >
            Mở Facebook
          </Button>
          <p className={styles.previewHint}>
            Nút này chỉ mở Facebook ở tab mới. Ảnh và caption đã có sẵn ở trên — bấm Copy ở phương án
            muốn đăng rồi tải ảnh lên bài viết. TrustCar chưa có quyền đăng bài tự động lên Trang.
          </p>
        </aside>
      </div>
    </Modal>
  )
}
