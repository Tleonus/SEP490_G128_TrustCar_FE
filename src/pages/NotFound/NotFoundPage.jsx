import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="container" style={{ padding: '72px 0' }}>
      <Result
        status="404"
        title="404"
        subTitle="Không tìm thấy trang bạn yêu cầu."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        }
      />
    </div>
  )
}
