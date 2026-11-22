import { describe, expect, test } from 'vitest'
import { initialVerifyState, verifyReducer, actionForError } from './verifyState.js'

const summary = {
  verified: true,
  status: 'AVAILABLE',
  certificate: { id: 'CPO-20261201-A1B2', issuedAt: '2026-12-01T08:00:00.000Z' },
  score: 5,
}

describe('verifyReducer', () => {
  test('F1 — a valid response lands on verified with the summary', () => {
    const next = verifyReducer(initialVerifyState, { type: 'verified', summary })
    expect(next.status).toBe('verified')
    expect(next.summary.certificate.id).toBe('CPO-20261201-A1B2')
  })

  test('F2 — a 404 becomes the not-found state and drops any previous summary', () => {
    const verified = verifyReducer(initialVerifyState, { type: 'verified', summary })
    const next = verifyReducer(verified, actionForError({ response: { status: 404 } }))
    expect(next.status).toBe('notfound')
    expect(next.summary).toBeNull()
  })

  test('F3 — a sold car stays verified and keeps its status', () => {
    const sold = { ...summary, status: 'SOLD' }
    const next = verifyReducer(initialVerifyState, { type: 'verified', summary: sold })
    expect(next.status).toBe('verified')
    expect(next.summary.status).toBe('SOLD')
  })

  test('a network failure is an error, not a not-found', () => {
    const next = verifyReducer(initialVerifyState, actionForError(new Error('offline')))
    expect(next.status).toBe('error')
  })

  test('reset returns to loading', () => {
    const verified = verifyReducer(initialVerifyState, { type: 'verified', summary })
    expect(verifyReducer(verified, { type: 'reset' }).status).toBe('loading')
  })
})
