import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ConfigProvider, theme as antdTheme } from 'antd'
import {
  BankOutlined,
  CalendarOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import InstallmentForm from '../components/InstallmentForm'
import InstallmentSummary from '../components/InstallmentSummary'
import ScheduleTable from '../components/ScheduleTable'
import { useInstallment } from '../hooks/useInstallment'
import { initialInput } from '../utils/installmentInput'
import { trackEvent } from '../../../utils/trackEvent'
import styles from '../styles/Installment.module.css'

const BANKING_NOTE_THEME = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: '#8c6527',
    colorInfo: '#8c6527',
    colorSuccess: '#1b5e3c',
    colorWarning: '#b4690e',
    colorError: '#b93829',
    colorBgContainer: '#fffdf8',
    colorBgElevated: '#fffdf8',
    colorBgLayout: '#f5efe3',
    colorText: '#1f1b16',
    colorTextSecondary: '#655b4d',
    colorBorder: '#dccbb4',
    colorBorderSecondary: '#e8decb',
    borderRadius: 14,
    borderRadiusLG: 16,
    fontFamily: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  components: {
    InputNumber: {
      controlHeightLG: 46,
      activeBorderColor: '#8c6527',
      hoverBorderColor: '#a9803b',
      activeShadow: '0 0 0 4px rgba(140, 101, 39, 0.14)',
      addonBg: '#f3ead8',
    },
    Select: {
      controlHeightLG: 46,
      optionSelectedBg: '#f3ead8',
      optionSelectedColor: '#1f1b16',
      optionActiveBg: '#faf5ea',
    },
    Slider: {
      trackBg: '#8c6527',
      trackHoverBg: '#73511c',
      handleColor: '#8c6527',
      handleActiveColor: '#5c4014',
      dotActiveBorderColor: '#8c6527',
      railBg: '#e4d8c3',
      railHoverBg: '#d8c9ae',
    },
    Segmented: {
      trackBg: '#ede3d0',
      itemColor: '#5c5245',
      itemHoverColor: '#1f1b16',
      itemHoverBg: 'rgba(255, 253, 248, 0.55)',
      itemSelectedBg: '#fffdf8',
      itemSelectedColor: '#1f1b16',
    },
    Table: {
      headerBg: '#f2e8d5',
      headerColor: '#3d3428',
      headerSplitColor: '#e2d5be',
      rowHoverBg: '#faf4e8',
      borderColor: '#ebe1cf',
    },
  },
}

/**
 * "Tính trả góp" (/installment, công khai): nhập giá xe, trả trước, thời hạn, lãi suất, cách tính và
 * xem ngay số tiền trả hằng tháng, tổng lãi và lịch trả nợ. Không gọi API.
 * `?price=<đồng>` điền sẵn giá xe.
 *
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F01
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F04
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F09
 */
export default function InstallmentPage() {
  const { search } = useLocation()
  const { values, setField, errors, result, input } = useInstallment(() => initialInput(search))

  // KAN-97: ghi 1 event CALCULATOR_USE khi trang mở.
  useEffect(() => { trackEvent('CALCULATOR_USE') }, [])

  return (
    <ConfigProvider theme={BANKING_NOTE_THEME}>
      <div className={styles.pageShell}>
        <div className={styles.page}>
          <header className={styles.bankHeader}>
            <div className={styles.bankHeaderMain}>
              <div className={styles.eyebrowRow}>
                <span className={styles.bankBadge}>
                  <BankOutlined /> TRUSTCAR PRIVATE BANKING · FINANCIAL NOTE
                </span>
                <span className={styles.docSerial}>FORM TC-CREDIT / 2026</span>
              </div>
              <h1 className={styles.title}>Tính trả góp</h1>
              <p className={styles.desc}>
                Ước tính khoản vay mua xe: số tiền trả mỗi tháng, tổng lãi và lịch trả nợ. Thay đổi bất kỳ thông số nào, kết quả cập nhật ngay.
              </p>
            </div>

            <div className={styles.policyStrip} aria-label="Chính sách tín dụng tiêu chuẩn">
              <div className={styles.policyChip}>
                <span className={styles.policyIcon}><SafetyCertificateOutlined /></span>
                <div>
                  <span className={styles.policyLabel}>Hạn mức tài trợ</span>
                  <strong className={styles.policyValue}>Tối đa 70% giá xe</strong>
                </div>
              </div>
              <div className={styles.policyChip}>
                <span className={styles.policyIcon}><CalendarOutlined /></span>
                <div>
                  <span className={styles.policyLabel}>Kỳ hạn linh hoạt</span>
                  <strong className={styles.policyValue}>12 – 84 tháng</strong>
                </div>
              </div>
              <div className={styles.policyChip}>
                <span className={styles.policyIcon}><FileProtectOutlined /></span>
                <div>
                  <span className={styles.policyLabel}>Biểu tính chuẩn</span>
                  <strong className={styles.policyValue}>Dư nợ / Niên kim</strong>
                </div>
              </div>
            </div>
          </header>

          <div className={styles.grid}>
            <InstallmentForm values={values} errors={errors} result={result} setField={setField} />
            <InstallmentSummary
              result={result}
              method={values.method}
              termMonths={input?.termMonths ?? values.termMonths}
              downPercent={values.downPercent}
              ratePercent={values.ratePercent}
            />
          </div>

          {result && (
            <ScheduleTable
              rows={result.rows}
              termMonths={input?.termMonths ?? values.termMonths}
              method={values.method}
            />
          )}
        </div>
      </div>
    </ConfigProvider>
  )
}
