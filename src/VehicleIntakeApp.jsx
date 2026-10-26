import React, { useState } from 'react';
import { VehicleIntakePage, saveVehicleIntake } from './features/vehicle-intake/index.js';
import Icon from './features/vehicle-intake/components/VehicleIntakeIcon.jsx';
import styles from './VehicleIntakeApp.module.css';

const saveVehicle = (payload) => saveVehicleIntake(payload, {
  endpoint: 'http://localhost:3001/api/cpo/vehicles',
});

export default function VehicleIntakeApp() {
  const [role, setRole] = useState('OWNER');

  return (
    <div className={styles["app-shell"]}>
      <aside className={styles["sidebar"]}>
        <div className={styles["brand-lockup"]}>
          <div className={styles["brand-mark"]}><Icon name="car" size={24} /></div>
          <div><strong>trust<span>car</span></strong><small>SHOWROOM OS</small></div>
        </div>
        <div className={styles["workspace-label"]}>WORKSPACE</div>
        <nav className={styles["main-nav"]} aria-label="Điều hướng chính">
          <a href="#dashboard"><Icon name="grid" />Tổng quan</a>
          <a href="#inventory"><Icon name="car" />Kho xe <span className={styles["nav-count"]}>24</span></a>
          <a className={styles["active"]} href="#inspection"><Icon name="clipboard" />Thẩm định xe</a>
          <a href="#sales"><Icon name="chart" />Bán xe</a>
          <a href="#settings"><Icon name="settings" />Thiết lập</a>
        </nav>
        <div className={styles["sidebar-bottom"]}>
          <div className={styles["help-card"]}><div className={styles["help-icon"]}><Icon name="info" size={17} /></div><div><strong>Cần hỗ trợ?</strong><span>Trung tâm hướng dẫn</span></div><Icon name="chevron" size={16} /></div>
          <div className={styles["profile-row"]}><div className={styles["avatar"]}>NA</div><div className={styles["profile-copy"]}><strong>Nguyễn An</strong><span>{role === 'STAFF' ? 'Nhân viên' : 'Chủ cửa hàng'}</span></div><button className={styles["icon-button"]} aria-label="Mở tùy chọn tài khoản"><Icon name="chevron" size={16} /></button></div>
        </div>
      </aside>

      <main className={styles["main-content"]}>
        <header className={styles["topbar"]}>
          <div className={styles["breadcrumbs"]}><span>Quản lý xe</span><Icon name="chevron" size={14} /><strong>Nhập xe & Thẩm định TrustCar</strong></div>
          <div className={styles["topbar-actions"]}><div className={styles["live-indicator"]}><i />Hệ thống đang hoạt động</div><button className={[styles["icon-button"], styles["notification-button"]].join(' ')} aria-label="Thông báo"><Icon name="bell" size={20} /><b>3</b></button><div className={styles["role-select"]}><span>Vai trò</span><select aria-label="Vai trò người dùng" value={role} onChange={(event) => setRole(event.target.value)}><option value="OWNER">Chủ cửa hàng</option><option value="STAFF">Nhân viên</option></select></div></div>
        </header>


        <VehicleIntakePage onSave={saveVehicle} />
      </main>
    </div>
  );
}
