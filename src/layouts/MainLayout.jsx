import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import ChatWidget from '../components/chat/ChatWidget'

export default function MainLayout() {
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </>
  )
}
