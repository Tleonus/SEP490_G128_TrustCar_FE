import { DirectionalLight, Group, HemisphereLight, PMREMGenerator, SpotLight } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { SLOTS } from './layout'

function spot(g, [x, y, z], [tx, tz], intensity, shadow) {
  const s = new SpotLight('#fff4e6', intensity, 0, 0.62, 0.65, 1.6)
  s.position.set(x, y, z)
  s.target.position.set(tx, 0, tz)
  g.add(s, s.target)
  if (shadow) {
    s.castShadow = true
    s.shadow.mapSize.set(2048, 2048)
    s.shadow.bias = -0.0002
    s.shadow.normalBias = 0.02
    s.shadow.camera.near = 2
    s.shadow.camera.far = 14
  }
  return s
}

/**
 * Ánh sáng: môi trường phản chiếu (RoomEnvironment), 1 đèn chính có bóng cho sảnh,
 * đèn rọi trên mỗi kệ và 1 đèn rọi có bóng ở studio.
 */
export function buildLights(renderer, scene) {
  const pmrem = new PMREMGenerator(renderer)
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
  pmrem.dispose()
  scene.environment = envRT.texture
  scene.environmentIntensity = 0.55

  const g = new Group()
  g.name = 'lights'
  g.add(new HemisphereLight('#e9eef5', '#2a2420', 0.35))

  const key = new DirectionalLight('#fff6ec', 1.5)
  key.position.set(5, 10, 7)
  key.target.position.set(0, 0, -2.4)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 6, bottom: -6, near: 1, far: 30 })
  key.shadow.bias = -0.0003
  key.shadow.normalBias = 0.03
  g.add(key, key.target)

  spot(g, [SLOTS.left.x, 4.9, SLOTS.left.z + 1.2], [SLOTS.left.x, SLOTS.left.z], 60, false)
  spot(g, [SLOTS.right.x, 4.9, SLOTS.right.z + 1.2], [SLOTS.right.x, SLOTS.right.z], 60, false)
  spot(g, [SLOTS.studio.x + 2.5, 5.7, SLOTS.studio.z + 3], [SLOTS.studio.x, SLOTS.studio.z], 120, true)
  spot(g, [-3, 5.7, SLOTS.studio.z - 2], [SLOTS.studio.x, SLOTS.studio.z], 45, false)
  scene.add(g)
  return { group: g, envRT }
}
