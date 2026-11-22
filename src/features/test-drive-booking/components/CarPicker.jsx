import { useEffect, useState } from 'react'
import { Input } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { getCars } from '../../../services/carService'
import {
  MAX_CARS, SEARCH_DEBOUNCE_MS, SEARCH_FETCH_LIMIT, SEARCH_LIMIT, SEARCH_MIN_CHARS,
} from '../constants/testDriveConstants'
import { canAdd, matchesTerms, splitSearch, toCarItem } from '../utils/carSelection'
import styles from '../styles/CarPicker.module.css'

/**
 * Xe đã chọn (xe đang xem cố định) + ô tìm thêm xe đang bán, tối đa 3 xe mỗi lượt.
 * Tìm bằng API công khai sẵn có, đợi 400 ms sau lần gõ cuối và cần ≥ 2 ký tự.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F02
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F04
 * @param {{ id: string, title: string, image: string|null }[]} selected
 * @param {string} lockedId        Xe đang xem, không bỏ được
 * @param {(item: object) => void} onAdd
 * @param {(id: string) => void} onRemove
 * @param {Set<string>} [heldIds]  Xe khách đã có lượt chưa diễn ra: hiện "Đã có lịch" và không thêm được
 * @param {Set<string>} [lockedIds] Thêm các xe cố định khác (ví dụ xe đã có trong lượt khi thêm xe)
 * @param {string} [lockedLabel]    Nhãn của xe cố định
 * @param {boolean} [disabled]
 */
export default function CarPicker({
  selected, lockedId, onAdd, onRemove, heldIds, lockedIds, lockedLabel = 'Xe đang xem', disabled = false,
}) {
  const [query, setQuery] = useState('')
  const [found, setFound] = useState({ query: '', items: [], failed: false })
  const [loading, setLoading] = useState(false)
  const text = query.trim()
  const searching = text.length >= SEARCH_MIN_CHARS
  const full = selected.length >= MAX_CARS

  useEffect(() => {
    if (!searching || full) return undefined
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const { apiTerm, terms } = splitSearch(text)
        const { items } = await getCars({ search: apiTerm, limit: SEARCH_FETCH_LIMIT })
        const matched = items.map(toCarItem).filter((item) => item && matchesTerms(item, terms))
        if (!cancelled) setFound({ query: text, items: matched.slice(0, SEARCH_LIMIT), failed: false })
      } catch {
        if (!cancelled) setFound({ query: text, items: [], failed: true })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [text, searching, full])

  const results = found.query === text ? found.items.filter((item) => canAdd(selected, item.id) === 'ok') : []

  return (
    <section className={styles.wrap} aria-label="Xe muốn lái thử">
      <div className={styles.head}>
        <span>Xe muốn lái thử</span>
        <span className={styles.count}>{selected.length}/{MAX_CARS} xe</span>
      </div>

      <ul className={styles.chips}>
        {selected.map((item) => (
          <li key={item.id} className={styles.chip}>
            {item.image && <img className={styles.thumb} src={item.image} alt="" />}
            <span className={styles.title}>{item.title}</span>
            {item.id === lockedId || lockedIds?.has(item.id) ? (
              <span className={styles.fixed}>{lockedLabel}</span>
            ) : (
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => onRemove(item.id)}
                disabled={disabled}
                aria-label={`Bỏ ${item.title} khỏi lượt lái thử`}
                title="Bỏ xe này"
              >
                <CloseOutlined aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>

      {full ? (
        <p className={styles.hint}>Tối đa {MAX_CARS} xe mỗi lượt.</p>
      ) : (
        <>
          <Input.Search
            placeholder="Tìm thêm xe theo tên hoặc mã xe"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            loading={loading}
            allowClear
            disabled={disabled}
            aria-label="Tìm thêm xe để lái thử cùng lượt"
          />
          {searching && found.failed && found.query === text && <p className={styles.hint}>Không thể tìm xe lúc này.</p>}
          {searching && !loading && !found.failed && found.query === text && results.length === 0 && (
            <p className={styles.hint}>Không có xe phù hợp.</p>
          )}
          {results.length > 0 && (
            <ul className={styles.results}>
              {results.map((item) => {
                const held = Boolean(heldIds?.has(String(item.id)))
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={styles.result}
                      onClick={() => { onAdd(item); setQuery('') }}
                      disabled={disabled || held}
                      aria-label={held ? `${item.title} - bạn đã có lịch cho xe này` : `Thêm ${item.title} vào lượt lái thử`}
                    >
                      {item.image && <img className={styles.thumb} src={item.image} alt="" />}
                      <span className={styles.title}>{item.title}</span>
                      <span className={styles.fixed}>{held ? 'Đã có lịch' : '+ Thêm'}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
