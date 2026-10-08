import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, InputNumber, message, Tooltip, Alert, Popconfirm
} from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, EyeOutlined, WarningOutlined, DeleteOutlined } from '@ant-design/icons';
import API from '../services/api';

export default function PRManagement() {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPr, setSelectedPr] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [form] = Form.useForm();
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : {};

  const fetchPRs = async () => {
    setLoading(true);
    try {
      const res = await API.get('/pr');
      setPrs(res.data);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách phiếu PR!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPRs();
  }, []);

  const handleCreate = async (values) => {
    try {
      await API.post('/pr', values);
      message.success('Tạo phiếu đề nghị mua sắm (PR) thành công!');
      setCreateModalVisible(false);
      form.resetFields();
      fetchPRs();
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi tạo phiếu PR!');
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/pr/${id}/approve`);
      message.success('Đã phê duyệt phiếu PR!');
      fetchPRs();
      if (detailModalVisible) setDetailModalVisible(false);
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi phê duyệt!');
    }
  };

  const handleReject = async () => {
    if (!selectedPr) return;
    try {
      await API.put(`/pr/${selectedPr.id}/reject`, { reason: rejectReason });
      message.success('Đã từ chối phiếu PR!');
      setRejectModalVisible(false);
      setDetailModalVisible(false);
      setRejectReason('');
      fetchPRs();
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi từ chối phiếu PR!');
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Đã phê duyệt
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Chờ phê duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Đã từ chối
          </span>
        );
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  const handleDeletePR = async (id) => {
    try {
      await API.delete(`/pr/${id}`);
      message.success('Đã xóa phiếu đề nghị PR thành công!');
      fetchPRs();
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi xóa phiếu PR!');
    }
  };

  const columns = [
    {
      title: 'Mã PR',
      dataIndex: 'prCode',
      key: 'prCode',
      render: (text, record) => (
        <span
          onClick={() => { setSelectedPr(record); setDetailModalVisible(true); }}
          className="font-mono text-cyan-700 font-medium cursor-pointer hover:underline"
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Tiêu đề đề xuất',
      dataIndex: 'title',
      key: 'title',
      render: (title) => <span className="font-medium text-slate-800">{title}</span>,
    },
    { title: 'Người lập', dataIndex: 'requesterName', key: 'requesterName', render: (n) => <span className="text-slate-600">{n}</span> },
    { title: 'Phòng ban', dataIndex: 'departmentName', key: 'departmentName', render: (d) => <span className="text-slate-500">{d}</span> },
    {
      title: 'Tổng tiền ước tính',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (amount, record) => (
        <span className={`font-mono tabular-nums font-semibold ${amount > record.departmentBudgetLimit ? 'text-rose-600' : 'text-slate-900'}`}>
          {formatCurrency(amount)}
          {amount > record.departmentBudgetLimit && (
            <Tooltip title="Vượt ngân sách hạn mức tháng của phòng ban!">
              <WarningOutlined className="ml-1 text-rose-500" />
            </Tooltip>
          )}
        </span>
      ),
    },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: renderStatus },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            size="small"
            className="text-xs h-7 text-slate-600 border-slate-300"
            onClick={() => { setSelectedPr(record); setDetailModalVisible(true); }}
          >
            Chi tiết
          </Button>
          {(user.role === 'ADMIN' || user.role === 'APPROVER') && record.status === 'PENDING_APPROVAL' && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size="small"
                className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7 border-0"
                onClick={() => handleApprove(record.id)}
              >
                Duyệt
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                size="small"
                className="text-xs h-7"
                onClick={() => { setSelectedPr(record); setRejectModalVisible(true); }}
              >
                Từ chối
              </Button>
            </>
          )}
          {(user.role === 'ADMIN' || user.role === 'REQUESTER') && record.status !== 'APPROVED' && (
            <Popconfirm
              title="Xác nhận xóa phiếu đề nghị này?"
              onConfirm={() => handleDeletePR(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true, size: 'small', className: 'text-xs' }}
            >
              <Button
                danger
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                className="text-xs h-7 text-rose-500 hover:text-rose-700"
              >
                Xóa
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Yêu Cầu Đề Nghị Mua Sắm (PR)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý quy trình lập nhu cầu, kiểm soát hạn mức ngân sách và phê duyệt đề xuất
          </p>
        </div>
        {(user.role === 'REQUESTER' || user.role === 'ADMIN') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs h-8 border-0 mt-2 sm:mt-0"
            onClick={() => setCreateModalVisible(true)}
          >
            Lập Đề Nghị Mua Sắm
          </Button>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <Table
          columns={columns}
          dataSource={prs}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </div>

      {/* Modal Tạo PR */}
      <Modal
        title={<span className="text-sm font-semibold text-slate-900">Lập Phiếu Đề Nghị Mua Sắm Mới</span>}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={720}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} className="mt-4">
          <Form.Item
            name="title"
            label={<span className="text-xs font-medium text-slate-700">Tiêu đề yêu cầu mua sắm</span>}
            rules={[{ required: true, message: 'Nhập tiêu đề đề xuất' }]}
            className="mb-4"
          >
            <Input placeholder="Ví dụ: Mua sắm máy tính xách tay và thiết bị văn phòng Q4" className="text-xs" />
          </Form.Item>

          <Form.List
            name="items"
            initialValue={[{ itemName: '', quantity: 1, unit: 'Cái', estimatedUnitPrice: 0 }]}
          >
            {(fields, { add, remove }) => (
              <>
                <div className="text-xs font-semibold text-slate-700 mb-2">Danh mục hàng hóa đề xuất:</div>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="p-3 bg-slate-50/80 border border-slate-200 rounded-md mb-2.5">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
                        <Form.Item
                          {...restField}
                          name={[name, 'itemName']}
                          rules={[{ required: true, message: 'Tên hàng' }]}
                          className="mb-1"
                        >
                          <Input placeholder="Tên mặt hàng" className="text-xs" />
                        </Form.Item>
                      </div>
                      <div className="col-span-3">
                        <Form.Item
                          {...restField}
                          name={[name, 'specification']}
                          className="mb-1"
                        >
                          <Input placeholder="Quy cách / Model" className="text-xs" />
                        </Form.Item>
                      </div>
                      <div className="col-span-2">
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          rules={[{ required: true, message: 'SL' }]}
                          className="mb-1"
                        >
                          <InputNumber min={1} placeholder="SL" className="w-full text-xs" />
                        </Form.Item>
                      </div>
                      <div className="col-span-2">
                        <Form.Item
                          {...restField}
                          name={[name, 'unit']}
                          rules={[{ required: true, message: 'ĐVT' }]}
                          className="mb-1"
                        >
                          <Input placeholder="Đơn vị" className="text-xs" />
                        </Form.Item>
                      </div>
                      <div className="col-span-10 mt-1">
                        <Form.Item
                          {...restField}
                          name={[name, 'estimatedUnitPrice']}
                          rules={[{ required: true, message: 'Đơn giá' }]}
                          className="mb-0"
                        >
                          <InputNumber
                            className="w-full text-xs font-mono"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                            addonAfter="₫ / ĐVT"
                            placeholder="Đơn giá ước tính"
                          />
                        </Form.Item>
                      </div>
                      <div className="col-span-2 mt-1 text-right">
                        {fields.length > 1 && (
                          <Button danger type="text" size="small" onClick={() => remove(name)} className="text-xs">
                            Xóa dòng
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Form.Item className="mb-4">
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="text-xs h-8">
                    Thêm mặt hàng đề xuất
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <Button onClick={() => setCreateModalVisible(false)} size="middle" className="text-xs">
              Hủy bỏ
            </Button>
            <Button type="primary" htmlType="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs border-0" size="middle">
              Gửi Đề Nghị Phê Duyệt
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Chi Tiết PR */}
      {selectedPr && (
        <Modal
          title={<span className="text-sm font-semibold text-slate-900">Chi tiết Phiếu: <span className="font-mono text-cyan-700">{selectedPr.prCode}</span></span>}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          width={700}
        >
          <div className="space-y-4 mt-3">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-md text-xs">
              <div><span className="text-slate-500">Tiêu đề:</span> <b className="text-slate-800">{selectedPr.title}</b></div>
              <div><span className="text-slate-500">Người đề xuất:</span> <b className="text-slate-800">{selectedPr.requesterName}</b></div>
              <div><span className="text-slate-500">Phòng ban:</span> <b className="text-slate-800">{selectedPr.departmentName}</b></div>
              <div><span className="text-slate-500">Trạng thái:</span> {renderStatus(selectedPr.status)}</div>
              <div><span className="text-slate-500">Tổng tiền ước tính:</span> <span className="font-mono font-bold text-slate-900">{formatCurrency(selectedPr.totalAmount)}</span></div>
              <div><span className="text-slate-500">Hạn mức ngân sách tháng:</span> <span className="font-mono text-slate-700">{formatCurrency(selectedPr.departmentBudgetLimit)}</span></div>
            </div>

            {selectedPr.totalAmount > selectedPr.departmentBudgetLimit && (
              <Alert
                message="Cảnh báo vượt ngân sách phòng ban"
                description={`Tổng tiền đề xuất (${formatCurrency(selectedPr.totalAmount)}) vượt hạn mức ngân sách tháng (${formatCurrency(selectedPr.departmentBudgetLimit)}). Cần xem xét kỹ trước khi duyệt.`}
                type="warning"
                showIcon
                className="text-xs border-amber-200 bg-amber-50"
              />
            )}

            {selectedPr.rejectionReason && (
              <Alert
                message="Lý do từ chối:"
                description={selectedPr.rejectionReason}
                type="error"
                showIcon
                className="text-xs border-rose-200 bg-rose-50"
              />
            )}

            <div className="text-xs font-semibold text-slate-800">Danh Sách Mặt Hàng Đề Xuất:</div>
            <Table
              dataSource={selectedPr.items}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: 'Tên mặt hàng', dataIndex: 'itemName', key: 'itemName', render: (t) => <span className="font-medium">{t}</span> },
                { title: 'Quy cách', dataIndex: 'specification', key: 'specification', render: (s) => <span className="text-slate-500">{s || '—'}</span> },
                { title: 'SL', dataIndex: 'quantity', key: 'quantity', align: 'center', render: (q) => <span className="font-mono font-medium">{q}</span> },
                { title: 'ĐVT', dataIndex: 'unit', key: 'unit', align: 'center' },
                { title: 'Đơn giá', dataIndex: 'estimatedUnitPrice', key: 'estimatedUnitPrice', align: 'right', render: (p) => <span className="font-mono tabular-nums">{formatCurrency(p)}</span> },
                { title: 'Thành tiền', dataIndex: 'estimatedTotalPrice', key: 'estimatedTotalPrice', align: 'right', render: (t) => <span className="font-mono tabular-nums font-semibold">{formatCurrency(t)}</span> },
              ]}
            />

            {(user.role === 'ADMIN' || user.role === 'APPROVER') && selectedPr.status === 'PENDING_APPROVAL' && (
              <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-200">
                <Button danger size="middle" icon={<CloseOutlined />} onClick={() => setRejectModalVisible(true)} className="text-xs">
                  Từ Chối
                </Button>
                <Button type="primary" size="middle" icon={<CheckOutlined />} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs border-0" onClick={() => handleApprove(selectedPr.id)}>
                  Phê Duyệt Đề Nghị
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Từ Chối PR */}
      <Modal
        title={<span className="text-sm font-semibold text-slate-900">Nhập Lý Do Từ Chối Phiếu PR</span>}
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={handleReject}
        okText="Xác nhận từ chối"
        okButtonProps={{ danger: true, size: 'middle', className: 'text-xs' }}
        cancelButtonProps={{ size: 'middle', className: 'text-xs' }}
      >
        <Input.TextArea
          rows={3}
          placeholder="Ví dụ: Vượt ngân sách tháng / Chưa cần thiết trong quý này..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="text-xs mt-2"
        />
      </Modal>
    </div>
  );
}
