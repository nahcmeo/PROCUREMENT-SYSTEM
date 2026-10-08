import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Tag, Tooltip, DatePicker, Rate
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  SolutionOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import API from '../services/api';

const { Option } = Select;

export default function RFQManagement() {
  const [rfqs, setRfqs] = useState([]);
  const [approvedPrs, setApprovedPrs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [addQuoteModalVisible, setAddQuoteModalVisible] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState(null);

  const [form] = Form.useForm();
  const [quoteForm] = Form.useForm();
  const [selectedPrItems, setSelectedPrItems] = useState([]);

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : {};

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      const res = await API.get('/rfq');
      setRfqs(res.data);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải danh sách RFQ!');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedPRs = async () => {
    try {
      const res = await API.get('/pr');
      const approved = res.data.filter((p) => p.status === 'APPROVED');
      setApprovedPrs(approved);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await API.get('/vendors');
      setVendors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRFQs();
    fetchApprovedPRs();
    fetchVendors();
  }, []);

  const handlePrSelect = (prId) => {
    const pr = approvedPrs.find((p) => p.id === prId);
    if (pr) {
      setSelectedPrItems(pr.items || []);
      form.setFieldsValue({ title: `Hỏi giá cho đề xuất: ${pr.title}` });
    }
  };

  const handleCreateRFQ = async (values) => {
    try {
      await API.post('/rfq', values);
      message.success('Tạo yêu cầu báo giá (RFQ) thành công!');
      setCreateModalVisible(false);
      form.resetFields();
      setSelectedPrItems([]);
      fetchRFQs();
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi tạo RFQ!');
    }
  };

  const handleOpenAddQuote = () => {
    if (!selectedRfq || !selectedRfq.items) return;
    const initialItems = selectedRfq.items.map((item) => ({
      prItemId: item.id,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: 0,
    }));
    quoteForm.setFieldsValue({
      vendorId: undefined,
      deliveryDays: 7,
      note: '',
      items: initialItems,
    });
    setAddQuoteModalVisible(true);
  };

  const handleSaveQuotation = async (values) => {
    try {
      // Đảm bảo các thuộc tính itemName, quantity, prItemId luôn có đầy đủ
      const payload = {
        ...values,
        items: selectedRfq.items.map((it, idx) => ({
          prItemId: it.id,
          itemName: it.itemName,
          quantity: it.quantity,
          unitPrice: values.items?.[idx]?.unitPrice || 0,
        })),
      };
      await API.post(`/rfq/${selectedRfq.id}/quotations`, payload);
      message.success('Đã nhập thông tin báo giá từ Nhà cung cấp!');
      setAddQuoteModalVisible(false);
      quoteForm.resetFields();
      // Reload RFQ details
      const updated = await API.get(`/rfq/${selectedRfq.id}`);
      setSelectedRfq(updated.data);
      fetchRFQs();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Lỗi khi lưu báo giá!');
    }
  };

  const handleSelectWinningQuotation = async (quotationId) => {
    try {
      await API.put(`/rfq/${selectedRfq.id}/quotations/${quotationId}/select`);
      message.success('Đã chốt lựa chọn Nhà cung cấp thắng thầu!');
      const updated = await API.get(`/rfq/${selectedRfq.id}`);
      setSelectedRfq(updated.data);
      fetchRFQs();
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi chọn nhà cung cấp!');
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
            Đang nhận báo giá
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Đã chốt NCC
          </span>
        );
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  const columns = [
    {
      title: 'Mã RFQ',
      dataIndex: 'rfqCode',
      key: 'rfqCode',
      render: (text, record) => (
        <span
          onClick={() => { setSelectedRfq(record); setDetailModalVisible(true); }}
          className="font-mono text-cyan-700 font-medium cursor-pointer hover:underline"
        >
          {text}
        </span>
      ),
    },
    { title: 'Tiêu đề đợt hỏi giá', dataIndex: 'title', key: 'title', render: (t) => <span className="font-medium text-slate-800">{t}</span> },
    {
      title: 'Phiếu PR gốc',
      dataIndex: 'prCode',
      key: 'prCode',
      render: (p) => p ? <span className="font-mono text-slate-600">{p}</span> : <span className="text-slate-400">Không gắn</span>,
    },
    { title: 'Phòng ban', dataIndex: 'departmentName', key: 'departmentName', render: (d) => <span className="text-slate-500">{d || 'Nội bộ'}</span> },
    {
      title: 'Số báo giá đã nhận',
      key: 'quotesCount',
      align: 'center',
      render: (_, record) => (
        <span className="font-mono tabular-nums font-semibold text-slate-700">
          {record.quotations?.length || 0} NCC
        </span>
      ),
    },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: renderStatus },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          className="text-xs h-7 text-slate-600 border-slate-300"
          onClick={() => { setSelectedRfq(record); setDetailModalVisible(true); }}
        >
          So sánh & Báo giá
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Quản Lý Yêu Cầu Báo Giá (RFQ) & So Sánh Báo Giá
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lập đợt hỏi giá từ PR đã duyệt, tiếp nhận báo giá từ các Nhà cung cấp và đối chiếu lựa chọn
          </p>
        </div>
        {(user.role === 'PURCHASER' || user.role === 'ADMIN') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs h-8 border-0 mt-2 sm:mt-0"
            onClick={() => setCreateModalVisible(true)}
          >
            Lập Yêu Cầu Báo Giá Mới
          </Button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <Table
          columns={columns}
          dataSource={rfqs}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </div>

      {/* Modal Lập RFQ Mới */}
      <Modal
        title={<span className="text-sm font-semibold text-slate-900">Lập Yêu Cầu Báo Giá (RFQ) Từ PR Đã Duyệt</span>}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={680}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateRFQ} className="mt-4">
          <Form.Item
            name="prId"
            label={<span className="text-xs font-medium text-slate-700">Chọn Phiếu Đề Nghị Mua Sắm (PR đã được phê duyệt)</span>}
            rules={[{ required: true, message: 'Vui lòng chọn phiếu PR' }]}
          >
            <Select placeholder="Chọn phiếu PR đã duyệt..." onChange={handlePrSelect} className="text-xs">
              {approvedPrs.map((pr) => (
                <Option key={pr.id} value={pr.id}>
                  <span className="font-mono text-cyan-700 mr-2">{pr.prCode}</span> — {pr.title} ({pr.departmentName} - {formatCurrency(pr.totalAmount)})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label={<span className="text-xs font-medium text-slate-700">Tiêu đề đợt hỏi giá</span>}
            rules={[{ required: true, message: 'Nhập tiêu đề RFQ' }]}
          >
            <Input placeholder="Tiêu đề yêu cầu báo giá" className="text-xs" />
          </Form.Item>

          <Form.Item
            name="note"
            label={<span className="text-xs font-medium text-slate-700">Ghi chú yêu cầu gửi NCC</span>}
          >
            <Input.TextArea rows={2} placeholder="Yêu cầu về xuất xứ, thời hạn giao hàng, tiêu chuẩn kỹ thuật..." className="text-xs" />
          </Form.Item>

          {selectedPrItems.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-700 mb-2">Các mặt hàng sẽ được đưa vào RFQ:</div>
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <Table
                  dataSource={selectedPrItems}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Mặt hàng', dataIndex: 'itemName', key: 'itemName', render: (t) => <span className="font-medium">{t}</span> },
                    { title: 'Quy cách', dataIndex: 'specification', key: 'specification', render: (s) => <span className="text-slate-500">{s || '—'}</span> },
                    { title: 'SL', dataIndex: 'quantity', key: 'quantity', align: 'center', render: (q) => <span className="font-mono">{q}</span> },
                    { title: 'ĐVT', dataIndex: 'unit', key: 'unit', align: 'center' },
                  ]}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <Button onClick={() => setCreateModalVisible(false)} size="middle" className="text-xs">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs border-0" size="middle">
              Tạo & Phát Hành RFQ
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Chi Tiết RFQ & Bảng So Sánh Báo Giá */}
      {selectedRfq && (
        <Modal
          title={
            <div className="flex items-center justify-between pr-6">
              <span className="text-sm font-semibold text-slate-900">
                Đợt Hỏi Giá: <span className="font-mono text-cyan-700">{selectedRfq.rfqCode}</span>
              </span>
              {renderStatus(selectedRfq.status)}
            </div>
          }
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          width={880}
        >
          <div className="space-y-5 mt-3">
            {/* Header thông tin */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 p-3 rounded-md text-xs">
              <div><span className="text-slate-500">Tiêu đề:</span> <b className="text-slate-800">{selectedRfq.title}</b></div>
              <div><span className="text-slate-500">PR nguồn:</span> <b className="font-mono text-slate-700">{selectedRfq.prCode || '—'}</b></div>
              <div><span className="text-slate-500">Phòng ban:</span> <b className="text-slate-800">{selectedRfq.departmentName || '—'}</b></div>
              <div><span className="text-slate-500">Người lập RFQ:</span> <b className="text-slate-800">{selectedRfq.createdByName}</b></div>
            </div>

            {/* Danh sách mặt hàng cần hỏi giá */}
            <div>
              <div className="text-xs font-semibold text-slate-800 mb-2">Mặt Hàng Cần Báo Giá:</div>
              <Table
                dataSource={selectedRfq.items}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Tên mặt hàng', dataIndex: 'itemName', key: 'itemName', render: (t) => <span className="font-medium">{t}</span> },
                  { title: 'Quy cách', dataIndex: 'specification', key: 'specification', render: (s) => <span className="text-slate-500">{s || '—'}</span> },
                  { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', align: 'center', render: (q) => <span className="font-mono">{q}</span> },
                  { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', align: 'center' },
                ]}
              />
            </div>

            {/* BẢNG SO SÁNH BÁO GIÁ ĐA CHIỀU (SCORECARD & QUOTATION MATRIX) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-900 flex items-center">
                  <TrophyOutlined className="text-amber-500 mr-1.5" />
                  Bảng So Sánh Báo Giá Từ Các Nhà Cung Cấp ({selectedRfq.quotations?.length || 0} Báo Giá)
                </div>
                {(user.role === 'PURCHASER' || user.role === 'ADMIN') && selectedRfq.status === 'SENT' && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    className="bg-cyan-700 hover:bg-cyan-800 text-white text-xs border-0 h-7"
                    onClick={handleOpenAddQuote}
                  >
                    + Nhập Báo Giá Của NCC
                  </Button>
                )}
              </div>

              {(!selectedRfq.quotations || selectedRfq.quotations.length === 0) ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-md">
                  Chưa có báo giá nào được nhập cho đợt RFQ này. Bấm nút "+ Nhập Báo Giá Của NCC" để ghi nhận.
                </div>
              ) : (
                <Table
                  dataSource={selectedRfq.quotations}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  expandable={{
                    expandedRowRender: (quoteRecord) => (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                        <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                          <span>Chi tiết bảng báo giá #{quoteRecord.quotationCode} ({quoteRecord.vendorName}):</span>
                          <span className="font-mono text-slate-500">Ghi chú: {quoteRecord.note || 'Không có'}</span>
                        </div>
                        <Table
                          dataSource={quoteRecord.items}
                          rowKey="id"
                          pagination={false}
                          size="small"
                          columns={[
                            { title: 'Tên hàng hóa', dataIndex: 'itemName', key: 'itemName', render: (t) => <span className="font-medium">{t}</span> },
                            { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', align: 'center', render: (q) => <span className="font-mono">{q}</span> },
                            { title: 'Đơn giá NCC báo', dataIndex: 'unitPrice', key: 'unitPrice', align: 'right', render: (p) => <span className="font-mono tabular-nums">{formatCurrency(p)}</span> },
                            { title: 'Thành tiền', dataIndex: 'totalPrice', key: 'totalPrice', align: 'right', render: (t) => <span className="font-mono tabular-nums font-semibold text-slate-900">{formatCurrency(t)}</span> },
                          ]}
                        />
                      </div>
                    ),
                    rowExpandable: (record) => record.items && record.items.length > 0,
                  }}
                  columns={[
                    {
                      title: 'Nhà Cung Cấp',
                      dataIndex: 'vendorName',
                      key: 'vendorName',
                      render: (name, record) => (
                        <div>
                          <div className="font-semibold text-slate-900">{name}</div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center mt-0.5">
                            Mã: <span className="text-cyan-700 font-semibold ml-1 mr-2">{record.quotationCode}</span>
                            Đánh giá: <Rate disabled defaultValue={record.vendorRatingAvg || 4} count={5} className="text-xs ml-1" />
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: 'Cam kết giao hàng',
                      dataIndex: 'deliveryDays',
                      key: 'deliveryDays',
                      align: 'center',
                      render: (days) => (
                        <span className="font-mono text-xs text-slate-700 font-medium">
                          {days} ngày
                        </span>
                      ),
                    },
                    {
                      title: 'Hiệu lực',
                      dataIndex: 'validUntil',
                      key: 'validUntil',
                      align: 'center',
                      render: (v) => <span className="font-mono text-xs text-slate-500">{v || '30 ngày'}</span>,
                    },
                    {
                      title: 'Tổng Giá Báo',
                      dataIndex: 'totalAmount',
                      key: 'totalAmount',
                      align: 'right',
                      render: (amount, record) => (
                        <span className={`font-mono tabular-nums font-bold text-sm ${record.status === 'SELECTED' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {formatCurrency(amount)}
                        </span>
                      ),
                    },
                    {
                      title: 'Kết quả',
                      dataIndex: 'status',
                      key: 'status',
                      align: 'center',
                      render: (status) => {
                        if (status === 'SELECTED') {
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                              ✓ Thắng thầu (Đã chọn)
                            </span>
                          );
                        }
                        if (status === 'REJECTED') {
                          return <span className="text-[11px] text-slate-400">Không chọn</span>;
                        }
                        return <span className="text-[11px] text-slate-500">Đã gửi</span>;
                      },
                    },
                    {
                      title: 'Hành động',
                      key: 'action',
                      align: 'right',
                      render: (_, record) => {
                        if (selectedRfq.status === 'CLOSED') {
                          return null;
                        }
                        return (
                          <Button
                            type="primary"
                            size="small"
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-7 border-0"
                            onClick={() => handleSelectWinningQuotation(record.id)}
                          >
                            Chọn NCC Này
                          </Button>
                        );
                      },
                    },
                  ]}
                />
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Nhập Báo Giá NCC */}
      <Modal
        title={<span className="text-sm font-semibold text-slate-900">Nhập Thông Tin Báo Giá Từ Nhà Cung Cấp</span>}
        open={addQuoteModalVisible}
        onCancel={() => setAddQuoteModalVisible(false)}
        footer={null}
        width={720}
      >
        <Form form={quoteForm} layout="vertical" onFinish={handleSaveQuotation} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="vendorId"
              label={<span className="text-xs font-medium text-slate-700">Chọn Nhà Cung Cấp</span>}
              rules={[{ required: true, message: 'Chọn nhà cung cấp' }]}
            >
              <Select placeholder="Chọn NCC..." className="text-xs">
                {vendors.map((v) => (
                  <Option key={v.id} value={v.id}>
                    {v.name} (Đánh giá: {v.ratingAvg || '4.5'}★)
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="deliveryDays"
              label={<span className="text-xs font-medium text-slate-700">Cam kết giao hàng (số ngày)</span>}
              rules={[{ required: true, message: 'Nhập số ngày cam kết' }]}
            >
              <InputNumber min={1} max={90} className="w-full text-xs font-mono" addonAfter="ngày" />
            </Form.Item>
          </div>

          <Form.Item
            name="note"
            label={<span className="text-xs font-medium text-slate-700">Ghi chú điều khoản / Bảo hành</span>}
          >
            <Input placeholder="Ví dụ: Bảo hành chính hãng 24 tháng, miễn phí vận chuyển nội thành" className="text-xs" />
          </Form.Item>

          <div className="text-xs font-semibold text-slate-700 mb-2">Đơn giá báo cho từng mặt hàng:</div>
          <Form.List name="items">
            {(fields) => (
              <div className="space-y-2 mb-4">
                {fields.map(({ key, name, ...restField }) => {
                  const item = quoteForm.getFieldValue(['items', name]);
                  return (
                    <div key={key} className="p-3 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6 text-xs">
                        <b className="text-slate-800">{item?.itemName}</b>
                        <span className="text-slate-500 ml-2 font-mono">(SL: {item?.quantity})</span>
                        <Form.Item {...restField} name={[name, 'itemName']} hidden initialValue={item?.itemName}>
                          <Input />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, 'quantity']} hidden initialValue={item?.quantity}>
                          <Input />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, 'prItemId']} hidden initialValue={item?.prItemId}>
                          <Input />
                        </Form.Item>
                      </div>
                      <div className="col-span-6">
                        <Form.Item
                          {...restField}
                          name={[name, 'unitPrice']}
                          rules={[{ required: true, message: 'Nhập đơn giá' }]}
                          className="mb-0"
                        >
                          <InputNumber
                            className="w-full text-xs font-mono"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                            addonAfter="₫"
                            placeholder="Đơn giá NCC báo"
                          />
                        </Form.Item>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Form.List>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <Button onClick={() => setAddQuoteModalVisible(false)} size="middle" className="text-xs">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs border-0" size="middle">
              Lưu Báo Giá
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
