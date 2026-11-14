/**
 * KAN-66 – Màn chọn ảnh chia sẻ mạng xã hội: /admin/inventory/:id
 *
 * Block "Ảnh chia sẻ mạng xã hội": lưới thumbnail ảnh hiện có, tick chọn 1 ảnh
 * hoặc upload ảnh mới, khung preview tỷ lệ 1200x630, nút lưu gọi
 * PATCH /manage/cars/:id/social-image.
 *
 * Backend chưa có endpoint lưu (xem api/socialImageApi.js): nút lưu gọi thật và
 * hiển thị lỗi Backend trả về, không giả lập lưu thành công.
 */

import { Link, useParams } from 'react-router-dom'
import { Alert, App, Button } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useSocialImage } from '../hooks/useSocialImage'
import SocialImagePicker from '../components/SocialImagePicker'
import SharePreviewCard from '../components/SharePreviewCard'
import { LoadingState, ErrorState } from '../../../components/common/StateBlock'
import { getCarTitle } from '../../../utils/car'
import { ADMIN_PATHS } from '../../../router/paths'
import { CAR_STATUS_META } from '../../inspection/constants/inspectionConstants'
import styles from '../styles/SocialImagePage.module.css'

export default function SocialImagePage() {
  const { id: carId } = useParams()
  const { notification } = App.useApp()
  const {
    car, images, loading, loadError, selectedUrl, isDirty, canUploadMore,
    uploading, saving, actionError, selectImage, uploadImage, save,
  } = useSocialImage(carId)

  async function handleSave() {
    const result = await save()
    if (result.ok) {
      notification.success({ message: 'Đã lưu ảnh chia sẻ', description: 'Ảnh này sẽ dùng khi chia sẻ xe lên mạng xã hội.' })
    } else if (result.message) {
      notification.error({ message: 'Không lưu được ảnh chia sẻ', description: result.message })
    }
  }

  if (loading) return <div className={styles.page}><LoadingState text="Đang tải thông tin xe..." /></div>
  if (loadError) {
    return (
      <div className={styles.page}>
        <ErrorState message={loadError} />
        <Link to={ADMIN_PATHS.inventory}>Quay lại kho xe</Link>
      </div>
    )
  }

  const statusMeta = CAR_STATUS_META[car?.status]

  return (
    <div className={styles.page}>
      <Link to={ADMIN_PATHS.inventory} className={styles.backLink}>
        <ArrowLeftOutlined /> Kho xe
      </Link>

      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>KHO XE · CHIA SẺ</span>
          <h1 className={styles.title}>{getCarTitle(car) || 'Chi tiết xe'}</h1>
          <p className={styles.desc}>
            Mã xe <strong>{car?.vehicleCode || '—'}</strong>
            {statusMeta ? <> · {statusMeta.label}</> : null}
          </p>
        </div>
      </header>

      <section className={styles.block} aria-labelledby="social-image-title">
        <header className={styles.blockHead}>
          <h2 id="social-image-title">Ảnh chia sẻ mạng xã hội</h2>
          <p>Ảnh này hiển thị khi xe được chia sẻ lên Facebook. Chọn một ảnh có sẵn hoặc tải ảnh mới, rồi xem trước trước khi lưu.</p>
        </header>

        <Alert
          type="info"
          showIcon
          title="API lưu ảnh chia sẻ chưa có trên Backend"
          description="Nút Lưu gọi PATCH /manage/cars/:id/social-image đúng như yêu cầu, nhưng Backend hiện chưa triển khai endpoint này (model xe cũng chưa có trường socialImage). Lưu sẽ báo lỗi cho đến khi Backend bổ sung — không có dữ liệu nào bị giả lập là đã lưu."
        />

        <div className={styles.layout}>
          <SocialImagePicker
            images={images}
            selectedUrl={selectedUrl}
            savedUrl={car?.socialImage?.url || null}
            canUploadMore={canUploadMore}
            uploading={uploading}
            onSelect={selectImage}
            onUpload={uploadImage}
          />
          <SharePreviewCard car={car} imageUrl={selectedUrl} />
        </div>

        {actionError && <Alert type="error" showIcon title={actionError} />}

        <div className={styles.actions}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            disabled={!selectedUrl || !isDirty || uploading}
            loading={saving}
            onClick={handleSave}
          >
            Lưu ảnh chia sẻ
          </Button>
          {!selectedUrl && <span className={styles.actionHint}>Chọn một ảnh trước khi lưu.</span>}
          {selectedUrl && !isDirty && <span className={styles.actionHint}>Ảnh đang chọn đã là ảnh chia sẻ hiện tại.</span>}
        </div>
      </section>
    </div>
  )
}
