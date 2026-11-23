import { describe, expect, it } from 'vitest'
import {
  addedRoles,
  buildRoleIdsPayload,
  removedRoles,
  validateRoleSelection,
} from './roleSelection'

const ROLES = [
  { _id: 'id-admin', name: 'ADMIN' },
  { _id: 'id-sales', name: 'SALES_STAFF' },
  { _id: 'id-insp', name: 'INSPECTOR' },
]

describe('buildRoleIdsPayload', () => {
  it('giữ role chính ở đầu khi vẫn được chọn', () => {
    expect(buildRoleIdsPayload(['INSPECTOR', 'SALES_STAFF'], 'SALES_STAFF', ROLES))
      .toEqual(['id-sales', 'id-insp'])
  })

  it('đưa role được chọn đầu tiên lên đầu khi role chính bị bỏ', () => {
    expect(buildRoleIdsPayload(['INSPECTOR', 'ADMIN'], 'SALES_STAFF', ROLES))
      .toEqual(['id-insp', 'id-admin'])
  })

  it('bỏ qua tên role không tồn tại trong danh sách gán được', () => {
    expect(buildRoleIdsPayload(['SALES_STAFF', 'CUSTOMER'], null, ROLES))
      .toEqual(['id-sales'])
  })

  it('trả mảng rỗng khi không chọn gì', () => {
    expect(buildRoleIdsPayload([], 'ADMIN', ROLES)).toEqual([])
  })

  it('một role duy nhất vẫn giữ đúng id', () => {
    expect(buildRoleIdsPayload(['INSPECTOR'], null, ROLES)).toEqual(['id-insp'])
  })
})

describe('removedRoles / addedRoles', () => {
  it('tính đúng phần bị bỏ và phần được thêm', () => {
    expect(removedRoles(['SALES_STAFF'], ['SALES_STAFF', 'INSPECTOR'])).toEqual([])
    expect(addedRoles(['SALES_STAFF'], ['SALES_STAFF', 'INSPECTOR'])).toEqual(['INSPECTOR'])
    expect(removedRoles(['SALES_STAFF', 'INSPECTOR'], ['INSPECTOR'])).toEqual(['SALES_STAFF'])
  })

  it('an toàn với mảng undefined', () => {
    expect(removedRoles(undefined, ['INSPECTOR'])).toEqual([])
    expect(addedRoles(undefined, ['INSPECTOR'])).toEqual(['INSPECTOR'])
  })
})

describe('validateRoleSelection', () => {
  it('báo lỗi khi không chọn role nào', () => {
    expect(validateRoleSelection([])).toMatch(/ít nhất một vai trò/)
    expect(validateRoleSelection(null)).toMatch(/ít nhất một vai trò/)
  })

  it('hợp lệ khi có ít nhất một role', () => {
    expect(validateRoleSelection(['INSPECTOR'])).toBeNull()
  })
})
