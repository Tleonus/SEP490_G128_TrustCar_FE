import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, Button, Pagination, message } from 'antd'
import { ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { EmptyState, ErrorState, LoadingState } from '../../../components/common/StateBlock'
import { ADMIN_PATHS } from '../../../router/paths'
import { useAuthStore } from '../../../store/useAuthStore'
import { getPublicTestDriveSettings, listAssignableStaff, listTestDrives, runStaffAction } from '../api/testDriveApi'
import TestDriveActionModal from '../components/TestDriveActionModal'
import TestDriveDetailDrawer from '../components/TestDriveDetailDrawer'
import TestDriveKpis from '../components/TestDriveKpis'
import TestDriveSlotTable from '../components/TestDriveSlotTable'
import TestDriveToolbar from '../components/TestDriveToolbar'
import { ACTION_SUCCESS_MESSAGE, MANAGEMENT_PAGE_SIZE, TEST_DRIVE_STATUS } from '../constants/testDriveConstants'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { useClampPage } from '../hooks/useClampPage'
import { useFocusReturn } from '../hooks/useFocusReturn'
import { getTestDriveErrorMessage, isStaleAppointmentError } from '../utils/testDriveErrors'
import { getLocalDate, isLocalDate } from '../utils/testDriveTime'
import styles from '../styles/TestDriveManagement.module.css'

export default function TestDriveManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const isAdmin = useAuthStore((state) => state.user?.roleName) === 'ADMIN'
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [pendingAction, setPendingAction] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [conflict, setConflict] = useState('')
  const detailFocus = useFocusReturn()
  const modalFocus = useFocusReturn()

  const dateParam = searchParams.get('date')
  const date = isLocalDate(dateParam) ? dateParam : getLocalDate()
  const statusParam = searchParams.get('status')
  const status = TEST_DRIVE_STATUS[statusParam] ? statusParam : ''
  const staffId = searchParams.get('staffId') || ''
  const attentionOnly = searchParams.get('attention') === '1'
  const requestedPage = Number(searchParams.get('page'))
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1

  // Lịch cần xử lý được xem trên mọi ngày, để lịch quá giờ của hôm trước không bị bỏ sót.
  const query = {
    ...(attentionOnly ? { needsAttention: true } : { date }),
    status: status || undefined,
    staffId: staffId || undefined,
    page,
    limit: MANAGEMENT_PAGE_SIZE,
  }
  const list = useAsyncResource(() => listTestDrives(query), `${JSON.stringify(query)}|${refreshKey}`)
  const settings = useAsyncResource(getPublicTestDriveSettings, 'settings')
  const staff = useAsyncResource(listAssignableStaff, 'staff')
  const staffOptions = staff.data ?? []
  useClampPage(list, page)

  const items = list.data?.items ?? []
  const total = list.data?.total ?? 0
  const selected = items.find((item) => item.id === selectedId) ?? null
  const actionOptions = { isAdmin, canReassign: staffOptions.length > 0 }
  // Số chỗ chỉ đúng khi đang xem đủ lịch của một ngày, không bị bộ lọc hay phân trang cắt bớt.
  const showCapacity = !attentionOnly && !status && !staffId && total <= MANAGEMENT_PAGE_SIZE
  const capacity = showCapacity ? settings.data?.maxGuestsPerSlot : undefined

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next)
  }

  async function submitAction(action, appointment, payload = {}) {
    setBusyId(appointment.id)
    setConflict('')
    try {
      await runStaffAction(action, appointment.id, payload)
      message.success(`${ACTION_SUCCESS_MESSAGE[action]} ${appointment.appointmentCode}`)
      // Xác nhận không mở hộp thoại, nên không được đóng hộp thoại nhân viên vừa mở cho lịch khác.
      if (action !== 'confirm') setPendingAction(null)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      // Lịch vừa được người khác xử lý: tải lại để nhân viên thấy trạng thái mới rồi quyết định tiếp.
      if (isStaleAppointmentError(error)) {
        setConflict(`Không thể xử lý lịch ${appointment.appointmentCode} vì lịch vừa thay đổi. Danh sách đã được tải lại, hãy kiểm tra trạng thái mới.`)
        if (action !== 'confirm') setPendingAction(null)
        setSelectedId(null)
        setRefreshKey((key) => key + 1)
        return
      }
      throw error
    } finally {
      setBusyId(null)
    }
  }

  function handleAction(action, appointment) {
    if (action !== 'confirm') {
      modalFocus.remember()
      setPendingAction({ action, appointment })
      return
    }
    submitAction(action, appointment).catch((error) => message.error(getTestDriveErrorMessage(error)))
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>QUẢN LÝ SHOWROOM</span>
          <h1 className={styles.title}>Lịch lái thử</h1>
          <p className={styles.desc}>Xác nhận, phân công và ghi kết quả cho lịch khách đã đặt.</p>
        </div>
        <div className={styles.headerActions}>
          {/* Trang có thể mở cả ngày: tải lại để thấy lịch mới và nút theo đúng giờ hiện tại. */}
          <Button size="large" icon={<ReloadOutlined />} loading={list.loading} onClick={() => setRefreshKey((key) => key + 1)}>Tải lại</Button>
          {isAdmin && (
            <Link to={ADMIN_PATHS.baseSettings} className={styles.secondaryLink}>
              <SettingOutlined aria-hidden="true" />Cấu hình khung giờ
            </Link>
          )}
        </div>
      </div>

      <TestDriveKpis
        date={date}
        refreshKey={refreshKey}
        onShowStatus={(value) => updateParams({ status: value, attention: null, date: date === getLocalDate() ? null : date })}
        onShowAttention={() => updateParams({ attention: '1', status: null })}
      />

      <TestDriveToolbar
        date={date}
        status={status}
        staffId={staffId}
        attentionOnly={attentionOnly}
        staffOptions={staffOptions}
        onChange={updateParams}
      />

      {staff.error && (
        <Alert type="warning" showIcon className={styles.conflict} title="Chưa tải được danh sách nhân viên nên tạm thời không đổi hoặc lọc theo nhân viên được. Hãy tải lại trang." />
      )}
      {conflict && <Alert type="warning" showIcon closable title={conflict} onClose={() => setConflict('')} className={styles.conflict} />}

      {list.loading && <LoadingState text="Đang tải lịch lái thử..." />}
      {!list.loading && list.error && (
        <ErrorState message={getTestDriveErrorMessage(list.error)} onRetry={() => setRefreshKey((key) => key + 1)} />
      )}
      {!list.loading && !list.error && items.length === 0 && (
        <EmptyState description={attentionOnly ? 'Không có lịch nào cần xử lý.' : 'Không có lịch phù hợp với ngày và bộ lọc này.'} />
      )}
      {!list.loading && !list.error && items.length > 0 && (
        <>
          <TestDriveSlotTable
            items={items}
            withDate={attentionOnly}
            capacity={capacity}
            actionOptions={actionOptions}
            busyId={busyId}
            onAction={handleAction}
            onOpen={(id) => { detailFocus.remember(); setSelectedId(id) }}
          />
          {total > MANAGEMENT_PAGE_SIZE && (
            <div className={styles.pagination}>
              <Pagination current={page} pageSize={MANAGEMENT_PAGE_SIZE} total={total} showSizeChanger={false} onChange={(next) => updateParams({ page: String(next) })} />
            </div>
          )}
        </>
      )}

      <TestDriveDetailDrawer
        appointment={selected}
        actionOptions={actionOptions}
        busyId={busyId}
        onAction={handleAction}
        onClose={() => { setSelectedId(null); detailFocus.restore() }}
      />
      {pendingAction && (
        <TestDriveActionModal
          key={`${pendingAction.action}-${pendingAction.appointment.id}`}
          action={pendingAction.action}
          appointment={pendingAction.appointment}
          staffOptions={staffOptions}
          onSubmit={(payload) => submitAction(pendingAction.action, pendingAction.appointment, payload)}
          onClose={() => { setPendingAction(null); modalFocus.restore() }}
        />
      )}
    </div>
  )
}
