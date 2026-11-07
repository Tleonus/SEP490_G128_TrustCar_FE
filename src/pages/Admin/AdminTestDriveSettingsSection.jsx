import { useEffect, useState } from 'react'
import { CheckCircleOutlined, ClockCircleOutlined, SaveOutlined, TeamOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { ErrorState, LoadingState } from '../../components/common/StateBlock'
import {
  getAdminTestDriveSettings, getPublicTestDriveSettings, saveTestDriveSettings,
} from '../../features/test-drive/api/testDriveApi'
import { useAsyncResource } from '../../features/test-drive/hooks/useAsyncResource'
import { getTestDriveErrorMessage } from '../../features/test-drive/utils/testDriveErrors'
import { buildSlotPreview, validateTestDriveSettings } from '../../features/test-drive/utils/testDriveSlotPreview'
import { useAuthStore } from '../../store/useAuthStore'
import { Field, SectionHeading } from './AdminSettingsFields'
import styles from './AdminBaseSettingsPage.module.css'

const TIME_FIELDS = [
  { key: 'openTime', label: 'Bắt đầu lái thử' },
  { key: 'closeTime', label: 'Kết thúc lái thử' },
  { key: 'lunchBreakStart', label: 'Bắt đầu nghỉ trưa' },
  { key: 'lunchBreakEnd', label: 'Kết thúc nghỉ trưa' },
]

// Mục này tự lưu qua API, tách khỏi form showroom phía trên (form đó chỉ lưu trên trình duyệt).
export default function AdminTestDriveSettingsSection() {
  const isAdmin = useAuthStore((state) => state.user?.roleName) === 'ADMIN'
  const [reloadKey, setReloadKey] = useState(0)
  const remote = useAsyncResource(isAdmin ? getAdminTestDriveSettings : getPublicTestDriveSettings, `settings|${reloadKey}`)
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(null)
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' })

  useEffect(() => {
    if (!remote.data) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(remote.data)
    setSaved(remote.data)
  }, [remote.data])

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setSaveState({ status: 'idle', message: '' })
  }

  async function handleSave() {
    setSaveState({ status: 'saving', message: '' })
    try {
      const changes = Object.fromEntries(Object.entries(form).filter(([key, value]) => value !== saved[key]))
      const next = await saveTestDriveSettings(changes)
      setForm(next)
      setSaved(next)
      setSaveState({ status: 'success', message: 'Đã lưu cấu hình. Lịch mới sẽ dùng các khung giờ này, lịch đã đặt giữ nguyên.' })
    } catch (error) {
      setSaveState({ status: 'error', message: getTestDriveErrorMessage(error, 'Không thể lưu cấu hình. Hãy thử lại.') })
    }
  }

  const heading = (
    <SectionHeading
      headingId="test-drive-heading"
      icon={<ThunderboltOutlined />}
      eyebrow="04 · QUY TẮC LÁI THỬ"
      title="Cấu hình khung giờ lái thử"
      description="Hệ thống dùng cấu hình này để tính khung giờ khách đặt. Thay đổi chỉ áp dụng cho lịch mới."
    />
  )

  let body
  if (remote.error) {
    body = <ErrorState message={getTestDriveErrorMessage(remote.error)} onRetry={() => setReloadKey((key) => key + 1)} />
  } else if (!form) {
    body = <LoadingState text="Đang tải cấu hình lái thử..." />
  } else {
    const validationError = validateTestDriveSettings(form)
    const slots = buildSlotPreview(form)
    const isDirty = JSON.stringify(form) !== JSON.stringify(saved)
    body = (
      <>
        <div className={styles.testDriveGrid}>
          <div className={styles.testDriveFields}>
            {TIME_FIELDS.map(({ key, label }) => (
              <Field key={key} label={label} htmlFor={`test-drive-${key}`}>
                <div className={styles.inputWithIcon}>
                  <ClockCircleOutlined aria-hidden="true" />
                  <input id={`test-drive-${key}`} className={styles.input} type="time" value={form[key] ?? ''} disabled={!isAdmin} onChange={(event) => update(key, event.target.value)} />
                </div>
              </Field>
            ))}
            <Field label="Độ dài mỗi khung" htmlFor="test-drive-duration" hint="Từ 15 đến 480 phút.">
              <div className={`${styles.inputWithIcon} ${styles.inputWithSuffix}`}>
                <ClockCircleOutlined aria-hidden="true" />
                <input id="test-drive-duration" className={styles.input} type="number" min="15" max="480" value={form.slotDurationMinutes ?? ''} disabled={!isAdmin} onChange={(event) => update('slotDurationMinutes', Number(event.target.value))} />
                <span className={styles.inputSuffix}>phút</span>
              </div>
            </Field>
            <Field label="Tối đa mỗi khung giờ" htmlFor="test-drive-capacity" hint="Từ 1 đến 100 khách.">
              <div className={`${styles.inputWithIcon} ${styles.inputWithSuffix}`}>
                <TeamOutlined aria-hidden="true" />
                <input id="test-drive-capacity" className={styles.input} type="number" min="1" max="100" value={form.maxGuestsPerSlot ?? ''} disabled={!isAdmin} onChange={(event) => update('maxGuestsPerSlot', Number(event.target.value))} />
                <span className={styles.inputSuffix}>khách</span>
              </div>
            </Field>
          </div>
          <aside className={styles.preview} aria-label="Xem trước khung giờ lái thử">
            <div className={styles.previewTopline}><span>Xem trước một ngày mở cửa đủ giờ</span></div>
            <strong>{form.openTime} – {form.closeTime}</strong>
            <div className={styles.previewStats}>
              <div><span>Độ dài khung</span><b>{form.slotDurationMinutes} phút</b></div>
              <div><span>Số khung giờ</span><b>{slots.length} khung</b></div>
              <div><span>Tối đa/ngày</span><b>{slots.length * (form.maxGuestsPerSlot || 0)} khách</b></div>
            </div>
            {slots.length > 0 ? (
              <div className={styles.slotList}>{slots.map((slot) => <span key={slot}>{slot}</span>)}</div>
            ) : (
              <p className={styles.previewError}>{validationError ?? 'Chưa thể tạo khung giờ từ thiết lập hiện tại.'}</p>
            )}
          </aside>
        </div>

        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {validationError && isAdmin && <div className={`${styles.alert} ${styles.errorAlert}`} role="alert"><span>{validationError}</span></div>}
        {saveState.status === 'error' && <div className={`${styles.alert} ${styles.errorAlert}`} role="alert"><span>{saveState.message}</span></div>}
        {saveState.status === 'success' && (
          <div className={`${styles.alert} ${styles.successAlert}`} role="status">
            <CheckCircleOutlined aria-hidden="true" /><span>{saveState.message}</span>
          </div>
        )}
        </div>

        {isAdmin ? (
          <div className={styles.headerActions} style={{ justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className={styles.secondaryButton} disabled={!isDirty} onClick={() => { setForm(saved); setSaveState({ status: 'idle', message: '' }) }}>Hủy thay đổi</button>
            <button type="button" className={styles.primaryButton} disabled={!isDirty || Boolean(validationError) || saveState.status === 'saving'} onClick={handleSave}>
              <SaveOutlined aria-hidden="true" />{saveState.status === 'saving' ? 'Đang lưu...' : 'Lưu cấu hình lái thử'}
            </button>
          </div>
        ) : (
          <p className={styles.fieldHint} style={{ marginTop: 16 }}>Chỉ quản trị viên được sửa cấu hình này.</p>
        )}
      </>
    )
  }

  return (
    <div className={styles.layout} style={{ marginTop: 20 }}>
      <section className={`${styles.card} ${styles.testDriveCard}`} aria-labelledby="test-drive-heading">
        <div className={styles.testDriveHeader}>{heading}</div>
        {body}
      </section>
    </div>
  )
}
