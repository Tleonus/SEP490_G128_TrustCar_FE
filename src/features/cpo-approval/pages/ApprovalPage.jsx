/**
 * KAN-56 – Bảng điều khiển duyệt của Admin: /admin/approval
 *
 * Chỉ ADMIN vào được (AdminOnlyRoute ở router + mục menu ẩn với SALES_STAFF).
 * Backend vẫn kiểm quyền cuối cùng: PUT approve-sale trả 403 với role khác.
 *
 * Tab 1 – Chờ duyệt thẩm định: xe UNDER_INSPECTION (dữ liệu thật). API duyệt/trả lại
 *          biên bản chưa có trên Backend, nên hai nút tạm vô hiệu (xem InspectionQueueTab).
 * Tab 2 – Chờ duyệt mở bán: xe APPROVED_CPO, nút gọi PUT /inspections/cars/:id/approve-sale.
 */

import { Tabs } from 'antd'
import { AuditOutlined, ShopOutlined } from '@ant-design/icons'
import InspectionQueueTab from '../components/InspectionQueueTab'
import SaleQueueTab from '../components/SaleQueueTab'
import { APPROVAL_TAB } from '../constants/approvalConstants'
import styles from '../styles/ApprovalPage.module.css'

const TAB_ITEMS = [
  {
    key: APPROVAL_TAB.INSPECTION,
    label: 'Chờ duyệt thẩm định',
    icon: <AuditOutlined />,
    children: <InspectionQueueTab />,
  },
  {
    key: APPROVAL_TAB.SALE,
    label: 'Chờ duyệt mở bán',
    icon: <ShopOutlined />,
    children: <SaleQueueTab />,
  },
]

export default function ApprovalPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>QUẢN TRỊ · DUYỆT</span>
          <h1 className={styles.title}>Duyệt kiểm định &amp; mở bán</h1>
          <p className={styles.desc}>
            Xe đạt chuẩn CPO cần Quản trị viên duyệt thì mới được mở bán trên trang công khai.
            Chỉ tài khoản Quản trị viên xem được màn này.
          </p>
        </div>
      </header>

      <Tabs defaultActiveKey={APPROVAL_TAB.SALE} items={TAB_ITEMS} />
    </div>
  )
}
