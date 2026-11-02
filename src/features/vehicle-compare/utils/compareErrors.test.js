import { describe, it, expect } from 'vitest'
import { classifyCompareError, COMPARE_ERROR } from './compareErrors'

const httpError = (status, data) => ({ response: { status, data } })

describe('classifyCompareError', () => {
  it('401 → UNAUTHORIZED', () => {
    expect(classifyCompareError(httpError(401, { code: 'TOKEN_EXPIRED' })).kind).toBe(COMPARE_ERROR.UNAUTHORIZED)
  })

  it('403 ROLE_INSUFFICIENT → ROLE', () => {
    expect(classifyCompareError(httpError(403, { code: 'ROLE_INSUFFICIENT' })).kind).toBe(COMPARE_ERROR.ROLE)
  })

  it('403 PROFILE_INCOMPLETE → PROFILE_INCOMPLETE', () => {
    const result = classifyCompareError(httpError(403, { code: 'PROFILE_INCOMPLETE' }))
    expect(result.kind).toBe(COMPARE_ERROR.PROFILE_INCOMPLETE)
    expect(result.message).toMatch(/hồ sơ/)
  })

  it('422 COMPARE_NOT_ENOUGH_CARS → NOT_ENOUGH kèm id không còn bán', () => {
    const result = classifyCompareError(
      httpError(422, { code: 'COMPARE_NOT_ENOUGH_CARS', errors: { unavailableIds: ['a', 'b'] } }),
    )
    expect(result.kind).toBe(COMPARE_ERROR.NOT_ENOUGH)
    expect(result.unavailableIds).toEqual(['a', 'b'])
  })

  it('422 khác → INVALID, không có id', () => {
    const result = classifyCompareError(httpError(422, { code: 'VALIDATION_ERROR', errors: [{ field: 'ids' }] }))
    expect(result.kind).toBe(COMPARE_ERROR.INVALID)
    expect(result.unavailableIds).toEqual([])
  })

  it('lỗi mạng, hết thời gian, 5xx → NETWORK', () => {
    expect(classifyCompareError(new Error('Network Error')).kind).toBe(COMPARE_ERROR.NETWORK)
    expect(classifyCompareError(httpError(500, { code: 'INTERNAL_ERROR' })).kind).toBe(COMPARE_ERROR.NETWORK)
    expect(classifyCompareError(httpError(503, null)).kind).toBe(COMPARE_ERROR.NETWORK)
    expect(classifyCompareError(undefined).kind).toBe(COMPARE_ERROR.NETWORK)
  })

  it('NOT_ENOUGH thiếu danh sách id → mảng rỗng, không ném lỗi', () => {
    const result = classifyCompareError(httpError(422, { code: 'COMPARE_NOT_ENOUGH_CARS' }))
    expect(result.unavailableIds).toEqual([])
  })
})
