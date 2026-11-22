import { describe, it, expect } from 'vitest'
import { OUTCOME_MAX } from '../../test-drive-booking/constants/testDriveConstants'
import { LIKES, CONCERNS, EMPTY_FEEDBACK } from '../constants/feedbackConstants'
import {
  normalizeFeedback, serializeFeedback, fixedLength, notesCapacity, clampNotes, isEmptyFeedback,
} from './feedbackFormat'
import { makeRandom, randomFeedback } from './feedbackTestKit'

const full = {
  rating: 4, interest: 'Nóng', likes: ['Vận hành', 'Nội thất'], concerns: ['Giá'], next: 'Gửi báo giá',
  notes: 'Khách muốn thêm màu trắng',
}
const allTags = { ...EMPTY_FEEDBACK, rating: 5, interest: 'Lạnh', likes: [...LIKES], concerns: [...CONCERNS], next: 'Hỗ trợ vay trả góp' }

describe('serializeFeedback: chuỗi outcome theo khuôn Spec mục 5', () => {
  it('AC-F03: biểu mẫu trống → không có outcome', () => {
    expect(serializeFeedback(EMPTY_FEEDBACK)).toEqual({ text: '', length: 0, empty: true })
    expect(serializeFeedback(undefined)).toEqual({ text: '', length: 0, empty: true })
    expect(serializeFeedback({ ...EMPTY_FEEDBACK, notes: '   \n  ' }).empty).toBe(true)
  })

  it('AC-F04: đủ mọi ô → đúng chuỗi mẫu', () => {
    expect(serializeFeedback(full).text).toBe(
      'Phản hồi lái thử\nĐánh giá: 4/5\nQuan tâm: Nóng\nThích: Vận hành, Nội thất\nLo ngại: Giá\nTiếp theo: Gửi báo giá\nGhi chú: Khách muốn thêm màu trắng',
    )
    expect(serializeFeedback(full).length).toBe(serializeFeedback(full).text.length)
  })

  it('AC-F05: chỉ chọn "Nóng"', () => {
    expect(serializeFeedback({ ...EMPTY_FEEDBACK, interest: 'Nóng' }).text).toBe('Phản hồi lái thử\nQuan tâm: Nóng')
  })

  it('AC-F06: chỉ gõ ghi chú', () => {
    expect(serializeFeedback({ ...EMPTY_FEEDBACK, notes: 'Khách ổn' }).text).toBe('Phản hồi lái thử\nGhi chú: Khách ổn')
  })

  it('AC-F07: ghi chú nhiều dòng và có dấu hai chấm giữ nguyên, luôn ở cuối', () => {
    const notes = 'Dòng 1: a\nDòng 2\n\nĐánh giá: 1/5'
    expect(serializeFeedback({ ...full, notes }).text.endsWith(`Ghi chú: ${notes}`)).toBe(true)
  })

  it.each([
    ['đánh giá', { rating: 3 }, 'Phản hồi lái thử\nĐánh giá: 3/5'],
    ['thích', { likes: ['An toàn'] }, 'Phản hồi lái thử\nThích: An toàn'],
    ['lo ngại', { concerns: ['Số km / đời xe'] }, 'Phản hồi lái thử\nLo ngại: Số km / đời xe'],
    ['tiếp theo', { next: 'Không mua' }, 'Phản hồi lái thử\nTiếp theo: Không mua'],
  ])('từng ô riêng lẻ: %s', (_name, patch, expected) => {
    expect(serializeFeedback({ ...EMPTY_FEEDBACK, ...patch }).text).toBe(expected)
  })

  it('cắt khoảng trắng hai đầu ghi chú, đổi \\r\\n thành \\n và chuẩn hóa NFC', () => {
    const decomposed = 'Việt' // "Việt" viết rời
    const out = serializeFeedback({ ...EMPTY_FEEDBACK, notes: `  a\r\nb ${decomposed}  ` }).text
    expect(out).toBe(`Phản hồi lái thử\nGhi chú: a\nb ${'Việt'.normalize('NFC')}`)
    expect(out).not.toContain('\r')
  })

  it('thẻ luôn theo thứ tự khai báo, không phụ thuộc thứ tự bấm, và bỏ trùng', () => {
    const out = serializeFeedback({ ...EMPTY_FEEDBACK, likes: ['Nội thất', 'Vận hành', 'Nội thất'] }).text
    expect(out).toBe('Phản hồi lái thử\nThích: Vận hành, Nội thất')
  })
})

describe('normalizeFeedback: giá trị ngoài danh sách bị bỏ', () => {
  it('đánh giá chỉ nhận số nguyên 1–5', () => {
    for (const bad of [0, 6, -1, 2.5, '3', NaN, null, undefined, {}]) {
      expect(normalizeFeedback({ rating: bad }).rating).toBeNull()
    }
    expect(normalizeFeedback({ rating: 1 }).rating).toBe(1)
    expect(normalizeFeedback({ rating: 5 }).rating).toBe(5)
  })

  it('quan tâm, tiếp theo và thẻ lạ bị bỏ', () => {
    const n = normalizeFeedback({
      interest: 'Rất nóng', next: 'Gọi lại', likes: ['Vận hành', 'Lạ'], concerns: 'Giá', notes: 42,
    })
    expect(n).toEqual({ rating: null, interest: '', likes: ['Vận hành'], concerns: [], next: '', notes: '' })
  })

  it('đầu vào không phải object → biểu mẫu trống', () => {
    for (const bad of [null, undefined, 'x', 5, []]) expect(isEmptyFeedback(bad)).toBe(true)
  })
})

