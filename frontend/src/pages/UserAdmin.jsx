import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import API from '../services/api';

const { Option } = Select;

export default function UserAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách người dùng!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (values) => {
    try {
      await API.post('/admin/users', values);
      message.success('Thêm tài khoản người dùng mới thành công!');
      setCreateModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi thêm người dùng!');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/toggle-status`);
      message.success('Đã cập nhật trạng thái tài khoản!');
      fetchUsers();
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi đổi trạng thái!');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">Quản trị viên</span>;
      case 'APPROVER':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">Người phê duyệt</span>;
      case 'PURCHASER':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">NV Mua hàng</span>;
      case 'REQUESTER':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">NV Đề xuất</span>;
      default:
        return <span>{role}</span>;
    }
  };

  const columns = [
    {
      title: 'Tài khoản',
      dataIndex: 'username',
      key: 'username',
      render: (u) => <span className="font-mono text-cyan-700 font-medium">{u}</span>,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (n) => <span className="font-medium text-slate-800">{n}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (e) => <span className="text-slate-500 font-mono text-xs">{e}</span>,
    },
    {
      title: 'Phòng ban',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (d) => <span className="text-slate-600">{d || 'Phòng Công nghệ thông tin'}</span>,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: getRoleBadge,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${s === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {s === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          icon={record.status === 'ACTIVE' ? <LockOutlined /> : <UnlockOutlined />}
          className="text-xs h-7 text-slate-600 border-slate-300"
          onClick={() => handleToggleStatus(record.id)}
        >
          {record.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Quản Lý Người Dùng & Phân Quyền
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý danh sách tài khoản nội bộ, phân bổ phòng ban và cấp quyền truy cập hệ thống
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs h-8 border-0 mt-2 sm:mt-0"
          onClick={() => setCreateModalVisible(true)}
        >
          Thêm Người Dùng Mới
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </div>

      <Modal
        title={<span className="text-sm font-semibold text-slate-900">Thêm Người Dùng & Phân Quyền Mới</span>}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateUser} className="mt-4">
          <Form.Item
            name="username"
            label={<span className="text-xs font-medium text-slate-700">Tên đăng nhập</span>}
            rules={[{ required: true, message: 'Nhập tên đăng nhập' }]}
          >
            <Input placeholder="ví dụ: linhnd" className="text-xs font-mono" />
          </Form.Item>

          <Form.Item
            name="fullName"
            label={<span className="text-xs font-medium text-slate-700">Họ và tên</span>}
            rules={[{ required: true, message: 'Nhập họ và tên' }]}
          >
            <Input placeholder="Nguyễn Diệu Linh" className="text-xs" />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span className="text-xs font-medium text-slate-700">Email</span>}
            rules={[{ required: true, message: 'Nhập email' }]}
          >
            <Input placeholder="linhnd@company.com" className="text-xs font-mono" />
          </Form.Item>

          <Form.Item
            name="role"
            label={<span className="text-xs font-medium text-slate-700">Vai trò (Role)</span>}
            rules={[{ required: true, message: 'Chọn vai trò' }]}
          >
            <Select placeholder="Chọn quyền hạn..." className="text-xs">
              <Option value="REQUESTER">Nhân viên Đề xuất (Requester)</Option>
              <Option value="PURCHASER">Nhân viên Mua hàng (Purchaser)</Option>
              <Option value="APPROVER">Người phê duyệt / Trưởng phòng (Approver)</Option>
              <Option value="ADMIN">Quản trị viên (Admin)</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <Button onClick={() => setCreateModalVisible(false)} size="middle" className="text-xs">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs border-0" size="middle">
              Tạo Tài Khoản
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
