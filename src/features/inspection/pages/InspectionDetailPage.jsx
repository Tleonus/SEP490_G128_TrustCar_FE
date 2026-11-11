/**
 * KAN-55 – Màn lập biên bản kiểm định: /admin/inspection/:carId
 *
 * Thành phần theo yêu cầu ticket:
 *   1. Thông tin tổng quan xe            → GET /manage/cars/:carId
 *   2. 5 tiêu chí CPO                    → tái sử dụng TrustCarInspectionChecklist.jsx (không sửa)
 *   3. Upload ảnh bằng chứng             → POST /inspections/:id/upload-signature + Cloudinary
 *   4. Danh sách ảnh đã upload           → hiển thị lại, xem phóng to, gỡ được
 *   5. Lưu nháp                          → PATCH /inspections/:id (chỉ section đã sửa)
 *   6. Gửi biên bản                      → POST /inspections/:id/submit (BE chấm và khoá)
 *
 * 5 tiêu chí = 5 nhóm của checklist Backend: mỗi nhóm có `criteriaKey` là một trong 5
 * boolean mà evaluateCPO dùng, và Backend suy ra tiêu chí từ kết quả từng hạng mục.
 */

import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert, App, Button, Collapse, Tag } from 'antd'
import { ArrowLeftOutlined, PlayCircleOutlined } from '@ant-design/icons'

import TrustCarInspectionChecklist from '../../vehicle-intake/components/TrustCarInspectionChecklist'
import { useInspectionDraft } from '../hooks/useInspectionDraft'
import InspectionCarSummary from '../components/InspectionCarSummary'
import RejectedBanner from '../components/RejectedBanner'
import VehicleInfoForm from '../components/VehicleInfoForm'
import OverviewPhotos from '../components/OverviewPhotos'
import ChecklistGroupPanel from '../components/ChecklistGroupPanel'
import SubmitReadiness from '../components/SubmitReadiness'
import InspectionActionBar from '../components/InspectionActionBar'
import { LoadingState, ErrorState } from '../../../components/common/StateBlock'
import { ADMIN_PATHS } from '../../../router/paths'
import { countChecked, deriveChecks } from '../data/draftState'
import { resolveRejectedNotice } from '../utils/rejectedReason'
import { groupViolationCounts } from '../utils/inspectionValidation'
import {
  CAR_STATUS_META,
  CRITERION_TO_GROUP,
  INSPECTION_RESULT_META,
  INSPECTION_STATUS_META,
  SUPPORTED_CHECKLIST_VERSION,
} from '../constants/inspectionConstants'
import styles from '../styles/InspectionDetailPage.module.css'

