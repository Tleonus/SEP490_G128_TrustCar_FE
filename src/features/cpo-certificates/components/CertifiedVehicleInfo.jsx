import { Descriptions } from 'antd'
import { formatDate, formatMileage } from '../../../utils/format'
import { getCarTitle } from '../../../utils/car'
import { REPORT_LEVEL } from '../constants/cpoCertificateConstants'

/**
 * Thông tin xe được xác nhận tại kiểm định. Chỉ dùng trường của báo cáo công khai
 * (không có VIN, số máy, số km người bán khai báo, ID người dùng).
 *
 * @param {{ report: import('../constants/cpoCertificateConstants').PublicInspectionReport, vehicleCode: string|null, showLevel?: boolean }} props
 *   showLevel: hiện loại báo cáo (chỉ dành cho nhân viên).
 */
export default function CertifiedVehicleInfo({ report, vehicleCode, showLevel = true }) {
  const { vehicle } = report
  const items = [
    { key: 'car', label: 'Xe', children: getCarTitle(vehicle) || '—' },
    { key: 'code', label: 'Mã xe', children: vehicleCode || '—' },
    { key: 'year', label: 'Năm sản xuất', children: vehicle?.year ?? '—' },
    { key: 'color', label: 'Màu', children: vehicle?.color || '—' },
    { key: 'mileage', label: 'Số km xác nhận', children: formatMileage(vehicle?.mileage) },
    { key: 'issued', label: 'Ngày cấp', children: formatDate(report.issuedAt) },
    { key: 'inspector', label: 'Kiểm định viên', children: report.inspector || '—' },
    showLevel && {
      key: 'level',
      label: 'Loại báo cáo',
      children: report.level === REPORT_LEVEL.FULL ? 'Đầy đủ (checklist số)' : 'Tối thiểu (duyệt theo quy trình cũ)',
    },
  ].filter(Boolean)
  return <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} items={items} />
}
