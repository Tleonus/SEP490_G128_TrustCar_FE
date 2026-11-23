import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { STOPS } from '../three/layout'
import styles from '../showroom.module.css'

/**
 * Nút "‹ Trước / Tiếp theo ›" ở giữa dưới cùng (cuộn chuột giờ dùng để phóng to), kèm lời nhắc thao tác.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F04
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F20
 */
export default function StopStepper({ stop, onGo }) {
  const next = STOPS[stop + 1]
  return (
    <div className={styles.stepper}>
      <div className={styles.stepBtns}>
        <button type="button" disabled={stop === 0} onClick={() => onGo(stop - 1)} aria-label="Điểm dừng trước">
          <LeftOutlined /> Trước
        </button>
        <button type="button" disabled={!next} onClick={() => onGo(stop + 1)} className={styles.stepNext}>
          {next ? `Tiếp theo: ${next.label}` : 'Hết'} <RightOutlined />
        </button>
      </div>
      <p className={styles.stepHint}>Cuộn chuột để phóng to · kéo để nhìn quanh</p>
    </div>
  )
}
