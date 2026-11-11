import { getAdminCars } from '../../../services/adminCarService'
import { listInspectionQueueCars } from '../../inspection/api/inspectionApi'
import { OLDEST_PENDING_LIMIT, PENDING_STATUSES } from '../constants/inspectionDashboardConstants'

// Đếm bằng một request limit=1 cho mỗi trạng thái: chỉ cần meta.total.
export async function countCarsByStatus(status) {
  const { total } = await getAdminCars({ status, limit: 1 })
  return total
}

// Xe nhập sớm nhất trong số xe còn việc kiểm định, để xử lý theo thứ tự.
export async function listOldestPendingCars() {
  const { items } = await listInspectionQueueCars({
    statuses: PENDING_STATUSES,
    limit: OLDEST_PENDING_LIMIT,
    sortDir: 'asc',
  })
  return items
}
