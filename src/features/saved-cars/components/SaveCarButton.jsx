import { Button, message } from 'antd'
import { HeartFilled, HeartOutlined } from '@ant-design/icons'
import { useSavedCarsStore } from '../store/useSavedCarsStore'
import { savedIdOf, MAX_SAVED_CARS } from '../utils/savedCars'
import styles from './SaveCarButton.module.css'

/**
 * Nút lưu / bỏ lưu xe vào danh sách yêu thích.
 * variant="card": nút tròn trên ảnh thẻ xe; variant="detail": nút cỡ lớn ở trang chi tiết.
 */
export default function SaveCarButton({ car, variant = 'card' }) {
  const id = savedIdOf(car)
  const saved = useSavedCarsStore((state) => Boolean(id) && state.items.some((item) => item.id === id))
  const toggle = useSavedCarsStore((state) => state.toggle)

  if (!id) return null

  function handleClick(event) {
    event.preventDefault()
    event.stopPropagation()
    const result = toggle(car)
    if (result === 'added') message.success({ content: 'Đã lưu xe. Bạn sẽ thấy thông báo khi xe giảm giá.', key: 'saved-car' })
    else if (result === 'removed') message.info({ content: 'Đã bỏ xe khỏi danh sách đã lưu.', key: 'saved-car' })
    else if (result === 'full') message.warning(`Bạn chỉ lưu được tối đa ${MAX_SAVED_CARS} xe.`)
  }

  const label = saved ? 'Bỏ lưu xe' : 'Lưu xe'

  if (variant === 'detail') {
    return (
      <Button
        size="large"
        block
        icon={saved ? <HeartFilled /> : <HeartOutlined />}
        aria-pressed={saved}
        className={`${styles.detailBtn} ${saved ? styles.detailSaved : ''}`}
        onClick={handleClick}
      >
        {saved ? 'Đã lưu · Theo dõi giá' : 'Lưu xe & theo dõi giá'}
      </Button>
    )
  }

  return (
    <button
      type="button"
      className={`${styles.cardBtn} ${saved ? styles.saved : ''}`}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      onClick={handleClick}
    >
      {saved ? <HeartFilled /> : <HeartOutlined />}
    </button>
  )
}

