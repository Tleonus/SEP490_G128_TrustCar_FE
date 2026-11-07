import { useMemo, useState } from 'react'
import { Alert, Button, Checkbox, ConfigProvider, Form, Input, InputNumber, Modal, Radio, Select, Tag } from 'antd'
import { CarOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useSalesPipeline } from '../hooks/useSalesPipeline'
import { CheckoutError, submitCheckout } from '../data/salesCrmRepository'
import { findOpenLead, isSellableStatus } from '../data/salesCrmMappers'
import {
  computeCheckoutSummary,
  createEmptyCheckoutValues,
  toLocalISODate,
  validateCheckout,
} from '../utils/checkoutValidation'
import {
  LENDING_BANKS,
  NEW_CUSTOMER_OPTION,
  PAYMENT_METHOD,
  PAYMENT_METHOD_LABEL,
  SALES_THEME,
} from '../constants/salesCrmConstants'
import { CAR_STATUS_COLOR, CAR_STATUS_LABEL, labelOf } from '../../../utils/constants'
import { formatPrice } from '../../../utils/format'
import styles from '../styles/OrderCheckoutModal.module.css'

/**
 * Modal chốt đơn bán xe (KAN-18).
 * context: { lead } | { appointment } | { car } | {} — tự điền khách hàng/xe khi đi từ Lead, Lịch hẹn hoặc Kho xe.
 * onSuccess({ mode, car, vehicleCode, customerName }) được gọi sau khi xe đã chuyển sang SOLD.
 */
export default function OrderCheckoutModal({ open, context, onClose, onSuccess }) {
  const [busy, setBusy] = useState(false)
  return (
    <ConfigProvider theme={SALES_THEME}>
      <Modal
        open={open}
        onCancel={busy ? undefined : onClose}
        footer={null}
        width={1040}
        centered
        destroyOnHidden
        closable={!busy}
        keyboard={!busy}
        mask={{ closable: false }}
        rootClassName={styles.modalRoot}
        title={(
          <div className={styles.modalTitle}>
            <span className={styles.eyebrow}>CHỐT ĐƠN BÁN XE</span>
            <span className={styles.titleText}>Hoàn tất hợp đồng &amp; đánh dấu xe đã bán</span>
          </div>
        )}
      >
        {open && (
          <CheckoutForm context={context ?? {}} onClose={onClose} onSuccess={onSuccess} onBusyChange={setBusy} />
        )}
      </Modal>
    </ConfigProvider>
  )
}

const MONEY_FORMATTER = (value) => (value == null || value === '' ? '' : String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.'))
const MONEY_PARSER = (text) => (text ? text.replace(/\D/g, '') : '')

function MoneyInput({ id, value, onChange, placeholder, disabled }) {
  return (
    <InputNumber
      id={id}
      className={styles.moneyInput}
      value={value}
      min={0}
      step={1000000}
      controls={false}
      formatter={MONEY_FORMATTER}
      parser={MONEY_PARSER}
      onChange={(next) => onChange(typeof next === 'number' ? next : null)}
      placeholder={placeholder}
      suffix="₫"
      disabled={disabled}
    />
  )
}

function Field({ field, label, required, errors, extra, children }) {
  return (
    <Form.Item
      label={label}
      htmlFor={`checkout-${field}`}
      required={required}
      validateStatus={errors[field] ? 'error' : undefined}
      help={errors[field]}
      extra={extra}
      className={styles.field}
    >
      {children}
    </Form.Item>
  )
}

function SectionTitle({ step, title, description }) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.step} aria-hidden="true">{step}</span>
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
    </div>
  )
}

function initialValues(context) {
  const base = createEmptyCheckoutValues()
  const customer = context.lead?.customer ?? context.appointment?.customer ?? null
  const car = context.lead?.car ?? context.appointment?.car ?? context.car ?? null
  return {
    ...base,
    customerId: customer?.id ?? null,
    customerName: customer?.fullName ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    carId: car?.id ?? null,
    finalPrice: car?.price ?? null,
  }
}

