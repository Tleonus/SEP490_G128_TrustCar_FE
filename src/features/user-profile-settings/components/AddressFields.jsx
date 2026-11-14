import { Form, Input, Select } from 'antd'
import { LIMITS } from '../utils/validateProfile'
import styles from '../styles/ProfilePage.module.css'

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
]

const ADDRESS_FIELDS = [
  { key: 'street', label: 'Số nhà, đường', max: LIMITS.STREET_MAX, wide: true },
  { key: 'district', label: 'Quận/huyện', max: LIMITS.ADDRESS_PART_MAX },
  { key: 'city', label: 'Thành phố', max: LIMITS.ADDRESS_PART_MAX },
  { key: 'province', label: 'Tỉnh', max: LIMITS.ADDRESS_PART_MAX },
]

const status = (error) => (error ? 'error' : undefined)

/**
 * Các ô chỉ khách mới có: địa chỉ (4 ô), ngày sinh, giới tính. Ô bị xóa trống sẽ xóa dữ liệu ở BE.
 * Ngày sinh dùng ô ngày của trình duyệt, giá trị luôn là chuỗi YYYY-MM-DD (không qua Date, NFR-F05).
 *
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F05
 */
export default function AddressFields({ values, errors, disabled, todayISO, onAddress, onField }) {
  return (
    <>
      <h3 className={`${styles.sectionTitle}`}>Địa chỉ</h3>
      <div className={styles.grid}>
        {ADDRESS_FIELDS.map(({ key, label, max, wide }) => (
          <Form.Item
            key={key}
            label={label}
            htmlFor={`profile-address-${key}`}
            validateStatus={status(errors[`address.${key}`])}
            help={errors[`address.${key}`]}
            className={wide ? styles.fullWidth : undefined}
          >
            <Input
              id={`profile-address-${key}`}
              size="large"
              value={values.address[key]}
              maxLength={max + 50}
              disabled={disabled}
              autoComplete={key === 'street' ? 'street-address' : 'off'}
              onChange={(event) => onAddress(key, event.target.value)}
            />
          </Form.Item>
        ))}
      </div>

      <h3 className={styles.sectionTitle}>Thông tin thêm</h3>
      <div className={styles.grid}>
        <Form.Item label="Ngày sinh" htmlFor="profile-dateOfBirth" validateStatus={status(errors.dateOfBirth)} help={errors.dateOfBirth}>
          <Input
            id="profile-dateOfBirth"
            size="large"
            type="date"
            min="1900-01-01"
            max={todayISO}
            value={values.dateOfBirth}
            disabled={disabled}
            autoComplete="bday"
            onChange={(event) => onField('dateOfBirth', event.target.value)}
          />
        </Form.Item>
        <Form.Item label="Giới tính" htmlFor="profile-gender" validateStatus={status(errors.gender)} help={errors.gender}>
          <Select
            id="profile-gender"
            size="large"
            allowClear
            placeholder="Chưa chọn"
            options={GENDER_OPTIONS}
            value={values.gender || undefined}
            disabled={disabled}
            onChange={(value) => onField('gender', value ?? '')}
          />
        </Form.Item>
      </div>
    </>
  )
}
