// Danh sách ngân hàng đang hoạt động tại Việt Nam để admin chọn khi thêm (không gõ tay tên). `id` khớp mã đã lưu
// trong cấu hình (TPBANK, MSB, PVCOMBANK, HLBANK…). Tên theo tên giao dịch phổ biến; vài ngân hàng đã đổi tên gần
// đây (Vikki Bank — trước là DongA Bank, VCBNeo — trước là CBBank, MBV — trước là OceanBank, LPBank — trước là
// LienVietPostBank). Ngân hàng đổi tên / sáp nhập → sửa tại đây.

export const BANK_GROUPS = [
  { key: 'STATE', label: 'Ngân hàng thương mại nhà nước' },
  { key: 'JSC', label: 'Ngân hàng thương mại cổ phần' },
  { key: 'FOREIGN', label: 'Ngân hàng nước ngoài, liên doanh' },
]

const bank = (group, id, name, fullName) => ({ group, id, name, fullName })

/** @type {Array<{ group: string, id: string, name: string, fullName: string }>} */
export const VN_BANKS = [
  bank('STATE', 'AGRIBANK', 'Agribank', 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam'),
  bank('STATE', 'BIDV', 'BIDV', 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam'),
  bank('STATE', 'VIETCOMBANK', 'Vietcombank', 'Ngân hàng TMCP Ngoại thương Việt Nam'),
  bank('STATE', 'VIETINBANK', 'VietinBank', 'Ngân hàng TMCP Công Thương Việt Nam'),

  bank('JSC', 'ABBANK', 'ABBANK', 'Ngân hàng TMCP An Bình'),
  bank('JSC', 'ACB', 'ACB', 'Ngân hàng TMCP Á Châu'),
  bank('JSC', 'BACABANK', 'Bac A Bank', 'Ngân hàng TMCP Bắc Á'),
  bank('JSC', 'BAOVIETBANK', 'BaoViet Bank', 'Ngân hàng TMCP Bảo Việt'),
  bank('JSC', 'BVBANK', 'BVBank', 'Ngân hàng TMCP Bản Việt'),
  bank('JSC', 'EXIMBANK', 'Eximbank', 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam'),
  bank('JSC', 'GPBANK', 'GPBank', 'Ngân hàng TM TNHH MTV Dầu Khí Toàn Cầu'),
  bank('JSC', 'HDBANK', 'HDBank', 'Ngân hàng TMCP Phát triển TP. Hồ Chí Minh'),
  bank('JSC', 'KIENLONGBANK', 'KienlongBank', 'Ngân hàng TMCP Kiên Long'),
  bank('JSC', 'LPBANK', 'LPBank', 'Ngân hàng TMCP Lộc Phát Việt Nam'),
  bank('JSC', 'MB', 'MB', 'Ngân hàng TMCP Quân đội'),
  bank('JSC', 'MBV', 'MBV', 'Ngân hàng TNHH MTV Việt Nam Hiện Đại'),
  bank('JSC', 'MSB', 'MSB', 'Ngân hàng TMCP Hàng Hải Việt Nam'),
  bank('JSC', 'NAMABANK', 'Nam A Bank', 'Ngân hàng TMCP Nam Á'),
  bank('JSC', 'NCB', 'NCB', 'Ngân hàng TMCP Quốc Dân'),
  bank('JSC', 'OCB', 'OCB', 'Ngân hàng TMCP Phương Đông'),
  bank('JSC', 'PGBANK', 'PGBank', 'Ngân hàng TMCP Thịnh vượng và Phát triển'),
  bank('JSC', 'PVCOMBANK', 'PVcomBank', 'Ngân hàng TMCP Đại Chúng Việt Nam'),
  bank('JSC', 'SACOMBANK', 'Sacombank', 'Ngân hàng TMCP Sài Gòn Thương Tín'),
  bank('JSC', 'SAIGONBANK', 'Saigonbank', 'Ngân hàng TMCP Sài Gòn Công Thương'),
  bank('JSC', 'SCB', 'SCB', 'Ngân hàng TMCP Sài Gòn'),
  bank('JSC', 'SEABANK', 'SeABank', 'Ngân hàng TMCP Đông Nam Á'),
  bank('JSC', 'SHB', 'SHB', 'Ngân hàng TMCP Sài Gòn – Hà Nội'),
  bank('JSC', 'TECHCOMBANK', 'Techcombank', 'Ngân hàng TMCP Kỹ Thương Việt Nam'),
  bank('JSC', 'TPBANK', 'TPBank', 'Ngân hàng TMCP Tiên Phong'),
  bank('JSC', 'VCBNEO', 'VCBNeo', 'Ngân hàng TNHH MTV Ngoại thương Công nghệ số'),
  bank('JSC', 'VIB', 'VIB', 'Ngân hàng TMCP Quốc tế Việt Nam'),
  bank('JSC', 'VIETABANK', 'VietABank', 'Ngân hàng TMCP Việt Á'),
  bank('JSC', 'VIETBANK', 'Vietbank', 'Ngân hàng TMCP Việt Nam Thương Tín'),
  bank('JSC', 'VIKKIBANK', 'Vikki Bank', 'Ngân hàng TNHH MTV Số Vikki'),
  bank('JSC', 'VPBANK', 'VPBank', 'Ngân hàng TMCP Việt Nam Thịnh Vượng'),

  bank('FOREIGN', 'CIMB', 'CIMB', 'Ngân hàng TNHH MTV CIMB Việt Nam'),
  bank('FOREIGN', 'HLBANK', 'Hong Leong Bank', 'Ngân hàng TNHH MTV Hong Leong Việt Nam'),
  bank('FOREIGN', 'HSBC', 'HSBC', 'Ngân hàng TNHH MTV HSBC (Việt Nam)'),
  bank('FOREIGN', 'IVB', 'Indovina Bank', 'Ngân hàng TNHH Indovina'),
  bank('FOREIGN', 'PUBLICBANK', 'Public Bank', 'Ngân hàng TNHH MTV Public Việt Nam'),
  bank('FOREIGN', 'SHINHAN', 'Shinhan Bank', 'Ngân hàng TNHH MTV Shinhan Việt Nam'),
  bank('FOREIGN', 'SCVN', 'Standard Chartered', 'Ngân hàng TNHH MTV Standard Chartered (Việt Nam)'),
  bank('FOREIGN', 'UOB', 'UOB', 'Ngân hàng TNHH MTV UOB Việt Nam'),
  bank('FOREIGN', 'VRB', 'VRB', 'Ngân hàng Liên doanh Việt – Nga'),
  bank('FOREIGN', 'WOORI', 'Woori Bank', 'Ngân hàng TNHH MTV Woori Việt Nam'),
]

/** Bỏ dấu, chữ thường — để tìm "vietcom", "ngoai thuong", "á châu" đều ra. */
export const searchKey = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

/**
 * Ngân hàng khớp từ khoá (tên, tên đầy đủ hoặc mã), giữ thứ tự danh sách.
 * @param {string} query
 */
export const findBanks = (query) => {
  const key = searchKey(query).trim()
  if (!key) return VN_BANKS
  return VN_BANKS.filter((item) => searchKey(`${item.name} ${item.fullName} ${item.id}`).includes(key))
}
