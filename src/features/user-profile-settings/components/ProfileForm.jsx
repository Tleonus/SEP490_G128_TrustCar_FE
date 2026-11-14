import { useMemo, useState } from 'react'
import { Alert, App, Button, Form, Input } from 'antd'
import { Link } from 'react-router-dom'
import { buildPatch, toFormValues } from '../utils/buildPatch'
import { todayLocalISO } from '../utils/dob'
import { validateProfile } from '../utils/validateProfile'
import AddressFields from './AddressFields'
import styles from '../styles/ProfilePage.module.css'

const status = (error) => (error ? 'error' : undefined)

/**
 * Form hồ sơ. Chỉ các ô có trong `profile.editableFields` được hiện để sửa (CF10); email luôn chỉ đọc.
 * Lỗi kiểm tra tức thời hiện dưới ô; lỗi từ BE (409/422) gắn vào đúng ô và biến mất khi ô đó được sửa.
 *
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F04
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F05
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F07
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F08
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F09
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F12
 */
export default function ProfileForm({ profile, saving, onSave }) {
  const { message } = App.useApp()
  const [values, setValues] = useState(() => toFormValues(profile))
  const [serverErrors, setServerErrors] = useState({})
  const [banner, setBanner] = useState(null)
  const todayISO = todayLocalISO()
  const editable = profile.editableFields
  const canEdit = (field) => editable.includes(field)

  const { valid, errors: liveErrors } = useMemo(() => validateProfile(values, editable, todayISO, profile), [values, editable, todayISO, profile])
  const { hasChanges } = useMemo(() => buildPatch(profile, values, editable), [profile, values, editable])
  const errors = { ...liveErrors, ...serverErrors }

  const clearServerError = (key) => setServerErrors((current) => {
    if (!(key in current)) return current
    const next = { ...current }
    delete next[key]
    return next
  })
  const setField = (field, value) => { setValues((current) => ({ ...current, [field]: value })); clearServerError(field) }
  const setAddress = (key, value) => {
    setValues((current) => ({ ...current, address: { ...current.address, [key]: value } }))
    clearServerError(`address.${key}`)
  }

  async function handleSubmit() {
    setBanner(null)
    const result = await onSave(values)
    if (result.ok && result.profile) {
      setValues(toFormValues(result.profile))
      setServerErrors({})
      if (!result.unchanged) message.success('Đã lưu thông tin.')
      return
    }
    if (result.fieldErrors) setServerErrors(result.fieldErrors)
    if (!result.error) return
    if (result.error.action) setBanner(result.error)
    else message.error(result.error.message)
  }

  return (
    <Form layout="vertical" className={styles.card} onFinish={handleSubmit} requiredMark={false}>
      {banner && (
        <Alert
          className={styles.banner}
          type="warning"
          showIcon
          message={banner.message}
          action={<Link to={banner.action.to}>{banner.action.label}</Link>}
        />
      )}

      <h3 className={`${styles.sectionTitle} ${styles.sectionTitleFirst}`}>Thông tin liên hệ</h3>
      <Form.Item label="Email" htmlFor="profile-email">
        <Input id="profile-email" size="large" value={profile.email} readOnly disabled aria-describedby="profile-email-hint" />
        <span id="profile-email-hint" className={styles.hint}>Email dùng để đăng nhập, không thể đổi.</span>
      </Form.Item>

      <div className={styles.grid}>
        <Form.Item label="Họ và tên" htmlFor="profile-fullName" validateStatus={status(errors.fullName)} help={errors.fullName}>
          <Input
            id="profile-fullName"
            size="large"
            value={values.fullName}
            disabled={saving || !canEdit('fullName')}
            autoComplete="name"
            onChange={(event) => setField('fullName', event.target.value)}
          />
        </Form.Item>
        <Form.Item label="Số điện thoại" htmlFor="profile-phone" validateStatus={status(errors.phone)} help={errors.phone}>
          <Input
            id="profile-phone"
            size="large"
            inputMode="tel"
            value={values.phone}
            disabled={saving || !canEdit('phone')}
            autoComplete="tel"
            onChange={(event) => setField('phone', event.target.value)}
          />
        </Form.Item>
      </div>

      {canEdit('address') && (
        <AddressFields
          values={values}
          errors={errors}
          disabled={saving}
          todayISO={todayISO}
          onAddress={setAddress}
          onField={setField}
        />
      )}

      <div className={styles.actions}>
        <Button type="primary" htmlType="submit" size="large" loading={saving} disabled={!hasChanges || !valid || saving}>
          Lưu thay đổi
        </Button>
      </div>
    </Form>
  )
}
