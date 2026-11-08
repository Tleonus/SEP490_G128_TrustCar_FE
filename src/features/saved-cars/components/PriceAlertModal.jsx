import { useEffect, useState } from 'react'
import { InputNumber, Modal, Switch } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { formatPrice } from '../../../utils/format'
import { formatCompactPrice } from '../utils/savedCars'
import styles from './PriceAlertModal.module.css'

const PRESETS = [3, 5, 10, 15]

/** Hộp thoại bật cảnh báo và đặt giá mục tiêu cho một xe đã lưu. */
export default function PriceAlertModal({ item, open, onClose, onSave }) {
  const [enabled, setEnabled] = useState(true)
  const [target, setTarget] = useState(null)

  useEffect(() => {
    if (!open || !item) return
    setEnabled(item.alert.enabled || item.alert.targetPrice == null)
    setTarget(item.alert.targetPrice ?? (item.currentPrice ? Math.round((item.currentPrice * 0.95) / 1e6) * 1e6 : null))
  }, [open, item])

  if (!item) return null
  const base = item.currentPrice
  const invalid = enabled && target != null && base != null && target >= base

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={() => onSave({ enabled, targetPrice: enabled ? target : item.alert.targetPrice })}
      okText="Lưu cảnh báo"
      cancelText="Hủy"
      okButtonProps={{ disabled: invalid }}
      title={<span className={styles.title}><BellOutlined /> Cảnh báo giảm giá</span>}
      destroyOnHidden
    >
      <div className={styles.carRow}>
        {item.image ? <img src={item.image} alt="" className={styles.thumb} /> : <div className={styles.thumb} />}
        <div>
          <strong>{item.title}</strong>
          <span>Giá hiện tại: <b>{formatPrice(base)}</b></span>
        </div>
      </div>

      <label className={styles.switchRow}>
        <div>
          <strong>Nhận thông báo khi giá giảm</strong>
          <span>Hiển thị trên website mỗi khi bạn quay lại TrustCar.</span>
        </div>
        <Switch checked={enabled} onChange={setEnabled} />
      </label>

      <div className={`${styles.targetBlock} ${enabled ? '' : styles.disabled}`}>
        <span className={styles.label}>Báo khi giá xuống bằng hoặc thấp hơn</span>
        <InputNumber
          size="large"
          className={styles.input}
          value={target}
          disabled={!enabled}
          min={0}
          step={5_000_000}
          onChange={setTarget}
          formatter={(value) => (value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
          parser={(value) => Number((value ?? '').replace(/\D/g, '')) || null}
          suffix="₫"
          placeholder="Ví dụ: 650.000.000"
          status={invalid ? 'error' : undefined}
        />
        {invalid && <span className={styles.error}>Giá mục tiêu phải thấp hơn giá hiện tại.</span>}
        {base != null && (
          <div className={styles.presets}>
            {PRESETS.map((pct) => {
              const value = Math.round((base * (1 - pct / 100)) / 1e6) * 1e6
              return (
                <button
                  type="button"
                  key={pct}
                  disabled={!enabled}
                  className={`${styles.preset} ${target === value ? styles.presetActive : ''}`}
                  onClick={() => setTarget(value)}
                >
                  <b>-{pct}%</b>
                  <span>{formatCompactPrice(value)}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
