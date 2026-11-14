import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntdApp, theme } from 'antd'
import viVN from 'antd/locale/vi_VN.js'
import AppRouter from './router/AppRouter'
import { useThemeStore } from './store/useThemeStore'

function App() {
  const mode = useThemeStore((state) => state.mode)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#0b1f3a',
          colorInfo: '#0b1f3a',
          colorLink: '#c9a227',
          borderRadius: 8,
          fontFamily:
            "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        },
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
