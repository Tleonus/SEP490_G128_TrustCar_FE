import { Spin, Result, Button, Empty } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

export function LoadingState({ text = 'Đang tải dữ liệu...' }) {
  return (
    <div style={{ padding: '64px 0', textAlign: 'center' }}>
      <Spin size="large" />
      <p style={{ marginTop: 16 }}>{text}</p>
    </div>
  )
}

export function ErrorState({ message = 'Đã có lỗi xảy ra.', onRetry }) {
  return (
    <Result
      status="warning"
      title="Không thể tải dữ liệu"
      subTitle={message}
      extra={
        onRetry && (
          <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
            Thử lại
          </Button>
        )
      }
    />
  )
}

export function EmptyState({ description = 'Không có dữ liệu để hiển thị.' }) {
  return (
    <div style={{ padding: '64px 0' }}>
      <Empty description={description} />
    </div>
  )
}
