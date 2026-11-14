import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import { CarOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { useCompareStore } from '../store/useCompareStore'
import { COMPARE_PATH, MAX_COMPARE, MIN_COMPARE } from '../constants/compareConstants'
import styles from './CompareBar.module.css'

/**
 * Thanh so sánh cố định ở đáy màn hình: hiện các xe đã chọn (tối đa 3 ô), "Thêm xe",
 * "Xóa tất cả" và "So sánh ngay". Ẩn khi chưa chọn xe nào và ở trang so sánh.
 * Có khối đệm cùng chiều cao để không che nội dung và chân trang.
 *
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F07
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F08
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F09
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F10
 */
export default function CompareBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const items = useCompareStore((state) => state.items)
  const remove = useCompareStore((state) => state.remove)
  const clear = useCompareStore((state) => state.clear)

  if (items.length === 0 || pathname === COMPARE_PATH) return null

  const slots = Array.from({ length: MAX_COMPARE }, (_, index) => items[index] ?? null)
  const ready = items.length >= MIN_COMPARE

  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <section className={styles.bar} aria-label="Danh sách xe so sánh">
        <div className={styles.inner}>
          <ul className={styles.slots}>
            {slots.map((item, index) =>
              item ? (
                <li className={styles.slot} key={item.id}>
                  <span className={styles.thumb}>
                    {item.image ? <img src={item.image} alt="" /> : <CarOutlined />}
                  </span>
                  <span className={styles.title} title={item.title}>{item.title}</span>
                  <button
                    type="button"
                    className={styles.remove}
                    aria-label={`Bỏ ${item.title} khỏi so sánh`}
                    onClick={() => remove(item.id)}
                  >
                    <CloseOutlined />
                  </button>
                </li>
              ) : (
                <li className={styles.slotEmpty} key={`empty-${index}`}>
                  <Link to="/xe" className={styles.addLink}>
                    <PlusOutlined /> Thêm xe
                  </Link>
                </li>
              ),
            )}
          </ul>
          <div className={styles.actions}>
            {!ready && <span className={styles.hint}>Chọn thêm ít nhất 1 xe</span>}
            <Button type="text" onClick={clear}>Xóa tất cả</Button>
            <Button type="primary" disabled={!ready} onClick={() => navigate(COMPARE_PATH)}>
              So sánh ngay ({items.length})
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
