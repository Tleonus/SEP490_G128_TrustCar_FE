import { Color, Matrix4, Vector3 } from 'three'
import { detectWheels, sampleBodyColor } from './carShape'

// Màu sơn ở studio.
// Mô hình xe dựng bằng AI chỉ có MỘT vật liệu, màu thân xe, kính, lốp... nằm chung một ảnh texture,
// nên không thể đổi riêng "vật liệu sơn". Cách làm: nhuộm trong shader theo một mặt nạ ước lượng
//   - bỏ bánh xe (2 vòng tròn ở vị trí trục bánh ước lượng từ kích thước xe) và phần gầm thấp,
//   - bỏ kính: mặt gần thẳng đứng phía trên đường eo xe (nóc, capô vẫn sơn),
//   - bỏ đèn: điểm ảnh đỏ/cam rõ (đèn hậu, trừ khi xe vốn màu đỏ) hoặc sáng hơn hẳn thân xe (đèn pha, crôm),
//   - KHÔNG dựa vào ảnh độ nhám: mô hình AI hay ghi nhầm cả mảng thân xe là "bóng như gương" (lỗi mảng đen hông sau),
//   - giữ độ sáng tối của ảnh gốc để còn nếp gấp, bóng đổ.
// Kết quả là gần đúng; xe có vật liệu thân riêng (tên chứa paint/body) thì nhuộm đúng vật liệu đó.
// @ears .sdd/features/showroom-3d/SPEC.md#REQ-F09

export const PAINTS = [
  { key: 'original', label: 'Màu gốc', swatch: 'conic-gradient(#555, #ddd, #555)' },
  { key: 'obsidian', label: 'Đen Obsidian', color: '#141518' },
  { key: 'polar', label: 'Trắng Polar', color: '#e6e8eb' },
  { key: 'iridium', label: 'Bạc Iridium', color: '#9da2a8' },
  { key: 'emerald', label: 'Xanh Emerald', color: '#1d4a3a' },
  { key: 'ruby', label: 'Đỏ Ruby', color: '#7d1119' },
  { key: 'navy', label: 'Xanh Navy', color: '#1c2d4d' },
].map((p) => ({ ...p, swatch: p.swatch ?? p.color }))

const PAINT_NAME = /^TC_Body_Paint$|paint|carpaint|vo_xe/i // TC_Body_Paint: vật liệu sơn do Blender tách

