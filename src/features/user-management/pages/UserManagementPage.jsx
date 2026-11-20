import { useState } from 'react'
import { Alert, Button, Skeleton, Table } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { roleBadgeClass, roleLabel } from '../constants/userManagementConstants'
import { useStaffUsers } from '../hooks/useStaffUsers'
import RoleAssignModal from '../components/RoleAssignModal'
import styles from '../styles/UserManagementPage.module.css'

/**
 * Trang "Quản lý người dùng" (/admin/nguoi-dung, bọc AdminOnlyRoute).
 *
 * KAN-93: hiển thị mọi vai trò của từng nhân sự và cho phép ADMIN gán/bỏ nhiều
 * vai trò cùng lúc (ví dụ SALES_STAFF + INSPECTOR). Quyền cuối cùng do BE quyết
 * định — 403 sẽ hiện thông báo thay vì dữ liệu.
 */
export default function UserManagementPage() {
  const s = useStaffUsers()
  const [editing, setEditing] = useState(null)

  const columns = [
    {
      title: 'Nhân sự',
      key: 'person',
      render: (_, row) => (
        <div className={styles.person}>
          <strong className={styles.personName}>{row.fullName || '—'}</strong>
          <span className={styles.personEmail}>{row.email}</span>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      key: 'roles',
      render: (_, row) => {
        const names = row.roleNames?.length ? row.roleNames : (row.roleName ? [row.roleName] : [])
        return (
          <div className={styles.badgeRow}>
            {names.map((name) => (
              <span key={name} className={`${styles.badge} ${styles[roleBadgeClass(name)]}`}>
                {roleLabel(name)}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => (
        <span className={active ? styles.activeText : styles.inactiveText}>
          {active ? 'Đang hoạt động' : 'Đã khóa'}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 160,
      render: (_, row) => (
        <Button onClick={() => setEditing(row)} disabled={row.roleName === 'CUSTOMER'}>
          Gán vai trò
        </Button>
      ),
    },
  ]

  if (s.status === 'loading' && s.items.length === 0) {
    return <div className={styles.page}><Skeleton active paragraph={{ rows: 8 }} /></div>
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>TÀI KHOẢN NỘI BỘ</span>
          <h1 className={styles.title}>Quản lý người dùng</h1>
          <p className={styles.desc}>
            Một nhân sự có thể giữ nhiều vai trò cùng lúc. Quyền của họ là hợp quyền của mọi vai trò được gán.
          </p>
        </div>
        <Button size="large" icon={<ReloadOutlined />} onClick={() => s.load(s.page)} loading={s.status === 'loading'}>
          Tải lại
        </Button>
      </header>

      {s.status === 'error' && (
        <Alert
          type="error"
          showIcon
          message="Không tải được danh sách nhân sự"
          description={s.error}
          action={<Button size="small" onClick={() => s.load(s.page)}>Thử lại</Button>}
        />
      )}

      {s.status !== 'error' && (
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={s.items}
          loading={s.status === 'loading'}
          pagination={{
            current: s.meta?.page ?? s.page,
            pageSize: s.meta?.limit ?? 20,
            total: s.meta?.total ?? s.items.length,
            showSizeChanger: false,
            onChange: (nextPage) => s.setPage(nextPage),
          }}
          scroll={{ x: 720 }}
        />
      )}

      <RoleAssignModal
        user={editing}
        roles={s.roles}
        open={Boolean(editing)}
        saving={Boolean(s.savingId)}
        onCancel={() => setEditing(null)}
        onSave={async (names) => {
          if (!editing) return
          const ok = await s.saveRoles(editing, names)
          if (ok) setEditing(null)
        }}
      />
    </div>
  )
}
