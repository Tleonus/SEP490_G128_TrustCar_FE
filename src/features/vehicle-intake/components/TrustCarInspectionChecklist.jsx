import React from 'react';
import styles from '../styles/VehicleIntake.module.css';
import { vehicleInspectionCriteria } from '../constants/vehicleIntakeConstants.js';
import Icon from './VehicleIntakeIcon.jsx';

export default function TrustCarInspectionChecklist({ checks, notes, checkedCount, onCheckChange, onNotesChange }) {
  return (
                <section className={[styles["panel"], styles["checklist-panel"]].join(' ')} id="inspection" aria-labelledby="inspection-title">
                  <div className={[styles["panel-heading"], styles["checklist-heading"]].join(' ')}>
                    <div>
                      <span className={styles["section-kicker"]}>PHẦN 02</span>
                      <h2 id="inspection-title">Biên bản thẩm định TrustCar</h2>
                      <p>Tích chọn những tiêu chí xe đáp ứng khi kiểm tra thực tế.</p>
                    </div>
                    <div className={styles["checklist-counter"]} aria-live="polite" aria-atomic="true">
                      <strong>{checkedCount}/5</strong>
                      <span>đã tích chọn</span>
                    </div>
                  </div>

                  <div className={styles["checklist-list"]}>
                    {vehicleInspectionCriteria.map((item) => (
                      <label className={[styles['check-item'], checks[item.id] ? styles.checked : ''].join(' ')} key={item.id}>
                        <input
                          className={styles["criterion-checkbox"]}
                          type="checkbox"
                          name={item.id}
                          checked={checks[item.id]}
                          onChange={(event) => onCheckChange(item.id, event.target.checked)}
                          aria-labelledby={`criterion-${item.id}`}
                          aria-describedby={`criterion-${item.id}-hint`}
                        />
                        <span className={styles["criterion-copy"]}>
                          <strong id={`criterion-${item.id}`}>{item.title}</strong>
                          <span id={`criterion-${item.id}-hint`}>{item.hint}</span>
                        </span>
                        <span className={styles["criterion-index"]} aria-hidden="true">{item.number}</span>
                      </label>
                    ))}
                  </div>

                  <div className={styles["inspection-guidance"]}>
                    <Icon name="info" size={20} />
                    <p>Checklist ghi nhận tình trạng xe để quản lý nội bộ. Chủ cửa hàng quyết định nhập xe và định giá theo tình trạng thực tế.</p>
                  </div>

                  <label className={styles["notes-field"]} htmlFor="inspection-notes">
                    <span className={styles["field-label"]}>Ghi chú thẩm định <span className={styles["optional-label"]}>Tuỳ chọn</span></span>
                    <textarea
                      id="inspection-notes"
                      name="notes"
                      value={notes}
                      onChange={(event) => onNotesChange(event.target.value)}
                      placeholder="Ghi lại tình trạng thực tế, hạng mục cần sửa chữa, dự kiến chi phí hoặc lưu ý khi định giá xe..."
                      rows="5"
                    />
                    <span className={styles["notes-hint"]}>Ghi chú được lưu cùng hồ sơ xe, áp dụng cho mọi kết quả checklist.</span>
                  </label>
                </section>
  );
}
