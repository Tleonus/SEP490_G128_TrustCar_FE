import React from 'react';
import styles from '../styles/VehicleIntake.module.css';
import Icon from './VehicleIntakeIcon.jsx';

export default function VehicleIntakeSummary({ car, notes, checkedCount, isSaving }) {
  return (
                <section className={styles["review-card"]}>
                  <div className={styles["review-top"]}>
                    <div>
                      <span className={styles["section-kicker"]}>TÓM TẮT TRƯỚC KHI LƯU</span>
                      <h3>Kiểm tra lại hồ sơ</h3>
                    </div>
                    <span className={[styles["status-pill"], styles["record"]].join(' ')}>Quản lý nội bộ</span>
                  </div>
                  <div className={styles["review-rows"]}>
                    <div><span>Hồ sơ định danh</span><strong>{car.brand && car.model ? `${car.brand} ${car.model}` : 'Chưa nhập'}</strong></div>
                    <div><span>Biển số</span><strong>{car.licensePlate || '—'}</strong></div>
                    <div><span>Checklist thẩm định</span><strong>{checkedCount}/5 mục tích chọn</strong></div>
                    <div><span>Ghi chú</span><strong>{notes.trim() ? 'Đã ghi chú' : 'Chưa ghi chú'}</strong></div>
                  </div>
                  <button type="submit" className={styles["primary-button"]} disabled={isSaving}>
                    <Icon name="save" size={18} />
                    {isSaving ? 'Đang lưu hồ sơ...' : 'Lưu hồ sơ & biên bản'}
                    <Icon name="arrow" size={18} />
                  </button>
                  <p className={styles["submit-hint"]}>Thông tin thẩm định và giá xe do cửa hàng ghi nhận để quản lý trên hệ thống.</p>
                </section>
  );
}
