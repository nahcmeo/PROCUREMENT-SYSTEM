import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, Select, Rate, message, Tag, Tooltip, Alert, Radio
} from 'antd';
import {
  EyeOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  StarOutlined,
  CarOutlined,
  SendOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import API from '../services/api';

const { Option } = Select;

export default function POManagement() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [evalModalVisible, setEvalModalVisible] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);

  const [receiptForm] = Form.useForm();
  const [evalForm] = Form.useForm();

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : {};

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const res = await API.get('/po');
      setPos(res.data);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách Đơn đặt hàng (PO)!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  const handleUpdateStatus = async (poId, status) => {
    try {
      await API.put(`/po/${poId}/status`, { status });
      message.success('Đã cập nhật trạng thái đơn hàng!');
      fetchPOs();
      if (selectedPo && selectedPo.id === poId) {
        const updated = await API.get(`/po/${poId}`);
        setSelectedPo(updated.data);
      }
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi cập nhật trạng thái!');
    }
  };

  const handleConfirmReceipt = async (values) => {
    try {
      await API.post(`/po/${selectedPo.id}/receipt`, values);
      message.success('Xác nhận nghiệm thu & nhận hàng thành công!');
      setReceiptModalVisible(false);
      receiptForm.resetFields();
      const updated = await API.get(`/po/${selectedPo.id}`);
      setSelectedPo(updated.data);
      fetchPOs();
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi nghiệm thu!');
    }
  };

  const handleEvaluate = async (values) => {
    try {
      await API.post(`/po/${selectedPo.id}/evaluate`, values);
      message.success('Đã gửi đánh giá Nhà cung cấp thành công!');
      setEvalModalVisible(false);
      evalForm.resetFields();
      const updated = await API.get(`/po/${selectedPo.id}`);
      setSelectedPo(updated.data);
      fetchPOs();
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi đánh giá NCC!');
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'CREATED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Đã tạo đơn
          </span>
        );
      case 'SENT_TO_VENDOR':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
            Đã gửi NCC
          </span>
        );
      case 'DELIVERING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Đang vận chuyển
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Đã nghiệm thu
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Đã hủy
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const columns = [
    {
      title: 'Mã Đơn (PO)',
      dataIndex: 'poCode',
      key: 'poCode',
      render: (text, record) => (
        <span
          onClick={() => { setSelectedPo(record); setDetailModalVisible(true); }}
          className="font-mono text-cyan-700 font-medium cursor-pointer hover:underline"
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Nhà Cung Cấp',
      dataIndex: 'vendorName',
      key: 'vendorName',
      render: (v) => <span className="font-semibold text-slate-900">{v}</span>,
    },
    { title: 'Phòng ban', dataIndex: 'departmentName', key: 'departmentName', render: (d) => <span className="text-slate-500">{d || 'Nội bộ'}</span> },
    {
      title: 'Hạn giao hàng',
      dataIndex: 'expectedDeliveryDate',
      key: 'expectedDeliveryDate',
      align: 'center',
      render: (d) => <span className="font-mono text-xs text-slate-600">{d || '7 ngày'}</span>,
    },
    {
      title: 'Tổng Giá Trị Đơn',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (amount) => (
        <span className="font-mono tabular-nums font-bold text-slate-900">
          {formatCurrency(amount)}
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
            onClick={() => { setSelectedPo(record); setDetailModalVisible(true); }}
          >
            Chi tiết
          </Button>

          {/* Quy trình chuyển trạng thái PO */}
          {record.status === 'CREATED' && (user.role === 'PURCHASER' || user.role === 'ADMIN') && (
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs h-7 border-0"
              onClick={() => handleUpdateStatus(record.id, 'SENT_TO_VENDOR')}
            >
              Gửi NCC
            </Button>
          )}

          {record.status === 'SENT_TO_VENDOR' && (user.role === 'PURCHASER' || user.role === 'ADMIN') && (
            <Button
              type="primary"
              size="small"
              icon={<CarOutlined />}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 border-0"
              onClick={() => handleUpdateStatus(record.id, 'DELIVERING')}
            >
              Đang giao
            </Button>
          )}

          {record.status === 'DELIVERING' && (user.role === 'REQUESTER' || user.role === 'ADMIN') && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 border-0"
              onClick={() => { setSelectedPo(record); setReceiptModalVisible(true); }}
            >
              Nghiệm thu
            </Button>
          )}

          {record.status === 'RECEIVED' && !record.evaluation && (user.role === 'PURCHASER' || user.role === 'ADMIN') && (
            <Button
              type="dashed"
              size="small"
              icon={<StarOutlined />}
              className="text-amber-600 border-amber-300 hover:text-amber-700 text-xs h-7"
              onClick={() => { setSelectedPo(record); setEvalModalVisible(true); }}
            >
              Đánh giá NCC
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Quản Lý Đơn Đặt Hàng (PO) & Nghiệm Thu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tiến độ giao nhận đơn hàng, đối chiếu nghiệm thu và chấm điểm đánh giá nhà cung cấp
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <Table
          columns={columns}
          dataSource={pos}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </div>

      {/* Modal Chi Tiết PO */}
      {selectedPo && (
        <Modal
          title={
            <div className="flex items-center justify-between pr-6">
              <span className="text-sm font-semibold text-slate-900">
                Đơn Đặt Hàng: <span className="font-mono text-cyan-700">{selectedPo.poCode}</span>
              </span>
              {renderStatus(selectedPo.status)}
            </div>
          }
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          width={750}
        >
          <div className="space-y-4 mt-3">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-md text-xs">
              <div><span className="text-slate-500">Nhà cung cấp:</span> <b className="text-slate-800">{selectedPo.vendorName}</b></div>
              <div><span className="text-slate-500">Phòng ban đề xuất:</span> <b className="text-slate-800">{selectedPo.departmentName}</b></div>
              <div><span className="text-slate-500">Nhân viên mua hàng:</span> <b className="text-slate-800">{selectedPo.purchaserName}</b></div>
              <div><span className="text-slate-500">Hạn giao hàng dự kiến:</span> <b className="font-mono text-slate-700">{selectedPo.expectedDeliveryDate || '7 ngày'}</b></div>
              <div><span className="text-slate-500">Tổng giá trị đơn:</span> <span className="font-mono font-bold text-slate-900">{formatCurrency(selectedPo.totalAmount)}</span></div>
              <div><span className="text-slate-500">Báo giá tham chiếu:</span> <span className="font-mono text-cyan-700">{selectedPo.quotationCode}</span></div>
            </div>

            {/* Thông tin nghiệm thu nếu đã có */}
            {selectedPo.receipt && (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-md text-xs">
                <div className="flex items-center justify-between font-semibold text-emerald-800 mb-1">
                  <span>Biên Bản Nghiệm Thu ({selectedPo.receipt.grCode})</span>
                  <span>{selectedPo.receipt.status === 'COMPLETED' ? '✓ Đã nhận đủ 100%' : '⚠ Lệch/Thiếu hàng'}</span>
                </div>
                <div className="text-slate-600">
                  Người nghiệm thu: <b>{selectedPo.receipt.receivedByName}</b> | Ghi chú: {selectedPo.receipt.note || 'Hàng đạt chuẩn, đúng quy cách.'}
                </div>
              </div>
            )}

            {/* Thông tin đánh giá nếu đã có */}
            {selectedPo.evaluation && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-md text-xs">
                <div className="flex items-center justify-between font-semibold text-amber-800 mb-1">
                  <span>Đánh Giá Nhà Cung Cấp Sau Nghiệm Thu</span>
                  <span className="font-mono text-sm">{selectedPo.evaluation.averageScore} / 5.0 ★</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-slate-600 my-1 font-mono text-[11px]">
                  <div>Giá cả: <b>{selectedPo.evaluation.priceScore}★</b></div>
                  <div>Chất lượng: <b>{selectedPo.evaluation.qualityScore}★</b></div>
                  <div>Tiến độ: <b>{selectedPo.evaluation.deliveryScore}★</b></div>
                </div>
                <div className="text-slate-500 mt-1 italic">
                  Nhận xét: "{selectedPo.evaluation.comment || 'Nhà cung cấp uy tín, giao hàng nhanh chóng.'}"
                </div>
              </div>
            )}

            <div className="text-xs font-semibold text-slate-800">Danh Mục Hàng Hóa Trong Đơn:</div>
            <Table
              dataSource={selectedPo.items}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: 'Tên mặt hàng', dataIndex: 'itemName', key: 'itemName', render: (t) => <span className="font-medium">{t}</span> },
                { title: 'Số lượng đặt', dataIndex: 'orderedQuantity', key: 'orderedQuantity', align: 'center', render: (q) => <span className="font-mono">{q}</span> },
                { title: 'ĐVT', dataIndex: 'unit', key: 'unit', align: 'center' },
                { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', align: 'right', render: (p) => <span className="font-mono tabular-nums">{formatCurrency(p)}</span> },
                { title: 'Thành tiền', dataIndex: 'totalPrice', key: 'totalPrice', align: 'right', render: (t) => <span className="font-mono tabular-nums font-semibold">{formatCurrency(t)}</span> },
              ]}
            />
          </div>
        </Modal>
      )}

      {/* Modal Nghiệm Thu Nhanh (Goods Receipt) */}
      <Modal
        title={<span className="text-sm font-semibold text-slate-900">Biên Bản Nghiệm Thu & Xác Nhận Nhận Hàng</span>}
        open={receiptModalVisible}
        onCancel={() => setReceiptModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={receiptForm} layout="vertical" onFinish={handleConfirmReceipt} initialValues={{ status: 'COMPLETED' }} className="mt-4">
          <Form.Item
            name="status"
            label={<span className="text-xs font-medium text-slate-700">Tình trạng đối chiếu số lượng thực tế nhận được</span>}
            rules={[{ required: true }]}
          >
            <Radio.Group className="w-full">
              <Space direction="vertical" className="w-full">
                <Radio value="COMPLETED" className="text-xs p-2.5 border rounded-md w-full bg-emerald-50/40 border-emerald-200">
                  <span className="font-semibold text-emerald-800">Đã nhận đủ toàn bộ hàng hóa (100% Đạt)</span>
                  <div className="text-[11px] text-slate-500 ml-6">Số lượng nhận khớp hoàn toàn với đơn đặt hàng PO.</div>
                </Radio>
                <Radio value="DISCREPANCY" className="text-xs p-2.5 border rounded-md w-full bg-rose-50/40 border-rose-200">
                  <span className="font-semibold text-rose-800">Giao thiếu hàng hoặc phát hiện lỗi</span>
                  <div className="text-[11px] text-slate-500 ml-6">Có sự sai lệch số lượng hoặc hàng hóa không đạt tiêu chuẩn.</div>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="note"
            label={<span className="text-xs font-medium text-slate-700">Ghi chú biên bản nghiệm thu</span>}
          >
            <Input.TextArea rows={3} placeholder="Ghi chú chi tiết về tình trạng hàng hóa..." className="text-xs" />
          </Form.Item>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <Button onClick={() => setReceiptModalVisible(false)} size="middle" className="text-xs">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs border-0" size="middle">
              Xác Nhận Nghiệm Thu
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Đánh Giá Nhà Cung Cấp */}
      <Modal
        title={<span className="text-sm font-semibold text-slate-900">Đánh Giá Nhà Cung Cấp Sau Giao Hàng</span>}
        open={evalModalVisible}
        onCancel={() => setEvalModalVisible(false)}
        footer={null}
        width={520}
      >
        <Form form={evalForm} layout="vertical" onFinish={handleEvaluate} initialValues={{ priceScore: 5, qualityScore: 5, deliveryScore: 5 }} className="mt-4">
          <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-md mb-4">
            <Form.Item
              name="priceScore"
              label={<span className="text-xs font-medium text-slate-700">1. Mức độ cạnh tranh về Giá Cả</span>}
              className="mb-2"
            >
              <Rate className="text-amber-500 text-base" />
            </Form.Item>

            <Form.Item
              name="qualityScore"
              label={<span className="text-xs font-medium text-slate-700">2. Chất lượng hàng hóa & Quy cách</span>}
              className="mb-2"
            >
              <Rate className="text-amber-500 text-base" />
            </Form.Item>

            <Form.Item
              name="deliveryScore"
              label={<span className="text-xs font-medium text-slate-700">3. Tiến độ & Thái độ giao hàng</span>}
              className="mb-1"
            >
              <Rate className="text-amber-500 text-base" />
            </Form.Item>
          </div>

          <Form.Item
            name="comment"
            label={<span className="text-xs font-medium text-slate-700">Nhận xét chi tiết cho Scorecard NCC</span>}
          >
            <Input.TextArea rows={3} placeholder="Nhập đánh giá và nhận xét chi tiết..." className="text-xs" />
          </Form.Item>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <Button onClick={() => setEvalModalVisible(false)} size="middle" className="text-xs">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs border-0" size="middle">
              Gửi Đánh Giá Vào Hệ Thống
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
