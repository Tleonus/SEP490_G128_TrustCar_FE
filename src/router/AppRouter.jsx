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
import AboutPage from '../pages/About/AboutPage'
import ContactPage from '../pages/Contact/ContactPage'
import NotFoundPage from '../pages/NotFound/NotFoundPage'
import AdminCarsPage from '../pages/Admin/AdminCarsPage'
import { LoadingState } from '../components/common/StateBlock'
import PrivateRoute from './PrivateRoute'
import LegacyRedirect from './LegacyRedirect'
import { ADMIN_PATHS } from './paths'

const AdminVehicleIntakePage = lazy(() => import('../pages/Admin/AdminVehicleIntakePage.jsx'))
const AdminOverviewPage = lazy(() => import('../pages/Admin/AdminOverviewPage.jsx'))
const AdminBaseSettingsPage = lazy(() => import('../pages/Admin/AdminBaseSettingsPage.jsx'))
const SalesCrmPage = lazy(() => import('../features/sales-crm/pages/SalesCrmPage.jsx'))
const ComparePage = lazy(() => import('../features/vehicle-compare/pages/ComparePage.jsx'))
const SavedCarsPage = lazy(() => import('../features/saved-cars/pages/SavedCarsPage.jsx'))
const CpoCertificatesPage = lazy(() => import('../features/cpo-certificates/pages/CpoCertificatesPage.jsx'))
const CpoCertificateDetailPage = lazy(() => import('../features/cpo-certificates/pages/CpoCertificateDetailPage.jsx'))
// KAN-55: kiểm định xe cho Sale
const InspectionQueuePage = lazy(() => import('../features/inspection/pages/InspectionQueuePage.jsx'))
const InspectionDetailPage = lazy(() => import('../features/inspection/pages/InspectionDetailPage.jsx'))
// KAN-56: bảng điều khiển duyệt cho Admin
const ApprovalPage = lazy(() => import('../features/cpo-approval/pages/ApprovalPage.jsx'))
// KAN-66: chọn ảnh chia sẻ mạng xã hội trong kho xe
const SocialImagePage = lazy(() => import('../features/social-share-image/pages/SocialImagePage.jsx'))

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
        <Route path="/ve-chung-toi" element={<AboutPage />} />
        <Route path="/lien-he" element={<ContactPage />} />
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />
        <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
        <Route path="/dat-lai-mat-khau" element={<ResetPasswordPage />} />
        {/* Link trong email đặt lại mật khẩu của BE dùng /reset-password */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/doi-mat-khau" element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} />
        <Route path="/hoan-tat-ho-so" element={<PrivateRoute><CompleteProfilePage /></PrivateRoute>} />
        <Route
          path="/so-sanh"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingState />}>
                <ComparePage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
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
        <Route path="overview" element={<Suspense fallback={<LoadingState />}><AdminOverviewPage /></Suspense>} />
        <Route path="inventory" element={<AdminCarsPage />} />
        {/* Ảnh chia sẻ mạng xã hội (KAN-66): ADMIN, SALES_STAFF */}
        <Route
          path="inventory/:id"
          element={<Suspense fallback={<LoadingState />}><SocialImagePage /></Suspense>}
        />
        {/* Quản lý bán hàng & chốt đơn (KAN-18): ADMIN, SALES_STAFF */}
        <Route path="sales" element={<Suspense fallback={<LoadingState />}><SalesCrmPage /></Suspense>} />
        <Route path="vehicle-intake" element={<Suspense fallback={<LoadingState />}><AdminVehicleIntakePage /></Suspense>} />
        <Route path="base-settings" element={<Suspense fallback={<LoadingState />}><AdminBaseSettingsPage /></Suspense>} />
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
        {/* Route admin không tồn tại: hiện 404 trong AdminLayout thay vì vùng nội dung trống */}
        <Route
          path="*"
          element={<NotFoundPage homePath={ADMIN_PATHS.overview} homeLabel="Về trang tổng quan" suggestions={[]} />}
        />
      </Route>
    </Routes>
  )
}
