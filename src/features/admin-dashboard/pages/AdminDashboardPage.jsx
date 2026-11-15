/**
 * KAN-35 – Trang Tổng quan hợp nhất cho Admin: /admin/overview
 *
 * Trước đây khu quản trị có hai trang gần trùng nhau:
 *   /admin/overview  (AdminOverviewPage) – đếm xe theo trạng thái, xe mới nhập
 *   /admin/dashboard (KAN-35)           – KPI doanh thu, biểu đồ, hoạt động gần đây
 * Trang này gộp cả hai: một lần tải dữ liệu, một bố cục, không còn số liệu lặp.
 *
 * /admin/dashboard vẫn được giữ và chuyển hướng về đây để link cũ không chết.
 *
 * Bố cục: dải tồn kho → 4 thẻ KPI → 2 biểu đồ → bảng hoạt động (lead, xe vừa bán, xe mới nhập).
 *
 * Số liệu lấy từ API có thật (GET /manage/cars, GET /leads). Backend chưa có API doanh thu,
 * nên "Tổng doanh thu" là tổng giá niêm yết của xe đã SOLD trong tháng — trang ghi rõ.
 */

import { Link } from 'react-router-dom'
import { Alert, Button, Tooltip } from 'antd'
import {
  AppstoreOutlined,
  CarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useDashboardData } from '../hooks/useDashboardData'
import KpiCard from '../components/KpiCard'
import RevenueLineChart from '../components/RevenueLineChart'
import BrandPieChart from '../components/BrandPieChart'
import { RecentLeadsTable, RecentNewCarsTable, RecentSoldTable } from '../components/DashboardTables'
import {
  buildBrandBreakdown,
  buildMonthlyRevenue,
  computeKpis,
  formatVndFull,
  inventoryBreakdown,
  recentLeads,
  recentNewCars,
  recentSoldCars,
} from '../utils/dashboardMetrics'
import {
  RECENT_LEADS_LIMIT,
  RECENT_NEW_CARS_LIMIT,
  RECENT_SOLD_LIMIT,
  REVENUE_MONTHS,
} from '../constants/dashboardConstants'
import { ADMIN_PATHS } from '../../../router/paths'
import { useAuthStore } from '../../../store/useAuthStore'
import { ErrorState } from '../../../components/common/StateBlock'
import styles from '../styles/AdminDashboardPage.module.css'

const countFormatter = (value) => new Intl.NumberFormat('vi-VN').format(value ?? 0)

function SectionSkeleton({ rows = 4 }) {
  return (
    <div className={styles.skeletonBlock} aria-busy="true" role="status">
      <div className={styles.skeletonLine} style={{ width: '32%' }} />
      <div className={styles.skeletonChart} />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.skeletonLine} style={{ width: `${90 - i * 8}%` }} />
      ))}
    </div>
  )
}

/** Một ô trong dải tồn kho. */
function StockTile({ label, value, icon, tone, to, loading }) {
  const content = (
    <div className={`${styles.stockTile} ${styles[tone]}`}>
      <span className={styles.stockIcon} aria-hidden="true">{icon}</span>
      <span className={styles.stockValue}>
        {loading ? <span className={styles.stockSkeleton} /> : countFormatter(value)}
      </span>
      <span className={styles.stockLabel}>{label}</span>
    </div>
  )
  if (!to) return content
  return <Link to={to} className={styles.stockLink} aria-label={`${label}: ${value} xe`}>{content}</Link>
}

