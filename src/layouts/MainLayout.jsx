import { useLayoutEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import ChatWidget from '../components/chat/ChatWidget'
import FloatingContactWidget from '../components/contact/FloatingContactWidget'
import CompareBar from '../features/vehicle-compare/components/CompareBar'
import { useAuthStore } from '../store/useAuthStore'
import { useSavedCarsStore } from '../features/saved-cars/store/useSavedCarsStore'

export default function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const roleName = useAuthStore((state) => state.user?.roleName)
  const activateAuthenticated = useSavedCarsStore((state) => state.activateAuthenticated)
  const deactivateAuthenticated = useSavedCarsStore((state) => state.deactivateAuthenticated)

  useLayoutEffect(() => {
    if (isAuthenticated && roleName === 'CUSTOMER') activateAuthenticated()
    else deactivateAuthenticated()
  }, [isAuthenticated, roleName, activateAuthenticated, deactivateAuthenticated])

  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
      <FloatingContactWidget />
      <ChatWidget />
      <CompareBar />
    </>
  )
}

