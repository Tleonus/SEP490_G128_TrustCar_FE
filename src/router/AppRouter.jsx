import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import HomePage from '../pages/Home/HomePage'
import CarsPage from '../pages/Cars/CarsPage'
import CarDetailPage from '../pages/CarDetail/CarDetailPage'
import LoginPage from '../pages/Login/LoginPage'
import AboutPage from '../pages/About/AboutPage'
import ContactPage from '../pages/Contact/ContactPage'
import NotFoundPage from '../pages/NotFound/NotFoundPage'
import { LoadingState } from '../components/common/StateBlock'

const VehicleIntakeApp = lazy(() => import('../VehicleIntakeApp.jsx'))

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/xe" element={<CarsPage />} />
        <Route path="/xe/:id" element={<CarDetailPage />} />
        <Route path="/ve-chung-toi" element={<AboutPage />} />
        <Route path="/lien-he" element={<ContactPage />} />
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route
        path="/quan-ly/nhap-xe"
        element={
          <Suspense fallback={<LoadingState />}>
            <VehicleIntakeApp />
          </Suspense>
        }
      />
    </Routes>
  )
}
