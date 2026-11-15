import { describe, expect, it } from 'vitest'
import { mergeIntoUser } from './mergeUser'

const user = () => ({
  id: 'u1', email: 'an@example.com', fullName: 'Tên Cũ', phone: '0901111111',
  roleName: 'CUSTOMER', role: { name: 'CUSTOMER', permissions: ['x'] }, missingFields: [], profileCompleted: true,
})
const dto = { id: 'u1', email: 'an@example.com', role: 'CUSTOMER', fullName: 'Tên Mới', phone: '0902222222', address: { city: 'Huế' }, gender: 'MALE' }

describe('mergeIntoUser (AC-F11)', () => {
  it('chỉ đổi fullName và phone', () => {
    const merged = mergeIntoUser(user(), dto)
    expect(merged.fullName).toBe('Tên Mới')
    expect(merged.phone).toBe('0902222222')
  })

  it('giữ nguyên roleName, role đối tượng và mọi khóa khác của phiên đăng nhập', () => {
    const merged = mergeIntoUser(user(), dto)
    expect(merged.roleName).toBe('CUSTOMER')
    expect(merged.role).toEqual({ name: 'CUSTOMER', permissions: ['x'] }) // không bị DTO.role (chuỗi) đè
    expect(merged.missingFields).toEqual([])
    expect(merged.profileCompleted).toBe(true)
    expect(merged.email).toBe('an@example.com')
  })

  it('không chép trường của DTO vào user (địa chỉ, giới tính…)', () => {
    const merged = mergeIntoUser(user(), dto)
    expect(merged).not.toHaveProperty('address')
    expect(merged).not.toHaveProperty('gender')
  })

  it('không đột biến đối tượng gốc', () => {
    const original = user()
    const merged = mergeIntoUser(original, dto)
    expect(merged).not.toBe(original)
    expect(original.fullName).toBe('Tên Cũ')
    expect(original.phone).toBe('0901111111')
  })

  it('DTO thiếu trường thì giữ giá trị cũ', () => {
    const merged = mergeIntoUser(user(), { fullName: 'Chỉ Tên' })
    expect(merged).toMatchObject({ fullName: 'Chỉ Tên', phone: '0901111111' })
    expect(mergeIntoUser(user(), {})).toEqual(user())
    expect(mergeIntoUser(user(), undefined)).toEqual(user())
  })

  it('user rỗng (đã đăng xuất) → null', () => {
    expect(mergeIntoUser(null, dto)).toBeNull()
    expect(mergeIntoUser(undefined, dto)).toBeNull()
  })
})
