// Dựng bảng "Trường / Trước / Sau" từ `changes{before, after}` của một sự kiện.
// Ref: .sdd/features/system-audit-logs/SPEC.md#REQ-F07 (CF6; AC-F10, AC-F11)

const VALUE_FIELD = '(giá trị)'
const MAX_DEPTH = 20

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

/** `before`/`after` có thể là đối tượng, giá trị đơn, mảng hoặc rỗng: đưa về đối tượng phẳng theo trường. */
const toRecord = (value) => {
  if (value === null || value === undefined) return {}
  return isRecord(value) ? value : { [VALUE_FIELD]: value }
}

/** So sánh sâu hai giá trị JSON (thứ tự khóa của đối tượng không quan trọng). */
function sameValue(a, b, depth = 0) {
  if (a === b) return true
  if (depth > MAX_DEPTH || typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) return a.length === b.length && a.every((item, i) => sameValue(item, b[i], depth + 1))
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  return keysA.length === keysB.length && keysA.every((key) => Object.hasOwn(b, key) && sameValue(a[key], b[key], depth + 1))
}

/**
 * Mỗi trường xuất hiện ở `before` hoặc `after` là một hàng, sắp theo tên. `changed` = vắng ở một phía hoặc giá trị khác nhau.
 * `hasBefore`/`hasAfter` phân biệt "trường vắng" với "trường có giá trị null".
 * `changes` null hoặc rỗng → `[]` (giao diện chỉ hiện tóm tắt, không bảng trống).
 *
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F07
 * @param {{ before?: *, after?: * }|null|undefined} changes
 * @returns {Array<{ field: string, hasBefore: boolean, hasAfter: boolean, before: *, after: *, changed: boolean }>}
 */
export function diffChanges(changes) {
  if (!isRecord(changes)) return []
  const before = toRecord(changes.before)
  const after = toRecord(changes.after)
  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort((a, b) => a.localeCompare(b))

  return fields.map((field) => {
    const hasBefore = Object.hasOwn(before, field)
    const hasAfter = Object.hasOwn(after, field)
    return {
      field,
      hasBefore,
      hasAfter,
      before: hasBefore ? before[field] : undefined,
      after: hasAfter ? after[field] : undefined,
      changed: hasBefore !== hasAfter || !sameValue(before[field], after[field]),
    }
  })
}