describe('ngân sách ký tự', () => {
  it('biểu mẫu trống: phần cố định là dòng đầu', () => {
    expect(fixedLength(EMPTY_FEEDBACK)).toBe('Phản hồi lái thử'.length)
    expect(notesCapacity(EMPTY_FEEDBACK)).toBe(OUTCOME_MAX - 'Phản hồi lái thử'.length - '\nGhi chú: '.length)
  })

  it('đúng số cụ thể khi chọn vài ô', () => {
    const fixed = 'Phản hồi lái thử\nQuan tâm: Nóng'.length
    expect(fixedLength({ ...EMPTY_FEEDBACK, interest: 'Nóng' })).toBe(fixed)
    expect(notesCapacity({ ...EMPTY_FEEDBACK, interest: 'Nóng' })).toBe(1000 - fixed - 10)
  })

  it('AC-F08: chọn mọi thẻ thì ghi chú vẫn còn ≥ 700 ký tự', () => {
    expect(fixedLength(allTags)).toBeLessThanOrEqual(260)
    expect(notesCapacity(allTags)).toBeGreaterThanOrEqual(700)
    const text = serializeFeedback({ ...allTags, notes: 'a'.repeat(notesCapacity(allTags)) }).text
    expect(text.length).toBe(OUTCOME_MAX)
  })

  it('không bao giờ âm', () => {
    expect(notesCapacity({ ...allTags, likes: LIKES, concerns: CONCERNS })).toBeGreaterThan(0)
  })

  it('AC-F09: chọn thêm thẻ làm ghi chú dài bị cắt về phần còn lại, có báo clipped', () => {
    const before = { ...EMPTY_FEEDBACK, notes: 'a'.repeat(notesCapacity(EMPTY_FEEDBACK)) }
    expect(clampNotes(before).clipped).toBe(false)
    const after = { ...before, likes: [...LIKES], concerns: [...CONCERNS] }
    const res = clampNotes(after)
    expect(res.clipped).toBe(true)
    expect(res.feedback.notes.length).toBe(notesCapacity(after))
    expect(serializeFeedback(res.feedback).length).toBeLessThanOrEqual(OUTCOME_MAX)
  })

  it('AC-F10: dán 5000 ký tự → cắt đúng phần còn lại', () => {
    const res = clampNotes({ ...EMPTY_FEEDBACK, notes: 'x'.repeat(5000) })
    expect(res.clipped).toBe(true)
    expect(res.feedback.notes.length).toBe(notesCapacity(EMPTY_FEEDBACK))
  })

  it('clampNotes không đụng khoảng trắng khi đang gõ dở', () => {
    const f = { ...EMPTY_FEEDBACK, notes: 'abc ' }
    expect(clampNotes(f)).toEqual({ feedback: f, clipped: false })
  })

  it('không cắt dở một cặp thay thế (emoji)', () => {
    const cap = notesCapacity(EMPTY_FEEDBACK)
    const notes = `${'a'.repeat(cap - 1)}😀😀`
    const res = clampNotes({ ...EMPTY_FEEDBACK, notes })
    expect(res.feedback.notes).toBe('a'.repeat(cap - 1))
    expect(serializeFeedback({ ...EMPTY_FEEDBACK, notes }).length).toBeLessThanOrEqual(OUTCOME_MAX)
  })

  it('serialize tự cắt nếu ghi chú dài hơn phần còn lại (an toàn cuối)', () => {
    const s = serializeFeedback({ ...allTags, notes: 'y'.repeat(5000) })
    expect(s.length).toBe(OUTCOME_MAX)
    expect(s.text.length).toBe(OUTCOME_MAX)
  })
})

describe('thuộc tính: 500 biểu mẫu ngẫu nhiên', () => {
  it('outcome luôn ≤ 1000 ký tự, length khớp, không lẫn \\r, trống ⇔ text rỗng', () => {
    const rand = makeRandom(20261115)
    for (let i = 0; i < 500; i += 1) {
      const f = randomFeedback(rand)
      const s = serializeFeedback(f)
      expect(s.text.length).toBeLessThanOrEqual(OUTCOME_MAX)
      expect(s.length).toBe(s.text.length)
      expect(s.text).not.toContain('\r')
      expect(s.empty).toBe(s.text === '')
      if (!s.empty) expect(s.text.startsWith('Phản hồi lái thử')).toBe(true)
      expect(clampNotes(f).feedback.notes.length).toBeLessThanOrEqual(notesCapacity(f))
    }
  })

  it('serialize là xác định: cùng đầu vào → cùng chuỗi, và chuẩn hóa xong không đổi nữa', () => {
    const rand = makeRandom(7)
    for (let i = 0; i < 200; i += 1) {
      const f = randomFeedback(rand)
      expect(serializeFeedback(f).text).toBe(serializeFeedback(f).text)
      const n = normalizeFeedback(f)
      expect(normalizeFeedback(n)).toEqual(n)
    }
  })
})
