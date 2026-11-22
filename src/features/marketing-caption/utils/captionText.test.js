import { describe, expect, it } from 'vitest'
import { captionToClipboard, normalizeHashtags, truncateCaption } from './captionText'
import { resolveRequestOptions, TONE_PRESETS, LENGTH_OPTIONS, PLATFORM } from '../constants/captionConstants'
import { captionErrorMessage } from './captionErrors'

describe('normalizeHashtags', () => {
  it('thêm # khi thiếu và bỏ khoảng trắng', () => {
    expect(normalizeHashtags([' xeCu ', '#TrustCar'])).toEqual(['#xeCu', '#TrustCar'])
  })

  it('bỏ trùng không phân biệt hoa thường', () => {
    expect(normalizeHashtags(['#TrustCar', 'trustcar', '#TRUSTCAR'])).toEqual(['#TrustCar'])
  })

  it('bỏ giá trị rỗng và đầu vào không phải mảng', () => {
    expect(normalizeHashtags(['', null, undefined, '#a'])).toEqual(['#a'])
    expect(normalizeHashtags(null)).toEqual([])
  })
})

describe('captionToClipboard', () => {
  it('ghép caption và hashtag, cách một dòng trống', () => {
    expect(captionToClipboard('Xe đẹp, giá tốt.', ['#TrustCar', 'xe cu'])).toBe(
      'Xe đẹp, giá tốt.\n\n#TrustCar #xe cu',
    )
  })

  it('không có hashtag thì chỉ trả caption', () => {
    expect(captionToClipboard('  Nội dung  ', [])).toBe('Nội dung')
  })

  it('caption rỗng thì trả chuỗi rỗng', () => {
    expect(captionToClipboard('   ', ['#a'])).toBe('')
    expect(captionToClipboard(null)).toBe('')
  })
})

describe('truncateCaption', () => {
  it('giữ nguyên khi chưa vượt giới hạn', () => {
    expect(truncateCaption('ngắn', 10)).toBe('ngắn')
  })

  it('cắt và thêm dấu … khi vượt giới hạn', () => {
    expect(truncateCaption('abcdefghij', 4)).toBe('abcd…')
  })
})

describe('resolveRequestOptions', () => {
  it('gửi đúng enum của Backend KAN-68', () => {
    expect(resolveRequestOptions('friendly', 'medium')).toEqual({
      tone: 'friendly',
      platform: PLATFORM,
      length: 'medium',
    })
  })

  it('preset "Ngắn gọn" ép độ dài short', () => {
    expect(resolveRequestOptions('concise', 'medium')).toEqual({
      tone: 'professional',
      platform: 'facebook',
      length: 'short',
    })
  })

  it('preset lạ rơi về mặc định chuyên nghiệp', () => {
    expect(resolveRequestOptions('sarcastic', 'short').tone).toBe('professional')
  })

  it('độ dài lạ rơi về medium', () => {
    expect(resolveRequestOptions('friendly', 'very-long').length).toBe('medium')
  })

  it('mọi preset đều dùng tone có trong enum Backend', () => {
    const allowed = ['professional', 'friendly', 'urgent']
    for (const preset of TONE_PRESETS) expect(allowed).toContain(preset.tone)
    for (const option of LENGTH_OPTIONS) expect(['short', 'medium']).toContain(option.value)
  })
})

describe('captionErrorMessage', () => {
  const withCode = (code, status = 422) => ({ response: { status, data: { code } } })

  it('dịch mã lỗi riêng của KAN-68', () => {
    expect(captionErrorMessage(withCode('CAR_NOT_FOUND', 404))).toContain('Không tìm thấy xe')
    expect(captionErrorMessage(withCode('CAR_NOT_ADVERTISABLE'))).toContain('không thể đăng bán')
    expect(captionErrorMessage(withCode('CAPTION_DAILY_LIMIT', 429))).toContain('hết lượt')
  })

  it('xử lý lỗi quyền và lỗi mạng', () => {
    expect(captionErrorMessage({ response: { status: 403 } })).toContain('không có quyền')
    expect(captionErrorMessage({ code: 'ECONNABORTED' })).toContain('quá lâu')
    expect(captionErrorMessage({ code: 'ERR_NETWORK' })).toContain('Không kết nối được')
  })

  it('ưu tiên thông điệp Backend nếu không khớp mã nào', () => {
    expect(captionErrorMessage({ response: { status: 400, data: { message: 'Lỗi riêng' } } })).toBe('Lỗi riêng')
  })
})
