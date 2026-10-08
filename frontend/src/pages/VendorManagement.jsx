import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, message, Rate, Popconfirm
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import API from '../services/api';

export default function VendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : {};

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await API.get('/vendors');
      const sorted = [...res.data].sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0));
      setVendors(sorted);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách nhà cung cấp!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleCreate = async (values) => {
    try {
      await API.post('/vendors', values);
      message.success('Thêm hồ sơ nhà cung cấp mới thành công!');
      setCreateModalVisible(false);
      form.resetFields();
      fetchVendors();
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi thêm nhà cung cấp!');
    }
  };

  const handleEdit = (record) => {
    setEditingVendor(record);
    editForm.setFieldsValue({
      name: record.name,
      taxCode: record.taxCode,
      contactPerson: record.contactPerson,
      email: record.email,
      phone: record.phone,
      address: record.address,
    });
    setEditModalVisible(true);
  };

  const handleUpdate = async (values) => {
    try {
      await API.put(`/vendors/${editingVendor.id}`, values);
      message.success('Cập nhật thông tin nhà cung cấp thành công!');
      setEditModalVisible(false);
      fetchVendors();
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi cập nhật nhà cung cấp!');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/vendors/${id}`);
      message.success('Đã xóa nhà cung cấp thành công!');
      fetchVendors();
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi xóa nhà cung cấp (đang có đơn hàng liên kết)!');
    }
  };

  const columns = [
    {
      title: 'Hạng',
      key: 'rank',
      width: 70,
      align: 'center',
      render: (_, __, index) => {
        if (index === 0) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold font-mono text-xs">🥇1</span>;
        if (index === 1) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold font-mono text-xs">🥈2</span>;
        if (index === 2) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-800 font-bold font-mono text-xs">🥉3</span>;
        return <span className="font-mono text-slate-400 font-medium text-xs">{index + 1}</span>;
      },
    },
    {
      title: 'Tên Nhà Cung Cấp',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <div className="font-semibold text-slate-900">{name}</div>
          <div className="text-[11px] text-slate-400 font-mono">MST: {record.taxCode || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Người liên hệ',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      render: (c, record) => (
        <div className="text-xs">
          <div className="text-slate-800 font-medium">{c || '—'}</div>
          <div className="text-slate-400 text-[11px] flex items-center space-x-2 mt-0.5">
            {record.phone && <span>📞 {record.phone}</span>}
            {record.email && <span>✉️ {record.email}</span>}
          </div>
        </div>
      ),
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      render: (a) => <span className="text-xs text-slate-500">{a || '—'}</span>,
    },
    {
      title: 'Điểm Scorecard',
      dataIndex: 'ratingAvg',
      key: 'ratingAvg',
      align: 'right',
      render: (rating) => {
        const val = rating ? Number(rating) : 4.5;
        return (
          <div className="flex flex-col items-end">
            <span className="font-mono tabular-nums font-bold text-amber-600 text-sm">
              {val.toFixed(2)} ★
            </span>
            <Rate disabled allowHalf value={val} count={5} className="text-xs text-amber-500" />
          </div>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: () => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          Hoạt động
        </span>
      ),
    },
    ...((user.role === 'PURCHASER' || user.role === 'ADMIN') ? [{
      title: 'Thao tác',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            className="text-xs h-7 text-slate-600 border-slate-300"
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa nhà cung cấp?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, size: 'small', className: 'text-xs' }}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              className="text-xs h-7"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Hồ Sơ & Bảng Xếp Hạng Nhà Cung Cấp (Vendor Scorecard)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phụ trách bởi: Phùng Bảo Trường (NV Mua hàng) — Quản lý hồ sơ (Thêm, Sửa, Xóa) & Bảng xếp hạng đối tác
          </p>
        </div>
        {(user.role === 'PURCHASER' || user.role === 'ADMIN') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs h-8 border-0 mt-2 sm:mt-0"
            onClick={() => setCreateModalVisible(true)}
          >
            Thêm Nhà Cung Cấp Mới
          </Button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <Table
          columns={columns}
          dataSource={vendors}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </div>

      {/* Modal Thêm Nhà Cung Cấp */}
      <Modal
        title={<span className="text-sm font-semibold text-slate-900">Thêm Hồ Sơ Nhà Cung Cấp Mới</span>}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} className="mt-4">
          <Form.Item
            name="name"
            label={<span className="text-xs font-medium text-slate-700">Tên doanh nghiệp / Nhà cung cấp</span>}
            rules={[{ required: true, message: 'Nhập tên nhà cung cấp' }]}
          >
            <Input placeholder="Ví dụ: Công ty Cổ phần Thiết bị Văn phòng ABC" className="text-xs" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="taxCode"
              label={<span className="text-xs font-medium text-slate-700">Mã số thuế</span>}
              rules={[{ required: true, message: 'Nhập mã số thuế' }]}
            >
              <Input placeholder="Mã số thuế" className="text-xs font-mono" />
            </Form.Item>

            <Form.Item
              name="contactPerson"
              label={<span className="text-xs font-medium text-slate-700">Người liên hệ chính</span>}
            >
              <Input placeholder="Họ và tên người đại diện" className="text-xs" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="email"
              label={<span className="text-xs font-medium text-slate-700">Email liên hệ</span>}
            >
              <Input placeholder="contact@company.com" className="text-xs" />
            </Form.Item>

            <Form.Item
              name="phone"
              label={<span className="text-xs font-medium text-slate-700">Số điện thoại</span>}
            >
              <Input placeholder="0901234567" className="text-xs font-mono" />
            </Form.Item>
          </div>

          <Form.Item
            name="address"
            label={<span className="text-xs font-medium text-slate-700">Địa chỉ trụ sở / kho hàng</span>}
          >
            <Input.TextArea rows={2} placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố..." className="text-xs" />
          </Form.Item>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <Button onClick={() => setCreateModalVisible(false)} size="middle" className="text-xs">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs border-0" size="middle">
              Lưu Hồ Sơ
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Sửa Nhà Cung Cấp */}
      <Modal
        title={<span className="text-sm font-semibold text-slate-900">Cập Nhật Hồ Sơ Nhà Cung Cấp</span>}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={560}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate} className="mt-4">
          <Form.Item
            name="name"
            label={<span className="text-xs font-medium text-slate-700">Tên doanh nghiệp / Nhà cung cấp</span>}
            rules={[{ required: true, message: 'Nhập tên nhà cung cấp' }]}
          >
            <Input className="text-xs" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="taxCode"
              label={<span className="text-xs font-medium text-slate-700">Mã số thuế</span>}
              rules={[{ required: true, message: 'Nhập mã số thuế' }]}
            >
              <Input className="text-xs font-mono" />
            </Form.Item>

            <Form.Item
              name="contactPerson"
              label={<span className="text-xs font-medium text-slate-700">Người liên hệ chính</span>}
            >
              <Input className="text-xs" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="email"
              label={<span className="text-xs font-medium text-slate-700">Email liên hệ</span>}
            >
              <Input className="text-xs" />
            </Form.Item>

            <Form.Item
              name="phone"
              label={<span className="text-xs font-medium text-slate-700">Số điện thoại</span>}
            >
              <Input className="text-xs font-mono" />
            </Form.Item>
          </div>

          <Form.Item
            name="address"
            label={<span className="text-xs font-medium text-slate-700">Địa chỉ trụ sở / kho hàng</span>}
          >
            <Input.TextArea rows={2} className="text-xs" />
          </Form.Item>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <Button onClick={() => setEditModalVisible(false)} size="middle" className="text-xs">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs border-0" size="middle">
              Cập Nhật Hồ Sơ
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
