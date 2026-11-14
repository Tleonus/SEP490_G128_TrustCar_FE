/**
 * KAN-55 – Panel một nhóm tiêu chí CPO (1 trong 5).
 *
 * Mỗi nhóm gồm các hạng mục con; Backend suy ra "tiêu chí đạt" từ hạng mục:
 * nhóm chỉ đạt khi MỌI hạng mục = PASS (computeGroupResults). Hạng mục FAIL bắt buộc
 * có ghi chú + ảnh, NOT_CHECKABLE bắt buộc có lý do. Nhóm cần ≥1 ảnh bằng chứng,
 * riêng G4_ODOMETER bắt buộc ảnh chụp đồng hồ ODO.
 */

import { Button, Input, Radio, Tag } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import PhotoUploader from './PhotoUploader'
import MinorDefectEditor from './MinorDefectEditor'
import {
  INSPECTION_LIMITS as L,
  ITEM_RESULT,
  ITEM_RESULT_COLOR,
  ITEM_RESULT_LABEL,
} from '../constants/inspectionConstants'
import { countGroupEvidence, isGroupPassed } from '../data/draftState'
import styles from '../styles/InspectionDetailPage.module.css'

const { TextArea } = Input

const RESULT_OPTIONS = [
  { value: ITEM_RESULT.PASS, label: ITEM_RESULT_LABEL[ITEM_RESULT.PASS] },
  { value: ITEM_RESULT.FAIL, label: ITEM_RESULT_LABEL[ITEM_RESULT.FAIL] },
  { value: ITEM_RESULT.NOT_CHECKABLE, label: ITEM_RESULT_LABEL[ITEM_RESULT.NOT_CHECKABLE] },
]

