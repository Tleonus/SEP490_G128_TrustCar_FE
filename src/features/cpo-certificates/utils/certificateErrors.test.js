import { describe, it, expect } from 'vitest'
import { CERT_ERROR, classifyCertificateError } from './certificateErrors'

const httpError = (status) => ({ response: { status } })

describe('classifyCertificateError', () => {
  it.each([
    [401, CERT_ERROR.UNAUTHORIZED],
    [403, CERT_ERROR.FORBIDDEN],
    [404, CERT_ERROR.NOT_FOUND],
    [500, CERT_ERROR.NETWORK],
  ])('HTTP %i → %s', (status, kind) => {
    expect(classifyCertificateError(httpError(status)).kind).toBe(kind)
  })

  it('mất mạng (không có response) → NETWORK, cho phép Thử lại', () => {
    const result = classifyCertificateError(new Error('Network Error'))
    expect(result.kind).toBe(CERT_ERROR.NETWORK)
    expect(result.retryable).toBe(true)
  })

  it('401/403/404 không hiện Thử lại', () => {
    expect([401, 403, 404].map((s) => classifyCertificateError(httpError(s)).retryable)).toEqual([false, false, false])
  })
})