export default function AdminDashboardPage() {
  const { cars, leads, leadsAvailable, partial, carTotal, loading, error, reload } = useDashboardData()
  // /admin/approval chỉ ADMIN vào được; SALES_STAFF xem thẻ chờ duyệt nhưng không có link.
  const isAdmin = useAuthStore((state) => state.user?.roleName === 'ADMIN')

  const kpis = computeKpis(cars)
  const stock = inventoryBreakdown(cars)
  const revenueSeries = buildMonthlyRevenue(cars, { months: REVENUE_MONTHS })
  const brands = buildBrandBreakdown(cars)
  const latestLeads = recentLeads(leads, RECENT_LEADS_LIMIT)
  const latestSold = recentSoldCars(cars, RECENT_SOLD_LIMIT)
  const latestNew = recentNewCars(cars, RECENT_NEW_CARS_LIMIT)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>QUẢN TRỊ · ĐIỀU HÀNH</span>
          <h1 className={styles.title}>Tổng quan kinh doanh</h1>
          <p className={styles.desc}>
            Doanh thu, tồn kho và hoạt động bán hàng của toàn hệ thống TrustCar.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button icon={<ReloadOutlined />} onClick={reload} loading={loading}>Làm mới</Button>
          <Link to={ADMIN_PATHS.vehicleIntake}>
            <Button type="primary" icon={<PlusOutlined />}>Nhập xe &amp; thẩm định</Button>
          </Link>
        </div>
      </header>

      {error ? (
        <>
          <ErrorState message={error} />
          <div>
            <Button type="primary" icon={<ReloadOutlined />} onClick={reload}>Thử lại</Button>
          </div>
        </>
      ) : (
        <>
          {!loading && (partial || kpis.soldMissingDate > 0 || !leadsAvailable) && (
            <div className={styles.notices}>
              {partial && (
                <Alert
                  type="warning"
                  showIcon
                  title="Số liệu chỉ tính trên một phần kho xe"
                  description={`Kho có ${countFormatter(carTotal)} xe nhưng trang chỉ tải được ${countFormatter(cars.length)} xe (giới hạn phân trang). Các con số bên dưới chưa phản ánh toàn bộ kho.`}
                />
              )}
              {kpis.soldMissingDate > 0 && (
                <Alert
                  type="info"
                  showIcon
                  icon={<WarningOutlined />}
                  title={`${kpis.soldMissingDate} xe đã bán nhưng thiếu ngày bán`}
                  description="Các xe này không được tính vào doanh thu theo tháng. Dữ liệu cũ có thể chưa lưu trường ngày bán."
                />
              )}
              {!leadsAvailable && (
                <Alert
                  type="info"
                  showIcon
                  title="Chưa tải được danh sách lead"
                  description="Backend trên môi trường này chưa mở route /leads cho tài khoản hiện tại. Các chỉ số khác vẫn chính xác."
                />
              )}
            </div>
          )}

          {/* Dải tồn kho: thay cho 4 thẻ đếm xe của trang cũ, gọn hơn và không lặp với KPI. */}
          <section className={styles.stockStrip} aria-label="Tồn kho theo trạng thái">
            <StockTile
              label="Tổng số xe"
              value={stock.total}
              icon={<AppstoreOutlined />}
              tone="stockTotal"
              to={ADMIN_PATHS.inventory}
              loading={loading}
            />
            <StockTile
              label="Đang bán"
              value={stock.available}
              icon={<CarOutlined />}
              tone="stockAvailable"
              to={`${ADMIN_PATHS.inventory}?status=AVAILABLE`}
              loading={loading}
            />
            <StockTile
              label="Mới nhập"
              value={stock.incoming}
              icon={<InboxOutlined />}
              tone="stockIncoming"
              to={`${ADMIN_PATHS.inventory}?status=INCOMING`}
              loading={loading}
            />
            <StockTile
              label="Đã đặt cọc"
              value={stock.reserved}
              icon={<ClockCircleOutlined />}
              tone="stockReserved"
              to={`${ADMIN_PATHS.inventory}?status=RESERVED`}
              loading={loading}
            />
            <StockTile
              label="Đã bán"
              value={stock.sold}
              icon={<ShoppingOutlined />}
              tone="stockSold"
              to={`${ADMIN_PATHS.inventory}?status=SOLD`}
              loading={loading}
            />
          </section>

          <section className={styles.kpiGrid} aria-label="Chỉ số kinh doanh">
            <KpiCard
              title="Tổng doanh thu tháng này"
              value={kpis.revenueThisMonth}
              formatter={(value) => formatVndFull(value)}
              delta={{ value: kpis.revenueDeltaPct, unit: '%', positiveIsGood: true }}
              hint={kpis.revenuePrevMonth === 0 ? 'Tháng trước chưa có doanh thu để so sánh.' : undefined}
              icon={<DollarOutlined />}
              tone="kpiRevenue"
              loading={loading}
            />
            <KpiCard
              title="Xe đã bán tháng này"
              value={kpis.soldThisMonth}
              suffix="xe"
              formatter={countFormatter}
              delta={{ value: kpis.soldDelta, unit: ' xe', positiveIsGood: true }}
              description={`Tháng trước: ${countFormatter(kpis.soldPrevMonth)} xe`}
              icon={<ShoppingOutlined />}
              tone="kpiSold"
              loading={loading}
            />
            <KpiCard
              title="Xe đang bán"
              value={kpis.availableInventory}
              suffix="xe"
              formatter={countFormatter}
              description="Xe ở trạng thái Đang bán trên trang công khai."
              icon={<CarOutlined />}
              tone="kpiInventory"
              loading={loading}
            />
            <KpiCard
              title="Yêu cầu chờ duyệt"
              value={kpis.pendingApprovals}
              suffix="xe"
              formatter={countFormatter}
              description={`${countFormatter(kpis.inspectionQueue)} chờ duyệt thẩm định · ${countFormatter(kpis.saleQueue)} chờ duyệt mở bán`}
              icon={<WarningOutlined />}
              tone="kpiPending"
              to={isAdmin ? ADMIN_PATHS.approval : undefined}
              linkLabel={isAdmin ? 'Đi tới trang duyệt' : undefined}
              hint={isAdmin ? undefined : 'Chỉ Quản trị viên mới mở được trang duyệt.'}
              loading={loading}
            />
          </section>

          <div className={styles.chartsGrid}>
            <section className={styles.chartBlock} aria-labelledby="revenue-chart-title">
              <header className={styles.blockHead}>
                <div>
                  <h2 id="revenue-chart-title">Doanh thu {REVENUE_MONTHS} tháng gần nhất</h2>
                  <p>
                    <Tooltip title="Cộng giá niêm yết của xe chuyển sang Đã bán trong tháng. Backend chưa có API doanh thu nên đây không phải giá chốt hợp đồng.">
                      <span className={styles.understandable}>Cách tính: giá niêm yết của xe đã bán</span>
                    </Tooltip>
                  </p>
                </div>
              </header>
              {loading ? <SectionSkeleton rows={1} /> : <RevenueLineChart data={revenueSeries} />}
            </section>

            <section className={styles.chartBlock} aria-labelledby="brand-chart-title">
              <header className={styles.blockHead}>
                <div>
                  <h2 id="brand-chart-title">Tỷ trọng xe theo hãng</h2>
                  <p>Phân bố toàn bộ xe trong kho theo hãng sản xuất.</p>
                </div>
              </header>
              {loading ? <SectionSkeleton rows={3} /> : <BrandPieChart data={brands} />}
            </section>
          </div>

          <div className={styles.tablesGrid}>
            {loading
              ? <SectionSkeleton rows={5} />
              : <RecentLeadsTable leads={latestLeads} available={leadsAvailable} />}
            {loading
              ? <SectionSkeleton rows={4} />
              : <RecentSoldTable cars={latestSold} />}
          </div>

          <div className={styles.wideBlock}>
            {loading
              ? <SectionSkeleton rows={5} />
              : <RecentNewCarsTable cars={latestNew} />}
          </div>
        </>
      )}
    </div>
  )
}
