/**
 * KAN-69 – Modal "Tạo bài đăng Facebook" mở từ cột Thao tác của bảng kho xe.
 *
 * Luồng: mở modal → tự gọi Backend (KAN-68) một lần để soạn 3 phương án caption
 * → xem trước khung bài đăng (ảnh + caption + hashtag) → Copy từng phương án,
 * "Đăng lên Facebook" (KAN-91, Backend gọi Graph API đăng thật và trả post link),
 * hoặc "Mở Facebook (thủ công)" để tự dán bài như trước.
 *
 * Chỉ tự gọi đúng một lần cho mỗi lần mở: mỗi lượt gọi tính vào hạn mức 20 lượt/ngày của
 * Backend, nên người dùng muốn tạo lại phải bấm nút "Tạo lại caption".
 */

import { useEffect, useRef, useState } from 'react'
import { App, Alert, Button, Modal, Radio, Segmented } from 'antd'
import {
  CheckCircleOutlined,
  FacebookFilled,
  ReloadOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useCaptionSuggestions } from '../hooks/useCaptionSuggestions'
import CaptionOptionCard from './CaptionOptionCard'
import FacebookPostPreview from './FacebookPostPreview'
import AiDisclaimer from '../../../components/common/AiDisclaimer'
import { AI_DISCLAIMER_CAPTION } from '../../../constants/aiDisclaimer'
import { publishCaptionToFacebook } from '../api/captionApi'
import { publishErrorMessage } from '../utils/captionErrors'
import { captionToClipboard, normalizeHashtags } from '../utils/captionText'
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
  // KAN-91: trạng thái đăng thật lên Facebook Page.
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(null) // { postId, permalinkUrl, key }
  const [publishError, setPublishError] = useState(null)

  // Không cần effect đồng bộ: nếu danh sách mới ngắn hơn thì kẹp lại khi đọc.
  const selectedIndex = options.length ? Math.min(chosenIndex, options.length - 1) : 0
  const selectedCaption = options[selectedIndex] ?? null

  const imageUrl = previewImageUrl(car, imageSuggestion, preferredImageUrl)
  const tags = normalizeHashtags(hashtags)

  // Cùng một phương án thì không đăng lặp lại (mỗi lần đăng là một bài thật trên Page).
  const publishKey = selectedCaption ? `${selectedIndex}|${selectedCaption}` : null
  const alreadyPublished = Boolean(published && published.key === publishKey)

  /** Đổi phương án: xoá kết quả/lỗi của lần đăng trước để không gây hiểu nhầm. */
  function selectOption(index) {
    setChosenIndex(index)
    setPublishError(null)
    if (published && published.key !== `${index}|${options[index]}`) setPublished(null)
  }

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
    setPublished(null)
    setPublishError(null)
    const result = await generate()
    if (result.ok) message.success(`Đã tạo ${result.count} phương án caption`)
  }

  /**
   * KAN-91 – Đăng thật lên Facebook Page qua Backend. Chỉ báo thành công khi Backend trả
   * postId/permalink của Graph API; mọi lỗi (thiếu cấu hình, token hết hạn…) hiện nguyên nhân.
   */
  async function handlePublish() {
    if (!selectedCaption || publishing || alreadyPublished) return
    const key = publishKey
    setPublishing(true)
    setPublishError(null)
    try {
      const result = await publishCaptionToFacebook(car?._id, captionToClipboard(selectedCaption, tags))
      setPublished({ ...result, key })
      message.success('Đã đăng bài lên Facebook Page')
    } catch (err) {
      setPublishError(publishErrorMessage(err))
    } finally {
      setPublishing(false)
    }
  }

  // Đăng thủ công: chỉ mở Facebook ở tab mới, người dùng tự dán caption đã Copy.
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
                    onSelect={() => selectOption(index)}
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

          {/* KAN-91: đăng thật lên Page qua Graph API; chỉ báo thành công khi có postId từ Facebook. */}
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handlePublish}
            loading={publishing}
            disabled={!selectedCaption || alreadyPublished}
            className={styles.publishBtn}
          >
            {alreadyPublished ? 'Đã đăng phương án này' : 'Đăng lên Facebook'}
          </Button>

          {published && (
            <div className={styles.publishResult} role="status">
              <span className={styles.publishTitle}>
                <CheckCircleOutlined aria-hidden /> Đã đăng lên Facebook Page
              </span>
              <span className={styles.publishMeta}>Mã bài viết: {published.postId}</span>
              {published.permalinkUrl && (
                <a
                  className={styles.publishLink}
                  href={published.permalinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Xem bài viết trên Facebook
                </a>
              )}
            </div>
          )}

          {publishError && (
            <Alert
              type="error"
              showIcon
              title="Không đăng được bài lên Facebook"
              description={publishError}
            />
          )}

          <Button
            icon={<SendOutlined />}
            onClick={handleOpenFacebook}
            className={styles.openFbBtn}
          >
            Mở Facebook (thủ công)
          </Button>
          <p className={styles.previewHint}>
            "Đăng lên Facebook" gửi phương án đang chọn tới Backend để đăng ảnh + caption lên Page
            qua Graph API. Nếu Page chưa được cấu hình, lỗi cấu hình sẽ hiện ở trên. Nút
            "Mở Facebook (thủ công)" chỉ mở Facebook ở tab mới để tự dán bài như trước.
          </p>
        </aside>
      </div>
    </Modal>
  )
}
