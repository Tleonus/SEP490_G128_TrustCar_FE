import { useState } from 'react'
import { BUDGETS, MAX_NAME, NEEDS, NO_VISIT, PAYMENTS, SESSIONS, STEPS, dateBounds, stepError } from '../utils/consult'
import ConsultSummary from './ConsultSummary'
import styles from '../panels.module.css'

const QUESTION = {
  name: 'Trước hết, anh chị tên gì?',
  need: 'Anh chị cần xe để làm gì?',
  budget: 'Ngân sách khoảng bao nhiêu?',
  payment: 'Anh chị muốn thanh toán thế nào?',
  visit: 'Anh chị muốn lái thử ngày nào?',
}

function Choices({ list, value, onPick }) {
  return (
    <div className={styles.choices}>
      {list.map((o) => (
        <button key={o.value} type="button" className={value === o.value ? styles.choiceOn : styles.choice} onClick={() => onPick(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function StepBody({ step, a, set }) {
  if (step === 'name') {
    return (
      <input className={styles.input} autoFocus maxLength={MAX_NAME} placeholder="Họ và tên" value={a.name || ''}
        aria-label="Họ và tên" onChange={(e) => set({ name: e.target.value })} />
    )
  }
  if (step === 'need') return <Choices list={NEEDS} value={a.need} onPick={(need) => set({ need })} />
  if (step === 'budget') return <Choices list={BUDGETS} value={a.budget} onPick={(budget) => set({ budget })} />
  if (step === 'payment') return <Choices list={PAYMENTS} value={a.payment} onPick={(payment) => set({ payment })} />
  const { min, max } = dateBounds()
  const noVisit = a.session === NO_VISIT.value
  return (
    <>
      {!noVisit && (
        <label className={styles.label}>
          Chọn ngày và buổi
          <input type="date" className={styles.input} min={min} max={max} value={a.date || ''} onChange={(e) => set({ date: e.target.value })} />
        </label>
      )}
      <Choices list={[...SESSIONS, NO_VISIT]} value={a.session} onPick={(session) => set({ session })} />
    </>
  )
}

/**
 * Hộp tư vấn 5 câu ở điểm dừng 03; chỉ ở trình duyệt.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F08
 */
export default function ConsultBox({ cars, onShowCar }) {
  const [i, setI] = useState(0)
  const [a, setA] = useState({})
  const [error, setError] = useState(null)
  const set = (patch) => {
    setA((prev) => ({ ...prev, ...patch }))
    setError(null)
  }
  if (i >= STEPS.length) {
    return <ConsultSummary answers={a} cars={cars} onEdit={() => setI(0)} onReset={() => { setA({}); setI(0) }} onShowCar={onShowCar} />
  }
  const step = STEPS[i]
  const next = (e) => {
    e.preventDefault()
    const err = stepError(step, a)
    if (err) return setError(err)
    setI(i + 1)
  }
  return (
    <form className={styles.consult} onSubmit={next} noValidate>
      <p className={styles.consultStep}>Câu {i + 1} / {STEPS.length}</p>
      <h2 className={styles.consultQ}>{QUESTION[step]}</h2>
      <StepBody step={step} a={a} set={set} />
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.consultNav}>
        <button type="button" className={styles.linkBtn} disabled={i === 0} onClick={() => setI(i - 1)}>Quay lại</button>
        <button type="submit" className={styles.nextBtn}>{i === STEPS.length - 1 ? 'Xem tóm tắt' : 'Tiếp'}</button>
      </div>
    </form>
  )
}
