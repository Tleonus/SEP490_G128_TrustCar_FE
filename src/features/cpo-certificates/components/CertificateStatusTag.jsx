import { Tag } from 'antd'
import { CERT_CAR_STATUS_COLOR, CERT_CAR_STATUS_LABEL } from '../constants/cpoCertificateConstants'

export default function CertificateStatusTag({ status }) {
  return <Tag color={CERT_CAR_STATUS_COLOR[status] || 'default'}>{CERT_CAR_STATUS_LABEL[status] || status || '—'}</Tag>
}
