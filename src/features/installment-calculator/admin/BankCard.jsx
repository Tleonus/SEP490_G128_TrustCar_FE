import { Button, Input, InputNumber, Popconfirm, Switch, Tooltip } from 'antd'
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, StarFilled, StarOutlined } from '@ant-design/icons'
import { RATE_MAX } from './adminLoanForm'
import { VN_BANKS } from './vnBanks'
import { digitsOnly, groupDigits } from '../utils/installmentInput'
import styles from './AdminLoanSettings.module.css'

function Cell({ id, label, error, hint, wide, children }) {
  return (
    <div className={wide ? `${styles.cell} ${styles.cellWide}` : styles.cell}>
      <label htmlFor={id} className={styles.cellLabel}>{label}</label>
      {children}
      {error ? <p id={`${id}-error`} role="alert" className={styles.cellError}>{error}</p> : hint && <p className={styles.cellHint}>{hint}</p>}
    </div>
  )
}

const status = (error) => (error ? 'error' : undefined)

/** Ô số dùng chung: không có nút tăng/giảm, rộng hết ô. */
function NumberInput({ id, value, onChange, error, ...rest }) {
  return <InputNumber id={id} className={styles.full} value={value} onChange={(next) => onChange(next ?? null)} controls={false} status={status(error)} {...rest} />
}

/** Dòng dưới ô điều kiện: trống → số khách đang thấy theo quy định chung; có số → áp riêng cho ngân hàng này. */
const ruleHint = (value, general) => (value === null || value === undefined ? `Đang trống → khách thấy: ${general}` : 'Riêng ngân hàng này')

function CardHead({ bank, index, total, onChange, onPartner, onMove, onRemove }) {
  const fullName = VN_BANKS.find((item) => item.id === bank.id)?.fullName
  return (
    <header className={styles.bankHead}>
      <div className={styles.bankTitle}>
        <strong className={styles.bankName}>{bank.name || 'Ngân hàng'}</strong>
        {fullName && <span className={styles.bankFullName}>{fullName}</span>}
      </div>
      {bank.isPartner
        ? <span className={styles.partnerBadge}><StarFilled /> Liên kết showroom</span>
        : <Button size="small" icon={<StarOutlined />} onClick={() => onPartner(index)}>Đặt làm liên kết</Button>}
      <label className={styles.switchLabel}>
        <Switch size="small" checked={bank.active} onChange={(value) => onChange(index, 'active', value)} aria-label="Hiện trên trang tính" />
        <span>{bank.active ? 'Đang hiện cho khách' : 'Đang ẩn'}</span>
      </label>
      <span className={styles.bankTools}>
        <Tooltip title="Lên trên"><Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => onMove(index, -1)} aria-label="Đưa lên" /></Tooltip>
        <Tooltip title="Xuống dưới"><Button size="small" type="text" icon={<ArrowDownOutlined />} disabled={index === total - 1} onClick={() => onMove(index, 1)} aria-label="Đưa xuống" /></Tooltip>
        <Popconfirm title="Xoá ngân hàng này?" description="Chỉ mất khi bấm Lưu." okText="Xoá" cancelText="Không" onConfirm={() => onRemove(index)} disabled={bank.isPartner}>
          <Tooltip title={bank.isPartner ? 'Chọn ngân hàng liên kết khác trước khi xoá' : 'Xoá'}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} disabled={bank.isPartner} aria-label="Xoá ngân hàng" />
          </Tooltip>
        </Popconfirm>
      </span>
    </header>
  )
}

/**
 * Khung sửa một ngân hàng (bên phải danh sách): lãi suất, điều kiện vay (tỷ lệ, số tiền tối thiểu, thời hạn), loại
 * xe, ghi chú, nguồn; nút liên kết showroom, hiện/ẩn, đổi thứ tự, xoá. Tên lấy từ danh sách ngân hàng (không gõ tay).
 * Ô điều kiện để trống = theo quy định chung; ô hiện mờ đúng số khách đang thấy (`general`).
 * @param {{ bank: object, index: number, total: number, errors: object,
 *   general: { maxLoanPct: number|null, minTermMonths: number|null, maxTermMonths: number|null },
 *   onChange: Function, onPartner: Function, onMove: Function, onRemove: Function }} props
 */
