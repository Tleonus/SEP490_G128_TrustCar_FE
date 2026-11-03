import { describe, it, expect } from 'vitest'
import { applyCertificateListChanges, parseCertificateListParams } from './certificateListParams'

const parse = (qs) => parseCertificateListParams(new URLSearchParams(qs))

describe('parseCertificateListParams', () => {
  it('mặc định: ngày cấp mới nhất, trang 1', () => {
    expect(parse('')).toMatchObject({ search: '', status: '', issuedFrom: '', issuedTo: '', sort: 'issuedAt:desc', page: 1 })
  })

  it('đọc đủ bộ lọc từ URL', () => {
    expect(parse('q=CPO-2026&status=AVAILABLE&from=2026-10-01&to=2026-10-31&sort=certificateId:asc&page=3')).toMatchObject({
      search: 'CPO-2026',
      status: 'AVAILABLE',
      issuedFrom: '2026-10-01',
      issuedTo: '2026-10-31',
      sort: 'certificateId:asc',
      page: 3,
    })
  })

  it('bỏ qua giá trị lạ trên URL', () => {
    expect(parse('status=HACKED&sort=password:asc&page=-2&from=01/10/2026')).toMatchObject({
      status: '',
      sort: 'issuedAt:desc',
      page: 1,
      issuedFrom: '',
    })
  })
})

describe('applyCertificateListChanges', () => {
  it('đổi bộ lọc thì về trang 1', () => {
    const next = applyCertificateListChanges(new URLSearchParams('status=SOLD&page=4'), { status: 'AVAILABLE' })
    expect(next.toString()).toBe('status=AVAILABLE')
  })

  it('giữ bộ lọc khi chỉ đổi trang', () => {
    const next = applyCertificateListChanges(new URLSearchParams('q=camry'), { page: 2 })
    expect(next.toString()).toBe('q=camry&page=2')
  })

  it('xoá khoá rỗng và giá trị mặc định cho URL gọn', () => {
    const next = applyCertificateListChanges(new URLSearchParams('q=camry&sort=certificateId:asc&page=2'), {
      q: '',
      sort: 'issuedAt:desc',
      page: 1,
    })
    expect(next.toString()).toBe('')
  })
})