export default function ChecklistGroupPanel({
  groupDef,
  group,
  violationCount = 0,
  disabled = false,
  uploadEvidence,
  onItemResult,
  onItemNote,
  onItemPhotos,
  onGroupPhotos,
  onOdometerPhoto,
  onNote,
  onMinorDefects,
  onMarkAllPass,
}) {
  const items = group?.items || []
  const evaluated = items.filter((item) => Boolean(item.result)).length
  const passed = isGroupPassed(group, groupDef)
  const evidence = countGroupEvidence(group)
  const failCount = items.filter((item) => item.result === ITEM_RESULT.FAIL).length

  const statusTag = evaluated === 0
    ? <Tag>Chưa đánh giá</Tag>
    : passed
      ? <Tag color="success">Đạt</Tag>
      : <Tag color={failCount > 0 ? 'error' : 'warning'}>Chưa đạt ({evaluated}/{items.length} hạng mục)</Tag>

  return (
    <div className={styles.groupPanel}>
      <div className={styles.groupHead}>
        <div>
          <h3 className={styles.groupTitle}>{groupDef.label}</h3>
          <p className={styles.groupMeta}>
            {items.length} hạng mục · {evidence} ảnh bằng chứng
            {groupDef.requiresOdometerPhoto ? ' · bắt buộc ảnh ODO' : ''}
          </p>
        </div>
        <div className={styles.groupBadges}>
          {statusTag}
          {violationCount > 0 && <Tag color="error">{violationCount} mục cần sửa</Tag>}
        </div>
      </div>

      {!disabled && evaluated < items.length && (
        <Button
          size="small"
          icon={<CheckOutlined />}
          className={styles.groupQuickAction}
          onClick={() => onMarkAllPass(groupDef.key)}
        >
          Đánh dấu tất cả hạng mục “Đạt”
        </Button>
      )}

      <ul className={styles.itemList}>
        {groupDef.items.map((itemDef) => {
          const item = items.find((entry) => entry.itemKey === itemDef.key) || { result: null, note: '', photos: [] }
          const needsNote = item.result === ITEM_RESULT.FAIL || item.result === ITEM_RESULT.NOT_CHECKABLE
          const needsPhoto = item.result === ITEM_RESULT.FAIL

          return (
            <li className={styles.item} key={itemDef.key}>
              <div className={styles.itemRow}>
                <span className={styles.itemLabel} id={`item-${groupDef.key}-${itemDef.key}`}>
                  {itemDef.label}
                  {item.result && (
                    <Tag color={ITEM_RESULT_COLOR[item.result]} className={styles.itemResultTag}>
                      {ITEM_RESULT_LABEL[item.result]}
                    </Tag>
                  )}
                </span>
                <Radio.Group
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                  options={RESULT_OPTIONS}
                  value={item.result}
                  disabled={disabled}
                  aria-labelledby={`item-${groupDef.key}-${itemDef.key}`}
                  onChange={(event) => onItemResult(groupDef.key, itemDef.key, event.target.value)}
                />
              </div>

              {needsNote && (
                <label className={styles.field} htmlFor={`note-${groupDef.key}-${itemDef.key}`}>
                  <span className={styles.fieldLabel}>
                    {item.result === ITEM_RESULT.FAIL ? 'Ghi chú kỹ thuật (bắt buộc)' : 'Lý do không kiểm tra được (bắt buộc)'}
                  </span>
                  <TextArea
                    id={`note-${groupDef.key}-${itemDef.key}`}
                    className={styles.fieldControl}
                    rows={2}
                    maxLength={L.NOTE_MAX_LENGTH}
                    showCount
                    disabled={disabled}
                    value={item.note}
                    placeholder={item.result === ITEM_RESULT.FAIL
                      ? 'Mô tả hư hỏng, vị trí, mức độ và hướng xử lý'
                      : 'Vì sao không kiểm tra được hạng mục này'}
                    onChange={(event) => onItemNote(groupDef.key, itemDef.key, event.target.value)}
                  />
                </label>
              )}

              {needsPhoto && (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Ảnh hạng mục không đạt (bắt buộc)</span>
                  <PhotoUploader
                    photos={item.photos || []}
                    onAdd={(url) => onItemPhotos(groupDef.key, itemDef.key, [...(item.photos || []), url])}
                    onRemove={(index) => onItemPhotos(groupDef.key, itemDef.key,
                      (item.photos || []).filter((_, i) => i !== index))}
                    uploadEvidence={uploadEvidence}
                    max={L.ITEM_PHOTOS_MAX}
                    disabled={disabled}
                    label="Thêm ảnh"
                    compact
                  />
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {groupDef.requiresOdometerPhoto && (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Ảnh chụp đồng hồ ODO (bắt buộc)</span>
          <PhotoUploader
            photos={group?.odometerPhoto ? [group.odometerPhoto] : []}
            onAdd={(url) => onOdometerPhoto(groupDef.key, url)}
            onRemove={() => onOdometerPhoto(groupDef.key, null)}
            uploadEvidence={uploadEvidence}
            max={1}
            disabled={disabled}
            label="Tải ảnh ODO"
            emptyHint="Chưa có ảnh ODO — thiếu ảnh này sẽ không gửi được biên bản."
            compact
          />
        </div>
      )}

      <div className={styles.field}>
        <span className={styles.fieldLabel}>
          Ảnh bằng chứng của tiêu chí {evidence === 0 && <span className={styles.requiredInline}>(cần ít nhất 1)</span>}
        </span>
        <PhotoUploader
          photos={group?.photos || []}
          onAdd={(url) => onGroupPhotos(groupDef.key, [...(group?.photos || []), url])}
          onRemove={(index) => onGroupPhotos(groupDef.key, (group?.photos || []).filter((_, i) => i !== index))}
          uploadEvidence={uploadEvidence}
          max={L.GROUP_PHOTOS_MAX}
          disabled={disabled}
          label="Thêm ảnh bằng chứng"
        />
      </div>

      <label className={styles.field} htmlFor={`group-note-${groupDef.key}`}>
        <span className={styles.fieldLabel}>Ghi chú tiêu chí</span>
        <TextArea
          id={`group-note-${groupDef.key}`}
          className={styles.fieldControl}
          rows={2}
          maxLength={L.NOTE_MAX_LENGTH}
          showCount
          disabled={disabled}
          value={group?.note || ''}
          placeholder="Tình trạng chung của tiêu chí này, lưu ý cho người duyệt"
          onChange={(event) => onNote(groupDef.key, event.target.value)}
        />
      </label>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Lỗi nhỏ (không làm trượt tiêu chí)</span>
        <MinorDefectEditor
          groupDef={groupDef}
          defects={group?.minorDefects || []}
          onChange={(next) => onMinorDefects(groupDef.key, next)}
          uploadEvidence={uploadEvidence}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
