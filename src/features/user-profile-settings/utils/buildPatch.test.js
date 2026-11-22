import { describe, expect, it } from 'vitest'
import { buildPatch, normalizePhone, toFormValues } from './buildPatch'

const CUSTOMER = ['fullName', 'phone', 'address', 'dateOfBirth', 'gender']
const STAFF = ['fullName', 'phone']
const original = {
  fullName: 'Nguyễn An', phone: '0901234567',
  address: { street: '1 Lê Lợi', district: null, city: 'Huế', province: null },
  dateOfBirth: '2000-05-20', gender: 'MALE',
}
const formOf = (extra = {}) => ({ ...toFormValues(original), ...extra })
const build = (extra, editable = CUSTOMER) => buildPatch(original, formOf(extra), editable)

describe('buildPatch: không đổi thì không gửi gì (AC-F06)', () => {
  it('form vừa tải cho gói rỗng', () => {
    expect(build({})).toEqual({ patch: {}, hasChanges: false })
  })

  it('sửa rồi sửa lại đúng giá trị cũ → gói rỗng', () => {
    expect(build({ fullName: 'Nguyễn An' }).hasChanges).toBe(false)
    expect(build({ address: { ...formOf().address, city: 'Huế' } }).hasChanges).toBe(false)
  })

  it('khoảng trắng đầu cuối không tính là thay đổi', () => {
    expect(build({ fullName: '  Nguyễn An ', phone: ' 0901234567 ' }).hasChanges).toBe(false)
  })

  it('+84… và 0… của cùng một số không tính là thay đổi', () => {
    expect(build({ phone: '+84901234567' }).hasChanges).toBe(false)
  })
})

describe('buildPatch: chỉ gửi trường đã đổi', () => {
  it('đổi họ tên → chỉ {fullName}, đã cắt khoảng trắng', () => {
    expect(build({ fullName: '  Nguyễn Văn An ' }).patch).toEqual({ fullName: 'Nguyễn Văn An' })
  })

  it('đổi SĐT thật sự → gửi đúng chuỗi người dùng nhập (BE chuẩn hóa)', () => {
    expect(build({ phone: '+84907654321' }).patch).toEqual({ phone: '+84907654321' })
  })

  it('sửa city → chỉ {address:{city}} (AC-F08)', () => {
    const result = build({ address: { ...formOf().address, city: 'Hà Nội' } })
    expect(result.patch).toEqual({ address: { city: 'Hà Nội' } })
    expect(result.hasChanges).toBe(true)
  })

  it('đổi nhiều ô địa chỉ → chỉ các ô đó', () => {
    const result = build({ address: { street: 'Số 9', district: 'Q1', city: 'Huế', province: '' } })
    expect(result.patch).toEqual({ address: { street: 'Số 9', district: 'Q1' } })
  })

  it('đổi ngày sinh và giới tính', () => {
    expect(build({ dateOfBirth: '1999-12-31', gender: 'FEMALE' }).patch).toEqual({ dateOfBirth: '1999-12-31', gender: 'FEMALE' })
  })
})

describe('buildPatch: xóa trống để xóa dữ liệu (AC-F09)', () => {
  it('xóa trống street đã có → address.street rỗng', () => {
    expect(build({ address: { ...formOf().address, street: '' } }).patch).toEqual({ address: { street: '' } })
  })

  it('xóa trống một ô địa chỉ vốn đã trống → không phải thay đổi', () => {
    expect(build({ address: { ...formOf().address, district: '' } }).hasChanges).toBe(false)
  })

  it('xóa ngày sinh và giới tính → null', () => {
    expect(build({ dateOfBirth: '', gender: '' }).patch).toEqual({ dateOfBirth: null, gender: null })
  })

  it('xóa ngày sinh vốn đã trống → không đổi', () => {
    const blank = { ...original, dateOfBirth: null, gender: null }
    expect(buildPatch(blank, { ...toFormValues(blank) }, CUSTOMER).hasChanges).toBe(false)
  })
})

describe('buildPatch: chỉ trường trong editableFields (nhân viên)', () => {
  it('nhân viên không bao giờ gửi address, dateOfBirth, gender dù form có đổi', () => {
    const result = build({ fullName: 'Tên Mới', address: { street: 'x', district: 'y', city: 'z', province: 'w' }, dateOfBirth: '1990-01-01', gender: 'MALE' }, STAFF)
    expect(result.patch).toEqual({ fullName: 'Tên Mới' })
  })

  it('nhân viên đổi cả họ tên và SĐT', () => {
    expect(build({ fullName: 'A B', phone: '0911000222' }, STAFF).patch).toEqual({ fullName: 'A B', phone: '0911000222' })
  })

  it('danh sách rỗng thì không gửi gì', () => {
    expect(build({ fullName: 'Khác' }, []).patch).toEqual({})
  })
})

describe('toFormValues / normalizePhone', () => {
  it('biến null thành chuỗi rỗng và đủ 4 ô địa chỉ', () => {
    expect(toFormValues({ fullName: 'A', phone: '0901234567', address: null, dateOfBirth: null, gender: null })).toEqual({
      fullName: 'A', phone: '0901234567', address: { street: '', district: '', city: '', province: '' }, dateOfBirth: '', gender: '',
    })
  })

  it('normalizePhone đổi +84 thành 0 và giữ nguyên số khác', () => {
    expect(normalizePhone('+84901234567')).toBe('0901234567')
    expect(normalizePhone(' 0901234567 ')).toBe('0901234567')
    expect(normalizePhone(null)).toBe('')
  })
})