const FRAG_MASK = /* glsl */ `
  float paintMask = 0.0;
  {
    vec3 q = vCarPos / uCarSize;                   // x: -0.5..0.5 theo chiều dài, y: 0..1 theo chiều cao
    float m = smoothstep(0.10, 0.16, q.y);         // bỏ gầm
    // bánh + lốp: 2 hình tròn theo vị trí / cỡ bánh dò được từ hình khối (uWheels = trục trước, trục sau, bán kính)
    float dw = min(length(vCarPos.xy - vec2(uWheels.x, uWheels.z)), length(vCarPos.xy - vec2(uWheels.y, uWheels.z)));
    m *= smoothstep(uWheels.z * 1.07, uWheels.z * 1.13, dw); // nới ra ngoài mép lốp một chút
    vec3 c = diffuseColor.rgb;
    float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
    // trên eo xe: mặt nằm (nóc) luôn sơn; mặt đứng chỉ sơn khi màu giống thân xe (cột, khung đuôi), bỏ kính (sáng/khác hẳn)
    float up = abs(normalize(vCarNormal).y);
    // Như sơn xe thật: chỉ sơn chỗ CÙNG MÀU thân xe (màu đo trên cửa hông). Logo, viền crôm, khung trắng/bạc,
    // lưới tản nhiệt, đèn... khác màu thân thì giữ nguyên. So độ sáng (log) và sắc độ / độ bão hoà (như mắt nhìn).
    float dl = abs(log((lum + 0.004) / (uBodyLum + 0.004)));
    vec3 g = sqrt(max(c, 0.0)); // gần với sRGB để sắc độ ổn định ở chỗ tối
    float gmax = max(g.r, max(g.g, g.b));
    float sat = (gmax - min(g.r, min(g.g, g.b))) / (gmax + 1e-4);
    float hue = gmax == g.r ? mod((g.g - g.b) / (gmax - min(g.r, min(g.g, g.b)) + 1e-4), 6.0)
      : gmax == g.g ? (g.b - g.r) / (gmax - min(g.r, min(g.g, g.b)) + 1e-4) + 2.0
      : (g.r - g.g) / (gmax - min(g.r, min(g.g, g.b)) + 1e-4) + 4.0;
    float dh = abs(hue - uBodyHue);
    dh = min(dh, 6.0 - dh) / 6.0; // 0..0.5
    // thân xe màu trung tính (đen/trắng/bạc): chỉ sơn chỗ cũng trung tính -> logo xanh, đèn vàng... giữ nguyên.
    // Điểm ảnh tối có sắc độ nhiễu (texture AI hay ám xanh ở chỗ đen) nên chỗ tối nới ngưỡng bão hoà.
    float satMax = mix(0.75, max(0.42, uBodySat + 0.15), smoothstep(0.12, 0.4, gmax));
    float neutralOk = 1.0 - smoothstep(satMax - 0.1, satMax + 0.05, sat);
    // thân xe có màu (đỏ, xanh...): chỉ sơn chỗ cùng sắc độ; chỗ bóng sáng thì nhạt màu nên nới độ sáng
    float coloredOk = (1.0 - smoothstep(0.05, 0.1, dh)) * smoothstep(0.12, 0.25, sat);
    // xe "có màu" khi màu thân đủ sáng và đủ đậm; đen ám xanh vẫn tính là đen
    float colored = step(0.3, uBodySat) * smoothstep(0.38, 0.5, uBodyVal);
    // mặt nằm (nóc, capô) hay in sẵn vệt phản chiếu bầu trời -> nới độ sáng ở đó
    float flatTop = smoothstep(0.75, 0.9, up);
    // thân xe tối: chỗ còn tối hơn (bóng, nếp gấp) vẫn là sơn -> nới mạnh phía tối
    float darker = step(lum, uBodyLum) * (1.0 - colored) * (1.0 - smoothstep(0.35, 0.6, uBodyVal));
    float loose = max(max(colored, flatTop), darker);
    float lumOk = 1.0 - smoothstep(mix(0.75, 1.6, loose), mix(1.25, 2.6, loose), dl);
    float bodyLike = lumOk * mix(neutralOk, coloredOk, colored);
    m *= mix(1.0, bodyLike, uColorMatch);
    m *= 1.0 - smoothstep(0.62, 0.66, q.y) * (1.0 - max(smoothstep(0.86, 0.93, up), bodyLike));
    m *= 1.0 - smoothstep(0.86, 0.9, abs(q.z) * 2.0) * smoothstep(0.45, 0.5, q.y); // gương chiếu hậu nhô ra ngoài thân
    m *= 1.0 - uKeepRed * smoothstep(0.06, 0.14, c.r - max(c.g, c.b)); // đèn hậu, xi-nhan
    m *= 1.0 - smoothstep(uLampLum, uLampLum * 1.4, lum);               // đèn pha, crôm sáng
    #ifdef USE_METALNESSMAP
      // kim loại đậm (chỉ dùng khi chưa đo được màu thân: ảnh kim loại của mô hình AI hay đánh dấu nhầm cả tấm cửa)
      m *= 1.0 - (1.0 - uColorMatch) * smoothstep(0.8, 0.95, texture2D(metalnessMap, vMetalnessMapUv).b);
    #endif
    // vòm quét: phía đầu xe (x > uSweep) đã sang màu mới, phía sau còn màu cũ
    // toạ độ dọc theo hướng vòm (vòm đứng yên trong phòng, xe có thể đang xoay)
    float archX = (uArchFromCar * vec4(vCarPos, 1.0)).x;
    float swept = smoothstep(uSweep - 0.03, uSweep + 0.03, archX);
    vec3 paintCol = mix(uPaintOld, uPaintNew, swept);
    paintMask = mix(uOnOld, uOnNew, swept) * mix(1.0, m, uUseMask); // có vật liệu sơn riêng thì nhuộm cả vật liệu
    // giữ nếp gấp nhưng nén mạnh vệt phản chiếu in sẵn trong texture AI (phản chiếu thật do ánh sáng + lớp bóng tạo)
    float shade = clamp(pow((lum + 0.01) / (uBodyLum + 0.01), 0.3), 0.6, 1.3);
    diffuseColor.rgb = mix(diffuseColor.rgb, paintCol * shade, paintMask);
  }
`

function patch(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 uCarFrame;\nvarying vec3 vCarPos;\nvarying vec3 vCarNormal;')
      .replace('#include <begin_vertex>',
        '#include <begin_vertex>\nvCarPos = (uCarFrame * vec4(position, 1.0)).xyz;\nvCarNormal = mat3(uCarFrame) * objectNormal;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>',
        '#include <common>\nuniform vec3 uPaintOld, uPaintNew, uCarSize, uWheels, uBodyColor;\nuniform mat4 uArchFromCar;\n' +
        'uniform float uColorMatch, uBodyHue, uBodySat, uBodyVal;\n' +
        'uniform float uOnOld, uOnNew, uSweep, uGlow, uBodyLum, uUseMask, uKeepRed, uLampLum;\nvarying vec3 vCarPos;\nvarying vec3 vCarNormal;')
      .replace('#include <map_fragment>', `#include <map_fragment>\n${FRAG_MASK}`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.42, paintMask);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.12, paintMask);')
      // dải sáng mảnh trên thân xe ngay dưới vòm lúc đang quét
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' +
        // chỉ trên phần thân được sơn (bánh, kính không lóe khi mặt phẳng quét trùng mặt bánh)
        'totalEmissiveRadiance += uGlow * paintMask * (1.0 - smoothstep(0.0, 0.07, abs((uArchFromCar * vec4(vCarPos, 1.0)).x - uSweep)))' +
        ' * vec3(0.7, 0.76, 0.82);')
      // lớp bóng (clearcoat) chỉ phủ vùng sơn
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n#ifdef USE_CLEARCOAT\nmaterial.clearcoat *= paintMask;\n#endif')
  }
  if (material.isMeshPhysicalMaterial) {
    material.clearcoat = 1
    material.clearcoatRoughness = 0.06
  }
  material.customProgramCacheKey = () => 'tc-paint'
  material.needsUpdate = true
}

