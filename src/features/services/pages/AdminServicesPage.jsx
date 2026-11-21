import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert, Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message,
} from 'antd'
import { PlusOutlined, EditOutlined, StopOutlined } from '@ant-design/icons'
import {
  createAdminService, deactivateAdminService, fetchAdminServices, updateAdminService,
} from '../api/servicesApi'
import { useAuthStore } from '../../../store/useAuthStore'
import { hasAnyRole } from '../../../utils/roles'
import styles from '../styles/AdminServicesPage.module.css'

const { Title, Paragraph } = Typography

const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)

/** KAN-96 — CRUD 6 gói dịch vụ showroom. ADMIN có đủ quyền, SALES_STAFF chỉ đọc. */
export default function AdminServicesPage() {
  const currentUser = useAuthStore((state) => state.user)
  const canWrite = hasAnyRole(currentUser, ['ADMIN'])
  const [filter, setFilter] = useState({ status: undefined, search: '' })
  const [state, setState] = useState({ status: 'loading', items: [], meta: null, error: null })
  const [editor, setEditor] = useState({ open: false, mode: 'create', record: null })
  const [form] = Form.useForm()

  const load = useCallback(() => {
    const controller = new AbortController()
    setState((prev) => ({ ...prev, status: 'loading', error: null }))
    fetchAdminServices({ ...filter, page: 1, limit: 50 }, controller.signal)
      .then(({ items, meta }) => setState({ status: 'ready', items, meta, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', items: [], meta: null, error })
      })
    return () => controller.abort()
  }, [filter])

  useEffect(() => load(), [load])

  const openCreate = () => {
    setEditor({ open: true, mode: 'create', record: null })
    form.resetFields()
    form.setFieldsValue({ status: 'ACTIVE', estimatedDuration: 60, referencePrice: 0 })
  }

  const openEdit = (record) => {
    setEditor({ open: true, mode: 'edit', record })
    form.setFieldsValue({
      code: record.code,
      serviceName: record.serviceName,
      description: record.description,
      estimatedDuration: record.estimatedDuration,
      referencePrice: record.referencePrice,
      status: record.status,
    })
  }

  const close = () => setEditor({ open: false, mode: 'create', record: null })

  const onSubmit = async (values) => {
    try {
      if (editor.mode === 'create') {
        await createAdminService({
          code: values.code.trim().toUpperCase(),
          serviceName: values.serviceName.trim(),
          description: values.description?.trim() || null,
          estimatedDuration: Number(values.estimatedDuration),
          referencePrice: Number(values.referencePrice),
          status: values.status,
        })
        message.success('Đã thêm gói dịch vụ.')
      } else {
        // `code` không thể đổi (BE từ chối) — không gửi trong payload.
        await updateAdminService(editor.record.id, {
          serviceName: values.serviceName.trim(),
          description: values.description?.trim() || null,
          estimatedDuration: Number(values.estimatedDuration),
          referencePrice: Number(values.referencePrice),
          status: values.status,
        })
        message.success('Đã cập nhật gói dịch vụ.')
      }
      close()
      load()
    } catch (error) {
      message.error(error?.response?.data?.message || 'Không lưu được gói dịch vụ.')
    }
  }

  const onDeactivate = async (record) => {
    try {
      await deactivateAdminService(record.id)
      message.success('Đã vô hiệu gói dịch vụ. Lịch cũ giữ nguyên.')
      load()
    } catch (error) {
      message.error(error?.response?.data?.message || 'Không vô hiệu được gói.')
    }
  }

  const columns = useMemo(() => [
    { title: 'Mã', dataIndex: 'code', width: 180, render: (code) => <Tag color="blue">{code}</Tag> },
    { title: 'Tên gói', dataIndex: 'serviceName' },
    {
      title: 'Thời lượng', dataIndex: 'estimatedDuration', width: 120,
      render: (value) => `${value} phút`,
    },
    {
      title: 'Giá tham khảo', dataIndex: 'referencePrice', width: 160,
      render: (value) => <span className={styles.price}>{formatPrice(value)}</span>,
    },
    {
      title: 'Trạng thái', dataIndex: 'status', width: 120,
      render: (status) => <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>{status}</Tag>,
    },
    ...(canWrite ? [{
      title: 'Thao tác', width: 220, fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>Sửa</Button>
          {record.status === 'ACTIVE' && (
            <Popconfirm
              title="Vô hiệu gói này?"
              description="Lịch cũ vẫn giữ nguyên, khách sẽ không thấy gói trên /dich-vu."
              onConfirm={() => onDeactivate(record)}
              okText="Vô hiệu"
              cancelText="Huỷ"
            >
              <Button size="small" danger icon={<StopOutlined />}>Vô hiệu</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    }] : []),
  ], [canWrite])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Title level={3}>Dịch vụ showroom</Title>
          <Paragraph type="secondary">
            Quản lý 6 gói dịch vụ chuẩn (rửa cao cấp, đánh bóng, phủ nano, bọc gầm, detailing, kiểm tra tổng quát).
            Khách đặt lịch trên trang <strong>/dich-vu</strong>.
          </Paragraph>
        </div>
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm gói mới
          </Button>
        )}
      </div>

      <Card className={styles.filters}>
        <Space wrap>
          <Select
            placeholder="Tất cả trạng thái"
            allowClear
            style={{ width: 180 }}
            value={filter.status}
            onChange={(status) => setFilter((prev) => ({ ...prev, status }))}
            options={[
              { label: 'Đang mở (ACTIVE)', value: 'ACTIVE' },
              { label: 'Đã vô hiệu', value: 'INACTIVE' },
            ]}
          />
          <Input.Search
            allowClear
            placeholder="Tìm theo tên hoặc mã"
            style={{ width: 280 }}
            defaultValue={filter.search}
            onSearch={(search) => setFilter((prev) => ({ ...prev, search }))}
          />
        </Space>
      </Card>

      {state.status === 'error' && (
        <Alert
          type="error" showIcon
          message={state.error?.response?.data?.message || 'Không tải được danh sách dịch vụ.'}
        />
      )}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={state.items}
        loading={state.status === 'loading'}
        pagination={false}
        scroll={{ x: 960 }}
      />

      <Modal
        open={editor.open}
        onCancel={close}
        title={editor.mode === 'create' ? 'Thêm gói dịch vụ' : `Sửa gói: ${editor.record?.code}`}
        okText="Lưu"
        cancelText="Huỷ"
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item
            name="code"
            label="Mã gói"
            tooltip="Không thể đổi sau khi tạo (giữ ổn định với lịch đã đặt)."
            rules={[
              { required: true, message: 'Mã gói là bắt buộc.' },
              { pattern: /^[A-Z0-9_]{3,40}$/, message: 'Mã 3-40 ký tự hoa, số hoặc gạch dưới.' },
            ]}
          >
            <Input disabled={editor.mode === 'edit'} placeholder="VD: CAR_WASH_PREMIUM" />
          </Form.Item>

          <Form.Item name="serviceName" label="Tên gói" rules={[{ required: true, message: 'Tên gói là bắt buộc.' }]}>
            <Input maxLength={120} />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} maxLength={2000} showCount />
          </Form.Item>

          <Space className={styles.inlineFields} align="start">
            <Form.Item
              name="estimatedDuration"
              label="Thời lượng (phút)"
              rules={[{ required: true, message: 'Bắt buộc.' }, { type: 'number', min: 15, max: 480, message: '15-480 phút.' }]}
            >
              <InputNumber min={15} max={480} step={15} style={{ width: 160 }} />
            </Form.Item>
            <Form.Item
              name="referencePrice"
              label="Giá tham khảo (VND)"
              rules={[{ required: true, message: 'Bắt buộc.' }, { type: 'number', min: 0, message: 'Không âm.' }]}
            >
              <InputNumber
                min={0} step={50000} style={{ width: 200 }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => Number(String(value).replace(/,/g, '')) || 0}
              />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
              <Select
                style={{ width: 160 }}
                options={[
                  { label: 'ACTIVE', value: 'ACTIVE' },
                  { label: 'INACTIVE', value: 'INACTIVE' },
                ]}
              />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}
