import { Tag, Tooltip } from 'antd'
import { SCORE_BAND_COLOR, SCORE_BAND_LABEL, SCORE_FACTOR_LABEL } from '../constants/salesCrmConstants'

/**
 * KAN-97 — badge điểm ý định của một lead.
 *
 * Hiện band (Nóng/Ấm/Nguội) + số điểm 0-100, tooltip liệt kê các event
 * đã góp vào điểm (lấy từ `lead.scoreFactors`).
 */
export default function ScoreBadge({ lead }) {
  if (!lead) return null
  const band = lead.scoreBand || 'COLD'
  const score = typeof lead.score === 'number' ? lead.score : 0
  const factors = lead.scoreFactors || {}

  const breakdown = Object.entries(factors)
    .filter(([, count]) => Number(count) > 0)
    .map(([key, count]) => `${count} ${SCORE_FACTOR_LABEL[key] || key}`)

  const tooltipContent = breakdown.length
    ? breakdown.join(' · ')
    : 'Chưa có tương tác nào trong 30 ngày gần nhất.'

  return (
    <Tooltip title={tooltipContent}>
      <Tag color={SCORE_BAND_COLOR[band] || 'default'} aria-label={`Mức độ ${SCORE_BAND_LABEL[band]} ${score} điểm`}>
        {SCORE_BAND_LABEL[band] || band} · {score}
      </Tag>
    </Tooltip>
  )
}
