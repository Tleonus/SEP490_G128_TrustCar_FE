import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Result, Switch } from 'antd'
import { LoadingState, ErrorState } from '../../../components/common/StateBlock'
import { useAuthStore } from '../../../store/useAuthStore'
import { useCompareStore } from '../store/useCompareStore'
import { useComparison } from '../hooks/useComparison'
import { COMPARE_ERROR } from '../utils/compareErrors'
import { buildRows, onlyDifferences } from '../utils/compareRows'
import { MIN_COMPARE } from '../constants/compareConstants'
import CompareTable from '../components/CompareTable'
import styles from './ComparePage.module.css'

function Notice({ status = 'info', title, subTitle, actionLabel = 'Xem danh sách xe' }) {
  return (
    <Result
      status={status}
      title={title}
      subTitle={subTitle}
      extra={<Link to="/xe"><Button type="primary">{actionLabel}</Button></Link>}
    />
  )
}

/**
 * Trang so sánh xe (chỉ khách hàng đăng nhập; được bọc PrivateRoute ở router).
 * Gọi API đúng một lần theo danh sách chọn tại lúc mở trang; bỏ xe tại trang không gọi lại.
 *
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F12
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F13
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F14
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F15
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F16
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F17
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F18
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F19
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F20
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F21
 */
export default function ComparePage() {
  const items = useCompareStore((state) => state.items)
  const remove = useCompareStore((state) => state.remove)
  const prune = useCompareStore((state) => state.prune)
  const clear = useCompareStore((state) => state.clear)
  const logout = useAuthStore((state) => state.logout)

  // Ảnh chụp danh sách tại lúc mở trang: chỉ gọi API khi đủ số xe tối thiểu.
  const [initialIds] = useState(() => (items.length >= MIN_COMPARE ? items.map((item) => item.id) : []))
  const { status, data, error, retry } = useComparison(initialIds)
  const [differencesOnly, setDifferencesOnly] = useState(false)

  const errorKind = error?.kind
  useEffect(() => {
    if (status === 'success' && data?.unavailableIds?.length) prune(data.unavailableIds)
  }, [status, data, prune])

  useEffect(() => {
    if (status !== 'error') return
    if (errorKind === COMPARE_ERROR.NOT_ENOUGH) prune(error.unavailableIds)
    else if (errorKind === COMPARE_ERROR.INVALID) clear()
    // 401: đăng xuất khỏi store, PrivateRoute tự chuyển tới /dang-nhap kèm đường quay lại; danh sách giữ nguyên.
    else if (errorKind === COMPARE_ERROR.UNAUTHORIZED) logout()
  }, [status, errorKind, error, prune, clear, logout])

  const selectedIds = useMemo(() => new Set(items.map((item) => item.id)), [items])
  const cars = useMemo(
    () => (data?.cars ?? []).filter((car) => selectedIds.has(String(car._id).toLowerCase())),
    [data, selectedIds],
  )
  const groups = useMemo(() => {
    const all = buildRows(cars)
    return differencesOnly ? onlyDifferences(all) : all
  }, [cars, differencesOnly])

  let content
  if (status === 'idle') {
    content = <Notice title="Chọn ít nhất 2 xe để so sánh" subTitle="Hãy chọn xe từ danh sách rồi quay lại đây." />
  } else if (status === 'loading' || errorKind === COMPARE_ERROR.UNAUTHORIZED) {
    content = <LoadingState text="Đang tải bảng so sánh..." />
  } else if (status === 'error') {
    if (errorKind === COMPARE_ERROR.NETWORK) {
      content = <ErrorState message={error.message} onRetry={retry} />
    } else if (errorKind === COMPARE_ERROR.NOT_ENOUGH) {
      content = <Notice status="warning" title={error.message} subTitle="Xe bạn chọn có thể đã được bán hoặc gỡ khỏi website." />
    } else if (errorKind === COMPARE_ERROR.INVALID) {
      content = <Notice status="warning" title={error.message} />
    } else {
      content = <Notice status="warning" title={error.message} actionLabel="Về danh sách xe" />
    }
  } else if (cars.length < MIN_COMPARE) {
    content = <Notice title="Chọn ít nhất 2 xe để so sánh" subTitle="Hãy chọn thêm xe từ danh sách." />
  } else {
    const unavailable = data.unavailableIds?.length ?? 0
    content = (
      <>
        {unavailable > 0 && (
          <Alert
            type="warning"
            showIcon
            className={styles.alert}
            title={`${unavailable} xe không còn bán và đã được bỏ khỏi so sánh.`}
          />
        )}
        <div className={styles.toolbar}>
          <label className={styles.switch}>
            <Switch checked={differencesOnly} onChange={setDifferencesOnly} aria-label="Chỉ hiện điểm khác biệt" />
            <span>Chỉ hiện điểm khác biệt</span>
          </label>
          <Link to="/xe" className={styles.addMore}>Thêm xe khác</Link>
        </div>
        {groups.length === 0 ? (
          <Alert type="info" showIcon title="Các xe giống nhau ở mọi thông số đang hiển thị." />
        ) : (
          <CompareTable cars={cars} groups={groups} onRemove={remove} />
        )}
      </>
    )
  }

  return (
    <div className="container">
      <div className={styles.page}>
        <h1 className={styles.title}>So sánh xe</h1>
        {content}
      </div>
    </div>
  )
}
