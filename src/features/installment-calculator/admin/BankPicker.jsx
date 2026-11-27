import { useState } from 'react'
import { Input, Modal } from 'antd'
import { CheckOutlined, SearchOutlined } from '@ant-design/icons'
import { BANK_GROUPS, findBanks } from './vnBanks'
import styles from './AdminLoanSettings.module.css'

/**
 * Popup "Thêm ngân hàng": tìm và chọn trong danh sách ngân hàng tại Việt Nam (không gõ tay tên). Ngân hàng đã có
 * trong cấu hình hiện "Đã thêm" và không chọn được.
 * @param {{ open: boolean, takenIds: string[], onPick: (bank: { id: string, name: string }) => void,
 *   onClose: () => void }} props
 */
export default function BankPicker({ open, takenIds, onPick, onClose }) {
  const [query, setQuery] = useState('')
  const found = findBanks(query)

  const close = () => {
    setQuery('')
    onClose()
  }
  const pick = (bank) => {
    setQuery('')
    onPick(bank)
  }

  return (
    <Modal open={open} onCancel={close} footer={null} title="Thêm ngân hàng" width={640} destroyOnHidden>
      <Input
        autoFocus
        allowClear
        size="large"
        prefix={<SearchOutlined />}
        placeholder="Tìm theo tên: Vietcombank, Á Châu, ngoại thương…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Tìm ngân hàng"
      />
      <div className={styles.pickerList}>
        {found.length === 0 && <p className={styles.pickerEmpty}>Không tìm thấy ngân hàng nào.</p>}
        {BANK_GROUPS.map((group) => {
          const items = found.filter((bank) => bank.group === group.key)
          if (items.length === 0) return null
          return (
            <section key={group.key} aria-label={group.label}>
              <h3 className={styles.pickerGroup}>{group.label}</h3>
              <ul className={styles.pickerItems}>
                {items.map((bank) => {
                  const taken = takenIds.includes(bank.id)
                  return (
                    <li key={bank.id}>
                      <button type="button" className={styles.pickerItem} disabled={taken} onClick={() => pick(bank)}>
                        <strong>{bank.name}</strong>
                        <span>{bank.fullName}</span>
                        {taken && <em><CheckOutlined /> Đã thêm</em>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </Modal>
  )
}
