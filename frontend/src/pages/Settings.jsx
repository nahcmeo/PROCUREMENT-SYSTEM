import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import API from '../services/api';

export default function Settings() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [form] = Form.useForm();

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách phòng ban!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleEdit = (record) => {
    setSelectedDept(record);
    form.setFieldsValue({ budgetLimit: record.budgetLimit });
    setEditModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      await API.put(`/admin/departments/${selectedDept.id}/budget`, values);
      message.success('Cập nhật hạn mức ngân sách thành công!');
      setEditModalVisible(false);
      fetchDepartments();
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi cập nhật hạn mức!');
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = [
    {
      title: 'Mã phòng',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <span className="font-mono text-xs text-slate-500">DEPT-0{id}</span>,
    },
    {
      title: 'Tên Phòng Ban',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <span className="font-semibold text-slate-800">{name}</span>,
    },
    {
      title: 'Hạn Mức Ngân Sách Tháng',
      dataIndex: 'budgetLimit',
      key: 'budgetLimit',
      align: 'right',
      render: (val) => <span className="font-mono tabular-nums font-bold text-slate-900">{formatCurrency(val)}</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          className="text-xs h-7 text-slate-600 border-slate-300"
          onClick={() => handleEdit(record)}
        >
          Sửa hạn mức
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Cài Đặt Hạn Mức Ngân Sách Phòng Ban
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thiết lập trần ngân sách mua sắm theo tháng để hệ thống tự động cảnh báo khi lập & duyệt PR
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <Table
          columns={columns}
          dataSource={departments}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </div>

      <Modal
        title={<span className="text-sm font-semibold text-slate-900">Điều Chỉnh Hạn Mức Ngân Sách: {selectedDept?.name}</span>}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={450}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item
            name="budgetLimit"
            label={<span className="text-xs font-medium text-slate-700">Hạn mức ngân sách mới (VNĐ)</span>}
            rules={[{ required: true, message: 'Nhập hạn mức' }]}
          >
            <InputNumber
              className="w-full text-xs font-mono"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              addonAfter="₫"
              min={10000000}
              step={10000000}
            />
          </Form.Item>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <Button onClick={() => setEditModalVisible(false)} size="middle" className="text-xs">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs border-0" size="middle">
              Lưu Hạn Mức
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
