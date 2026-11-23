import { PAINTS } from '../three/paint'
import styles from '../showroom.module.css'

/**
 * 6 màu sơn + "Màu gốc" ở studio.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F09
 */
export default function PaintPicker({ value, onChange, disabled }) {
  return (
    <div className={styles.paints} role="radiogroup" aria-label="Màu sơn">
      {PAINTS.map((p) => (
        <button
          key={p.key}
          type="button"
          role="radio"
          aria-checked={value === p.key}
          disabled={disabled}
          className={value === p.key ? styles.paintOn : styles.paint}
          onClick={() => onChange(p.key)}
        >
          <span className={styles.swatch} style={{ background: p.swatch }} />
          {p.label}
        </button>
      ))}
    </div>
  )
}
