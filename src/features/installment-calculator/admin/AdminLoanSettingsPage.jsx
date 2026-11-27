import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, InputNumber, Skeleton } from 'antd'
import { CheckCircleOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import BankCard from './BankCard'
import BankList from './BankList'
import BankPicker from './BankPicker'
import OptionList from './OptionList'
import {
  DOWN_MIN_RANGE, MAX_BANKS, MAX_DOWN_OPTIONS, MAX_TERM_OPTIONS, TERM_OPTION_RANGE, generalRules, newBankRow, sameForm, toForm,
  toPayload, validateForm,
} from './adminLoanForm'
import { fetchLoanSettingsFresh, saveLoanSettings } from '../api/loanSettingsApi'
import { formatUpdatedAt, termLabel } from '../utils/loanConfig'
import { getSettingsErrorMessage } from '../../test-drive-settings/utils/settingsErrors'
import styles from './AdminLoanSettings.module.css'

function RuleField({ id, label, error, hint, children }) {
  return (
    <div className={styles.cell}>
      <label htmlFor={id} className={styles.cellLabel}>{label}</label>
      {children}
      {error ? <p role="alert" className={styles.cellError}>{error}</p> : <p className={styles.cellHint}>{hint}</p>}
    </div>
  )
}

/** Tải cấu hình hiện tại; `reload()` tải lại (bỏ thay đổi chưa lưu). */
function useLoanForm() {
  const [state, setState] = useState({ loading: true, error: null, saved: null, updatedAt: null })
  const [form, setForm] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    fetchLoanSettingsFresh()
      .then((raw) => {
        if (!active) return
        const next = toForm(raw)
        setForm(next)
        setState({ loading: false, error: null, saved: next, updatedAt: raw?.updatedAt ?? null })
      })
      .catch((error) => { if (active) setState((current) => ({ ...current, loading: false, error })) })
    return () => { active = false }
  }, [reloadKey])

  const reload = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: null }))
    setReloadKey((key) => key + 1)
  }, [])
  const markSaved = useCallback((raw) => {
    const next = toForm(raw)
    setForm(next)
    setState({ loading: false, error: null, saved: next, updatedAt: raw?.updatedAt ?? null })
  }, [])
  return { ...state, form, setForm, reload, markSaved }
}


/**
 * Màn hình admin "Lãi suất trả góp" (/admin/lai-suat-tra-gop, chỉ ADMIN):
 *  - Quy định chung: trả trước tối thiểu, các mức trả trước và các thời hạn vay khách chọn được trên trang tính;
 *  - Ngân hàng: danh sách bên trái, bấm một ngân hàng → sửa bên phải; "Thêm ngân hàng" mở popup chọn trong danh sách
 *    ngân hàng tại Việt Nam.
 * Lưu → PUT /settings/loan; trang /installment và khối ước tính ở trang chi tiết xe dùng ngay số mới.
 */
