import { describe, it, expect } from 'vitest'
import { EMPTY_FEEDBACK } from '../constants/feedbackConstants'
import { parseFeedback } from './feedbackParse'
import { serializeFeedback, normalizeFeedback } from './feedbackFormat'
import { makeRandom, randomFeedback } from './feedbackTestKit'

const FULL = [
  'Phản hồi lái thử', 'Đánh giá: 4/5', 'Quan tâm: Nóng', 'Thích: Vận hành, Nội thất',
  'Lo ngại: Giá, Tình trạng xe', 'Tiếp theo: Gửi báo giá', 'Ghi chú: Khách muốn thêm màu trắng',
].join('\n')

describe('parseFeedback: nhận đúng khuôn', () => {
  it('đủ mọi ô', () => {
    const r = parseFeedback(FULL)
    expect(r.structured).toBe(true)
    expect(r.raw).toBe(FULL)
    expect(r.data).toEqual({
      rating: 4, interest: 'Nóng', likes: ['Vận hành', 'Nội thất'], concerns: ['Giá', 'Tình trạng xe'],
      next: 'Gửi báo giá', notes: 'Khách muốn thêm màu trắng',
    })
  })

  it('từng phần: ô vắng mặt nhận giá trị trống', () => {
    expect(parseFeedback('Phản hồi lái thử\nQuan tâm: Ấm').data).toEqual({ ...EMPTY_FEEDBACK, interest: 'Ấm' })
    expect(parseFeedback('Phản hồi lái thử\nGhi chú: Ổn').data.notes).toBe('Ổn')
  })

  it('AC-F07: ghi chú nhiều dòng, có dấu hai chấm và dòng giống khóa vẫn đọc nguyên văn', () => {
    const notes = 'Dòng 1: a\nĐánh giá: 9/5\n\nThích: x'
    const r = parseFeedback(`Phản hồi lái thử\nQuan tâm: Nóng\nGhi chú: ${notes}`)
    expect(r.structured).toBe(true)
    expect(r.data.notes).toBe(notes)
    expect(r.data.interest).toBe('Nóng')
  })

  it('giữ cả thẻ lạ (phiên bản khác), kể cả quan tâm / tiếp theo lạ', () => {
    const r = parseFeedback('Phản hồi lái thử\nQuan tâm: Rất nóng\nThích: Vận hành, Âm thanh\nTiếp theo: Gọi lại')
    expect(r.structured).toBe(true)
    expect(r.data.likes).toEqual(['Vận hành', 'Âm thanh'])
    expect(r.data.interest).toBe('Rất nóng')
    expect(r.data.next).toBe('Gọi lại')
  })
})

describe('parseFeedback: sai khuôn → chữ tự do nguyên văn (AC-F15, AC-F16)', () => {
  const plainCases = {
    'kết quả tự do cũ': 'Khách rất hài lòng, hẹn tuần sau',
    'đánh giá 9/5': 'Phản hồi lái thử\nĐánh giá: 9/5',
    'đánh giá 0/5': 'Phản hồi lái thử\nĐánh giá: 0/5',
    'đánh giá không phải số': 'Phản hồi lái thử\nĐánh giá: abc',
    'đánh giá 4/10': 'Phản hồi lái thử\nĐánh giá: 4/10',
    'đánh giá 44/5': 'Phản hồi lái thử\nĐánh giá: 44/5',
    'khóa lạ': 'Phản hồi lái thử\nMàu: Trắng',
    'khóa lạ sau khóa đúng': 'Phản hồi lái thử\nQuan tâm: Nóng\nMàu: Trắng',
    'thứ tự sai': 'Phản hồi lái thử\nQuan tâm: Nóng\nĐánh giá: 4/5',
    'khóa lặp': 'Phản hồi lái thử\nQuan tâm: Nóng\nQuan tâm: Ấm',
    'dòng đầu gần giống': 'Phản hồi lái thử.\nQuan tâm: Nóng',
    'dòng đầu viết thường': 'phản hồi lái thử\nQuan tâm: Nóng',
    'chỉ có dòng đầu': 'Phản hồi lái thử',
    'dòng trống giữa chừng': 'Phản hồi lái thử\n\nQuan tâm: Nóng',
    'giá trị trống': 'Phản hồi lái thử\nQuan tâm: ',
    'thiếu khoảng trắng sau dấu hai chấm': 'Phản hồi lái thử\nQuan tâm:Nóng',
    'thẻ rỗng': 'Phản hồi lái thử\nThích: Vận hành, ',
    'thẻ thừa khoảng trắng': 'Phản hồi lái thử\nThích: Vận hành,  Nội thất',
    'ghi chú chỉ có khoảng trắng': 'Phản hồi lái thử\nGhi chú:  ',
    'dòng không có khóa': 'Phản hồi lái thử\nchỉ là chữ',
    'có dòng đầu nhưng dòng sau là ghi chú viết sai': 'Phản hồi lái thử\nGhi chú Khách ổn',
  }
  it.each(Object.entries(plainCases))('%s', (_name, text) => {
    expect(parseFeedback(text)).toEqual({ structured: false, data: null, raw: text })
  })

  it('đầu vào không phải chuỗi hoặc rỗng không ném lỗi', () => {
    expect(parseFeedback('')).toEqual({ structured: false, data: null, raw: '' })
    for (const bad of [null, undefined, 42, {}, [], true]) {
      expect(parseFeedback(bad)).toEqual({ structured: false, data: null, raw: '' })
    }
  })

  it('XSS: nội dung giữ nguyên là chữ', () => {
    const evil = 'Phản hồi lái thử\nGhi chú: <img src=x onerror=alert(1)>'
    expect(parseFeedback(evil).data.notes).toBe('<img src=x onerror=alert(1)>')
  })
})

describe('khớp ngược với serializeFeedback (AC-F18)', () => {
  it('parse(serialize(x)) cho lại đúng các ô của x với 500 bộ ngẫu nhiên', () => {
    const rand = makeRandom(44)
    let structured = 0
    for (let i = 0; i < 500; i += 1) {
      const x = randomFeedback(rand)
      const { text, empty } = serializeFeedback(x)
      const parsed = parseFeedback(text)
      if (empty) {
        expect(parsed.structured).toBe(false)
        continue
      }
      // Chuỗi chỉ có dòng đầu không xảy ra: ô nào có giá trị thì có thêm dòng.
      expect(parsed.structured).toBe(true)
      structured += 1
      const expected = normalizeFeedback(x)
      // ghi chú dài hơn phần còn lại bị cắt khi tạo chuỗi; so với bản đã cắt
      const cutNotes = parsed.data.notes
      expect(expected.notes.startsWith(cutNotes.trimEnd())).toBe(true)
      expect({ ...parsed.data, notes: '' }).toEqual({ ...expected, notes: '' })
      expect(serializeFeedback(parsed.data).text).toBe(text)
    }
    expect(structured).toBeGreaterThan(300)
  })

  it('ghi chú không bị cắt thì đọc lại đúng nguyên văn từng ký tự', () => {
    const x = { ...EMPTY_FEEDBACK, rating: 2, notes: 'Tiếng Việt: êm\n  thụt lề giữ nguyên\nDòng 3' }
    expect(parseFeedback(serializeFeedback(x).text).data.notes).toBe(x.notes)
  })
})
