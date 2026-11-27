import { useEffect, useRef, useState } from 'react'
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  Box3,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PMREMGenerator,
  PerspectiveCamera,
  RingGeometry,
  Scene,
  ShadowMaterial,
  SpotLight,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { DragOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { castShadows, disposeTree, loadGLB, normalize } from '../../../features/showroom-3d/three/assets'
import { applyPartLooks, applyTruePaint } from '../../../features/showroom-3d/three/carMaterials'
import styles from './HeroCarStage3D.module.css'

const CAR_TARGET_LENGTH = 4.65
const BASE_YAW = -0.62 // Góc 3/4 nhìn trực diện đầu xe + cặp đèn pha LED hướng về người xem
const ENTRY_START_X = 6.2
const EXIT_END_X = -6.8

/** Tạo texture quầng sáng đèn pha LED (radial soft glow). */
function createGlowTexture(innerRgba, midRgba) {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, innerRgba)
  grad.addColorStop(0.28, midRgba)
  grad.addColorStop(0.62, 'rgba(255, 250, 235, 0.12)')
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  return tex
}

/** Tạo texture chùm tia sáng chiếu xuống mặt sàn. */
function createBeamTexture() {
  const w = 128
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, 'rgba(255, 252, 235, 0.58)')
  grad.addColorStop(0.35, 'rgba(226, 240, 255, 0.22)')
  grad.addColorStop(0.8, 'rgba(186, 220, 255, 0.05)')
  grad.addColorStop(1, 'rgba(186, 220, 255, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  return tex
}

/**
 * Xác định chiều mũi xe (+1 hay -1 dọc trục X) dựa trên hình học thực của thân xe:
 * Phần nắp capo phía trước ở vị trí ±32% chiều dài luôn thấp hơn phần nóc/cột C phía sau.
 */
function detectFrontSign(wrap) {
  wrap.updateMatrixWorld(true)
  const box = new Box3().setFromObject(wrap)
  const size = box.getSize(new Vector3())
  const minX = box.min.x
  const maxX = box.max.x
  const midX = (minX + maxX) / 2
  const halfLen = size.x / 2

  let posMaxY = -Infinity
  let negMaxY = -Infinity
  const v = new Vector3()

  wrap.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry?.attributes?.position) return
    const pos = obj.geometry.attributes.position
    const step = Math.max(1, Math.ceil(pos.count / 12000))
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i).applyMatrix4(obj.matrixWorld)
      const relX = (v.x - midX) / halfLen
      if (relX > 0.25 && relX < 0.58 && v.y > posMaxY) posMaxY = v.y
      if (relX < -0.25 && relX > -0.58 && v.y > negMaxY) negMaxY = v.y
    }
  })

  if (!Number.isFinite(posMaxY) || !Number.isFinite(negMaxY)) return 1
  return posMaxY <= negMaxY ? 1 : -1
}

/**
 * Tạo cụm đèn pha LED (2 bóng pha + 2 luồng ánh sáng + 2 đèn hậu đỏ) gắn trực tiếp vào thân xe
 * để khi kéo xoay 360° hoặc xe lướt vào, ánh đèn luôn bám chính xác theo mũi xe.
 */
