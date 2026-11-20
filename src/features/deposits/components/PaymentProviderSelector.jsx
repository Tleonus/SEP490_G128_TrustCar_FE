import { Radio, Tag, Tooltip } from 'antd'
import { CheckCircleFilled, ThunderboltFilled, WalletOutlined } from '@ant-design/icons'
import { PAYMENT_PROVIDER, PAYMENT_PROVIDER_META } from '../constants/depositConstants'

/**
 * Chọn cổng thanh toán tiền cọc trong `DepositConfirmModal` (KAN-99).
 *
 * `value` là 1 trong {@link PAYMENT_PROVIDER}; mặc định hiển thị VNPay làm option
 * khuyến nghị để hướng khách dùng cổng online. Khi VNPay chưa được bật trên BE
 * (prop `vnpayEnabled=false`) thì chỉ còn option MANUAL.
 */
export default function PaymentProviderSelector({
  value = PAYMENT_PROVIDER.VNPAY,
  onChange,
  vnpayEnabled = true,
  disabled = false,
  timeoutMinutes = 15,
}) {
  const handle = (ev) => {
    const next = ev?.target?.value
    if (next && next !== value) onChange?.(next)
  }

  return (
    <div className="kan99-payment-provider">
      <div style={{ marginBottom: 8, fontWeight: 600 }}>Phương thức thanh toán tiền cọc</div>
      <Radio.Group value={value} onChange={handle} disabled={disabled} style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: 10,
            border: '1px solid #e8e8e8',
            borderRadius: 8,
            background: value === PAYMENT_PROVIDER.VNPAY ? 'rgba(16, 185, 129, 0.05)' : '#fff',
          }}
        >
          <Radio value={PAYMENT_PROVIDER.VNPAY} disabled={disabled || !vnpayEnabled}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ThunderboltFilled style={{ color: '#f59e0b' }} />
              <strong>{PAYMENT_PROVIDER_META.VNPAY.label}</strong>
              {PAYMENT_PROVIDER_META.VNPAY.recommended && (
                <Tag color="green" style={{ marginLeft: 6 }}>Khuyến nghị</Tag>
              )}
            </span>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>
              {PAYMENT_PROVIDER_META.VNPAY.hint}{' '}
              <Tooltip title={`Khách có ${timeoutMinutes} phút ở trang VNPay để hoàn tất thanh toán.`}>
                <span style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'help' }}>
                  thời hạn {timeoutMinutes} phút
                </span>
              </Tooltip>
              .
            </div>
            {!vnpayEnabled && (
              <div style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>
                Cổng VNPay chưa được bật trên hệ thống. Vui lòng chọn phương thức thủ công.
              </div>
            )}
          </Radio>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: 10,
            marginTop: 10,
            border: '1px solid #e8e8e8',
            borderRadius: 8,
            background: value === PAYMENT_PROVIDER.MANUAL ? 'rgba(14, 116, 144, 0.05)' : '#fff',
          }}
        >
          <Radio value={PAYMENT_PROVIDER.MANUAL} disabled={disabled}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <WalletOutlined />
              <strong>{PAYMENT_PROVIDER_META.MANUAL.label}</strong>
            </span>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>
              {PAYMENT_PROVIDER_META.MANUAL.hint}
            </div>
          </Radio>
        </div>
      </Radio.Group>

      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <CheckCircleFilled style={{ color: '#10b981' }} />
        Số tiền cọc tối thiểu được tính theo % giá xe và cấu hình showroom.
      </div>
    </div>
  )
}
