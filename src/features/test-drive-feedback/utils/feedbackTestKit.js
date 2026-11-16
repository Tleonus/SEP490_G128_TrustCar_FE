// CHỈ DÙNG TRONG TEST: bộ sinh biểu mẫu ngẫu nhiên có hạt cố định (kết quả lặp lại được).
import { RATINGS, INTERESTS, LIKES, CONCERNS, NEXT_STEPS } from '../constants/feedbackConstants'

/** mulberry32: PRNG nhỏ, xác định theo hạt. */
export function makeRandom(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NOTE_PIECES = ['Khách rất thích', 'xe chạy êm', 'Giá: hơi cao', 'Ghi chú: thử', 'Đánh giá: 9/5', 'Thích: x', 'ế', '😀', 'Việt Nam']

const pick = (rand, list) => list[Math.floor(rand() * list.length)]
const some = (rand, list) => list.filter(() => rand() < 0.5)

function randomNotes(rand) {
  const roll = rand()
  if (roll < 0.25) return ''
  if (roll < 0.3) return 'x'.repeat(Math.floor(rand() * 1500))
  const parts = []
  for (let i = 0, n = 1 + Math.floor(rand() * 12); i < n; i += 1) parts.push(pick(rand, NOTE_PIECES))
  return parts.join(rand() < 0.4 ? '\n' : ' ')
}

/** Biểu mẫu ngẫu nhiên gồm các giá trị hợp lệ (ghi chú có thể dài hơn phần còn lại). */
export function randomFeedback(rand) {
  return {
    rating: rand() < 0.5 ? pick(rand, RATINGS) : null,
    interest: rand() < 0.5 ? pick(rand, INTERESTS) : '',
    likes: some(rand, LIKES),
    concerns: some(rand, CONCERNS),
    next: rand() < 0.5 ? pick(rand, NEXT_STEPS) : '',
    notes: randomNotes(rand),
  }
}
