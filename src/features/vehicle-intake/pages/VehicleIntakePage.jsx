import React, { useState } from 'react';
import VehicleDetailsForm from '../components/VehicleDetailsForm.jsx';
import TrustCarInspectionChecklist from '../components/TrustCarInspectionChecklist.jsx';
import VehicleIntakeSummary from '../components/VehicleIntakeSummary.jsx';
import Icon from '../components/VehicleIntakeIcon.jsx';
import { initialVehicleIntake, initialInspectionChecks, vehicleInspectionCriteria } from '../constants/vehicleIntakeConstants.js';
import { validateVehicleIntake } from '../utils/vehicleIntakeValidation.js';
import { saveVehicleIntake } from '../api/vehicleIntakeApi.js';
import styles from '../styles/VehicleIntake.module.css';

export default function VehicleIntakePage({ onSave = saveVehicleIntake }) {
  const [car, setCar] = useState(() => ({ ...initialVehicleIntake }));
  const [checks, setChecks] = useState(() => ({ ...initialInspectionChecks }));
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const checkedCount = vehicleInspectionCriteria.filter((item) => checks[item.id]).length;

  const handleCarChange = (event) => {
    const { name, value } = event.target;
    setCar((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setNotice(null);
  };

  const handleOwnershipChange = (ownership) => {
    setCar((current) => ({ ...current, ownership }));
    setNotice(null);
  };

  const handleCheckChange = (id, value) => {
    setChecks((current) => ({ ...current, [id]: value }));
    setNotice(null);
  };

  const handleNotesChange = (value) => {
    setNotes(value);
    setNotice(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    setNotice(null);
    const nextErrors = validateVehicleIntake(car);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setNotice({ type: 'error', text: 'Vui lòng kiểm tra các trường đang được đánh dấu.' });
      return;
    }

    const payload = { ...car, checklist: { ...checks }, notes: notes.trim() };
    setIsSaving(true);
    try {
      await onSave(payload);
      setNotice({ type: 'success', text: 'Đã lưu hồ sơ xe, checklist và ghi chú thẩm định TrustCar.' });
    } catch {
      setNotice({ type: 'error', text: 'Chưa lưu được hồ sơ. Vui lòng kiểm tra kết nối và thử lại.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles["page"]}>
      <div className={styles["content-wrap"]}>
          <section className={styles["page-heading"]}><div><div className={styles["eyebrow"]}><span className={styles["eyebrow-dot"]} />SCR-M04 · QUY TRÌNH NHẬP KHO</div><h1>Nhập xe mới & Thẩm định TrustCar</h1><p>Lưu hồ sơ, tình trạng kiểm tra và ghi chú để quản lý xe tại cửa hàng.</p></div><div className={styles["heading-meta"]}><Icon name="clipboard" size={16} />Hồ sơ quản lý nội bộ</div></section>

          <section className={styles["stepper"]} aria-label="Tiến độ hồ sơ"><div className={[styles["step"], styles["active"]].join(' ')}><span>01</span><div><strong>Thông tin xe</strong><small>Định danh & giá</small></div></div><div className={[styles["step-line"], styles["filled"]].join(' ')} /><div className={[styles["step"], styles["active"]].join(' ')}><span>02</span><div><strong>Thẩm định xe</strong><small>Checklist 5 tiêu chí</small></div></div><div className={styles["step-line"]} /><div className={styles["step"]}><span>03</span><div><strong>Xác nhận</strong><small>Lưu hồ sơ quản lý</small></div></div></section>

          {notice && <div className={[styles.notice, styles[notice.type]].join(' ')} role="status"><Icon name={notice.type === 'success' ? 'check' : 'info'} size={18} /><span>{notice.text}</span><button onClick={() => setNotice(null)} aria-label="Đóng thông báo"><Icon name="close" size={16} /></button></div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className={styles["workspace-grid"]}>
            <VehicleDetailsForm
              car={car}
              errors={errors}
              onChange={handleCarChange}
              onOwnershipChange={handleOwnershipChange}
            />
            <div className={styles["right-column"]}>
              <TrustCarInspectionChecklist
                checks={checks}
                notes={notes}
                checkedCount={checkedCount}
                onCheckChange={handleCheckChange}
                onNotesChange={handleNotesChange}
              />
              <VehicleIntakeSummary car={car} notes={notes} checkedCount={checkedCount} isSaving={isSaving} />
            </div>
          </div>
        </form>
          <footer className={styles["page-footer"]}><span>TrustCar Operations System</span><span>Hỗ trợ: support@trustcar.vn</span></footer>
      </div>
    </div>
  );
}
