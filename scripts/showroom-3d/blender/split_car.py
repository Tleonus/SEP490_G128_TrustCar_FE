# Tách mô hình xe AI (1 vật liệu duy nhất) thành các vật liệu riêng theo bộ phận, để web đổi màu sơn đúng
# như sơn xe thật và cho kính / lốp / mâm / crôm / đèn đúng chất liệu.
#
#   blender -b --factory-startup --python split_car.py -- <vào.glb> <ra.glb> <chiều dài m> [cấu hình.json] [thư mục ảnh xem trước]
#
# Không sửa file gốc. Vật liệu xuất ra (cùng dùng ảnh texture gốc):
#   TC_Body_Paint  sơn thân xe (đổi màu được)    TC_Glass  kính         TC_Tire  lốp       TC_Rim  mâm
#   TC_Chrome      viền crôm, logo kim loại       TC_Trim   nhựa đen, lưới tản nhiệt          TC_Light  đèn
# Toạ độ sau khi nhập glTF: X ngang, Y dọc xe, Z lên trên, đáy xe ở z = 0.
import bpy, bmesh, sys, json, os
import numpy as np

argv = sys.argv[sys.argv.index('--') + 1:]
SRC, DST, LENGTH = argv[0], argv[1], float(argv[2])
CFG = json.load(open(argv[3], encoding='utf-8')) if len(argv) > 3 and argv[3] not in ('', '-') else {}
PREVIEW = argv[4] if len(argv) > 4 else None
TARGET_FACES = int(CFG.get('faces', 420000))

CLASSES = ['TC_Body_Paint', 'TC_Glass', 'TC_Tire', 'TC_Rim', 'TC_Chrome', 'TC_Trim', 'TC_Light']
PAINT, GLASS, TIRE, RIM, CHROME, TRIM, LIGHT = range(7)
PREVIEW_COLORS = [(0.85, 0.1, 0.1), (0.3, 0.75, 1.0), (0.05, 0.05, 0.05), (0.85, 0.8, 0.1),
                  (0.95, 0.95, 0.95), (0.35, 0.2, 0.55), (1.0, 0.1, 0.9)]
FRONT = -1 if CFG.get('front', '-y') == '-y' else 1  # đầu xe ở phía -Y hay +Y (xem ảnh xem trước)


def log(*a):
    print('[split]', *a, flush=True)


# ---------- 1. nhập, chuẩn hoá, giảm lưới ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
obj = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

