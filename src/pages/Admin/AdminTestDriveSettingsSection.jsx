import { useEffect, useState } from 'react'
import { CheckCircleOutlined, SaveOutlined, TeamOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { ErrorState, LoadingState } from '../../components/common/StateBlock'
import {
  getAdminTestDriveSettings, getPublicTestDriveSettings, saveTestDriveSettings,
} from '../../features/test-drive-settings/api/testDriveSettingsApi'
import { useAsyncResource } from '../../features/test-drive-settings/hooks/useAsyncResource'
import { getSettingsErrorMessage } from '../../features/test-drive-settings/utils/settingsErrors'
import {
  buildCapacityChanges, FIXED_SLOT_STARTS, maxGuestsPerDay, MAX_GUESTS_MAX, MAX_GUESTS_MIN, validateMaxGuests,
} from '../../features/test-drive-settings/utils/testDriveCapacity'
import { useAuthStore } from '../../store/useAuthStore'
import { Field, SectionHeading } from './AdminSettingsFields'
import styles from './AdminBaseSettingsPage.module.css'

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
      // Chỉ gửi số khách tối đa; BE ghép với phần còn lại của cấu hình nên các trường ẩn không đổi.
      const changes = buildCapacityChanges(form, saved)
      const next = await saveTestDriveSettings(changes)
      setForm(next)
      setSaved(next)
      setSaveState({ status: 'success', message: 'Đã lưu cấu hình. Sức chứa mới áp dụng cho các lượt đặt sau, lịch đã đặt giữ nguyên.' })
    } catch (error) {
      setSaveState({ status: 'error', message: getSettingsErrorMessage(error, 'Không thể lưu cấu hình. Hãy thử lại.') })
    }
  }

  const heading = (
    <SectionHeading
      headingId="test-drive-heading"
      icon={<ThunderboltOutlined />}
      eyebrow="04 · QUY TẮC LÁI THỬ"
      title="Số khách tối đa mỗi khung lái thử"
      description="Khung giờ lái thử là cố định. Số khách tối đa quyết định có bao nhiêu lượt đặt cùng lúc trong một khung, theo số nhân viên showroom có thể phục vụ. Thay đổi chỉ áp dụng cho lượt đặt mới."
    />
  )

  let body
  if (remote.error) {
    body = <ErrorState message={getSettingsErrorMessage(remote.error)} onRetry={() => setReloadKey((key) => key + 1)} />
  } else if (!form) {
    body = <LoadingState text="Đang tải cấu hình lái thử..." />
  } else {
    const validationError = validateMaxGuests(form.maxGuestsPerSlot)
    const isDirty = JSON.stringify(form) !== JSON.stringify(saved)
    body = (
      <>
        <div className={styles.testDriveGrid}>
          <div className={styles.testDriveFields}>
            <Field label="Tối đa mỗi khung giờ" htmlFor="test-drive-capacity" hint={`Từ ${MAX_GUESTS_MIN} đến ${MAX_GUESTS_MAX} khách (lượt đặt). Một lượt đặt nhiều xe vẫn tính là một khách.`}>
              <div className={`${styles.inputWithIcon} ${styles.inputWithSuffix}`}>
                <TeamOutlined aria-hidden="true" />
                <input id="test-drive-capacity" className={styles.input} type="number" min={MAX_GUESTS_MIN} max={MAX_GUESTS_MAX} value={form.maxGuestsPerSlot ?? ''} disabled={!isAdmin} onChange={(event) => update('maxGuestsPerSlot', Number(event.target.value))} />
                <span className={styles.inputSuffix}>khách</span>
              </div>
            </Field>
          </div>
          <aside className={styles.preview} aria-label="Khung giờ lái thử cố định">
            <div className={styles.previewTopline}><span>Các khung lái thử cố định</span></div>
            <div className={styles.previewStats}>
              <div><span>Số khung mỗi ngày</span><b>{FIXED_SLOT_STARTS.length} khung</b></div>
              <div><span>Tối đa/ngày</span><b>{maxGuestsPerDay(form.maxGuestsPerSlot)} khách</b></div>
            </div>
            <div className={styles.slotList}>{FIXED_SLOT_STARTS.map((slot) => <span key={slot}>{slot}</span>)}</div>
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
              <SaveOutlined aria-hidden="true" />{saveState.status === 'saving' ? 'Đang lưu...' : 'Lưu số khách tối đa'}
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
