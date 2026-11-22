import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}))

const { default: api } = await import('../../../services/api')
const { fetchProfile, updateProfile, fetchSettings, updateSettings } = await import('./profileApi')

const ok = (data) => ({ data: { success: true, data } })
const signal = new AbortController().signal

beforeEach(() => vi.resetAllMocks())

describe('profileApi: đúng đường dẫn và thân yêu cầu (hợp đồng BE)', () => {
  it('fetchProfile gọi GET /profile kèm signal và trả data', async () => {
    api.get.mockResolvedValue(ok({ id: 'u1', fullName: 'An' }))
    const data = await fetchProfile(signal)
    expect(api.get).toHaveBeenCalledWith('/profile', { signal })
    expect(data).toEqual({ id: 'u1', fullName: 'An' })
  })

  it('updateProfile gửi đúng gói truyền vào, không thêm trường nào', async () => {
    api.patch.mockResolvedValue(ok({ fullName: 'Mới' }))
    const result = await updateProfile({ fullName: 'Mới', address: { city: 'Huế' } })
    expect(api.patch).toHaveBeenCalledWith('/profile', { fullName: 'Mới', address: { city: 'Huế' } })
    expect(result).toEqual({ fullName: 'Mới' })
  })

  it('updateProfile gửi null để xóa ngày sinh / giới tính', async () => {
    api.patch.mockResolvedValue(ok({}))
    await updateProfile({ dateOfBirth: null, gender: null })
    expect(api.patch).toHaveBeenCalledWith('/profile', { dateOfBirth: null, gender: null })
  })

  it('fetchSettings gọi GET /profile/settings', async () => {
    api.get.mockResolvedValue(ok({ marketingConsent: true }))
    expect(await fetchSettings(signal)).toEqual({ marketingConsent: true })
    expect(api.get).toHaveBeenCalledWith('/profile/settings', { signal })
  })

  it('updateSettings chỉ gửi marketingConsent kiểu boolean', async () => {
    api.patch.mockResolvedValue(ok({ marketingConsent: false }))
    await updateSettings({ marketingConsent: false, thua: 1 })
    expect(api.patch).toHaveBeenCalledWith('/profile/settings', { marketingConsent: false })
  })
})

describe('profileApi: không bắt lỗi, không tự thử lại (NFR-F02)', () => {
  const failure = Object.assign(new Error('boom'), { response: { status: 500 } })

  it('lỗi axios được ném nguyên vẹn để hook phân loại', async () => {
    api.get.mockRejectedValue(failure)
    await expect(fetchProfile(signal)).rejects.toBe(failure)
    api.patch.mockRejectedValue(failure)
    await expect(updateProfile({ fullName: 'x' })).rejects.toBe(failure)
    await expect(updateSettings({ marketingConsent: true })).rejects.toBe(failure)
    api.get.mockRejectedValue(failure)
    await expect(fetchSettings(signal)).rejects.toBe(failure)
  })

  it('lệnh ghi lỗi chỉ được gọi đúng một lần', async () => {
    api.patch.mockRejectedValue(failure)
    await updateProfile({ fullName: 'x' }).catch(() => {})
    await updateSettings({ marketingConsent: true }).catch(() => {})
    expect(api.patch).toHaveBeenCalledTimes(2)
  })
})
