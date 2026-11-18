import { useState } from 'react'
import { Alert, Modal } from 'antd'
import CarPicker from './CarPicker'
import { addCarsToMyVisit } from '../api/appointmentApi'
import { useHeldCars } from '../hooks/useHeldCars'
import { classifyAppointmentError } from '../utils/appointmentErrors'
import { addCar, carNamesOf, removeCar } from '../utils/carSelection'
import { openAppointments } from '../utils/visitRules'
import { formatVnDateTime } from '../utils/vnTime'

const carTitle = (car) => [car?.make, car?.model, car?.variant].filter(Boolean).join(' ') || car?.vehicleCode || 'Xe'

/** Xe đang có trong lượt → mục chọn của CarPicker. */
const itemsOf = (visit) => openAppointments(visit)
  .filter((a) => a.car?._id)
  .map((a) => ({ id: String(a.car._id).toLowerCase(), title: carTitle(a.car), image: a.car.primaryImageUrl ?? null }))

/** Nội dung hộp; mount mới mỗi lần mở nên trạng thái luôn sạch. */
function AddCarsDialog({ visit, onClose, onDone, onStale }) {
  const [existing] = useState(() => itemsOf(visit))
  const [locked] = useState(() => new Set(existing.map((item) => item.id)))
  const [selected, setSelected] = useState(existing)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState(null)
  const heldIds = useHeldCars()
  const added = selected.filter((item) => !locked.has(item.id))

  async function submit() {
    if (busy || added.length === 0) return
    setBusy(true)
    setProblem(null)
    try {
      onDone(await addCarsToMyVisit(visit.visitId, added.map((item) => item.id)))
    } catch (error) {
      const failure = classifyAppointmentError(error, carNamesOf(selected))
      setProblem(failure)
      if (failure.reload === 'visit') onStale()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      title={`Thêm xe vào lượt ${visit.visitCode}`}
      okText={added.length > 1 ? `Thêm ${added.length} xe` : 'Thêm xe'}
      cancelText="Đóng"
      okButtonProps={{ disabled: added.length === 0, loading: busy }}
      onOk={submit}
      onCancel={onClose}
      maskClosable={!busy}
      width="min(640px, calc(100vw - 24px))"
    >
      <p>
        Xe thêm vào sẽ lái thử cùng lượt lúc {formatVnDateTime(visit.scheduledAt)}. Chỉ thêm được khi lượt còn chờ
        xác nhận, tối đa 3 xe mỗi lượt.
      </p>
      <CarPicker
        selected={selected}
        lockedIds={locked}
        lockedLabel="Đã trong lượt"
        onAdd={(item) => setSelected((list) => addCar(list, item))}
        onRemove={(id) => setSelected((list) => (locked.has(id) ? list : removeCar(list, id)))}
        heldIds={heldIds}
        disabled={busy}
      />
      {problem && <Alert type="error" showIcon style={{ marginTop: 12 }} message={problem.message} />}
    </Modal>
  )
}

/**
 * Hộp thêm xe vào lượt "Chờ xác nhận" của khách (cùng khung giờ, tổng ≤ 3 xe).
 *
 * @param {object|null} visit  Lượt cần thêm xe; null thì đóng
 * @param {() => void} onClose
 * @param {(visit: object) => void} onDone  Lượt sau khi thêm, từ BE
 * @param {() => void} onStale              Cần tải lại danh sách (lượt đã đổi trạng thái)
 */
export default function AddCarsModal({ visit, onClose, onDone, onStale }) {
  return visit ? <AddCarsDialog key={visit.visitId} visit={visit} onClose={onClose} onDone={onDone} onStale={onStale} /> : null
}