export default function AdminLoanSettingsPage() {
  const { loading, error, saved, updatedAt, form, setForm, reload, markSaved } = useLoanForm()
  const [save, setSave] = useState({ status: 'idle', message: '' })
  const [showErrors, setShowErrors] = useState(false)
  const [selectedKey, setSelectedKey] = useState(null)
  const [picking, setPicking] = useState(false)

  const edit = (updater) => {
    setForm((current) => updater(current))
    setSave({ status: 'idle', message: '' })
  }
  const setRule = (field) => (value) => edit((current) => ({ ...current, [field]: value }))
  const setBank = (index, field, value) => edit((current) => ({
    ...current, banks: current.banks.map((bank, i) => (i === index ? { ...bank, [field]: value } : bank)),
  }))
  const setPartner = (index) => edit((current) => ({
    ...current, banks: current.banks.map((bank, i) => ({ ...bank, isPartner: i === index, active: i === index ? true : bank.active })),
  }))
  const moveBank = (index, step) => edit((current) => {
    const banks = [...current.banks]
    ;[banks[index], banks[index + step]] = [banks[index + step], banks[index]]
    return { ...current, banks }
  })
  const removeBank = (index) => {
    setSelectedKey(null)
    edit((current) => ({ ...current, banks: current.banks.filter((_, i) => i !== index) }))
  }
  const addBank = (picked) => {
    const row = newBankRow(picked)
    edit((current) => ({ ...current, banks: [...current.banks, row] }))
    setSelectedKey(row.key)
    setPicking(false)
  }

  if (loading && !form) return <div className={styles.page}><Skeleton active paragraph={{ rows: 10 }} /></div>
  if (error && !form) {
    return (
      <div className={styles.page}>
        <Alert type="error" showIcon message={getSettingsErrorMessage(error, 'Không tải được cấu hình trả góp.')} action={<Button onClick={reload}>Thử lại</Button>} />
      </div>
    )
  }

  const check = validateForm(form)
  const dirty = !sameForm(form, saved)
  const errorsShown = showErrors ? check : { general: {}, banks: form.banks.map(() => ({})), list: null }
  const selectedIndex = Math.max(0, form.banks.findIndex((bank) => bank.key === selectedKey))
  const selected = form.banks[selectedIndex]
  const general = generalRules(form)

  async function handleSave() {
    if (!check.ok) {
      setShowErrors(true)
      const firstBad = check.banks.findIndex((item) => Object.keys(item).length > 0)
      if (firstBad >= 0) setSelectedKey(form.banks[firstBad].key)
      setSave({ status: 'error', message: check.list ?? 'Còn ô nhập chưa đúng, xem các ô báo đỏ.' })
      return
    }
    setSave({ status: 'saving', message: '' })
    try {
      markSaved(await saveLoanSettings(toPayload(form)))
      setSelectedKey(`${toPayload(form).banks[selectedIndex].id}-${selectedIndex}`) // khoá dòng sau khi tải lại (toForm)
      setShowErrors(false)
      setSave({ status: 'success', message: 'Đã lưu. Trang tính trả góp dùng số mới cho khách mở trang từ bây giờ.' })
    } catch (err) {
      setSave({ status: 'error', message: getSettingsErrorMessage(err, 'Không lưu được cấu hình. Hãy thử lại.') })
    }
  }

  const updated = formatUpdatedAt(updatedAt)
  const downTooLow = (pct) => typeof form.minDownPaymentPct === 'number' && pct < form.minDownPaymentPct

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Quản trị · Tài chính</p>
          <h1 className={styles.title}>Lãi suất trả góp</h1>
          <p className={styles.desc}>
            Những gì khách thấy trên trang “Tính trả góp” và khối ước tính ở trang chi tiết xe: các mức trả trước, các
            thời hạn vay và lãi từng ngân hàng. Khi ngân hàng đổi lãi, sửa ở đây rồi bấm Lưu.
          </p>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Cập nhật lần cuối</span>
          <span className={styles.statValue}>{updated ?? 'Chưa lưu lần nào'}</span>
        </div>
      </header>

      <section className={styles.card} aria-labelledby="loan-rules-title">
        <h2 id="loan-rules-title" className={styles.cardTitle}>Quy định chung</h2>
        <div className={styles.rulesGrid}>
          <RuleField id="loan-down" label="Trả trước tối thiểu" error={errorsShown.general.minDownPaymentPct} hint={`Khách vay tối đa ${100 - (form.minDownPaymentPct ?? 0)}% giá xe`}>
            <InputNumber id="loan-down" className={styles.full} value={form.minDownPaymentPct} onChange={setRule('minDownPaymentPct')} min={DOWN_MIN_RANGE[0]} max={DOWN_MIN_RANGE[1]} precision={0} suffix="% giá xe" controls={false} />
          </RuleField>
          <RuleField id="loan-down-options" label="Các mức trả trước khách chọn (ô 03)" error={check.general.downPaymentOptions} hint={`Nút bấm nhanh dưới thanh trượt, tối đa ${MAX_DOWN_OPTIONS} mức`}>
            <OptionList
              id="loan-down-options"
              values={form.downPaymentOptions}
              onChange={setRule('downPaymentOptions')}
              min={Math.max(form.minDownPaymentPct ?? 0, DOWN_MIN_RANGE[0])}
              max={DOWN_MIN_RANGE[1]}
              unit="%"
              format={(pct) => `${pct}%`}
              maxCount={MAX_DOWN_OPTIONS}
              invalid={downTooLow}
            />
          </RuleField>
          <RuleField id="loan-term-options" label="Các thời hạn vay khách chọn (ô 04)" error={check.general.termOptions} hint={`Danh sách chọn thời hạn, ${TERM_OPTION_RANGE[0]}–${TERM_OPTION_RANGE[1]} tháng, tối đa ${MAX_TERM_OPTIONS} mục`}>
            <OptionList
              id="loan-term-options"
              values={form.termOptions}
              onChange={setRule('termOptions')}
              min={TERM_OPTION_RANGE[0]}
              max={TERM_OPTION_RANGE[1]}
              unit="tháng"
              format={termLabel}
              maxCount={MAX_TERM_OPTIONS}
            />
          </RuleField>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="loan-banks-title">
        <div className={styles.cardHead}>
          <h2 id="loan-banks-title" className={styles.cardTitle}>Ngân hàng ({form.banks.length}/{MAX_BANKS})</h2>
          <Button icon={<PlusOutlined />} onClick={() => setPicking(true)} disabled={form.banks.length >= MAX_BANKS}>Thêm ngân hàng</Button>
        </div>
        {errorsShown.list && <Alert type="error" showIcon message={errorsShown.list} className={styles.listAlert} />}
        {selected ? (
          <div className={styles.bankLayout}>
            <BankList banks={form.banks} errors={errorsShown.banks} selectedKey={selected.key} onSelect={setSelectedKey} />
            <BankCard
              key={selected.key}
              bank={selected}
              index={selectedIndex}
              total={form.banks.length}
              errors={errorsShown.banks[selectedIndex] ?? {}}
              general={general}
              onChange={setBank}
              onPartner={setPartner}
              onMove={moveBank}
              onRemove={removeBank}
            />
          </div>
        ) : (
          <p className={styles.cellHint}>Chưa có ngân hàng nào. Bấm “Thêm ngân hàng”.</p>
        )}
      </section>

      <BankPicker open={picking} takenIds={form.banks.map((bank) => bank.id)} onPick={addBank} onClose={() => setPicking(false)} />

      <div className={styles.saveBar}>
        <div className={styles.saveMessage} aria-live="polite">
          {save.status === 'error' && <Alert type="error" showIcon message={save.message} />}
          {save.status === 'success' && <Alert type="success" showIcon icon={<CheckCircleOutlined />} message={save.message} />}
        </div>
        <Button icon={<ReloadOutlined />} onClick={reload} disabled={!dirty || save.status === 'saving'}>Hủy thay đổi</Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={save.status === 'saving'} disabled={!dirty}>Lưu</Button>
      </div>
    </div>
  )
}
