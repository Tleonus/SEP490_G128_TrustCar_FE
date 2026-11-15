export { default as AdminDashboardPage } from './pages/AdminDashboardPage.jsx'
export { useDashboardData } from './hooks/useDashboardData.js'
export {
  buildMonthlyRevenue,
  computeKpis,
  buildBrandBreakdown,
  recentLeads,
  recentSoldCars,
  formatVndCompact,
  formatVndFull,
} from './utils/dashboardMetrics.js'
