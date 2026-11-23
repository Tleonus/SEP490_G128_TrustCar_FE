import { useEffect, useMemo, useState } from 'react'
import { CarOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons'
import { formatPrice } from '../../../utils/format'
import { carCoverUrl, carTitle } from '../utils/carSpecs'
import { SHELVES, pickerList } from '../utils/shelves'
import styles from '../panels.module.css'

function Row({ item, current, onPlace, onInfo }) {
  const { car, has3d } = item
  const cover = carCoverUrl(car)
  const onShelf = current?.vehicleCode === car.vehicleCode
  return (
    <li>
      <button type="button" className={has3d ? styles.pickRow : styles.pickRowOff} aria-current={onShelf || undefined}
        onClick={() => (has3d ? onPlace(car) : onInfo(car))}>
        <span className={styles.pickThumb}>{cover ? <img src={cover} alt="" loading="lazy" /> : <CarOutlined />}</span>
        <span className={styles.pickText}>
          <b>{carTitle(car)}</b>
          <small>{[car.vehicleCode, car.year].filter(Boolean).join(' · ')} · {formatPrice(car.price)}</small>
        </span>
        <span className={has3d ? styles.badge3d : styles.badgeNo}>{onShelf ? 'Đang trưng bày' : has3d ? '3D' : 'Chưa có 3D'}</span>
      </button>
    </li>
  )
}

/**
 * Bảng chọn xe cho một kệ: toàn bộ xe đang bán, tìm theo tên / mã. Xe có mô hình 3D thì đặt lên kệ;
 * xe chưa có mô hình thì chỉ mở thông tin (ảnh + thông số).
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F05
 */
export default function CarPicker({ shelf, cars, modelCodes, current, onPlace, onInfo, onClose }) {
  const [query, setQuery] = useState('')
  const [only3d, setOnly3d] = useState(false)
  const list = useMemo(() => pickerList(cars, modelCodes, query, only3d), [cars, modelCodes, query, only3d])
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const label = shelf === 'studio' ? 'Studio màu sơn' : SHELVES.find((s) => s.key === shelf)?.label ?? ''
  return (
    <aside className={styles.panel} aria-label={`Chọn xe cho ${label}`}>
      <button type="button" className={styles.panelClose} onClick={onClose}>
        <CloseOutlined /> Đóng
      </button>
      <p className={styles.panelEyebrow}>Chọn xe · {label}</p>
      <h2 className={styles.panelTitle}>Xe đang bán ({cars.length})</h2>
      <p className={styles.hint}>{modelCodes.size} xe đã có mô hình 3D. Xe chưa có 3D vẫn xem được ảnh và thông số.</p>
      <label className={styles.search}>
        <SearchOutlined />
        <input value={query} placeholder="Tìm theo tên hoặc mã xe" aria-label="Tìm xe" onChange={(e) => setQuery(e.target.value)} />
      </label>
      <label className={styles.only3d}>
        <input type="checkbox" checked={only3d} onChange={(e) => setOnly3d(e.target.checked)} /> Chỉ xe có 3D
      </label>
      <ul className={styles.pickList}>
        {list.map((item) => (
          <Row key={item.car.vehicleCode} item={item} current={current} onPlace={onPlace} onInfo={onInfo} />
        ))}
      </ul>
      {!list.length && <p className={styles.hint}>Không có xe phù hợp.</p>}
    </aside>
  )
}
