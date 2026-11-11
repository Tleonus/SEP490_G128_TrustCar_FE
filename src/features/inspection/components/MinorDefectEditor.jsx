/**
 * KAN-55 – Ghi nhận lỗi nhỏ (minor defects) của một nhóm tiêu chí.
 * Backend chỉ chấp nhận `type` nằm trong danh sách của nhóm, và mỗi lỗi phải có
 * vị trí + mô tả + ít nhất 1 ảnh (inspectionSubmitRules.checkMinorDefects).
 * Lỗi nhỏ KHÔNG làm nhóm trượt tiêu chí (computeGroupResults bỏ qua minorDefects).
 */

import { Button, Input, Select } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import PhotoUploader from './PhotoUploader'
import { INSPECTION_LIMITS as L } from '../constants/inspectionConstants'
import styles from '../styles/InspectionDetailPage.module.css'

const { TextArea } = Input

export default function MinorDefectEditor({ groupDef, defects = [], onChange, uploadEvidence, disabled = false }) {
  const allowedTypes = groupDef.minorDefectTypes || []
  const typeOptions = allowedTypes.map((type) => ({ value: type.key, label: type.label }))

  if (allowedTypes.length === 0) {
    return (
      <p className={styles.defectEmpty}>
        Tiêu chí “{groupDef.label}” không ghi nhận lỗi nhỏ. Nếu có hư hỏng, hãy đánh dấu hạng mục
        tương ứng là <strong>Không đạt</strong> kèm ghi chú và ảnh.
      </p>
    )
  }

  function updateAt(index, patch) {
    onChange(defects.map((defect, i) => (i === index ? { ...defect, ...patch } : defect)))
  }

  function removeAt(index) {
    onChange(defects.filter((_, i) => i !== index))
  }

  function addDefect() {
    if (defects.length >= L.MINOR_DEFECTS_MAX) return
    onChange([...defects, { type: allowedTypes[0].key, location: '', description: '', photos: [] }])
  }

  return (
    <div className={styles.defects}>
      {defects.map((defect, index) => (
        <div className={styles.defectCard} key={`${defect.type}-${index}`}>
          <div className={styles.defectHead}>
            <span className={styles.defectIndex}>Lỗi nhỏ #{index + 1}</span>
            {!disabled && (
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeAt(index)}
                aria-label={`Xoá lỗi nhỏ ${index + 1}`}
              >
                Xoá
              </Button>
            )}
          </div>

          <div className={styles.defectFields}>
            <label className={styles.field} htmlFor={`defect-${index}-type`}>
              <span className={styles.fieldLabel}>Loại lỗi</span>
              <Select
                id={`defect-${index}-type`}
                className={styles.fieldControl}
                value={defect.type || undefined}
                options={typeOptions}
                disabled={disabled}
                placeholder="Chọn loại lỗi"
                onChange={(value) => updateAt(index, { type: value })}
              />
            </label>

            <label className={styles.field} htmlFor={`defect-${index}-location`}>
              <span className={styles.fieldLabel}>Vị trí</span>
              <Input
                id={`defect-${index}-location`}
                className={styles.fieldControl}
                value={defect.location}
                maxLength={L.VEHICLE_TEXT_MAX_LENGTH * 2}
                disabled={disabled}
                placeholder="VD: cản trước bên phải"
                onChange={(event) => updateAt(index, { location: event.target.value })}
              />
            </label>
          </div>

          <label className={styles.field} htmlFor={`defect-${index}-description`}>
            <span className={styles.fieldLabel}>Mô tả</span>
            <TextArea
              id={`defect-${index}-description`}
              className={styles.fieldControl}
              value={defect.description}
              rows={2}
              maxLength={L.NOTE_MAX_LENGTH}
              showCount
              disabled={disabled}
              placeholder="Mô tả tình trạng, mức độ và hướng xử lý dự kiến"
              onChange={(event) => updateAt(index, { description: event.target.value })}
            />
          </label>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Ảnh lỗi (bắt buộc)</span>
            <PhotoUploader
              photos={defect.photos || []}
              onAdd={(url) => updateAt(index, { photos: [...(defect.photos || []), url] })}
              onRemove={(photoIndex) => updateAt(index, {
                photos: (defect.photos || []).filter((_, i) => i !== photoIndex),
              })}
              uploadEvidence={uploadEvidence}
              max={L.MINOR_DEFECT_PHOTOS_MAX}
              disabled={disabled}
              label="Thêm ảnh lỗi"
              compact
            />
          </div>
        </div>
      ))}

      {!disabled && defects.length < L.MINOR_DEFECTS_MAX && (
        <Button icon={<PlusOutlined />} onClick={addDefect} className={styles.addDefect}>
          Thêm lỗi nhỏ
        </Button>
      )}
    </div>
  )
}