function describeSubmitError(error) {
  const status = error?.response?.status
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Tài khoản của bạn không có quyền chốt đơn hoặc đổi trạng thái xe.'
  const serverMessage = error?.response?.data?.message
  if (status && serverMessage) return serverMessage
  if (!error?.response) return 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.'
  return 'Không thể chốt đơn lúc này. Vui lòng thử lại sau.'
}

function formatDifference(difference, listedPrice) {
  if (difference == null || difference === 0 || !listedPrice) return null
  const percent = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format((Math.abs(difference) / listedPrice) * 100)
  return difference < 0
    ? `Thấp hơn giá niêm yết ${formatPrice(-difference)} (${percent}%)`
    : `Cao hơn giá niêm yết ${formatPrice(difference)} (${percent}%)`
}

const FIELD_ORDER = ['customerName', 'phone', 'idNumber', 'email', 'carId', 'depositAmount', 'finalPrice',
  'paymentMethod', 'bankName', 'loanAmount', 'handoverDate', 'contractNumber', 'contractConfirmed']

function CheckoutForm({ context, onClose, onSuccess, onBusyChange }) {
  const options = useSalesPipeline()
  const [values, setValues] = useState(() => initialValues(context))
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [carOverride, setCarOverride] = useState(null)
  const [resumeReserved, setResumeReserved] = useState(false)
  const today = toLocalISODate()

  const contextCar = context.lead?.car ?? context.appointment?.car ?? context.car ?? null
  const customerLocked = Boolean(context.lead || context.appointment)
  const carLocked = Boolean(contextCar)

  const selectedCar = useMemo(() => {
    if (!values.carId) return null
    if (carOverride?.id === values.carId) return carOverride
    return options.cars.find((car) => car.id === values.carId)
      ?? (contextCar?.id === values.carId ? contextCar : null)
  }, [values.carId, carOverride, options.cars, contextCar])

  const carOptions = useMemo(() => {
    const list = [...options.sellableCars]
    if (selectedCar && !list.some((car) => car.id === selectedCar.id)) list.unshift(selectedCar)
    return list.map((car) => ({
      value: car.id,
      label: [car.vehicleCode, car.title, car.licensePlate].filter(Boolean).join(' · '),
    }))
  }, [options.sellableCars, selectedCar])

  const customerOptions = useMemo(() => {
    const list = options.customers.map((customer) => ({
      value: customer.id ?? customer.phone,
      label: `${customer.fullName} · ${customer.phone}`,
    }))
    const current = context.lead?.customer ?? context.appointment?.customer
    if (current?.id && !list.some((item) => item.value === current.id)) {
      list.unshift({ value: current.id, label: `${current.fullName} · ${current.phone}` })
    }
    return [{ value: NEW_CUSTOMER_OPTION, label: '＋ Khách hàng mới' }, ...list]
  }, [options.customers, context])

  const leadId = context.lead?.id
    ?? context.appointment?.leadId
    ?? findOpenLead(options.leads, values.customerId, values.carId)?.id
    ?? null
  const appointmentId = context.appointment?.id ?? null

  const errors = submitted ? validateCheckout(values, selectedCar, { today }) : {}
  const summary = computeCheckoutSummary(values, selectedCar)
  const isReserved = selectedCar?.status === 'RESERVED' && !resumeReserved
  const carBlocked = selectedCar != null && !isSellableStatus(selectedCar.status)
  const isInstallment = values.paymentMethod === PAYMENT_METHOD.INSTALLMENT
  const differenceText = formatDifference(summary.priceDifference, summary.listedPrice)

  function update(changes) {
    setValues((current) => ({ ...current, ...changes }))
    setSubmitError(null)
  }

  function handleCustomerChange(value) {
    if (value === NEW_CUSTOMER_OPTION) {
      update({ customerId: null, customerName: '', phone: '', email: '', idNumber: '' })
      return
    }
    const customer = options.customers.find((item) => (item.id ?? item.phone) === value)
    if (!customer) return
    update({ customerId: customer.id, customerName: customer.fullName, phone: customer.phone, email: customer.email ?? '' })
  }

  function handleCarChange(carId) {
    const car = options.cars.find((item) => item.id === carId)
    setCarOverride(null)
    setResumeReserved(false)
    update({ carId: carId ?? null, finalPrice: car?.price ?? null, depositAmount: null })
  }

  function setBusy(next) {
    setSubmitting(next)
    onBusyChange(next)
  }

  async function handleSubmit() {
    setSubmitted(true)
    const found = validateCheckout(values, selectedCar, { today })
    const firstError = FIELD_ORDER.find((field) => found[field])
    if (firstError) {
      setSubmitError('Vui lòng kiểm tra lại các trường được đánh dấu đỏ.')
      document.getElementById(`checkout-${firstError}`)?.focus()
      return
    }
    setBusy(true)
    setSubmitError(null)
    try {
      const result = await submitCheckout(values, { car: selectedCar, leadId, appointmentId, resumeReserved })
      setBusy(false)
      onSuccess?.({ ...result, vehicleCode: selectedCar.vehicleCode, customerName: values.customerName.trim() })
    } catch (error) {
      setBusy(false)
      if (error instanceof CheckoutError) {
        if (error.code === 'PARTIAL_RESERVED') setResumeReserved(true)
        else if (error.car) setCarOverride(error.car)
        setSubmitError(error.message)
      } else {
        setSubmitError(describeSubmitError(error))
      }
    }
  }

  return (
    <Form layout="vertical" component="div" className={styles.form}>
      {options.error && (
        <Alert
          type="warning"
          showIcon
          className={styles.topAlert}
          title="Không tải được danh sách xe và khách hàng"
          description={`${options.error} Bạn vẫn có thể chốt đơn cho xe đã chọn sẵn.`}
        />
      )}

      <div className={styles.layout}>
        <div className={styles.formColumn}>
          <section className={styles.section}>
            <SectionTitle step={1} title="Khách hàng" description={customerLocked ? 'Tự động điền từ khách hàng tiềm năng / lịch hẹn.' : 'Chọn khách hàng có sẵn hoặc nhập khách hàng mới.'} />
            <Field field="customerId" label="Chọn khách hàng" errors={errors}>
              <Select
                id="checkout-customerId"
                showSearch={{ optionFilterProp: 'label' }}
                value={values.customerId ?? NEW_CUSTOMER_OPTION}
                options={customerOptions}
                onChange={handleCustomerChange}
                loading={options.loading}
                disabled={customerLocked}
              />
            </Field>
            <div className={styles.grid2}>
              <Field field="customerName" label="Họ và tên" required errors={errors}>
                <Input id="checkout-customerName" value={values.customerName} maxLength={150} onChange={(e) => update({ customerName: e.target.value })} placeholder="Nguyễn Văn A" autoComplete="off" />
              </Field>
              <Field field="phone" label="Số điện thoại" required errors={errors}>
                <Input id="checkout-phone" value={values.phone} inputMode="tel" maxLength={15} onChange={(e) => update({ phone: e.target.value })} placeholder="0901234567" autoComplete="off" />
              </Field>
              <Field field="idNumber" label="Số CCCD / CMND" required errors={errors} extra="CCCD 12 số hoặc CMND 9 số, đối chiếu với giấy tờ gốc.">
                <Input id="checkout-idNumber" value={values.idNumber} inputMode="numeric" maxLength={14} onChange={(e) => update({ idNumber: e.target.value })} placeholder="079201001234" autoComplete="off" />
              </Field>
              <Field field="email" label="Email" errors={errors}>
                <Input id="checkout-email" type="email" value={values.email} maxLength={150} onChange={(e) => update({ email: e.target.value })} placeholder="khachhang@email.com" autoComplete="off" />
              </Field>
            </div>
          </section>

          <section className={styles.section}>
            <SectionTitle step={2} title="Xe bán" description="Chỉ chốt đơn được xe Đang bán hoặc Đã đặt cọc." />
            <Field field="carId" label="Xe" required errors={errors}>
              <Select
                id="checkout-carId"
                showSearch={{ optionFilterProp: 'label' }}
                placeholder="Tìm theo mã xe, tên xe, biển số"
                value={values.carId ?? undefined}
                options={carOptions}
                onChange={handleCarChange}
                loading={options.loading}
                disabled={carLocked}
                notFoundContent={options.loading ? 'Đang tải danh sách xe…' : 'Không có xe đang bán hoặc đã đặt cọc.'}
              />
            </Field>
            {selectedCar ? (
              <div className={`${styles.carCard} ${carBlocked ? styles.carCardBlocked : ''}`}>
                {selectedCar.image ? (
                  <img src={selectedCar.image} alt={selectedCar.title} className={styles.carThumb} />
                ) : (
                  <div className={styles.carThumbPlaceholder} aria-hidden="true"><CarOutlined /></div>
                )}
                <div className={styles.carInfo}>
                  <div className={styles.carHeading}>
                    <strong>{selectedCar.title}{selectedCar.year ? ` (${selectedCar.year})` : ''}</strong>
                    <Tag color={CAR_STATUS_COLOR[selectedCar.status]}>{labelOf(CAR_STATUS_LABEL, selectedCar.status)}</Tag>
                  </div>
                  <dl className={styles.carFacts}>
                    <div><dt>Mã xe</dt><dd>{selectedCar.vehicleCode || '—'}</dd></div>
                    <div><dt>Biển số</dt><dd>{selectedCar.licensePlate || '—'}</dd></div>
                    <div><dt>Giá niêm yết</dt><dd className={styles.price}>{formatPrice(selectedCar.price)}</dd></div>
                  </dl>
                </div>
              </div>
            ) : (
              <p className={styles.mutedNote}>Chưa chọn xe.</p>
            )}
            {carBlocked && (
              <Alert
                type="error"
                showIcon
                className={styles.inlineAlert}
                title="Không thể chốt đơn xe này"
                description={`Xe đang ở trạng thái "${labelOf(CAR_STATUS_LABEL, selectedCar.status)}". Chỉ xe Đang bán hoặc Đã đặt cọc mới được chốt đơn.`}
              />
            )}
            {resumeReserved && (
              <Alert
                type="info"
                showIcon
                className={styles.inlineAlert}
                title="Xe đã được giữ chỗ cho đơn này"
                description="Bấm Xác nhận chốt đơn để chuyển xe sang Đã bán."
              />
            )}
          </section>

          <section className={styles.section}>
            <SectionTitle step={3} title="Thanh toán" />
            <Field field="paymentMethod" label="Phương thức thanh toán" required errors={errors}>
              <Radio.Group
                id="checkout-paymentMethod"
                block
                optionType="button"
                buttonStyle="solid"
                value={values.paymentMethod}
                onChange={(e) => update({ paymentMethod: e.target.value })}
                options={Object.values(PAYMENT_METHOD).map((value) => ({ value, label: PAYMENT_METHOD_LABEL[value] }))}
              />
            </Field>
            <div className={styles.grid2}>
              <Field field="finalPrice" label="Giá chốt thực tế" required errors={errors} extra={differenceText}>
                <MoneyInput id="checkout-finalPrice" value={values.finalPrice} onChange={(finalPrice) => update({ finalPrice })} placeholder="Nhập giá chốt" />
              </Field>
              {isReserved && (
                <Field field="depositAmount" label="Tiền cọc đã nhận" required errors={errors} extra="Xe đang ở trạng thái Đã đặt cọc.">
                  <MoneyInput id="checkout-depositAmount" value={values.depositAmount} onChange={(depositAmount) => update({ depositAmount })} placeholder="Số tiền khách đã cọc" />
                </Field>
              )}
              {isInstallment && (
                <>
                  <Field field="bankName" label="Ngân hàng cho vay" required errors={errors}>
                    <Select
                      id="checkout-bankName"
                      showSearch
                      placeholder="Chọn ngân hàng"
                      value={values.bankName ?? undefined}
                      onChange={(bankName) => update({ bankName })}
                      options={LENDING_BANKS.map((bank) => ({ value: bank, label: bank }))}
                    />
                  </Field>
                  <Field field="loanAmount" label="Số tiền vay" required errors={errors}>
                    <MoneyInput id="checkout-loanAmount" value={values.loanAmount} onChange={(loanAmount) => update({ loanAmount })} placeholder="Số tiền ngân hàng giải ngân" />
                  </Field>
                </>
              )}
              <Field field="handoverDate" label="Ngày bàn giao xe" required errors={errors}>
                <Input id="checkout-handoverDate" type="date" min={today} value={values.handoverDate} onChange={(e) => update({ handoverDate: e.target.value })} />
              </Field>
            </div>
          </section>

          <section className={styles.section}>
            <SectionTitle step={4} title="Hợp đồng" />
            <div className={styles.grid2}>
              <Field field="contractNumber" label="Số hợp đồng mua bán" required errors={errors}>
                <Input id="checkout-contractNumber" value={values.contractNumber} maxLength={30} onChange={(e) => update({ contractNumber: e.target.value })} placeholder="HĐMB-2026-0001" autoComplete="off" />
              </Field>
            </div>
            <Field field="note" label="Ghi chú" errors={errors}>
              <Input.TextArea id="checkout-note" value={values.note} maxLength={1000} rows={2} onChange={(e) => update({ note: e.target.value })} placeholder="Phụ kiện tặng kèm, điều kiện bàn giao…" />
            </Field>
            <Form.Item
              validateStatus={errors.contractConfirmed ? 'error' : undefined}
              help={errors.contractConfirmed}
              className={styles.field}
            >
              <Checkbox id="checkout-contractConfirmed" checked={values.contractConfirmed} onChange={(e) => update({ contractConfirmed: e.target.checked })}>
                Khách hàng đã ký hợp đồng mua bán và tôi đã đối chiếu CCCD/CMND bản gốc.
              </Checkbox>
            </Form.Item>
          </section>
        </div>

        <aside className={styles.summaryColumn} aria-label="Tóm tắt đơn hàng">
          <div className={styles.summaryCard}>
            <h3>Tóm tắt đơn hàng</h3>
            <dl className={styles.summaryList}>
              <div><dt>Khách hàng</dt><dd>{values.customerName.trim() || '—'}</dd></div>
              <div><dt>Xe</dt><dd>{selectedCar?.vehicleCode || '—'}</dd></div>
              <div><dt>Giá niêm yết</dt><dd>{summary.listedPrice != null ? formatPrice(summary.listedPrice) : '—'}</dd></div>
              <div className={styles.summaryStrong}><dt>Giá chốt</dt><dd>{summary.finalPrice ? formatPrice(summary.finalPrice) : '—'}</dd></div>
              {summary.deposit > 0 && <div><dt>Đã đặt cọc</dt><dd>− {formatPrice(summary.deposit)}</dd></div>}
              <div><dt>Còn phải thanh toán</dt><dd>{formatPrice(summary.remaining)}</dd></div>
              {isInstallment && <div><dt>Ngân hàng giải ngân</dt><dd>{formatPrice(summary.loan)}</dd></div>}
              <div className={styles.summaryTotal}>
                <dt>Khách thanh toán trực tiếp</dt>
                <dd>{formatPrice(summary.customerPays)}</dd>
              </div>
            </dl>
          </div>
          <div className={styles.effectNote}>
            <InfoCircleOutlined aria-hidden="true" />
            <p>
              Sau khi xác nhận, xe chuyển sang <strong>Đã bán</strong>, được gỡ khỏi danh sách mở bán công khai và
              không thể chỉnh sửa. Thao tác này không thể hoàn tác.
            </p>
          </div>
        </aside>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerMessage} role="alert" aria-live="assertive">
          {submitError && <Alert type="error" showIcon title={submitError} />}
        </div>
        <div className={styles.footerActions}>
          <Button onClick={onClose} disabled={submitting}>Hủy</Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={submitting}
            disabled={carBlocked || (!selectedCar && options.loading)}
            onClick={handleSubmit}
            className={styles.submitButton}
          >
            Xác nhận chốt đơn
          </Button>
        </div>
      </div>
    </Form>
  )
}
