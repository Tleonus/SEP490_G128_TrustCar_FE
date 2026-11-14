import { Button, message } from 'antd'
import { CheckOutlined, SwapOutlined } from '@ant-design/icons'
import { useCompareStore } from '../store/useCompareStore'
import { toCompareItem, hasItem } from '../utils/compareSelection'
import { COMPARE_FULL_MESSAGE, MAX_COMPARE } from '../constants/compareConstants'
import styles from './CompareToggle.module.css'

/**
 * Nút chọn / bỏ chọn một xe để so sánh.
 * variant="card": ô nhỏ trên ảnh thẻ xe; variant="detail": nút cỡ lớn ở trang chi tiết.
 * Không hiện với xe không có id hợp lệ (dữ liệu mẫu).
 *
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F02
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F03
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F04
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F05
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F06
 */
export default function CompareToggle({ car, variant = 'card' }) {
  const items = useCompareStore((state) => state.items)
  const toggle = useCompareStore((state) => state.toggle)

  const item = toCompareItem(car)
  if (!item) return null

  const selected = hasItem(items, item.id)
  const full = !selected && items.length >= MAX_COMPARE
  const label = selected ? 'Đã chọn' : 'So sánh'
  const ariaLabel = selected
    ? `Bỏ ${item.title} khỏi danh sách so sánh`
    : full
      ? `${COMPARE_FULL_MESSAGE}`
      : `Thêm ${item.title} vào danh sách so sánh`
  const icon = selected ? <CheckOutlined /> : <SwapOutlined />

  // aria-disabled (không dùng thuộc tính disabled) để khách vẫn bấm được và thấy thông báo vì sao chưa chọn thêm.
  function handleClick(event) {
    event.preventDefault()
    event.stopPropagation()
    if (toggle(car) === 'full') message.warning(COMPARE_FULL_MESSAGE)
  }

  if (variant === 'detail') {
    return (
      <Button
        size="large"
        block
        icon={icon}
        type={selected ? 'primary' : 'default'}
        aria-pressed={selected}
        aria-label={ariaLabel}
        aria-disabled={full}
        title={full ? COMPARE_FULL_MESSAGE : undefined}
        className={full ? styles.fullDetail : undefined}
        onClick={handleClick}
      >
        {label}
      </Button>
    )
  }

  const className = [styles.cardBtn, selected ? styles.selected : '', full ? styles.full : ''].filter(Boolean).join(' ')
  return (
    <button
      type="button"
      className={className}
      aria-pressed={selected}
      aria-label={ariaLabel}
      aria-disabled={full}
      title={full ? COMPARE_FULL_MESSAGE : undefined}
      onClick={handleClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