/**
 * Thống kê ảnh texture: độ sáng trung vị (giữ tỉ lệ sáng tối khi nhuộm) và xe có vốn màu đỏ không
 * (xe đỏ thì không loại điểm ảnh đỏ như đèn hậu).
 */
export function textureStats(material) {
  const img = material.map?.image
  if (!img) return { lum: 0.2, red: false }
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d', { willReadFrequently: true })
  g.drawImage(img, 0, 0, 64, 64)
  const px = g.getImageData(0, 0, 64, 64).data
  const lums = []
  const reds = []
  for (let i = 0; i < px.length; i += 4) {
    lums.push((0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255)
    reds.push((px[i] - Math.max(px[i + 1], px[i + 2])) / 255)
  }
  const median = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)]
  // texture màu ở sRGB, shader làm việc ở tuyến tính
  return { lum: Math.pow(median(lums), 2.2), red: median(reds) > 0.08 }
}

/** Sắc độ (0..6), độ bão hoà và độ sáng (val) của màu thân xe, tính giống shader (trên căn bậc hai của màu tuyến tính). */
export function hueSat(color) {
  if (!color) return { hue: 0, sat: 0, val: 0 }
  const [r, g, b] = [color.r, color.g, color.b].map((v) => Math.sqrt(Math.max(v, 0)))
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  const sat = d / (max + 1e-4)
  const val = max
  if (max === r) return { hue: ((((g - b) / (d + 1e-4)) % 6) + 6) % 6, sat, val }
  if (max === g) return { hue: (b - r) / (d + 1e-4) + 2, sat, val }
  return { hue: (r - g) / (d + 1e-4) + 4, sat, val }
}

/** Uniform sơn của các mesh trong xe (lần đầu gọi thì gắn shader). */
export function paintUniforms(model) {
  if (model.userData.paint) return model.userData.paint
  const meshes = []
  model.traverse((o) => o.isMesh && meshes.push(o))
  const named = meshes.filter((m) => PAINT_NAME.test(m.material.name || ''))
  const targets = named.length ? named : meshes
  const holder = model.children[0]
  const s = holder.userData.size
  const size = holder.rotation.y ? new Vector3(s.z, s.y, s.x) : new Vector3(s.x, s.y, s.z)
  model.updateMatrixWorld(true)
  const inv = new Matrix4().copy(model.matrixWorld).invert()
  const frames = meshes.map((mesh) => new Matrix4().multiplyMatrices(inv, mesh.matrixWorld))
  const w = detectWheels(meshes, frames, size)
  const wheels = new Vector3(w.front, w.rear, w.r)
  // màu thân xe thật (đo trên cửa hông) -> "Màu gốc" phủ đều; độ sáng của nó làm mốc giữ nếp gấp
  // vật liệu sơn không có ảnh màu (đã đặt màu sơn thật) -> màu thân = màu vật liệu
  const body = targets[0].material.map ? sampleBodyColor(targets[0], frames[meshes.indexOf(targets[0])], size, w) : targets[0].material.color.clone()
  model.userData.paintBody = body
  const bodyLum = body && 0.2126 * body.r + 0.7152 * body.g + 0.0722 * body.b
  // xe vốn màu đỏ: không coi điểm ảnh đỏ là đèn hậu (nếu không cả thân xe sẽ bị bỏ qua)
  const redBody = body ? body.r - Math.max(body.g, body.b) > 0.05 : textureStats(targets[0].material).red
  const hs = hueSat(body)
  const all = []
  for (const mesh of targets) {
    const st = textureStats(mesh.material)
    if (body) st.lum = bodyLum
    const u = {
      uWheels: { value: wheels },
      uPaintOld: { value: new Color() }, uPaintNew: { value: new Color() }, uOnOld: { value: 0 }, uOnNew: { value: 0 },
      uSweep: { value: -1e4 }, uGlow: { value: 0 }, uCarSize: { value: size }, uArchFromCar: { value: new Matrix4() },
      uCarFrame: { value: frames[meshes.indexOf(mesh)] },
      uBodyLum: { value: st.lum }, uUseMask: { value: named.length ? 0 : 1 },
      uBodyColor: { value: body ?? new Color(st.lum, st.lum, st.lum) }, uColorMatch: { value: body ? 1 : 0 },
      uBodyHue: { value: hs.hue }, uBodySat: { value: hs.sat }, uBodyVal: { value: hs.val },
      uKeepRed: { value: redBody ? 0 : 1 }, uLampLum: { value: Math.max(0.35, st.lum * 8) },
    }
    patch(mesh.material, u)
    all.push(u)
  }
  model.userData.paint = all
  return all
}

/** Màu (hex) của một lựa chọn sơn; `null` = màu gốc của mô hình. */
export function paintColor(key) {
  return PAINTS.find((p) => p.key === key)?.color ?? null
}
