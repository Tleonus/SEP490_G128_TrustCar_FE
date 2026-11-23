import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { pendingBookingId } from '../../test-drive-booking/utils/resumeBooking'
import TopBar from '../components/TopBar'
import StopNav from '../components/StopNav'
import StopCaption from '../components/StopCaption'
import StopStepper from '../components/StopStepper'
import ShelfBar from '../components/ShelfBar'
import StudioCarBar from '../components/StudioCarBar'
import CarPicker from '../components/CarPicker'
import PaintPicker from '../components/PaintPicker'
import CarSpecPanel from '../components/CarSpecPanel'
import ConsultBox from '../components/ConsultBox'
import BookBar from '../components/BookBar'
import LoadingCover from '../components/LoadingCover'
import { useShowroomCars } from '../hooks/useShowroomCars'
import { useShowroomEngine } from '../hooks/useShowroomEngine'
import { defaultShelves, placeOnShelf } from '../utils/shelves'
import styles from '../showroom.module.css'

/**
 * Showroom 3D toàn màn hình: cuộn qua 4 điểm dừng, xem xe trên 2 kệ xoay, tư vấn, đổi màu sơn.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F02
 */
export default function Showroom3DPage() {
  const canvasRef = useRef(null)
  const location = useLocation()
  // vừa đăng nhập xong quay về (?datlich=<id xe>): mở lại bảng của đúng xe đó, nút đặt lịch trong bảng tự mở hộp thoại
  const pendingId = pendingBookingId(location.search)
  const data = useShowroomCars()
  const [stop, setStop] = useState(0)
  const [panelCar, setPanelCar] = useState(null)
  const [picked, setCurrent] = useState(null)
  const [chosen, setShelves] = useState(null)
  const [pickerFor, setPickerFor] = useState(null)
  const [paint, setPaint] = useState('original')
  const [loading, setLoading] = useState({ busy: false, progress: 0 })
  const [realism, setRealism] = useState({ state: 'waiting', samples: 0 })
  const { engine, error } = useShowroomEngine(canvasRef, {
    // sang điểm dừng khác: đóng bảng bên phải (chọn xe / thông số) cho khỏi che cảnh mới
    stop: (i) => { setStop(i); setPickerFor(null); setPanelCar(null) },
    select: (car) => { setPanelCar(car); setCurrent(car); setPaint('original') },
    loading: setLoading,
    realism: setRealism,
  })

  const modelCodes = useMemo(() => new Set(data.modelCars.map((c) => c.vehicleCode)), [data.modelCars])
  const shelves = useMemo(() => chosen ?? defaultShelves(data.modelCars), [chosen, data.modelCars])
  const current = picked ?? data.modelCars[0] ?? null // xe trên bục studio / để đặt lịch
  const ready = Boolean(engine) && data.status !== 'loading'

  // Kệ sảnh và bục studio luôn theo state React (engine tự bỏ qua khi xe không đổi).
  useEffect(() => {
    if (engine && data.status === 'ready') engine.setShelves(shelves)
  }, [engine, data.status, shelves])
  useEffect(() => {
    if (engine && current) engine.selectCar(current, false)
  }, [engine, current])

  useEffect(() => {
    document.title = 'Showroom 3D | TRUST CAR'
  }, [])

  useEffect(() => {
    const car = pendingId && data.cars.find((c) => (c._id ?? c.id) === pendingId)
    if (car) setPanelCar(car) // eslint-disable-line react-hooks/set-state-in-effect -- phản ứng một lần với đường dẫn
  }, [pendingId, data.cars])

  const showCar = (car) => {
    setPanelCar(car)
    if (modelCodes.has(car.vehicleCode)) {
      setCurrent(car)
      setPaint('original')
    }
  }
  const place = (car) => {
    if (pickerFor !== 'studio') setShelves(placeOnShelf(shelves, pickerFor, car))
    setCurrent(car)
    setPaint('original')
    setPickerFor(null)
  }
  const pickPaint = (key) => {
    setPaint(key)
    engine?.setPaint(key)
  }

  return (
    <div className={styles.page}>
      <canvas ref={canvasRef} className={styles.canvas} tabIndex={0} aria-label="Showroom 3D TRUST CAR" />
      <TopBar realism={realism} onToggleRealism={() => engine?.toggleRealism()} />
      <StopNav stop={stop} onGo={(i) => engine?.goTo(i)} />
      <StopCaption stop={stop}>
        {stop === 1 && data.status === 'ready' && <ShelfBar shelves={shelves} onOpen={showCar} onPick={setPickerFor} />}
        {stop === 3 && current && <StudioCarBar car={current} onPick={() => setPickerFor('studio')} onOpen={showCar} />}
        {stop === 3 && current && <PaintPicker value={paint} onChange={pickPaint} disabled={loading.busy} />}
        {data.status === 'ready' && !data.modelCars.length && (
          <p className={styles.empty}>
            Chưa có mô hình xe 3D. <Link to="/xe">Xem danh sách xe</Link>
          </p>
        )}
      </StopCaption>
      {!panelCar && !pickerFor && <StopStepper stop={stop} onGo={(i) => engine?.goTo(i)} />}
      {stop === 2 && !panelCar && <ConsultBox cars={data.cars} onShowCar={showCar} />}
      {pickerFor && !panelCar && (
        <CarPicker shelf={pickerFor} cars={data.cars} modelCodes={modelCodes} current={pickerFor === 'studio' ? current : shelves[pickerFor]}
          onPlace={place} onInfo={setPanelCar} onClose={() => setPickerFor(null)} />
      )}
      <CarSpecPanel car={panelCar} onClose={() => setPanelCar(null)} />
      {!panelCar && !pickerFor && !pendingId && <BookBar car={current} />}
      <LoadingCover ready={ready} loading={loading} error={error || data.error} />
    </div>
  )
}
