import { useState } from 'react'
import { Button, Modal, message } from 'antd'
import { HeartFilled, HeartOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useSavedCarsStore } from '../store/useSavedCarsStore'
import { savedIdOf, MAX_SAVED_CARS } from '../utils/savedCars'
import { useAuthStore } from '../../../store/useAuthStore'
import styles from './SaveCarButton.module.css'

const GUEST_LIMIT_MESSAGE = `Bạn chỉ lưu được tối đa ${MAX_SAVED_CARS} xe.`

export default function SaveCarButton({ car, variant = 'card' }) {
  const id = savedIdOf(car)
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(false)
  const isCustomer = useAuthStore((state) => state.isAuthenticated && state.user?.roleName === 'CUSTOMER')
  const saved = useSavedCarsStore((state) => Boolean(id) && state.items.some((item) => item.id === id))
  const toggle = useSavedCarsStore((state) => state.toggle)

  if (!id) return null

  async function handleClick(event) {
    event.preventDefault()
    event.stopPropagation()

    const result = await toggle(car)

    if (!isCustomer) {
      if (result === 'added') setLoginOpen(true)
      else if (result === 'full') message.warning(GUEST_LIMIT_MESSAGE)
      return
    }
    if (result === 'added') message.success({ content: 'Đã lưu xe vào tài khoản của bạn.', key: 'saved-car' })
    else if (result === 'removed') message.info({ content: 'Đã bỏ xe khỏi danh sách đã lưu.', key: 'saved-car' })
    else if (result === 'full') message.warning(GUEST_LIMIT_MESSAGE)
    else if (result === 'error') message.error('Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.')
  }

  const label = saved ? 'Bỏ lưu xe' : 'Lưu xe'
  const button = variant === 'detail' ? (
    <Button
      size="large"
      block
      icon={saved ? <HeartFilled /> : <HeartOutlined />}
      aria-pressed={saved}
      className={`${styles.detailBtn} ${saved ? styles.detailSaved : ''}`}
      onClick={handleClick}
    >
      {saved ? 'Đã lưu · Theo dõi giá' : 'Lưu xe & theo dõi giá'}
    </Button>
  ) : (
    <button
      type="button"
      className={`${styles.cardBtn} ${saved ? styles.saved : ''}`}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      onClick={handleClick}
    >
      {saved ? <HeartFilled /> : <HeartOutlined />}
    </button>
  )

  return (
    <>
      {button}
      <Modal
        open={loginOpen}
        centered
        title={'Đăng nhập để lưu xe yêu thích'}
        onCancel={() => setLoginOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <div className={styles.loginPrompt}>
          <div className={styles.loginPromptIcon}><HeartFilled /></div>
          <h3>{'Lưu xe để không bỏ lỡ lựa chọn của bạn'}</h3>
          <p>{'Xe đang được lưu tạm trên trình duyệt. Đăng nhập hoặc đăng ký để lưu vào tài khoản, xem lại sau khi tải lại trang và nhận thông báo khi giá giảm.'}</p>
          <div className={styles.loginPromptActions}>
            <Button type="primary" icon={<UserOutlined />} onClick={() => navigate('/dang-nhap', { state: { from: window.location.pathname } })}>
              {'Đăng nhập'}
            </Button>
            <Button onClick={() => navigate('/dang-ky', { state: { from: window.location.pathname } })}>{'Đăng ký tài khoản'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