me = obj.data
co = np.empty(len(me.vertices) * 3, np.float32)
me.vertices.foreach_get('co', co)
co = co.reshape(-1, 3)
mn, mx = co.min(0), co.max(0)
k = LENGTH / (mx[1] - mn[1])
co = (co - np.array([(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, mn[2]], np.float32)) * k
if CFG.get('flip_front'):  # đầu xe đang ở phía -Y: quay 180° để đầu xe luôn ở +Y
    co[:, 0] *= -1
    co[:, 1] *= -1
me.vertices.foreach_set('co', co.ravel())
me.update()
log('faces gốc', len(me.polygons), 'kích thước', ((mx - mn) * k).round(3))

if len(me.polygons) > TARGET_FACES:
    mod = obj.modifiers.new('dec', 'DECIMATE')
    mod.ratio = TARGET_FACES / len(me.polygons)
    mod.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    log('faces sau khi giảm', len(me.polygons))

# ---------- 2. dữ liệu từng mặt ----------
me = obj.data
me.calc_loop_triangles()
nf = len(me.polygons)
cen = np.empty(nf * 3, np.float32); me.polygons.foreach_get('center', cen); cen = cen.reshape(-1, 3)
nor = np.empty(nf * 3, np.float32); me.polygons.foreach_get('normal', nor); nor = nor.reshape(-1, 3)
ls = np.empty(nf, np.int32); me.polygons.foreach_get('loop_start', ls)
lt = np.empty(nf, np.int32); me.polygons.foreach_get('loop_total', lt)
uv = np.empty(len(me.loops) * 2, np.float32); me.uv_layers.active.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
fuv = np.add.reduceat(uv, ls) / lt[:, None]
lv = np.empty(len(me.loops), np.int32); me.loops.foreach_get('vertex_index', lv)

src_mat = me.materials[0]
base_img = next(n.image for n in src_mat.node_tree.nodes
                if n.type == 'TEX_IMAGE' and any(l.to_socket.name == 'Base Color' for l in n.outputs[0].links))
img = base_img.copy()
img.scale(1024, 1024)
px = np.empty(1024 * 1024 * 4, np.float32); img.pixels.foreach_get(px); px = px.reshape(1024, 1024, 4)[..., :3]
bpy.data.images.remove(img)
ix = np.clip((fuv[:, 0] % 1.0) * 1024, 0, 1023).astype(int)
iy = np.clip((fuv[:, 1] % 1.0) * 1024, 0, 1023).astype(int)
col = px[iy, ix]  # màu sRGB 0..1 của từng mặt
# độ nhám (kênh G của ảnh kim loại-độ nhám): mô hình AI đánh dấu kính nhám hơn hẳn sơn -> dùng để tách kính
rough = np.full(len(col), 0.5, np.float32)
mr_node = next((n for n in src_mat.node_tree.nodes if n.type == 'TEX_IMAGE' and 'rough' in n.image.name.lower()), None)
if mr_node:
    mi = mr_node.image.copy(); mi.scale(1024, 1024)
    mp = np.empty(1024 * 1024 * 4, np.float32); mi.pixels.foreach_get(mp)
    rough = mp.reshape(1024, 1024, 4)[iy, ix, 1]
    bpy.data.images.remove(mi)
lum = col @ np.array([0.2126, 0.7152, 0.0722], np.float32)
cmax, cmin = col.max(1), col.min(1)
sat = (cmax - cmin) / (cmax + 1e-4)


def hue_of(c):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    mxv, mnv = c.max(-1), c.min(-1)
    d = mxv - mnv + 1e-4
    h = np.where(mxv == r, ((g - b) / d) % 6, np.where(mxv == g, (b - r) / d + 2, (r - g) / d + 4))
    return h


hue = hue_of(col)
W, L, H = np.ptp(cen[:, 0]), np.ptp(cen[:, 1]), cen[:, 2].max()
X, Y, Z = cen[:, 0], cen[:, 1], cen[:, 2]

# ---------- 3. bánh xe ----------
def contact_center(side):
    m = (Z < 0.035 * H) & (side * Y > 0.15 * L)
    ys = np.sort(Y[m])
    if len(ys) < 30:
        return side * 0.295 * L
    return (ys[int(len(ys) * 0.05)] + ys[int(len(ys) * 0.95)]) / 2


def tire_top(cy):
    m = (np.abs(Y - cy) < 0.02 * L) & (np.abs(X) > 0.3 * W) & (Z < 0.75 * H)
    zs = np.sort(Z[m])
    gaps = np.where((zs[:-1] > 0.25 * H) & (np.diff(zs) > 0.015 * H))[0]
    return zs[gaps[0]] if len(gaps) else None


front, rear = contact_center(1), contact_center(-1)
tops = [t for t in (tire_top(front), tire_top(rear)) if t is not None]
R = min(tops) / 2 if tops else 0.215 * H
if not (0.14 * H < R < 0.3 * H):
    R = 0.215 * H
R *= CFG.get('wheel_scale', 1.0)
log('bánh trước y=%.3f sau y=%.3f R=%.3f (W %.2f L %.2f H %.2f)' % (front, rear, R, W, L, H))
dwheel = np.minimum(np.hypot(Y - front, Z - R), np.hypot(Y - rear, Z - R))
in_wheel = (dwheel < R * 1.03) & (np.abs(X) > 0.22 * W)

# ---------- 4. màu thân xe (đo trên cửa hông) ----------
mid, half = (front + rear) / 2, (front - rear) / 2
door = (np.abs(Y - mid) < 0.55 * half) & (Z > 0.3 * H) & (Z < 0.55 * H) & (np.abs(X) > 0.4 * W) & (np.abs(nor[:, 0]) > 0.7)
body = np.median(col[door][np.argsort(lum[door])][len(lum[door]) // 4: len(lum[door]) * 3 // 4], axis=0)
if 'body_color' in CFG:
    body = np.array(CFG['body_color'], np.float32)
b_lum = float(body @ np.array([0.2126, 0.7152, 0.0722]))
b_sat = float((body.max() - body.min()) / (body.max() + 1e-4))
b_hue = float(hue_of(body[None])[0])
colored = b_sat > 0.3 and body.max() > 0.38
dark_body = b_lum < 0.3
door_rough = float(np.median(rough[door]))
log('độ nhám cửa %.2f' % door_rough, 'màu thân sRGB', body.round(3), 'lum %.3f sat %.2f hue %.2f %s' % (b_lum, b_sat, b_hue, 'có màu' if colored else 'trung tính'))

# ---------- 5. phân loại ----------
dl = np.abs(np.log((lum + 0.01) / (b_lum + 0.01)))
dh = np.abs(hue - b_hue); dh = np.minimum(dh, 6 - dh) / 6
up = np.abs(nor[:, 2])
if colored:
    paint_like = (dh < 0.07) & (sat > 0.18) & (dl < 1.5)
else:
    sat_max = np.where(cmax < 0.25, 0.7, max(0.38, b_sat + 0.12))
    darker_ok = (lum <= b_lum) & (dl < 1.6) & dark_body  # chỗ tối hơn vẫn là sơn: chỉ đúng với xe sơn tối
    paint_like = (sat < sat_max) & ((dl < 0.8) | darker_ok | ((up > 0.85) & (dl < 1.6)))

cls = np.full(nf, TRIM, np.int8)
cls[paint_like] = PAINT
bright = lum > max(0.62, b_lum + 0.3)
cls[(~paint_like) & bright & (sat < 0.25)] = CHROME
red_light = (sat > 0.45) & ((hue < 0.75) | (hue > 5.5)) & (lum > 0.08) & ~(colored & (dh < 0.07))
amber = (sat > 0.5) & (hue > 0.4) & (hue < 1.2) & (lum > 0.25)
ends = np.abs(Y) > 0.36 * L
nose = FRONT * Y > 0.36 * L
cls[ends & (red_light | amber) & (Z > 0.2 * H)] = LIGHT
cls[nose & (lum > 0.8) & (Z > 0.3 * H) & (Z < 0.7 * H) & ~paint_like] = LIGHT  # đèn pha (đầu xe; đuôi là biển số)
belt = np.full(nf, CFG.get('belt', 0.63) * H, np.float32)
# kính hậu thường bắt đầu cao hơn kính hông: mặt quay ra sau ở đuôi xe dùng đường eo riêng
tail = (-FRONT * Y > 0.38 * L) & (-FRONT * nor[:, 1] > 0.3)
belt[tail] = CFG.get('rear_belt', CFG.get('belt', 0.63)) * H
glass_rough = rough > door_rough + 0.25
# gương chiếu hậu nhô ra xa nhất hai bên (W tính cả gương): không phải kính -> sơn nếu cùng màu thân, còn lại nhựa
mirror = (np.abs(X) > CFG.get('mirror_x', 0.445) * W) & (Z > 0.5 * H) & (Z < 0.8 * H)
if dark_body:
    # xe sơn tối: kính dán phim cũng tối gần bằng sơn, không tách được theo màu -> mọi mặt đứng trên đường eo là kính
    # (cột cửa xe tối thường cũng sơn đen bóng nên trông như kính). Crôm sáng vẫn giữ.
    glass = (Z > belt) & (up < 0.86) & (cls != CHROME) & (cls != LIGHT) & ~mirror
else:
    glass = (Z > belt) & (up < 0.86) & (~paint_like | glass_rough) & (cls != CHROME) & (cls != LIGHT) & ~mirror
cls[glass] = GLASS
roof_other = (Z > belt) & (up >= 0.86) & ~paint_like
cls[roof_other] = np.where(lum[roof_other] < 0.4, GLASS, TRIM)  # nóc kính toàn cảnh / cửa trời tối = kính, còn lại nhựa
low = Z < 0.13 * H
cls[low & ~in_wheel & (cls == PAINT)] = TRIM  # gầm, ốp dưới
cls[in_wheel] = np.where(dwheel[in_wheel] < 0.66 * R, RIM, TIRE)

# vùng chỉnh tay theo từng xe: [ {"class": "TC_Trim", "box": [x0,x1, y0,y1, z0,z1] (tỉ lệ W, L, H), "only": "TC_Body_Paint"} ]
for rule in CFG.get('regions', []):
    x0, x1, y0, y1, z0, z1 = rule['box']
    if rule.get('nose_relative'):  # y tính từ đầu xe vào trong (0 = mũi xe), tiện dùng cho lưới tản nhiệt
        ylo, yhi = sorted((FRONT * (0.5 - y1), FRONT * (0.5 - y0)))
        y0, y1 = ylo, yhi
    m = (X >= x0 * W) & (X <= x1 * W) & (Y >= y0 * L) & (Y <= y1 * L) & (Z >= z0 * H) & (Z <= z1 * H)
    if 'facing' in rule:  # chỉ các mặt quay về hướng này (+Y trước, -Y sau...)
        ax, sign = {'+x': (0, 1), '-x': (0, -1), '+y': (1, 1), '-y': (1, -1), '+z': (2, 1),
                    'front': (1, FRONT), 'rear': (1, -FRONT)}[rule['facing']]
        m &= sign * nor[:, ax] > rule.get('min_dot', 0.5)
    if 'only' in rule:
        m &= cls == CLASSES.index(rule['only'])
    cls[m] = CLASSES.index(rule['class'])
    log('vùng', rule['class'], int(m.sum()), 'mặt')

# ---------- 6. làm mượt (bỏ đốm lẻ): bầu chọn theo đỉnh, lặp 2 lần, giữ bánh xe ----------
nv = len(me.vertices)
face_of_loop = np.repeat(np.arange(nf), lt)
for _ in range(CFG.get('smooth', 3)):
    hist = np.zeros((nv, 7), np.int32)
    np.add.at(hist, (lv, cls[face_of_loop]), 1)
    fh = np.zeros((nf, 7), np.int32)
    np.add.at(fh, face_of_loop, hist[lv])
    new = fh.argmax(1).astype(np.int8)
    keep = in_wheel | (cls == LIGHT)
    cls = np.where(keep, cls, new)
counts = {CLASSES[i]: int((cls == i).sum()) for i in range(7)}
log('kết quả', counts)

# ---------- 7. vật liệu ----------
# độ nhám / kim loại thật của từng bộ phận (bỏ ảnh kim loại-độ nhám AI, vốn sai). Nhờ thông số khác nhau mà
# bước nén (gltf-transform dedup) không gộp các vật liệu lại làm một.
LOOK = {'TC_Body_Paint': (0.38, 0.15), 'TC_Glass': (0.04, 0.15), 'TC_Tire': (0.88, 0.0), 'TC_Rim': (0.28, 0.85),
        'TC_Chrome': (0.12, 1.0), 'TC_Trim': (0.55, 0.05), 'TC_Light': (0.1, 0.2)}
mats = []
for i, name in enumerate(CLASSES):
    m = src_mat.copy()
    m.name = name
    m.diffuse_color = (*PREVIEW_COLORS[i], 1)
    bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    for sock, val in (('Roughness', LOOK[name][0]), ('Metallic', LOOK[name][1])):
        for link in list(bsdf.inputs[sock].links):
            m.node_tree.links.remove(link)
        bsdf.inputs[sock].default_value = val
    mats.append(m)
me.materials.clear()
for m in mats:
    me.materials.append(m)
me.polygons.foreach_set('material_index', cls.astype(np.int32))
me.update()
bpy.data.materials.remove(src_mat)

# ---------- 8. ảnh xem trước phân loại ----------
if PREVIEW:
    os.makedirs(PREVIEW, exist_ok=True)
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.display.shading.light = 'STUDIO'
    sc.display.shading.color_type = 'MATERIAL'
    sc.render.resolution_x, sc.render.resolution_y = 1100, 700
    sc.world = bpy.data.worlds.new('w'); sc.world.color = (0.9, 0.9, 0.9)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    sc.collection.objects.link(cam); sc.camera = cam
    cam.data.lens = 50
    import mathutils
    for name, d in {'front34': (0.55, 1.0, 0.35), 'rear34': (-0.6, -1.0, 0.35), 'side': (1, 0, 0.12), 'front': (0, 1, 0.12),
                    'rear': (0, -1, 0.12), 'top': (0.01, 0.01, 1)}.items():
        v = mathutils.Vector(d).normalized()
        cam.location = v * (L * 1.55) + mathutils.Vector((0, 0, H * 0.45))
        cam.rotation_euler = (mathutils.Vector((0, 0, H * 0.45)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = os.path.join(PREVIEW, name + '.png')
        bpy.ops.render.render(write_still=True)
    log('ảnh xem trước ->', PREVIEW)

# ---------- 9. xuất ----------
bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB', use_selection=False, export_apply=True,
                          export_image_format='AUTO', export_yup=True)
log('xuất', DST, '%.1f MB' % (os.path.getsize(DST) / 1e6))