export default function BankCard({ bank, index, total, errors, general, onChange, onPartner, onMove, onRemove }) {
  const p = `bank-${bank.key}`
  const set = (field) => (value) => onChange(index, field, value)
  const setText = (field) => (event) => onChange(index, field, event.target.value)
  const generalText = (value, unit) => (value === null ? '—' : `${value}${unit}`)

  return (
    <article className={bank.isPartner ? `${styles.bankCard} ${styles.bankCardPartner}` : styles.bankCard} aria-label={bank.name || `Ngân hàng ${index + 1}`}>
      <CardHead bank={bank} index={index} total={total} onChange={onChange} onPartner={onPartner} onMove={onMove} onRemove={onRemove} />
      {errors.name && <p role="alert" className={styles.cellError}>{errors.name}</p>}

      <div className={styles.bankGrid}>
        <Cell id={`${p}-rate`} label="Lãi suất" error={errors.promoRate} hint="Mức ngân hàng công bố, tính cho cả kỳ vay">
          <NumberInput id={`${p}-rate`} value={bank.promoRate} onChange={set('promoRate')} error={errors.promoRate} min={0} max={RATE_MAX} step={0.01} suffix="%/năm" placeholder="VD: 8,2" />
        </Cell>
        <Cell id={`${p}-ltv`} label="Cho vay tối đa" error={errors.maxLoanPct} hint={ruleHint(bank.maxLoanPct, `${generalText(general.maxLoanPct, '%')} giá xe (quy định chung)`)}>
          <NumberInput id={`${p}-ltv`} value={bank.maxLoanPct} onChange={set('maxLoanPct')} error={errors.maxLoanPct} min={1} max={100} precision={0} suffix="% giá xe" placeholder={generalText(general.maxLoanPct, '')} />
        </Cell>
        <Cell id={`${p}-min-loan`} label="Vay tối thiểu" error={errors.minLoanAmount} hint={ruleHint(bank.minLoanAmount, 'không giới hạn')}>
          <NumberInput id={`${p}-min-loan`} value={bank.minLoanAmount} onChange={set('minLoanAmount')} error={errors.minLoanAmount} min={0} precision={0} formatter={groupDigits} parser={digitsOnly} suffix="đ" placeholder="Không giới hạn" />
        </Cell>

        <Cell id={`${p}-min-term`} label="Thời hạn tối thiểu" error={errors.minTermMonths} hint={ruleHint(bank.minTermMonths, `${generalText(general.minTermMonths, ' tháng')} (quy định chung)`)}>
          <NumberInput id={`${p}-min-term`} value={bank.minTermMonths} onChange={set('minTermMonths')} error={errors.minTermMonths} min={1} max={360} precision={0} suffix="tháng" placeholder={generalText(general.minTermMonths, '')} />
        </Cell>
        <Cell id={`${p}-max-term`} label="Thời hạn tối đa" error={errors.maxTermMonths} hint={ruleHint(bank.maxTermMonths, `${generalText(general.maxTermMonths, ' tháng')} (quy định chung)`)}>
          <NumberInput id={`${p}-max-term`} value={bank.maxTermMonths} onChange={set('maxTermMonths')} error={errors.maxTermMonths} min={1} max={360} precision={0} suffix="tháng" placeholder={generalText(general.maxTermMonths, '')} />
        </Cell>
        <Cell id={`${p}-cars`} label="Loại xe áp dụng" error={errors.cars} hint="Hiện cạnh tên ngân hàng">
          <Input id={`${p}-cars`} value={bank.cars} onChange={setText('cars')} maxLength={60} placeholder="Xe mới và xe cũ" />
        </Cell>

        <Cell id={`${p}-note`} label="Ghi chú hiển thị" error={errors.note} hint="Hiện dưới lãi suất trong bảng so sánh" wide>
          <Input id={`${p}-note`} value={bank.note} onChange={setText('note')} maxLength={160} placeholder="Ví dụ: Có gói cố định 1–2 năm" />
        </Cell>
        <Cell id={`${p}-date`} label="Ngày trên nguồn" error={errors.sourceDate}>
          <Input id={`${p}-date`} value={bank.sourceDate} onChange={setText('sourceDate')} maxLength={30} placeholder="27/11/2026" />
        </Cell>
        <Cell id={`${p}-url`} label="Link nguồn (web ngân hàng)" error={errors.sourceUrl} wide>
          <Input id={`${p}-url`} value={bank.sourceUrl} onChange={setText('sourceUrl')} maxLength={500} placeholder="https://…" status={status(errors.sourceUrl)} />
        </Cell>
      </div>
      {errors.id && <p role="alert" className={styles.cellError}>{errors.id}</p>}
    </article>
  )
}
