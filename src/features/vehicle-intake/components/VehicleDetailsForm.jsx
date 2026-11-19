import { useRef } from 'react';
import styles from '../styles/VehicleIntake.module.css';
import VehicleIntakeField from './VehicleIntakeField.jsx';
import Icon from './VehicleIntakeIcon.jsx';

const ACCEPTED_FILE_TYPES = 'image/*,application/pdf';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function VehicleDetailsForm({
  car,
  errors,
  onChange,
  onOwnershipChange,
  attachments = [],
  onAddFiles,
  onRemoveFile,
}) {
  const fileInputRef = useRef(null);

  const handleTriggerPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFilesSelected = (event) => {
    const picked = Array.from(event.target.files || []);
    if (picked.length > 0 && typeof onAddFiles === 'function') {
      const accepted = picked.filter((file) => file.size <= MAX_FILE_SIZE_BYTES);
      if (accepted.length > 0) onAddFiles(accepted);
    }
    // Reset để có thể chọn lại cùng một tệp nếu cần.
    event.target.value = '';
  };

  return (
    <div className={styles["left-column"]}>
                <section className={[styles["panel"], styles["form-panel"]].join(' ')}><div className={styles["panel-heading"]}><div><span className={styles["section-kicker"]}>PHẦN 01</span><h2>Thông tin hồ sơ xe</h2><p>Nhập chính xác theo giấy tờ xe và kết quả đối chiếu thực tế.</p></div><span className={styles["required-note"]}><span className={styles["required"]}>*</span> Bắt buộc</span></div>
                  <div className={styles["subsection"]}><div className={styles["subsection-title"]}><span className={styles["subsection-number"]}>A</span><div><strong>Thông tin định danh</strong><span>Nhận diện duy nhất của xe trong kho</span></div></div><div className={[styles["field-grid"], styles["two-col"]].join(' ')}><VehicleIntakeField label="Biển số xe" name="licensePlate" value={car.licensePlate} onChange={onChange} error={errors.licensePlate} required placeholder="51H-123.45" /><VehicleIntakeField label="Số khung (VIN)" name="vin" value={car.vin} onChange={onChange} error={errors.vin} required placeholder="17 ký tự trên giấy đăng ký" /><VehicleIntakeField label="Hãng xe" name="brand" value={car.brand} onChange={onChange} error={errors.brand} required placeholder="Ví dụ: Toyota" /><VehicleIntakeField label="Dòng xe" name="model" value={car.model} onChange={onChange} error={errors.model} required placeholder="Ví dụ: Camry 2.5Q" /><VehicleIntakeField label="Năm sản xuất" name="year" value={car.year} onChange={onChange} error={errors.year} required type="number" placeholder="2022" /><VehicleIntakeField label="Số km đã đi" name="mileage" value={car.mileage} onChange={onChange} error={errors.mileage} required type="number" placeholder="45,200" suffix="km" /></div></div>
                  <div className={styles["subsection"]}><div className={styles["subsection-title"]}><span className={styles["subsection-number"]}>B</span><div><strong>Thông số vận hành</strong><span>Thông tin hiển thị cho tư vấn bán hàng</span></div></div><div className={[styles["field-grid"], styles["two-col"]].join(' ')}><VehicleIntakeField label="Hộp số" name="transmission" value={car.transmission} onChange={onChange} required><span className={styles["select-wrap"]}><select name="transmission" value={car.transmission} onChange={onChange}><option value="automatic">Tự động</option><option value="manual">Số sàn</option><option value="cvt">CVT</option><option value="hybrid">e-CVT / Hybrid</option></select><Icon name="chevron" size={17} /></span></VehicleIntakeField><VehicleIntakeField label="Loại nhiên liệu" name="fuel" value={car.fuel} onChange={onChange} required><span className={styles["select-wrap"]}><select name="fuel" value={car.fuel} onChange={onChange}><option value="gasoline">Xăng</option><option value="diesel">Dầu diesel</option><option value="hybrid">Hybrid</option><option value="electric">Điện</option></select><Icon name="chevron" size={17} /></span></VehicleIntakeField></div></div>
                  <div className={[styles["subsection"], styles["pricing-section"]].join(' ')}><div className={styles["subsection-title"]}><span className={styles["subsection-number"]}>C</span><div><strong>Giá cả & phân loại</strong><span>Xác định chính sách sở hữu và biên độ giá bán</span></div></div><div className={styles["ownership-toggle"]}><span className={styles["field-label"]}>Loại hình sở hữu <span className={styles["required"]}>*</span></span><div className={styles["segmented"]}><button type="button" className={car.ownership === 'company' ? styles.selected : ''} aria-pressed={car.ownership === 'company'} onClick={() => onOwnershipChange('company')}>Xe công ty sở hữu</button><button type="button" className={car.ownership === 'consignment' ? styles.selected : ''} aria-pressed={car.ownership === 'consignment'} onClick={() => onOwnershipChange('consignment')}>Xe ký gửi</button></div></div><div className={[styles["field-grid"], styles["two-col"]].join(' ')}><VehicleIntakeField label="Giá niêm yết ban đầu" name="listedPrice" value={car.listedPrice} onChange={onChange} error={errors.listedPrice} required type="number" placeholder="850,000,000" suffix="VNĐ" /><VehicleIntakeField label="Giá sàn bán tối thiểu" name="floorPrice" value={car.floorPrice} onChange={onChange} error={errors.floorPrice} required type="number" placeholder="810,000,000" suffix="VNĐ" /><VehicleIntakeField label="Giá xe mới lăn bánh (gạch ngang tham khảo)" name="marketPrice" value={car.marketPrice ?? ''} onChange={onChange} error={errors.marketPrice} type="number" placeholder="1,150,000,000" suffix="VNĐ" /></div><div className={styles["price-hint"]}><Icon name="info" size={15} /><span>Giá sàn dùng để cảnh báo khi giao dịch. Giá xe mới lăn bánh lưu vào Database (`marketPrice`) để hiển thị giá gạch ngang & độ chênh lệch tiết kiệm trên trang chi tiết xe.</span></div></div>
                </section>
                <section className={[styles["panel"], styles["upload-panel"]].join(' ')}>
                  <div className={styles["upload-copy"]}>
                    <div className={styles["upload-icon"]}><Icon name="upload" size={21} /></div>
                    <div>
                      <h3>Đính kèm hồ sơ xe <span>Tuỳ chọn</span></h3>
                      <p>Tải đăng ký xe, đăng kiểm hoặc ảnh giấy tờ để đối chiếu sau. Hỗ trợ ảnh hoặc PDF, tối đa 10MB mỗi tệp.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles["secondary-button"]}
                    onClick={handleTriggerPicker}
                  >
                    <Icon name="plus" size={17} />Thêm tệp
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED_FILE_TYPES}
                    onChange={handleFilesSelected}
                    className={styles["file-input-hidden"]}
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                  {attachments.length > 0 && (
                    <ul className={styles["attachment-list"]} aria-label="Danh sách tệp đã đính kèm">
                      {attachments.map((file, index) => (
                        <li key={`${file.name}-${index}`} className={styles["attachment-item"]}>
                          <span className={styles["attachment-icon"]} aria-hidden="true">
                            <Icon name="clipboard" size={16} />
                          </span>
                          <span className={styles["attachment-meta"]}>
                            <strong>{file.name}</strong>
                            <span>{formatFileSize(file.size)}</span>
                          </span>
                          <button
                            type="button"
                            className={styles["attachment-remove"]}
                            onClick={() => onRemoveFile && onRemoveFile(index)}
                            aria-label={`Xoá tệp ${file.name}`}
                          >
                            <Icon name="close" size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
    </div>
  );
}
