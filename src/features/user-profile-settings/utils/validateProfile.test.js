import { describe, expect, it } from 'vitest'
import { validateProfile } from './validateProfile'

const TODAY = '2026-11-14'
const CUSTOMER = ['fullName', 'phone', 'address', 'dateOfBirth', 'gender']
const STAFF = ['fullName', 'phone']
const good = { fullName: 'Nguyễn An', phone: '0901234567', address: { street: '', district: '', city: '', province: '' }, dateOfBirth: '', gender: '' }
const check = (patch, editable = CUSTOMER) => validateProfile({ ...good, ...patch }, editable, TODAY)

describe('validateProfile: hợp lệ', () => {
  it('giá trị tốt và các ô tùy chọn để trống là hợp lệ (để xóa)', () => {
    expect(check({})).toEqual({ valid: true, errors: {} })
  })

  it('họ tên 2 và 100 ký tự, SĐT 0… và +84…', () => {
    expect(check({ fullName: 'An' }).valid).toBe(true)
    expect(check({ fullName: 'x'.repeat(100) }).valid).toBe(true)
    expect(check({ phone: '+84901234567' }).valid).toBe(true)
  })

  it('địa chỉ đúng giới hạn và ngày sinh hôm nay', () => {
    expect(check({ address: { street: 'a'.repeat(200), district: 'b'.repeat(100), city: '', province: '' } }).valid).toBe(true)
    expect(check({ dateOfBirth: TODAY }).valid).toBe(true)
  })
})

describe('validateProfile: lỗi hiện dưới đúng ô (AC-F07)', () => {
  it.each([[''], ['A'], [' A '], ['x'.repeat(101)]])('họ tên %j', (fullName) => {
    expect(check({ fullName }).errors.fullName).toMatch(/2 đến 100/)
  })

  it.each([[''], ['123'], ['abcdefghij'], ['012345678'], ['+1555123456'], ['090123456789']])('SĐT %j', (phone) => {
    const result = check({ phone })
    expect(result.valid).toBe(false)
    expect(result.errors.phone).toMatch(/không hợp lệ/)
  })

  it('đường quá 200 ký tự, quận/thành phố/tỉnh quá 100 ký tự', () => {
    const result = check({ address: { street: 'a'.repeat(201), district: 'b'.repeat(101), city: 'c'.repeat(101), province: 'd'.repeat(101) } })
    expect(Object.keys(result.errors).sort()).toEqual(['address.city', 'address.district', 'address.province', 'address.street'])
  })

  it.each([['2026-11-15'], ['2999-01-01'], ['1899-12-31'], ['2000-02-31'], ['abc'], ['20000520']])('ngày sinh %j', (dateOfBirth) => {
    expect(check({ dateOfBirth }).errors.dateOfBirth).toMatch(/không hợp lệ/)
  })

  it('báo đồng thời nhiều ô sai', () => {
    expect(Object.keys(check({ fullName: 'A', phone: '1', dateOfBirth: 'x' }).errors).sort()).toEqual(['dateOfBirth', 'fullName', 'phone'])
  })

  it('khoảng trắng đầu cuối không làm sai độ dài', () => {
    expect(check({ fullName: '  An  ', phone: ' 0901234567 ' }).valid).toBe(true)
  })
})

describe('validateProfile: chỉ kiểm ô sửa được (nhân viên)', () => {
  it('không kiểm địa chỉ, ngày sinh hay giới tính của nhân viên', () => {
    const result = check({ address: { street: 'a'.repeat(999) }, dateOfBirth: 'bad', gender: 'x' }, STAFF)
    expect(result).toEqual({ valid: true, errors: {} })
  })

  it('vẫn kiểm họ tên và SĐT của nhân viên', () => {
    expect(Object.keys(check({ fullName: 'A', phone: '1' }, STAFF).errors).sort()).toEqual(['fullName', 'phone'])
  })

  it('giá trị thiếu (undefined) cũng được xử lý không văng lỗi', () => {
    expect(() => validateProfile({}, CUSTOMER, TODAY)).not.toThrow()
    expect(validateProfile({}, CUSTOMER, TODAY).valid).toBe(false)
  })
})

describe('validateProfile: ô không đổi so với bản gốc thì không bị kiểm tra', () => {
  const noPhone = { fullName: 'Quản Trị', phone: '', address: { street: '', district: '', city: '', province: '' }, dateOfBirth: '', gender: '' }
  const check2 = (patch, original, editable = STAFF) => validateProfile({ ...noPhone, ...patch }, editable, TODAY, original)

  it('quản trị viên chưa có SĐT vẫn đổi được họ tên (không bị chặn vì ô SĐT trống)', () => {
    expect(check2({ fullName: 'Tên Mới' }, { fullName: 'Quản Trị', phone: null })).toEqual({ valid: true, errors: {} })
  })

  it('nhưng nếu bắt đầu nhập SĐT thì SĐT đó phải hợp lệ', () => {
    expect(check2({ phone: '123' }, { fullName: 'Quản Trị', phone: null }).errors.phone).toMatch(/không hợp lệ/)
    expect(check2({ phone: '0911000222' }, { fullName: 'Quản Trị', phone: null }).valid).toBe(true)
  })

  it('một SĐT cũ không hợp lệ được giữ nguyên thì không chặn; đổi đi thì bị kiểm tra', () => {
    expect(check2({ phone: '12345' }, { fullName: 'Quản Trị', phone: '12345' }).valid).toBe(true)
    expect(check2({ phone: '123456' }, { fullName: 'Quản Trị', phone: '12345' }).valid).toBe(false)
  })

  it('+84… và 0… của cùng một số coi là không đổi', () => {
    expect(check2({ phone: '+84901234567' }, { fullName: 'Quản Trị', phone: '0901234567' }).valid).toBe(true)
  })

  it('không truyền bản gốc thì kiểm tra mọi ô như cũ', () => {
    expect(check2({}, null).errors.phone).toMatch(/không hợp lệ/)
  })

  it('họ tên và ngày sinh cũ không đổi cũng không bị chặn', () => {
    const original = { fullName: 'A', phone: '0901234567', dateOfBirth: '2999-01-01' }
    const result = validateProfile({ ...good, fullName: 'A', dateOfBirth: '2999-01-01' }, CUSTOMER, TODAY, original)
    expect(result.valid).toBe(true)
  })
})
