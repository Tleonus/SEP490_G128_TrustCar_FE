import { STOPS } from '../three/layout'
import styles from '../showroom.module.css'

/** Chữ lớn góc dưới trái của từng điểm dừng (giống video), kèm phần riêng của điểm đó. */
export default function StopCaption({ stop, children }) {
  const s = STOPS[stop]
  return (
    <section className={styles.caption} key={s.key} aria-live="polite">
      <p className={styles.eyebrow}>{s.eyebrow}</p>
      <h1 className={styles.title}>{s.title}</h1>
      <p className={styles.text}>{s.text}</p>
      {children}
    </section>
  )
}
