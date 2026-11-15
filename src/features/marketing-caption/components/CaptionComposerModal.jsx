/**
 * KAN-69 – Modal "Tạo bài đăng Facebook" trong trang Admin chi tiết xe.
 *
 * Luồng: chọn giọng điệu + độ dài → bấm Tạo caption → Backend (KAN-68) trả 3 phương án
 * → xem trước khung bài đăng → Copy từng phương án, hoặc "Mở Facebook" để tự dán bài.
 *
 * Không tự gọi API khi mở modal: mỗi lượt gọi tính vào hạn mức 20 lượt/ngày của Backend.
 */

import { useState } from 'react'
import { App, Alert, Button, Modal, Radio, Segmented } from 'antd'
import { FacebookFilled, ReloadOutlined, SendOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useCaptionSuggestions } from '../hooks/useCaptionSuggestions'
import CaptionOptionCard from './CaptionOptionCard'
import FacebookPostPreview from './FacebookPostPreview'
import { copyText } from '../../../utils/clipboardText'
import { captionToClipboard, normalizeHashtags } from '../utils/captionText'
import { getCoverImage } from '../../../utils/car'
import {
  FACEBOOK_COMPOSER_URL,
  LENGTH_OPTIONS,
  SOURCE_NOTE,
  TONE_PRESETS,
} from '../constants/captionConstants'
import styles from '../styles/CaptionComposer.module.css'

/** Ảnh cho khung preview: gợi ý của AI → ảnh chia sẻ đã lưu → ảnh chính của xe. */
function previewImageUrl(car, imageSuggestion) {
  const suggested = imageSuggestion?.url
  if (typeof suggested === 'string' && suggested.trim()) return suggested.trim()
  const saved = car?.socialImage?.url
  if (typeof saved === 'string' && saved.trim()) return saved.trim()
  return getCoverImage(car)?.url || null
}

export default function CaptionComposerModal({ open, car, onClose }) {
  const { message } = App.useApp()
  const {
    presetId, setPresetId, length, setLength, lengthLocked,
    options, hashtags, imageSuggestion, source, cached,
    loading, error, generate,
  } = useCaptionSuggestions(car?._id)
  const [chosenIndex, setChosenIndex] = useState(0)

  // Không cần effect đồng bộ: nếu danh sách mới ngắn hơn thì kẹp lại khi đọc.
  const selectedIndex = options.length ? Math.min(chosenIndex, options.length - 1) : 0

  const imageUrl = previewImageUrl(car, imageSuggestion)
  const tags = normalizeHashtags(hashtags)

  async function handleGenerate() {
    setChosenIndex(0)
    const result = await generate()
    if (result.ok) message.success(`Đã tạo ${result.count} phương án caption`)
  }

  async function handleOpenFacebook() {
    if (!options.length) return
    try {
      await copyText(captionToClipboard(options[selectedIndex], tags))
      message.info('Đã copy caption. Dán vào bài đăng Facebook vừa mở.')
    } catch {
      message.warning('Không copy được caption tự động. Hãy bấm Copy ở phương án muốn đăng.')
    }
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
            disabled={!options.length || loading}
            className={styles.openFbBtn}
          >
            Mở Facebook
          </Button>
          <p className={styles.previewHint}>
            Nút này mở Facebook ở tab mới và copy phương án đang chọn vào clipboard để bạn dán vào bài đăng.
            TrustCar chưa có quyền đăng bài tự động lên Trang.
          </p>
        </aside>
      </div>
    </Modal>
  )
}
