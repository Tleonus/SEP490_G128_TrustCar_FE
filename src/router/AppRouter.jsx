import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AdminLayout from '../layouts/AdminLayout'
import AdminRoute from './AdminRoute'
import AdminOnlyRoute from './AdminOnlyRoute'
import HomePage from '../pages/Home/HomePage'
import CarsPage from '../pages/Cars/CarsPage'
import CarDetailPage from '../pages/CarDetail/CarDetailPage'
import LoginPage from '../pages/Login/LoginPage'
import RegisterPage from '../pages/Register/RegisterPage'
import ForgotPasswordPage from '../pages/ForgotPassword/ForgotPasswordPage'
import ResetPasswordPage from '../pages/ResetPassword/ResetPasswordPage'
import ChangePasswordPage from '../pages/ChangePassword/ChangePasswordPage'
import CompleteProfilePage from '../pages/CompleteProfile/CompleteProfilePage'
import ContactPage from '../pages/Contact/ContactPage'
import NotFoundPage from '../pages/NotFound/NotFoundPage'
import AdminCarsPage from '../pages/Admin/AdminCarsPage'
import { LoadingState } from '../components/common/StateBlock'
import PrivateRoute from './PrivateRoute'
import LegacyRedirect from './LegacyRedirect'
import { ADMIN_PATHS } from './paths'

