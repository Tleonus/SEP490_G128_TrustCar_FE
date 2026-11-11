import { describe, expect, it } from 'vitest'
import { DASHBOARD_STAGES, getInspectionDetailLink, getStageLink } from '../constants/inspectionDashboardConstants'
import { getWaitingDays } from './inspectionDashboardUtils'

describe('getWaitingDays', () => {
  const now = new Date('2026-11-11T10:00:00Z').getTime()

  it('counts whole days since intake', () => {
    expect(getWaitingDays('2026-11-08T11:00:00Z', now)).toBe(2)
    expect(getWaitingDays('2026-11-11T09:00:00Z', now)).toBe(0)
  })

  it('never goes negative when the client clock is behind', () => {
    expect(getWaitingDays('2026-11-12T00:00:00Z', now)).toBe(0)
  })

  it('returns null without a valid date', () => {
    expect(getWaitingDays(null, now)).toBeNull()
    expect(getWaitingDays('not-a-date', now)).toBeNull()
  })
})

describe('stage links', () => {
  it('sends new intakes to the inventory filtered by status', () => {
    expect(getStageLink('INCOMING', 'SALES_STAFF')).toBe('/admin/inventory?status=INCOMING')
  })

  it('sends inspection stages to the inspection queue filtered by status', () => {
    ['DRAFT', 'UNDER_INSPECTION', 'REJECTED'].forEach((status) => {
      expect(getStageLink(status, 'SALES_STAFF')).toBe(`/admin/inspection?status=${status}`)
    })
  })

  it('links the sale approval stage only for ADMIN', () => {
    expect(getStageLink('APPROVED_CPO', 'ADMIN')).toBe('/admin/approval')
    expect(getStageLink('APPROVED_CPO', 'SALES_STAFF')).toBeNull()
  })

  it('covers every stage shown on the dashboard', () => {
    DASHBOARD_STAGES.forEach(({ status }) => expect(getStageLink(status, 'ADMIN')).toBeTruthy())
  })

  it('opens the inspection screen of one car', () => {
    expect(getInspectionDetailLink('abc123')).toBe('/admin/inspection/abc123')
  })
})