function createHeadlightRig(wrap, glowTex, tailGlowTex, beamTex) {
  wrap.updateMatrixWorld(true)
  const box = new Box3().setFromObject(wrap)
  const size = box.getSize(new Vector3())
  const frontX = box.max.x - 0.04
  const rearX = box.min.x + 0.05
  const lampY = box.min.y + size.y * 0.43
  const lampZ = size.z * 0.34
  const tailY = box.min.y + size.y * 0.52
  const tailZ = size.z * 0.36

  const rig = new Group()
  rig.name = 'hero_headlight_rig'

  const lightMats = []
  wrap.traverse((obj) => {
    if (!obj.isMesh) return
    for (const m of [obj.material].flat()) {
      if (m && m.name === 'TC_Light') {
        m.emissive = new Color('#eff6ff')
        m.emissiveIntensity = 0
        lightMats.push(m)
      }
    }
  })

  const spots = []
  const beamMaterials = []
  const flareMaterials = []
  const tailMaterials = []

  // Hai cụm đèn pha trước (Trái & Phải) hướng về +X
  for (const side of [-1, 1]) {
    const z = side * lampZ

    // Đèn SpotLight thật chiếu sáng mặt sàn showroom
    const spot = new SpotLight('#f6f9ff', 0, 11, 0.52, 0.72, 1.35)
    spot.position.set(frontX, lampY, z)
    spot.target.position.set(frontX + 4.8, 0.02, z * 1.15)
    rig.add(spot, spot.target)
    spots.push(spot)

    // Chùm tia sáng thể tích mềm (volumetric cone)
    const beamLen = 3.4
    const coneGeo = new ConeGeometry(0.95, beamLen, 24, 1, true)
    coneGeo.translate(0, -beamLen / 2, 0)
    coneGeo.rotateZ(Math.PI / 2) // Đỉnh tại gốc, tỏa dần về +X
    const beamMat = new MeshBasicMaterial({
      map: beamTex,
      color: '#eef6ff',
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
    })
    const cone = new Mesh(coneGeo, beamMat)
    cone.position.set(frontX + 0.02, lampY, z)
    cone.rotation.z = -0.11 // Hơi chúc xuống mặt đường
    rig.add(cone)
    beamMaterials.push(beamMat)

    // Quầng sáng thấu kính đèn pha (LED Lens Flare)
    const flareMat = new SpriteMaterial({
      map: glowTex,
      color: '#eff6ff',
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    const flare = new Sprite(flareMat)
    flare.position.set(frontX + 0.06, lampY, z)
    flare.scale.set(0.92, 0.62, 1)
    rig.add(flare)
    flareMaterials.push(flareMat)
  }

  // Hai điểm đèn hậu LED đỏ nhẹ phía sau (-X)
  for (const side of [-1, 1]) {
    const z = side * tailZ
    const tailMat = new SpriteMaterial({
      map: tailGlowTex,
      color: '#ff3b30',
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    const tail = new Sprite(tailMat)
    tail.position.set(rearX - 0.05, tailY, z)
    tail.scale.set(0.64, 0.36, 1)
    rig.add(tail)
    tailMaterials.push(tailMat)
  }

  // Vệt sáng phản chiếu trên sàn phía trước mũi xe khi bật đèn
  const floorPoolGeo = new CircleGeometry(2.15, 36)
  floorPoolGeo.rotateX(-Math.PI / 2)
  const floorPoolMat = new MeshBasicMaterial({
    map: glowTex,
    color: '#dceeff',
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
  })
  const floorPool = new Mesh(floorPoolGeo, floorPoolMat)
  floorPool.scale.set(1.35, 1, 0.72)
  floorPool.position.set(frontX + 2.1, 0.015, 0)
  rig.add(floorPool)
  beamMaterials.push(floorPoolMat)

  wrap.add(rig)

  return {
    setIntensity(level) {
      const clamped = Math.max(0, Math.min(1, level))
      rig.visible = clamped > 0.01
      for (const m of lightMats) m.emissiveIntensity = clamped * 4.4
      for (const s of spots) s.intensity = clamped * 34
      for (let i = 0; i < beamMaterials.length; i++) {
        // phần tử cuối là vệt phản chiếu sàn
        const maxOpacity = i === beamMaterials.length - 1 ? 0.36 : 0.42
        beamMaterials[i].opacity = clamped * maxOpacity
      }
      for (const f of flareMaterials) f.opacity = clamped * 0.92
      for (const t of tailMaterials) t.opacity = clamped * 0.65
    },
  }
}

/**
 * Sân khấu mô hình xe 3D ngay trong Hero Slider:
 * - Xe lướt mượt vào sân khấu mỗi khi đổi slide.
 * - Hỗ trợ kéo thả xoay 360° có quán tính trực tiếp trên canvas.
 * - Đồng bộ trạng thái đèn pha LED: BẬT sáng khi giao diện tối, TẮT hoàn toàn khi giao diện sáng.
 */
export default function HeroCarStage3D({
  slide,
  isDark,
  onUserInteract,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const stateRef = useRef({
    isDark,
    autoSpin: true,
    dragging: false,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    currentYaw: BASE_YAW,
    headlightLevel: isDark ? 1 : 0,
    activeCar: null,
    exitingCars: [],
    loadToken: 0,
  })
  const engineRef = useRef(null)
  const [autoSpin, setAutoSpin] = useState(true)
  const [modelReady, setModelReady] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [webglError, setWebglError] = useState(false)

  // Đồng bộ biến isDark & autoSpin vào vòng lặp render Three.js mà không khởi tạo lại WebGL
  useEffect(() => {
    stateRef.current.isDark = isDark
  }, [isDark])

  useEffect(() => {
    stateRef.current.autoSpin = autoSpin
  }, [autoSpin])

  // 1. Khởi tạo Three.js scene, ánh sáng ngày/đêm, bệ sàn showroom và vòng lặp mượt 60fps
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return undefined

    let renderer
    try {
      renderer = new WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch {
      queueMicrotask(() => setWebglError(true))
      return undefined
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = isDark ? 1.05 : 1.18
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = PCFSoftShadowMap

    const scene = new Scene()
    const pmrem = new PMREMGenerator(renderer)
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
    pmrem.dispose()
    scene.environment = envRT.texture
    scene.environmentIntensity = isDark ? 0.42 : 0.95

    const camera = new PerspectiveCamera(31, 1, 0.1, 60)
    camera.position.set(0.35, 1.88, 6.45)
    camera.lookAt(0, 0.62, 0)

    // Hệ thống ánh sáng studio chuyển mượt giữa Ngày (Light) và Đêm (Dark)
    const hemiLight = new HemisphereLight('#eef4ff', '#2c3340', isDark ? 0.25 : 1.15)
    scene.add(hemiLight)

    const keyLight = new DirectionalLight('#eff6ff', isDark ? 0.95 : 2.15)
    keyLight.position.set(5.5, 8.5, 6.2)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(1024, 1024)
    Object.assign(keyLight.shadow.camera, {
      left: -5.5,
      right: 5.5,
      top: 4.5,
      bottom: -4.5,
      near: 1,
      far: 24,
    })
    keyLight.shadow.bias = -0.0004
    keyLight.shadow.normalBias = 0.025
    scene.add(keyLight)

    const rimLight = new DirectionalLight('#93c5fd', isDark ? 1.15 : 0.45)
    rimLight.position.set(-5.2, 3.6, -4.5)
    scene.add(rimLight)

    // Mặt sàn hứng bóng mềm (trong suốt để hòa hoàn toàn vào nền Hero ngày/đêm)
    const shadowPlaneMat = new ShadowMaterial({ opacity: isDark ? 0.52 : 0.24 })
    const shadowPlane = new Mesh(new CircleGeometry(6.5, 48), shadowPlaneMat)
    shadowPlane.rotation.x = -Math.PI / 2
    shadowPlane.receiveShadow = true
    scene.add(shadowPlane)

    // Vòng mâm xoay kiến trúc mảnh đặt dưới bánh xe
    const ringMat = new MeshStandardMaterial({
      color: isDark ? '#60a5fa' : '#8a99ad',
      metalness: 0.75,
      roughness: 0.28,
      transparent: true,
      opacity: isDark ? 0.42 : 0.34,
    })
    const stageRing = new Mesh(new RingGeometry(2.38, 2.43, 72), ringMat)
    stageRing.rotation.x = -Math.PI / 2
    stageRing.position.y = 0.006
    scene.add(stageRing)

    const innerRingMat = new MeshBasicMaterial({
      color: isDark ? '#38bdf8' : '#0b1f3a',
      transparent: true,
      opacity: isDark ? 0.16 : 0.08,
    })
    const innerRing = new Mesh(new RingGeometry(2.14, 2.16, 72), innerRingMat)
    innerRing.rotation.x = -Math.PI / 2
    innerRing.position.y = 0.005
    scene.add(innerRing)

    const stageGroup = new Group()
    scene.add(stageGroup)

    const glowTex = createGlowTexture('rgba(255,255,250,1)', 'rgba(220,242,255,0.68)')
    const tailGlowTex = createGlowTexture('rgba(255,70,58,0.95)', 'rgba(255,30,30,0.45)')
    const beamTex = createBeamTexture()
    const cache = new Map()

    engineRef.current = {
      stageGroup,
      cache,
      glowTex,
      tailGlowTex,
      beamTex,
    }

    const resize = () => {
      const w = container.clientWidth || 600
      const h = container.clientHeight || 420
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    let rafId = 0
    let prevTime = performance.now()
    const lightColorDay = new Color('#eef4ff')
    const lightColorNight = new Color('#1e3354')
    const ringColorDay = new Color('#94a3b8')
    const ringColorNight = new Color('#60a5fa')

    const tick = (now) => {
      rafId = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - prevTime) / 1000)
      prevTime = now

      const st = stateRef.current
      const targetDark = st.isDark ? 1 : 0
      const lerpFactor = 1 - Math.exp(-dt * 5.2)

      // Chuyển mượt cường độ đèn pha + ánh sáng studio theo chế độ sáng/tối
      st.headlightLevel += (targetDark - st.headlightLevel) * lerpFactor
      const d = st.headlightLevel

      hemiLight.intensity = 1.18 - d * 0.92
      hemiLight.color.copy(lightColorDay).lerp(lightColorNight, d)
      keyLight.intensity = 2.18 - d * 1.32
      rimLight.intensity = 0.42 + d * 0.85
      scene.environmentIntensity = 0.96 - d * 0.56
      renderer.toneMappingExposure = 1.16 - d * 0.14
      shadowPlaneMat.opacity = 0.22 + d * 0.34
      ringMat.color.copy(ringColorDay).lerp(ringColorNight, d)
      ringMat.opacity = 0.3 + d * 0.18
      innerRingMat.opacity = 0.08 + d * 0.1

      // Cập nhật chuyển động lướt vào & xoay 360° cho xe đang hiển thị
      if (st.activeCar) {
        const car = st.activeCar
        // Lướt từ phải vào tâm với hiệu ứng giảm tốc tự nhiên + nhún nhẹ hệ thống treo khi dừng
        const dx = 0 - car.root.position.x
        car.root.position.x += dx * (1 - Math.exp(-dt * 4.4))
        const speedNorm = Math.min(1, Math.abs(dx) / 2.2)
        // Hơi chúi mũi rất nhẹ khi phanh dừng lại vào bục
        car.root.rotation.z = speedNorm * -0.022

        // Quán tính xoay 360° hoặc xoay tự động chậm rãi
        if (!st.dragging) {
          if (Math.abs(st.velocity) > 0.004) {
            st.currentYaw += st.velocity * dt
            st.velocity *= Math.exp(-dt * 3.1)
          } else {
            st.velocity = 0
            if (st.autoSpin && Math.abs(dx) < 0.18) {
              st.currentYaw += 0.18 * dt
            }
          }
        }

        car.spin.rotation.y = st.currentYaw
        car.lights.setIntensity(d)
      }

      // Cập nhật các xe cũ đang lướt ra bên trái rồi gỡ khỏi scene
      for (let i = st.exitingCars.length - 1; i >= 0; i--) {
        const old = st.exitingCars[i]
        old.root.position.x += (EXIT_END_X - old.root.position.x) * (1 - Math.exp(-dt * 5.4))
        old.lights.setIntensity(d * Math.max(0, 1 - Math.abs(old.root.position.x) / 5.5))
        if (Math.abs(old.root.position.x - EXIT_END_X) < 0.35) {
          stageGroup.remove(old.root)
          st.exitingCars.splice(i, 1)
        }
      }

      renderer.render(scene, camera)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      for (const promise of cache.values()) {
        promise.then((entry) => disposeTree(entry.template), () => {})
      }
      cache.clear()
      glowTex.dispose()
      tailGlowTex.dispose()
      beamTex.dispose()
      envRT.dispose()
      renderer.dispose()
      engineRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2. Tải & chuyển đổi mô hình 3D khi slide thay đổi (xe mới lướt vào, xe cũ lướt ra)
  useEffect(() => {
    const eng = engineRef.current
    if (!eng || !slide?.modelCode || webglError) return undefined

    const st = stateRef.current
    const token = ++st.loadToken
    let active = true

    const loadModel = async () => {
      if (!eng.cache.has(slide.modelCode)) {
        setModelReady(false)
        setLoadProgress(12)
        const promise = loadGLB(`/showroom-3d/cars/${slide.modelCode}.glb`, (p) => {
          if (active && token === st.loadToken) {
            setLoadProgress(Math.max(12, Math.min(96, Math.round(p * 100))))
          }
        }).then((raw) => {
          castShadows(raw)
          applyPartLooks(raw)
          if (slide.paintHex) applyTruePaint(raw, slide.paintHex)
          const holder = normalize(raw, CAR_TARGET_LENGTH)
          const wrap = new Group()
          if (holder.userData.longAxis === 'z') holder.rotation.y = Math.PI / 2
          wrap.add(holder)

          // Đảm bảo mũi xe luôn quay về hướng +X trước khi gắn hệ thống đèn pha
          const frontSign = detectFrontSign(wrap)
          if (frontSign < 0) {
            holder.rotation.y += Math.PI
          }
          return { template: wrap }
        })
        promise.catch(() => eng.cache.delete(slide.modelCode))
        eng.cache.set(slide.modelCode, promise)
      }

      try {
        const { template } = await eng.cache.get(slide.modelCode)
        if (!active || token !== st.loadToken) return

        const clone = template.clone(true)
        // Tạo bản sao vật liệu TC_Light riêng để điều chỉnh phát sáng độc lập
        clone.traverse((obj) => {
          if (obj.isMesh && obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material = obj.material.map((m) => (m?.name === 'TC_Light' ? m.clone() : m))
            } else if (obj.material.name === 'TC_Light') {
              obj.material = obj.material.clone()
            }
          }
        })

        const lights = createHeadlightRig(clone, eng.glowTex, eng.tailGlowTex, eng.beamTex)
        lights.setIntensity(st.headlightLevel)

        const spin = new Group()
        spin.add(clone)

        const root = new Group()
        root.add(spin)
        root.position.set(ENTRY_START_X, 0, 0)

        // Cho xe trước đó lướt ra bên trái
        if (st.activeCar) {
          st.exitingCars.push(st.activeCar)
        }

        // Reset nhẹ góc nhìn 3/4 hướng mũi xe về phía người xem khi xe mới lướt vào
        st.currentYaw = BASE_YAW
        st.velocity = 0
        spin.rotation.y = BASE_YAW

        eng.stageGroup.add(root)
        st.activeCar = { root, spin, lights, code: slide.modelCode }
        setLoadProgress(100)
        setModelReady(true)
      } catch {
        if (active && token === st.loadToken) {
          setModelReady(false)
        }
      }
    }

    loadModel()
    return () => {
      active = false
    }
  }, [slide?.modelCode, slide?.paintHex, webglError])

  // Xử lý kéo thả xoay 360° trực tiếp bằng chuột hoặc cảm ứng
  const handlePointerDown = (e) => {
    const st = stateRef.current
    st.dragging = true
    st.lastX = e.clientX
    st.lastTime = performance.now()
    st.velocity = 0
    e.currentTarget.setPointerCapture?.(e.pointerId)
    onUserInteract?.()
  }

  const handlePointerMove = (e) => {
    const st = stateRef.current
    if (!st.dragging) return
    const now = performance.now()
    const dx = e.clientX - st.lastX
    const dt = Math.max(0.008, (now - st.lastTime) / 1000)
    const step = dx * 0.0095
    st.currentYaw += step
    st.velocity = Math.max(-6, Math.min(6, step / dt))
    st.lastX = e.clientX
    st.lastTime = now
  }

  const handlePointerUp = (e) => {
    const st = stateRef.current
    if (!st.dragging) return
    st.dragging = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.stageWrap} ${isDark ? styles.stageDark : styles.stageLight}`}
    >
      {/* Ảnh xem trước tức thì khi model GLB đang giải nén lần đầu (không bị màn hình trống) */}
      {(!modelReady || webglError) && slide?.previewPhoto && (
        <div className={styles.previewFallback}>
          <img
            src={slide.previewPhoto}
            alt={slide.carName}
            className={styles.previewImg}
          />
          {!webglError && (
            <div className={styles.loadingPill}>
              <span className={styles.loadingSpinner} />
              <span>Đang đưa xe 3D vào sàn trưng bày… {loadProgress}%</span>
            </div>
          )}
        </div>
      )}

      {!webglError && (
        <canvas
          ref={canvasRef}
          className={`${styles.canvas} ${modelReady ? styles.canvasVisible : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label={`Mô hình 3D xoay 360 độ của ${slide?.carName || 'xe TrustCar'}`}
        />
      )}

      {/* Thanh điều khiển tương tác 360° gọn dưới chân mô hình */}
      <div className={styles.stageHud}>
        <span className={styles.dragHint}>
          <DragOutlined /> Kéo trái / phải xoay 360°
        </span>
        <button
          type="button"
          className={styles.spinBtn}
          onClick={() => setAutoSpin((v) => !v)}
          aria-label={autoSpin ? 'Tạm dừng tự động xoay' : 'Bật tự động xoay'}
        >
          {autoSpin ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          <span>{autoSpin ? 'Đang xoay nhẹ' : 'Tự xoay'}</span>
        </button>
      </div>
    </div>
  )
}