export default function InspectionDetailPage() {
  const { carId } = useParams()
  const { notification } = App.useApp()
  const draft = useInspectionDraft(carId)
  const accordionRef = useRef(null)

  const [activeGroupKey, setActiveGroupKey] = useState(null)
  const [readinessExpanded, setReadinessExpanded] = useState(false)

  const {
    car, record, state, checklist, checklistSupported, violations, evidenceCount, submitResult,
    loadingCar, loadError, actionError, starting, saving, submitting, uploading, uploadingCount,
    isDirty, isLocked, readOnly, canStart, restoredFromCache,
    startDraft, saveDraft, submit, uploadEvidence, dismissRestored,
    setVehicleField, setOverviewPhoto, setGroupNote, setGroupPhotos, setOdometerPhoto,
    setItemResult, setItemNote, setItemPhotos, setMinorDefects, setGroupVerdict, applyResultToGroup,
  } = draft

  const currentGroupKey = activeGroupKey || checklist?.[0]?.key || null
  const violationCounts = useMemo(() => groupViolationCounts(violations), [violations])

  /** Biên bản/xe bị trả lại: ưu tiên bản vừa gửi, rồi tới bản ghi đang mở. */
  const rejectedNotice = useMemo(() => {
    const submittedFailed = submitResult?.inspectionRecord?.result === 'FAILED'
      ? submitResult.inspectionRecord
      : null
    const recordFailed = record?.result === 'FAILED' ? record : null
    const failedRecord = submittedFailed || recordFailed
    if (car?.status !== 'REJECTED' && !failedRecord) return null
    return resolveRejectedNotice({ car, record: failedRecord })
  }, [car, record, submitResult])

  function openGroup(groupKey) {
    setActiveGroupKey(groupKey)
    requestAnimationFrame(() => {
      accordionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  async function handleSave() {
    const result = await saveDraft()
    if (result?.ok === false) {
      notification.error({ message: 'Chưa lưu được biên bản', description: result.message })
      return
    }
    if (result?.skipped) {
      notification.info({ message: 'Không có thay đổi nào để lưu.' })
      return
    }
    notification.success({ message: 'Đã lưu nháp biên bản kiểm định.' })
  }

  async function handleSubmit() {
    const result = await submit()
    if (result?.ok) {
      const inspectionRecord = result.result?.inspectionRecord
      const passed = inspectionRecord?.result === 'PASSED'
      notification[passed ? 'success' : 'warning']({
        message: passed ? 'Biên bản đã gửi — xe đạt chuẩn CPO' : 'Biên bản đã gửi — xe không đạt chuẩn CPO',
        description: passed
          ? `Mã chứng nhận: ${inspectionRecord?.cpoCertificateId || 'đang cấp'}. Xe chuyển sang trạng thái "Đạt chuẩn CPO", chờ Admin duyệt bán.`
          : 'Xe chuyển sang trạng thái "Kiểm định không đạt". Có thể lập biên bản mới sau khi khắc phục.',
        placement: 'topRight',
        duration: 8,
      })
      return
    }
    if (result?.violations?.length) openGroup(result.violations[0].groupKey || currentGroupKey)
    if (result?.message) {
      notification.error({ message: 'Chưa gửi được biên bản', description: result.message, placement: 'topRight' })
    }
  }

  // ── Các trạng thái chặn: đang tải / lỗi / xe không kiểm định được ────────
  if (loadingCar) return <LoadingState text="Đang tải hồ sơ xe..." />
  if (loadError) {
    return (
      <div className={styles.page}>
        <ErrorState message={loadError} />
        <Link to={ADMIN_PATHS.inspection} className={styles.backLink}>
          <ArrowLeftOutlined /> Về danh sách kiểm định
        </Link>
      </div>
    )
  }

  const statusMeta = CAR_STATUS_META[car?.status] || { label: car?.status, color: 'default' }
  const canEdit = Boolean(state) && !readOnly
  const checks = state ? deriveChecks(state) : {}
  const activeGroupDef = checklist?.find((group) => group.key === currentGroupKey) || null
  const activeGroup = state?.groups?.find((group) => group.groupKey === currentGroupKey) || null
  const canSubmit = canEdit && violations.length === 0 && evidenceCount > 0
  const blockedReason = !canEdit
    ? 'Biên bản đã gửi hoặc không chỉnh sửa được.'
    : evidenceCount === 0
      ? 'Phải có ít nhất một ảnh bằng chứng trước khi gửi.'
      : `Còn ${violations.length} mục chưa hoàn tất.`

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Đường dẫn">
        <Link to={ADMIN_PATHS.inspection}><ArrowLeftOutlined /> Danh sách kiểm định</Link>
        <span aria-hidden="true">/</span>
        <span>{car?.vehicleCode || carId}</span>
      </nav>

      <InspectionCarSummary car={car} />

      {rejectedNotice && (
        <RejectedBanner
          notice={rejectedNotice}
          onAction={canStart ? startDraft : null}
          actionLabel="Lập biên bản kiểm định lại"
        />
      )}

      {actionError && (
        <Alert
          type="error"
          showIcon
          closable
          className={styles.inlineAlert}
          message={actionError}
        />
      )}

      {/* Xe không thuộc nhóm cho phép kiểm định (AVAILABLE / SOLD / APPROVED_CPO / …) */}
      {!canStart && !state && car && (
        <Alert
          type="warning"
          showIcon
          className={styles.inlineAlert}
          message={`Xe đang ở trạng thái “${statusMeta.label}” nên không lập được biên bản kiểm định.`}
          description={(
            <span>
              Chỉ xe ở trạng thái Bản nháp, Mới nhập, Đang kiểm định hoặc Kiểm định không đạt mới
              lập được biên bản.
              {car.status === 'APPROVED_CPO' && (
                <> Xe đã đạt chuẩn CPO — <Link to={`${ADMIN_PATHS.cpoCertificates}/${car._id}`}>xem chứng nhận</Link>.</>
              )}
            </span>
          )}
        />
      )}

      {/* Chưa có biên bản: chờ Sale bấm bắt đầu (tạo nháp sẽ đổi trạng thái xe) */}
      {canStart && !state && (
        <section className={styles.startCard}>
          <h2 className={styles.cardTitle}>Bắt đầu lập biên bản kiểm định</h2>
          <p className={styles.cardDesc}>
            Hệ thống sẽ tạo một biên bản nháp cho xe này và chuyển trạng thái xe sang
            <Tag color="processing" className={styles.inlineTag}>Đang kiểm định</Tag>.
            Sau đó bạn nhập 5 tiêu chí CPO, đính kèm ảnh bằng chứng, lưu nháp và gửi để hệ thống chấm điểm.
          </p>
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            loading={starting}
            onClick={startDraft}
          >
            {starting ? 'Đang mở biên bản…' : 'Bắt đầu lập biên bản'}
          </Button>
        </section>
      )}

      {/* Biên bản có version checklist mà FE chưa hỗ trợ */}
      {record && !checklistSupported && (
        <Alert
          type="error"
          showIcon
          className={styles.inlineAlert}
          message={`Biên bản dùng checklist phiên bản ${record.checklistVersion || 'không rõ'}, giao diện này chỉ hỗ trợ phiên bản ${SUPPORTED_CHECKLIST_VERSION}.`}
          description="Không thể hiển thị nhãn hạng mục nên biên bản được khoá để tránh ghi sai dữ liệu."
        />
      )}

      {state && checklistSupported && (
        <>
          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              Mã biên bản: <strong>{record?._id ? String(record._id).slice(-8) : '—'}</strong>
            </span>
            <Tag color={INSPECTION_STATUS_META[state.status]?.color}>
              {INSPECTION_STATUS_META[state.status]?.label || state.status}
            </Tag>
            {submitResult?.inspectionRecord?.result && (
              <Tag color={INSPECTION_RESULT_META[submitResult.inspectionRecord.result]?.color}>
                {INSPECTION_RESULT_META[submitResult.inspectionRecord.result]?.label}
              </Tag>
            )}
            {submitResult?.inspectionRecord?.cpoCertificateId && (
              <Tag color="gold">Mã CPO: {submitResult.inspectionRecord.cpoCertificateId}</Tag>
            )}
            {isDirty && <Tag color="warning">Chưa lưu</Tag>}
          </div>

          {restoredFromCache && (
            <Alert
              type="info"
              showIcon
              closable
              onClose={dismissRestored}
              className={styles.inlineAlert}
              message="Đã khôi phục phần bạn soạn dở nhưng chưa lưu."
              description="Bấm “Lưu nháp” để ghi lại lên máy chủ."
            />
          )}

          {isLocked && (
            <Alert
              type="info"
              showIcon
              className={styles.inlineAlert}
              message="Biên bản đã được gửi và khoá — chỉ có thể xem."
              description="Nếu cần kiểm định lại, xe phải ở trạng thái cho phép lập biên bản mới (xem danh sách kiểm định)."
            />
          )}

          {/* PHẦN 02 – component có sẵn của nhóm nhập xe, giữ nguyên */}
          <TrustCarInspectionChecklist
            checks={checks}
            notes={activeGroup?.note || ''}
            checkedCount={countChecked(checks)}
            onCheckChange={(criterionId, checked) => {
              const groupKey = CRITERION_TO_GROUP[criterionId]
              if (groupKey) setGroupVerdict(groupKey, checked)
            }}
            onNotesChange={(value) => {
              if (currentGroupKey && canEdit) setGroupNote(currentGroupKey, value)
            }}
          />

          {activeGroupDef && (
            <p className={styles.noteScope}>
              Khung “Ghi chú thẩm định” ở trên đang ghi chú cho tiêu chí:
              <strong> {activeGroupDef.label}</strong>. Mỗi tiêu chí cũng có ô ghi chú riêng bên dưới.
            </p>
          )}

          <OverviewPhotos
            value={state.overviewPhotos}
            onChange={setOverviewPhoto}
            uploadEvidence={uploadEvidence}
            disabled={!canEdit}
          />

          <VehicleInfoForm
            confirmed={state.vehicleInfo.confirmed}
            original={record?.vehicleInfo?.original}
            car={car}
            onChange={setVehicleField}
            disabled={!canEdit}
          />

          <section className={styles.card} aria-labelledby="checklist-detail-title">
            <header className={styles.cardHead}>
              <div>
                <h2 id="checklist-detail-title" className={styles.cardTitle}>Chi tiết 5 tiêu chí CPO</h2>
                <p className={styles.cardDesc}>
                  Backend chỉ chấm “đạt” cho một tiêu chí khi mọi hạng mục của nó đạt. Hạng mục
                  không đạt phải có ghi chú kỹ thuật và ảnh.
                </p>
              </div>
              <span className={violations.length === 0 ? styles.badgeOk : styles.badgeWarn}>
                {violations.length === 0 ? 'Đủ điều kiện' : `${violations.length} mục cần sửa`}
              </span>
            </header>

            <div ref={accordionRef}>
              <Collapse
                accordion
                activeKey={currentGroupKey}
                onChange={(key) => { if (key) setActiveGroupKey(key) }}
                items={checklist.map((groupDef) => {
                  const group = state.groups.find((entry) => entry.groupKey === groupDef.key)
                  const count = violationCounts[groupDef.key] || 0
                  return {
                    key: groupDef.key,
                    label: (
                      <span className={styles.collapseLabel}>
                        {groupDef.label}
                        {count > 0 && <Tag color="error" className={styles.collapseTag}>{count}</Tag>}
                        {groupDef.requiresOdometerPhoto && <Tag className={styles.collapseTag}>Cần ảnh ODO</Tag>}
                      </span>
                    ),
                    children: (
                      <ChecklistGroupPanel
                        groupDef={groupDef}
                        group={group}
                        violationCount={count}
                        disabled={!canEdit}
                        uploadEvidence={uploadEvidence}
                        onItemResult={setItemResult}
                        onItemNote={setItemNote}
                        onItemPhotos={setItemPhotos}
                        onGroupPhotos={setGroupPhotos}
                        onOdometerPhoto={setOdometerPhoto}
                        onNote={setGroupNote}
                        onMinorDefects={setMinorDefects}
                        onMarkAllPass={(groupKey) => applyResultToGroup(groupKey, 'PASS')}
                      />
                    ),
                  }
                })}
              />
            </div>
          </section>

          <SubmitReadiness
            violations={violations}
            evidenceCount={evidenceCount}
            checklist={checklist}
            state={state}
            onJump={openGroup}
            expanded={readinessExpanded}
            onToggleExpanded={() => setReadinessExpanded((value) => !value)}
          />

          <InspectionActionBar
            isDirty={isDirty}
            saving={saving}
            submitting={submitting}
            uploading={uploading}
            uploadingCount={uploadingCount}
            locked={isLocked}
            canSubmit={canSubmit}
            blockedReason={blockedReason}
            submitResult={submitResult}
            onSave={handleSave}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </div>
  )
}
