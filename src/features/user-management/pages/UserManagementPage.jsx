import { useState } from 'react'
import { Alert, Button, Dropdown, Skeleton, Table, Tag } from 'antd'
import { ReloadOutlined, MoreOutlined } from '@ant-design/icons'
import { roleBadgeClass, roleLabel } from '../constants/userManagementConstants'
import { useStaffUsers } from '../hooks/useStaffUsers'
import { useAuthStore } from '../../../store/useAuthStore'
import RoleAssignModal from '../components/RoleAssignModal'
import ConfirmReasonModal from '../components/ConfirmReasonModal'
import styles from '../styles/UserManagementPage.module.css'

/**
 * Trang "Quản lý người dùng" (/admin/nguoi-dung, bọc AdminOnlyRoute).
 *
 * KAN-93: hiển thị mọi vai trò của từng nhân sự và cho phép ADMIN gán/bỏ nhiều
 * vai trò cùng lúc.
 * KAN-101: thêm 3 action nguy hiểm (đặt lại mật khẩu, khoá, mở khoá) qua dropdown
 * kebab, cộng với badge trạng thái khoá và lý do khoá (ADMIN_LOCK / AUTO_RATE_LIMIT).
 * Row của chính người đang đăng nhập không hiển thị action nguy hiểm — guard chính
 * vẫn do BE giữ (CANNOT_MODIFY_SELF).
 */

/** Hiển thị trạng thái người dùng (active / locked + lý do). */
function StatusCell({ user, styles }) {
  const now = Date.now()
  const lockedUntil = user.lockedUntil ? new Date(user.lockedUntil).getTime() : 0
  const isLocked = lockedUntil > now
  if (isLocked) {
    const label = user.lockedReason === 'AUTO_RATE_LIMIT'
      ? 'Khoá tự động (đăng nhập sai nhiều lần)'
      : 'Đã khoá (quản trị viên)'
    return <Tag color="red" style={{ margin: 0 }}>{label}</Tag>
  }
  return (
    <span className={user.isActive ? styles.activeText : styles.inactiveText}>
      {user.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hoá'}
    </span>
  )
}

const ACTION_CONFIG = {
  reset: {
    title: 'Đặt lại mật khẩu',
    description: 'Hệ thống sẽ sinh mật khẩu tạm và gửi email cho',
    okText: 'Đặt lại và gửi email',
    required: false,
    danger: false,
    warning: 'Người dùng sẽ bị kick khỏi mọi phiên hiện tại ngay sau khi thao tác này hoàn tất.',
  },
  lock: {
    title: 'Khoá tài khoản',
    description: 'Khoá hoàn toàn quyền đăng nhập của',
    okText: 'Khoá tài khoản',
    required: true,
    danger: true,
    warning: 'Bắt buộc ghi lý do để tra cứu trong Nhật ký hoạt động.',
  },
  unlock: {
    title: 'Mở khoá tài khoản',
    description: 'Mở khoá và cho phép đăng nhập trở lại cho',
    okText: 'Mở khoá',
    required: false,
    danger: false,
  },
}

export default function UserManagementPage() {
  const s = useStaffUsers()
  const [editing, setEditing] = useState(null)
  const [action, setAction] = useState(null) // { user, type }
  const currentUser = useAuthStore((st) => st.user)

  const closeAction = () => setAction(null)

  const runAction = async (reason) => {
    if (!action) return false
    return s.runAction(action.user, action.type, reason)
  }

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
      key: 'status',
      render: (_, row) => <StatusCell user={row} styles={styles} />,
    },
    {
      title: '',
      key: 'actions',
      width: 220,
      render: (_, row) => {
        const isSelf    = currentUser?._id === row._id || currentUser?.id === row._id
        const isCust    = row.roleName === 'CUSTOMER'
        const now       = Date.now()
        const isLocked  = row.lockedUntil && new Date(row.lockedUntil).getTime() > now

        const items = []
        if (!isCust) {
          items.push({ key: 'roles', label: 'Gán vai trò', onClick: () => setEditing(row) })
        }
        if (!isSelf && !isCust) {
          items.push({ type: 'divider' })
          items.push({ key: 'reset', label: 'Đặt lại mật khẩu', onClick: () => setAction({ user: row, type: 'reset' }) })
          if (isLocked) {
            items.push({ key: 'unlock', label: 'Mở khoá tài khoản', onClick: () => setAction({ user: row, type: 'unlock' }) })
          } else {
            items.push({ key: 'lock', label: 'Khoá tài khoản', danger: true, onClick: () => setAction({ user: row, type: 'lock' }) })
          }
        }
        if (items.length === 0) return <span style={{ color: '#8c8c8c' }}>—</span>

        return (
          <Dropdown
            menu={{ items }}
            trigger={['click']}
            placement="bottomRight"
            disabled={Boolean(s.savingId)}
          >
            <Button icon={<MoreOutlined />} aria-label="Thao tác với nhân sự">Thao tác</Button>
          </Dropdown>
        )
      },
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
          scroll={{ x: 820 }}
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

      <ConfirmReasonModal
        open={Boolean(action)}
        user={action?.user}
        config={action ? ACTION_CONFIG[action.type] : null}
        saving={Boolean(s.savingId)}
        onCancel={closeAction}
        onConfirm={runAction}
      />
    </div>
  )
}
