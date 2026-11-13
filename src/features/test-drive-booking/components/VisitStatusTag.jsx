import { Tag } from 'antd'
import { VISIT_STATUS } from '../constants/testDriveConstants'

/** Nhãn trạng thái lượt (màu theo trạng thái); trạng thái lạ hiện nguyên văn. */
export default function VisitStatusTag({ status }) {
  const info = VISIT_STATUS[status]
  return <Tag color={info?.color ?? 'default'}>{info?.label ?? status}</Tag>
}