const AdminVehicleIntakePage = lazy(() => import('../pages/Admin/AdminVehicleIntakePage.jsx'))
const AdminBaseSettingsPage = lazy(() => import('../pages/Admin/AdminBaseSettingsPage.jsx'))
const SalesCrmPage = lazy(() => import('../features/sales-crm/pages/SalesCrmPage.jsx'))
const ComparePage = lazy(() => import('../features/vehicle-compare/pages/ComparePage.jsx'))
const SavedCarsPage = lazy(() => import('../features/saved-cars/pages/SavedCarsPage.jsx'))
const CpoCertificatesPage = lazy(() => import('../features/cpo-certificates/pages/CpoCertificatesPage.jsx'))
const CpoCertificateDetailPage = lazy(() => import('../features/cpo-certificates/pages/CpoCertificateDetailPage.jsx'))
// KAN-55: kiểm định xe cho Sale
const InspectionQueuePage = lazy(() => import('../features/inspection/pages/InspectionQueuePage.jsx'))
const InspectionDetailPage = lazy(() => import('../features/inspection/pages/InspectionDetailPage.jsx'))
// KAN-34: tổng quan kiểm định, dẫn sang các màn KAN-55/KAN-56
const InspectionDashboardPage = lazy(() => import('../features/inspection-dashboard/pages/InspectionDashboardPage.jsx'))
// KAN-56: bảng điều khiển duyệt cho Admin
const ApprovalPage = lazy(() => import('../features/cpo-approval/pages/ApprovalPage.jsx'))
// KAN-35: tổng quan điều hành (KPI, doanh thu, hoạt động gần đây)
const AdminDashboardPage = lazy(() => import('../features/admin-dashboard/pages/AdminDashboardPage.jsx'))
const MyVisitsPage = lazy(() => import('../features/test-drive-booking/pages/MyVisitsPage.jsx'))
const StaffVisitsPage = lazy(() => import('../features/test-drive-booking/pages/StaffVisitsPage.jsx'))
// KAN-25: hồ sơ cá nhân và cài đặt
const ProfilePage = lazy(() => import('../features/user-profile-settings/pages/ProfilePage.jsx'))
// KAN-40: nhật ký hoạt động hệ thống (chỉ ADMIN)
const AuditLogsPage = lazy(() => import('../features/audit-logs/pages/AuditLogsPage.jsx'))
// KAN-93: quản lý nhân sự & gán nhiều vai trò (chỉ ADMIN)
const UserManagementPage = lazy(() => import('../features/user-management/pages/UserManagementPage.jsx'))
// KAN-61: trang tính trả góp (công khai)
const InstallmentPage = lazy(() => import('../features/installment-calculator/pages/InstallmentPage.jsx'))
const AdminLoanSettingsPage = lazy(() => import('../features/installment-calculator/admin/AdminLoanSettingsPage.jsx'))
// Showroom 3D toàn màn hình (tải lười three.js, không có header/footer)
const Showroom3DPage = lazy(() => import('../features/showroom-3d/pages/Showroom3DPage.jsx'))
// KAN-99: thanh toán tiền cọc qua VNPay
const VnpayReturnPage = lazy(() => import('../features/deposits/pages/VnpayReturnPage.jsx'))
const DepositSuccessPage = lazy(() => import('../features/deposits/pages/DepositSuccessPage.jsx'))
const DepositCancelPage = lazy(() => import('../features/deposits/pages/DepositCancelPage.jsx'))
// KAN-96: dịch vụ showroom (công khai + wizard đặt lịch + CRUD admin)
const ServicesPage = lazy(() => import('../features/services/pages/ServicesPage.jsx'))
const VerifyPage = lazy(() => import('../features/vehicle-history/pages/VerifyPage.jsx'))
const ServiceBookingPage = lazy(() => import('../features/services/pages/ServiceBookingPage.jsx'))
const AdminServicesPage = lazy(() => import('../features/services/pages/AdminServicesPage.jsx'))

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/xe" element={<CarsPage />} />
        <Route path="/xe/:stockCode" element={<CarDetailPage />} />
        <Route
          path="/xe-da-luu"
          element={
            <Suspense fallback={<LoadingState />}>
              <SavedCarsPage />
            </Suspense>
          }
        />
        <Route path="/installment" element={<Suspense fallback={<LoadingState />}><InstallmentPage /></Suspense>} />
        {/* KAN-99: 3 landing page khi khách quay lại từ VNPay */}
        <Route path="/dat-coc/vnpay-return" element={<Suspense fallback={<LoadingState />}><VnpayReturnPage /></Suspense>} />
        <Route path="/dat-coc/:id/thanh-cong" element={<Suspense fallback={<LoadingState />}><DepositSuccessPage /></Suspense>} />
        <Route path="/dat-coc/:id/da-huy" element={<Suspense fallback={<LoadingState />}><DepositCancelPage /></Suspense>} />
        <Route path="/dat-coc/:id/that-bai" element={<Suspense fallback={<LoadingState />}><DepositCancelPage /></Suspense>} />
        <Route path="/dat-coc/that-bai" element={<Suspense fallback={<LoadingState />}><DepositCancelPage /></Suspense>} />
        <Route path="/lien-he" element={<ContactPage />} />
        {/* KAN-96: dịch vụ showroom công khai + wizard đặt lịch (yêu cầu đăng nhập) */}
        <Route path="/dich-vu" element={<Suspense fallback={<LoadingState />}><ServicesPage /></Suspense>} />
        <Route
          path="/dich-vu/dat/:serviceId"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingState />}><ServiceBookingPage /></Suspense>
            </PrivateRoute>
          }
        />
        {/* KAN-98: trang xác thực chứng nhận khi khách quét mã QR trên báo cáo lịch sử xe */}
        <Route path="/verify/:hash" element={<Suspense fallback={<LoadingState />}><VerifyPage /></Suspense>} />
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />
        <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
        <Route path="/dat-lai-mat-khau" element={<ResetPasswordPage />} />
        {/* Link trong email đặt lại mật khẩu của BE dùng /reset-password */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/doi-mat-khau" element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} />
        <Route path="/hoan-tat-ho-so" element={<PrivateRoute><CompleteProfilePage /></PrivateRoute>} />
        {/* So sánh xe: công khai, khách chưa đăng nhập, khách hàng, nhân viên và admin đều dùng được */}
        <Route
          path="/so-sanh"
          element={
            <Suspense fallback={<LoadingState />}>
              <ComparePage />
            </Suspense>
          }
        />
        <Route
          path="/lich-hen"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingState />}>
                <MyVisitsPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={<PrivateRoute><Suspense fallback={<LoadingState />}><ProfilePage /></Suspense></PrivateRoute>}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/showroom-3d" element={<Suspense fallback={<LoadingState />}><Showroom3DPage /></Suspense>} />
      <Route path="/quan-ly/nhap-xe" element={<LegacyRedirect to={ADMIN_PATHS.vehicleIntake} />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to={ADMIN_PATHS.overview} replace />} />
        {/* KAN-35: trang tổng quan hợp nhất (tồn kho + KPI + biểu đồ + hoạt động).
            AdminRoute bên ngoài giới hạn ADMIN + SALES_STAFF; cả hai vai trò đọc được
            /manage/cars và /leads nên trang mở cho cả hai. Không bọc AdminOnlyRoute ở đây:
            LoginPage và AdminOnlyRoute đều chuyển hướng về /admin/overview, bọc ADMIN-only
            sẽ thành vòng lặp với SALES_STAFF. Link sang /admin/approval mới là ADMIN-only. */}
        <Route path="overview" element={<Suspense fallback={<LoadingState />}><AdminDashboardPage /></Suspense>} />
        {/* Đường dẫn cũ của KAN-35: giữ để link đã chia sẻ không chết. */}
        <Route path="dashboard" element={<LegacyRedirect to={ADMIN_PATHS.overview} />} />
        <Route path="inventory" element={<AdminCarsPage />} />
        {/* Quản lý bán hàng & chốt đơn (KAN-18): ADMIN, SALES_STAFF */}
        <Route path="sales" element={<Suspense fallback={<LoadingState />}><SalesCrmPage /></Suspense>} />
        <Route path="vehicle-intake" element={<Suspense fallback={<LoadingState />}><AdminVehicleIntakePage /></Suspense>} />
        <Route path="base-settings" element={<Suspense fallback={<LoadingState />}><AdminBaseSettingsPage /></Suspense>} />
        <Route path="inspection-dashboard" element={<Suspense fallback={<LoadingState />}><InspectionDashboardPage /></Suspense>} />
        {/* Kiểm định xe (KAN-55): ADMIN, SALES_STAFF. Backend vẫn kiểm quyền cuối cùng. */}
        <Route
          path="inspection"
          element={<Suspense fallback={<LoadingState />}><InspectionQueuePage /></Suspense>}
        />
        <Route
          path="inspection/:carId"
          element={<Suspense fallback={<LoadingState />}><InspectionDetailPage /></Suspense>}
        />
        {/* Duyệt kiểm định & mở bán (KAN-56): chỉ ADMIN. Backend vẫn kiểm quyền cuối cùng. */}
        <Route
          path="approval"
          element={
            <AdminOnlyRoute>
              <Suspense fallback={<LoadingState />}><ApprovalPage /></Suspense>
            </AdminOnlyRoute>
          }
        />
        {/* Nhật ký hoạt động (KAN-40): chỉ ADMIN. Backend vẫn kiểm quyền cuối cùng. */}
        <Route
          path="nhat-ky"
          element={
            <AdminOnlyRoute>
              <Suspense fallback={<LoadingState />}><AuditLogsPage /></Suspense>
            </AdminOnlyRoute>
          }
        />
        {/* Lãi suất trả góp (ngân hàng, lãi ưu đãi/thả nổi): chỉ ADMIN; BE PUT /settings/loan cũng chỉ ADMIN. */}
        <Route
          path="lai-suat-tra-gop"
          element={
            <AdminOnlyRoute>
              <Suspense fallback={<LoadingState />}><AdminLoanSettingsPage /></Suspense>
            </AdminOnlyRoute>
          }
        />
        {/* Quản lý người dùng & gán nhiều vai trò (KAN-93): chỉ ADMIN. */}
        <Route
          path="nguoi-dung"
          element={
            <AdminOnlyRoute>
              <Suspense fallback={<LoadingState />}><UserManagementPage /></Suspense>
            </AdminOnlyRoute>
          }
        />
        <Route path="kho-xe" element={<LegacyRedirect to={ADMIN_PATHS.inventory} />} />
        {/* Chứng nhận CPO: AdminRoute chỉ cho ADMIN, SALES_STAFF; BE vẫn kiểm quyền cuối cùng */}
        <Route
          path="chung-nhan"
          element={<Suspense fallback={<LoadingState />}><CpoCertificatesPage /></Suspense>}
        />
        <Route
          path="chung-nhan/:carId"
          element={<Suspense fallback={<LoadingState />}><CpoCertificateDetailPage /></Suspense>}
        />
        {/* Lịch lái thử: AdminRoute chỉ cho ADMIN, SALES_STAFF; BE kiểm quyền appointment:* */}
        <Route
          path="lich-lai-thu"
          element={<Suspense fallback={<LoadingState />}><StaffVisitsPage /></Suspense>}
        />
        {/* KAN-96: CRUD dịch vụ showroom. Trong AdminRoute (ADMIN + SALES_STAFF đọc được).
            Backend tự kiểm quyền service:write cho POST/PUT/DELETE, SALES_STAFF chỉ đọc. */}
        <Route
          path="dich-vu"
          element={<Suspense fallback={<LoadingState />}><AdminServicesPage /></Suspense>}
        />
        {/* Route admin không tồn tại: hiện 404 trong AdminLayout thay vì vùng nội dung trống */}
        <Route
          path="*"
          element={<NotFoundPage homePath={ADMIN_PATHS.overview} homeLabel="Về trang tổng quan" suggestions={[]} />}
        />
      </Route>
    </Routes>
  )
}
