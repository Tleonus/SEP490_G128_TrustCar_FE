import { useCallback, useEffect, useState } from 'react'
import { App, Button, Empty, Skeleton, Switch, Table, Tag } from 'antd'
import { LeftOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons'
import LoadError from './LoadError'
import { fetchAttendance, markAttendance, setAttendanceKeeper } from '../api/staffingApi'
import { restaffSummary, staffingErrorMessage } from '../utils/staffing'
import { addDays, formatVnDateTime, vnDayKey, weekdayLabel } from '../utils/vnTime'
import styles from '../styles/StaffSlots.module.css'

const dmy = (key) => key.split('-').reverse().join('/')

/** Đọc bảng điểm danh của một ngày; `reload` đọc lại. */
function useAttendanceDay(date) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    fetchAttendance(date, controller.signal)
      .then((data) => setState({ status: 'success', data, error: null }))
      .catch((error) => {
        if (!controller.signal.aborted) setState({ status: 'error', data: null, error })
      })
    return () => controller.abort()
  }, [date, version])
  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { ...state, reload }
}

/**
 * Tab "Điểm danh": mỗi ngày, ai đi làm (mặc định là có). Bỏ xanh một người → các lượt sắp tới của người đó hôm ấy được
 * BE chuyển cho người khác còn rảnh; không còn ai thì lượt bị gắn "Thiếu nhân viên" để gọi khách đổi giờ (không tự hủy).
 * Số lượt mỗi khung nhận được = số người đi làm (không quá giới hạn Admin đặt). Ngày đã qua chỉ xem.
 * ADMIN thấy thêm cột "Được điểm danh" để giao quyền này cho nhân viên.
 */
export default function StaffAttendanceTab() {
  const { message, modal } = App.useApp()
  const [date, setDate] = useState(() => vnDayKey(new Date()))
  const [saving, setSaving] = useState(null)
  const day = useAttendanceDay(date)
  const sheet = day.data

  const save = async (person, present) => {
    setSaving(person._id)
    try {
      const result = await markAttendance(date, person._id, present)
      const summary = restaffSummary(result)
      const text = `${person.fullName}: ${present ? 'đi làm' : 'nghỉ'} ngày ${dmy(date)}${summary ? ` — ${summary}` : ''}`
      if (result.unassigned?.length) message.warning(text, 6)
      else message.success(text)
    } catch (error) {
      message.error(staffingErrorMessage(error))
    } finally {
      setSaving(null)
      day.reload()
    }
  }

  const toggle = (person, present) => {
    if (present || person.visitsThatDay === 0) return save(person, present)
    return modal.confirm({
      title: `${person.fullName} nghỉ ngày ${dmy(date)}?`,
      content: `Người này đang phụ trách ${person.visitsThatDay} lượt trong ngày. Hệ thống sẽ chuyển các lượt chưa diễn ra sang người khác còn rảnh; lượt nào không còn ai sẽ bị đánh dấu "Thiếu nhân viên".`,
      okText: 'Đánh dấu nghỉ',
      cancelText: 'Thôi',
      onOk: () => save(person, false),
    })
  }

  const grant = async (person, enabled) => {
    setSaving(person._id)
    try {
      await setAttendanceKeeper(person._id, enabled)
      message.success(`${person.fullName} ${enabled ? 'được' : 'không còn được'} điểm danh`)
    } catch (error) {
      message.error(staffingErrorMessage(error))
    } finally {
      setSaving(null)
      day.reload()
    }
  }

  const columns = [
    {
      title: 'Nhân viên',
      key: 'name',
      render: (_, p) => (
        <div className={styles.attName}>
          <strong>{p.fullName ?? '(không tên)'}</strong>
          {p.email && <span>{p.email}</span>}
        </div>
      ),
    },
    {
      title: 'Đi làm',
      key: 'present',
      width: 120,
      render: (_, p) => (
        <Switch
          checked={p.present}
          checkedChildren="Đi làm"
          unCheckedChildren="Nghỉ"
          loading={saving === p._id}
          disabled={!sheet.editable || saving !== null}
          onChange={(present) => toggle(p, present)}
          aria-label={`${p.fullName} đi làm ngày ${dmy(date)}`}
        />
      ),
    },
    { title: 'Lượt trong ngày', dataIndex: 'visitsThatDay', key: 'visits', width: 130 },
    {
      title: 'Người điểm danh',
      key: 'marked',
      render: (_, p) => (p.markedBy
        ? <span className={styles.attSub}>{p.markedBy.fullName ?? '—'} · {formatVnDateTime(p.markedAt)}</span>
        : <span className={styles.attSub}>Mặc định</span>),
    },
  ]
  if (sheet?.canManageKeepers) {
    columns.push({
      title: 'Được điểm danh',
      key: 'keeper',
      width: 140,
      render: (_, p) => (
        <Switch
          size="small"
          checked={p.canTakeAttendance}
          disabled={saving !== null}
          onChange={(enabled) => grant(p, enabled)}
          aria-label={`${p.fullName} được điểm danh`}
        />
      ),
    })
  }

  return (
    <div className={styles.tab}>
      <div className={styles.tabHead}>
        <div className={styles.attDay}>
          <Button icon={<LeftOutlined />} onClick={() => setDate(addDays(date, -1))} aria-label="Ngày trước" />
          <input type="date" className={styles.attDate} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Ngày điểm danh" />
          <Button icon={<RightOutlined />} onClick={() => setDate(addDays(date, 1))} aria-label="Ngày sau" />
          <span className={styles.legend}>{weekdayLabel(date)}</span>
        </div>
        <Button icon={<ReloadOutlined />} onClick={day.reload} disabled={day.status === 'loading'}>Làm mới</Button>
      </div>

      {day.status === 'loading' && !sheet && <Skeleton active paragraph={{ rows: 4 }} />}
      {day.status === 'error' && <LoadError title="Không thể tải điểm danh" error={day.error} onRetry={day.reload} />}
      {sheet && (
        <>
          <p className={styles.legend}>
            <Tag color={sheet.presentCount > 0 ? 'green' : 'red'}>{sheet.presentCount}/{sheet.total} người đi làm</Tag>
            Mỗi khung giờ nhận tối đa {sheet.presentCount} lượt lái thử (không quá giới hạn Admin đặt).
            {!sheet.editable && ' Ngày đã qua: chỉ xem.'}
          </p>
          {sheet.staff.length === 0
            ? <Empty description="Chưa có tài khoản nhân viên bán hàng nào" />
            : (
              <div className={styles.attTable}>
                <Table rowKey="_id" columns={columns} dataSource={sheet.staff} pagination={false} size="middle" scroll={{ x: 640 }} />
              </div>
            )}
        </>
      )}
    </div>
  )
}
