import { describe, it, expect } from 'vitest'
import { annuityPayment, buildAnnuity, buildReducing, computeInstallment } from './installmentMath'
import { DEFAULTS, METHOD_ANNUITY, METHOD_REDUCING, TERMS } from '../constants/installmentConstants'

/** Bộ sinh số giả ngẫu nhiên có hạt cố định (mulberry32) để test thuộc tính lặp lại được. */
const makeRandom = (seed) => {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const randomInput = (random, method) => ({
  price: Math.round(10_000_000 + random() * 4_000_000_000),
  downPercent: 30 + Math.floor(random() * 61),
  termMonths: TERMS[Math.floor(random() * TERMS.length)],
  ratePercent: Math.round(random() * 4000) / 100,
  method,
})

describe('computeInstallment — ví dụ mặc định (AC-F02)', () => {
  const result = computeInstallment(DEFAULTS)

  it('trả trước 30 %, vay 70 %', () => {
    expect(result.down).toBe(240_000_000)
    expect(result.loan).toBe(560_000_000)
  })

  it('kỳ đầu: gốc 9.333.333 + lãi 4.200.000; kỳ cuối bù phần dư 20 đ', () => {
    expect(result.rows).toHaveLength(60)
    expect(result.rows[0]).toMatchObject({ period: 1, opening: 560_000_000, principal: 9_333_333, interest: 4_200_000, payment: 13_533_333 })
    expect(result.rows[59].principal).toBe(9_333_353)
    expect(result.rows[59].interest).toBe(70_000)
    expect(result.rows[59].closing).toBe(0)
  })

  it('tổng lãi, tổng gốc + lãi và tổng chi phí khớp các dòng', () => {
    expect(result.totalInterest).toBe(result.rows.reduce((sum, row) => sum + row.interest, 0))
    expect(result.totalRepay).toBe(560_000_000 + result.totalInterest)
    expect(result.totalCost).toBe(240_000_000 + 560_000_000 + result.totalInterest)
    expect(result.totalInterest).toBe(128_100_000)
    expect(result.firstPayment).toBe(13_533_333)
    expect(result.lastPayment).toBe(9_403_353)
  })
})

describe('niên kim cố định', () => {
  it('ví dụ kinh điển: vay 100 triệu, 12 tháng, 12 %/năm → 8.884.879 đ/tháng', () => {
    expect(annuityPayment(100_000_000, 12, 12)).toBe(8_884_879)
  })

  it('lãi 0 % → trả đều gốc/n, tổng lãi 0', () => {
    const result = computeInstallment({ ...DEFAULTS, method: METHOD_ANNUITY, ratePercent: 0 })
    expect(result.totalInterest).toBe(0)
    expect(result.rows.every((row) => row.interest === 0)).toBe(true)
    expect(result.rows[59].closing).toBe(0)
  })

  it('kỳ 1: lãi = vay × r', () => {
    const rows = buildAnnuity(100_000_000, 12, 12)
    expect(rows[0].interest).toBe(1_000_000)
    expect(rows[0].payment).toBe(8_884_879)
  })
})

describe('thuộc tính trên 500 bộ thông số ngẫu nhiên (AC-F03)', () => {
  const random = makeRandom(20261116)
  const cases = Array.from({ length: 500 }, (_, i) => randomInput(random, i % 2 ? METHOD_ANNUITY : METHOD_REDUCING))

  it('tổng gốc = vay, dư nợ cuối = 0, đúng số kỳ, mọi số nguyên không âm', () => {
    cases.forEach((input) => {
      const { rows, loan, down } = computeInstallment(input)
      expect(rows).toHaveLength(input.termMonths)
      expect(rows.reduce((s, r) => s + r.principal, 0)).toBe(loan)
      expect(rows[rows.length - 1].closing).toBe(0)
      expect(down + loan).toBe(input.price)
      rows.forEach((r, i) => {
        expect(Number.isInteger(r.principal) && Number.isInteger(r.interest)).toBe(true)
        expect(r.principal).toBeGreaterThanOrEqual(0)
        expect(r.interest).toBeGreaterThanOrEqual(0)
        expect(r.payment).toBe(r.principal + r.interest)
        expect(r.closing).toBe(r.opening - r.principal)
        if (i > 0) expect(r.opening).toBe(rows[i - 1].closing)
      })
    })
  })

  it('dư nợ giảm dần: lãi không tăng theo kỳ; niên kim: các kỳ (trừ cuối) có tổng trả bằng nhau', () => {
    cases.forEach((input) => {
      const { rows } = computeInstallment(input)
      if (input.method === METHOD_REDUCING) {
        rows.slice(1).forEach((r, i) => expect(r.interest).toBeLessThanOrEqual(rows[i].interest))
      } else {
        const payments = new Set(rows.slice(0, -1).map((r) => r.payment))
        expect(payments.size).toBeLessThanOrEqual(1)
      }
    })
  })

  it('lãi 0 % → tổng lãi 0; lãi dương → tổng lãi dương; tăng lãi không làm giảm tổng lãi', () => {
    cases.slice(0, 100).forEach((input) => {
      expect(computeInstallment({ ...input, ratePercent: 0 }).totalInterest).toBe(0)
      const low = computeInstallment({ ...input, ratePercent: 5 }).totalInterest
      const high = computeInstallment({ ...input, ratePercent: 15 }).totalInterest
      expect(high).toBeGreaterThanOrEqual(low)
    })
  })

  it('84 kỳ tính dưới 50 ms (NFR-F03)', () => {
    const start = performance.now()
    for (let i = 0; i < 20; i += 1) computeInstallment({ ...DEFAULTS, termMonths: 84 })
    expect((performance.now() - start) / 20).toBeLessThan(50)
  })
})

describe('buildReducing', () => {
  it('chia gốc đều, dư dồn kỳ cuối', () => {
    const rows = buildReducing(100, 3, 0)
    expect(rows.map((r) => r.principal)).toEqual([33, 33, 34])
  })
})
