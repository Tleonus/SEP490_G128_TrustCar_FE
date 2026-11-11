import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Button, Input, Modal, Result } from 'antd'
import { LoadingState } from '../../../components/common/StateBlock'
import { CUSTOMER_PATHS } from '../../../router/paths'
import { getCarTitle } from '../../../utils/car'
import { bookTestDrive, getCarSlots } from '../api/testDriveApi'
import { BOOKING_MIN_LEAD_HOURS, BOOKING_WINDOW_DAYS } from '../constants/testDriveConstants'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { getNearestSlots, getTestDriveErrorMessage, isProfileIncompleteError } from '../utils/testDriveErrors'
import { addLocalDays, formatAppointmentWhen, formatTime, getLocalDate } from '../utils/testDriveTime'
import styles from '../styles/TestDriveBooking.module.css'

export default function TestDriveBookingModal({ car, onClose }) {
  const navigate = useNavigate()
  const today = getLocalDate()
  const [date, setDate] = useState(today)
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [booked, setBooked] = useState(null)

  const slots = useAsyncResource(() => getCarSlots(car._id, date), date ? `${date}|${reloadKey}` : null)
  const slotList = slots.data ?? []
  const carTitle = getCarTitle(car)
  const earliestBookable = new Date().getTime() + BOOKING_MIN_LEAD_HOURS * 3600000
  // Đang gửi thì không cho đóng: lịch vẫn được tạo mà khách không thấy mã lịch.
  const handleClose = () => { if (!submitting) onClose() }

  function changeDate(next) {
    setDate(next)
    setSelected(null)
    setFailure(null)
  }

  async function handleBook() {
    setSubmitting(true)
    setFailure(null)
    try {
      setBooked(await bookTestDrive({ carId: car._id, scheduledAt: selected, notes: notes.trim() }))
    } catch (error) {
      setFailure({
        message: getTestDriveErrorMessage(error),
        nearest: getNearestSlots(error),
        needsProfile: isProfileIncompleteError(error),
      })
      setSelected(null)
      setReloadKey((key) => key + 1)
    } finally {
      setSubmitting(false)
    }
  }

  function pickNearest(startAt) {
    setDate(getLocalDate(startAt))
    setSelected(startAt)
    setFailure(null)
  }

  if (booked) {
    return (
      <Modal open footer={null} onCancel={onClose} title="Đặt lịch lái thử">
        <Result
          status="success"
          title={`Đã gửi yêu cầu lái thử ${booked.appointmentCode ?? ''}`}
          subTitle={`${carTitle}. Nhân viên TrustCar sẽ xác nhận lịch, và bạn sẽ nhận email nhắc trước giờ hẹn 1 giờ.`}
          extra={[
            <Button key="mine" type="primary" size="large" onClick={() => navigate(CUSTOMER_PATHS.testDrives)}>Xem lịch của tôi</Button>,
            <Button key="close" size="large" onClick={onClose}>Đóng</Button>,
          ]}
        />
      </Modal>
    )
  }

  return (
    <Modal
      open
      title={`Đặt lịch lái thử ${carTitle}`}
      okText="Đặt lịch"
      cancelText="Đóng"
      okButtonProps={{ disabled: !selected, size: 'large' }}
      cancelButtonProps={{ size: 'large', disabled: submitting }}
      confirmLoading={submitting}
      onOk={handleBook}
      onCancel={handleClose}
    >
      <div className={styles.body}>
        <label className={styles.field}>
          <span className={styles.label}>Ngày lái thử</span>
          <input
            type="date"
            className={styles.dateInput}
            min={today}
            max={addLocalDays(today, BOOKING_WINDOW_DAYS)}
            value={date}
            onChange={(event) => changeDate(event.target.value)}
          />
          <span className={styles.hint}>Đặt trước ít nhất 2 giờ và không quá {BOOKING_WINDOW_DAYS} ngày.</span>
        </label>

        {failure && (
          <Alert
            type="error"
            showIcon
            role="alert"
            title={failure.message}
            description={failure.needsProfile ? <Link to="/hoan-tat-ho-so">Hoàn tất hồ sơ</Link> : null}
          />
        )}
        {failure?.nearest.length > 0 && (
          <div className={styles.field}>
            <span className={styles.label}>Khung giờ trống gần nhất</span>
            <div className={styles.slots}>
              {failure.nearest.map((slot) => (
                <button key={slot.startAt} type="button" className={styles.slot} onClick={() => pickNearest(slot.startAt)}>
                  {formatAppointmentWhen({ scheduledAt: slot.startAt, durationMinutes: (new Date(slot.endAt) - new Date(slot.startAt)) / 60000 })}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.field}>
          <span className={styles.label} id="slot-label">Khung giờ</span>
          {slots.loading && <LoadingState text="Đang tải khung giờ..." />}
          {!slots.loading && slots.error && (
            <Alert
              type="error"
              showIcon
              title={getTestDriveErrorMessage(slots.error)}
              description={isProfileIncompleteError(slots.error) ? <Link to="/hoan-tat-ho-so">Hoàn tất hồ sơ</Link> : null}
            />
          )}
          {!slots.loading && !slots.error && date && slotList.length === 0 && (
            <p className={styles.hint}>Showroom không nhận lịch trong ngày này. Hãy chọn ngày khác.</p>
          )}
          {!slots.loading && !slots.error && slotList.length > 0 && (
            <>
              <div className={styles.slots} role="group" aria-labelledby="slot-label">
                {slotList.map((slot) => (
                  <button
                    key={slot.startAt}
                    type="button"
                    disabled={!slot.available}
                    aria-pressed={selected === slot.startAt}
                    className={`${styles.slot} ${selected === slot.startAt ? styles.slotActive : ''}`}
                    onClick={() => { setSelected(slot.startAt); setFailure(null) }}
                  >
                    {formatTime(slot.startAt)} – {formatTime(slot.endAt)}
                    {!slot.available && (
                      <span className={styles.slotNote}>
                        {new Date(slot.startAt).getTime() < earliestBookable ? `Cần đặt trước ${BOOKING_MIN_LEAD_HOURS} giờ` : 'Hết chỗ'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {slotList.every((slot) => !slot.available) && <p className={styles.hint}>Ngày này không còn khung trống. Hãy chọn ngày khác.</p>}
            </>
          )}
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Ghi chú (không bắt buộc)</span>
          <Input.TextArea rows={2} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
      </div>
    </Modal>
  )
}
