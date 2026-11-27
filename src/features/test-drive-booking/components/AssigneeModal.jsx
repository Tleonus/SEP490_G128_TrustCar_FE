import { useEffect, useState } from 'react'
import { Alert, Empty, Modal, Radio, Skeleton, Tag } from 'antd'
import { fetchAssigneeOptions, reassignVisit } from '../api/staffingApi'
import { useRunOnce } from '../hooks/useRunOnce'
import { staffingErrorMessage } from '../utils/staffing'
import { formatVnDateTime } from '../utils/vnTime'
import styles from '../styles/StaffVisits.module.css'

/**
 * Hộp "Đổi người phụ trách": nhân viên bán hàng đi làm ngày của lượt. Người đang có lượt khác cùng khung giờ
 * thì không chọn được. Gửi đúng một yêu cầu dù bấm đúp.
 *
 * @param {object|null} visit
 * @param {() => void} onClose
 * @param {(visit: object) => void} onDone  Lượt sau khi đổi
 */
export default function AssigneeModal({ visit, onClose, onDone }) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [picked, setPicked] = useState(null)
  const [problem, setProblem] = useState(null)
  const { busy, run } = useRunOnce()
  const visitId = visit?.visitId

  useEffect(() => {
    if (!visitId) return undefined
    const controller = new AbortController()
    fetchAssigneeOptions(visitId, controller.signal)
      .then((data) => {
        setState({ status: 'success', data, error: null })
        setPicked(data.current)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ status: 'error', data: null, error: staffingErrorMessage(error) })
      })
    return () => controller.abort()
  }, [visitId])

  if (!visit) return null
  const { data } = state
  const unchanged = !picked || picked === data?.current

  const save = () => run(async () => {
    setProblem(null)
    try {
      onDone(await reassignVisit(visit.visitId, picked))
    } catch (error) {
      setProblem(staffingErrorMessage(error))
    }
  })

  return (
    <Modal
      open
      title={`Người phụ trách lượt ${visit.visitCode}`}
      okText="Lưu"
      cancelText="Đóng"
      onOk={save}
      onCancel={onClose}
      okButtonProps={{ disabled: unchanged || !data?.editable, loading: busy }}
      destroyOnHidden
    >
      <p className={styles.sub}>{formatVnDateTime(visit.scheduledAt)} · {visit.customer?.fullName ?? ''}</p>
      {state.status === 'loading' && <Skeleton active paragraph={{ rows: 3 }} />}
      {state.status === 'error' && <Alert type="error" showIcon title={state.error} />}
      {data && !data.editable && <Alert type="info" showIcon title="Lượt đã diễn ra hoặc đã đóng nên không đổi được." />}
      {data && data.options.length === 0 && <Empty description="Không có nhân viên bán hàng nào đi làm ngày này" />}
      {data && data.options.length > 0 && (
        <Radio.Group className={styles.assigneeList} value={picked} onChange={(event) => setPicked(event.target.value)}>
          {data.options.map((option) => (
            <Radio key={option._id} value={option._id} disabled={option.busy || !data.editable}>
              <span className={styles.strong}>{option.fullName ?? '(không tên)'}</span>
              {' '}<span className={styles.sub}>{option.visitsThatDay} lượt trong ngày</span>
              {option.current && <Tag color="blue">Đang phụ trách</Tag>}
              {option.busy && <Tag>Bận lượt khác khung này</Tag>}
            </Radio>
          ))}
        </Radio.Group>
      )}
      {problem && <Alert type="error" showIcon title={problem} className={styles.modalAlert} />}
    </Modal>
  )
}
