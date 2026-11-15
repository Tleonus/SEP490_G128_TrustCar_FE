import { describe, it, expect } from 'vitest'
import {
  FEEDBACK_HEADER, KEYS, KEY_ORDER, RATINGS, INTERESTS, LIKES, CONCERNS, NEXT_STEPS, EMPTY_FEEDBACK,
} from './feedbackConstants'

const GROUPS = { INTERESTS, LIKES, CONCERNS, NEXT_STEPS }

describe('feedbackConstants: giá trị đúng Spec mục 5', () => {
  it('dòng đầu và khóa đúng chữ', () => {
    expect(FEEDBACK_HEADER).toBe('Phản hồi lái thử')
    expect(KEYS).toEqual({
      rating: 'Đánh giá', interest: 'Quan tâm', likes: 'Thích', concerns: 'Lo ngại', next: 'Tiếp theo', notes: 'Ghi chú',
    })
  })

  it('thứ tự dòng cố định, ghi chú luôn cuối', () => {
    expect(KEY_ORDER).toEqual(['rating', 'interest', 'likes', 'concerns', 'next', 'notes'])
    expect(Object.keys(KEYS)).toEqual([...KEY_ORDER])
  })

  it('danh sách giá trị đúng nội dung', () => {
    expect(RATINGS).toEqual([1, 2, 3, 4, 5])
    expect(INTERESTS).toEqual(['Nóng', 'Ấm', 'Lạnh'])
    expect(LIKES).toEqual(['Vận hành', 'Nội thất', 'Ngoại thất', 'Tiện nghi', 'An toàn', 'Giá hợp lý'])
    expect(CONCERNS).toEqual(['Giá', 'Số km / đời xe', 'Tình trạng xe', 'Chi phí bảo dưỡng', 'Vay trả góp'])
    expect(NEXT_STEPS).toEqual(['Hẹn xem lại', 'Gửi báo giá', 'Hỗ trợ vay trả góp', 'Cân nhắc thêm', 'Không mua'])
  })

  it.each(Object.entries(GROUPS))('%s: nhãn không rỗng, không trùng, không có dấu phẩy hay xuống dòng', (_name, list) => {
    expect(new Set(list).size).toBe(list.length)
    for (const label of list) {
      expect(label.trim()).toBe(label)
      expect(label.length).toBeGreaterThan(0)
      expect(label).not.toMatch(/[,\n\r]/)
      expect(label).toBe(label.normalize('NFC'))
    }
  })

  it('không nhãn nào trùng giữa các nhóm thẻ chọn nhiều (tránh nhầm khi đọc lại)', () => {
    const all = [...LIKES, ...CONCERNS]
    expect(new Set(all).size).toBe(all.length)
  })

  it('biểu mẫu trống: không giá trị nào, và bị đóng băng', () => {
    expect(EMPTY_FEEDBACK).toEqual({ rating: null, interest: '', likes: [], concerns: [], next: '', notes: '' })
    expect(Object.isFrozen(EMPTY_FEEDBACK)).toBe(true)
    expect(Object.isFrozen(EMPTY_FEEDBACK.likes)).toBe(true)
  })

  it('ngân sách: chọn MỌI thẻ thì phần cố định ≤ 260 ký tự (Spec mục 5)', () => {
    const lines = [
      FEEDBACK_HEADER,
      `${KEYS.rating}: 5/5`,
      `${KEYS.interest}: ${INTERESTS.reduce((a, b) => (b.length > a.length ? b : a))}`,
      `${KEYS.likes}: ${LIKES.join(', ')}`,
      `${KEYS.concerns}: ${CONCERNS.join(', ')}`,
      `${KEYS.next}: ${NEXT_STEPS.reduce((a, b) => (b.length > a.length ? b : a))}`,
    ]
    const fixed = lines.join('\n').length
    expect(fixed).toBeLessThanOrEqual(260)
    expect(1000 - fixed - '\nGhi chú: '.length).toBeGreaterThanOrEqual(700)
  })
})
