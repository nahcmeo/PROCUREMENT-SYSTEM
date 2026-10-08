import React, { useState, useEffect } from 'react';
import { Row, Col, Progress, Table, Spin } from 'antd';
import {
  FileTextOutlined,
  ShoppingOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import API from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await API.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (val) => {
    if (!val) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getStatusBadge = (status) => {
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
            Từ chối
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const columns = [
    {
      title: 'Mã PR',
      dataIndex: 'prCode',
      key: 'prCode',
      render: (text) => <span className="font-mono text-cyan-700 font-medium">{text}</span>,
    },
    { title: 'Tiêu đề đề xuất', dataIndex: 'title', key: 'title', render: (t) => <span className="font-medium text-slate-800">{t}</span> },
    { title: 'Phòng ban', dataIndex: 'departmentName', key: 'departmentName', render: (d) => <span className="text-slate-500">{d || 'Phòng CNTT'}</span> },
    {
      title: 'Tổng tiền ước tính',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (amount) => <span className="font-mono tabular-nums font-semibold text-slate-900">{formatCurrency(amount)}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: getStatusBadge,
    },
  ];

  if (loading) {
    return <div className="p-8 text-center"><Spin tip="Đang tải dữ liệu thực tế từ hệ thống..." /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header khu vực */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Tổng quan Hoạt động Mua sắm & Báo cáo Thống kê
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu trực tiếp (Real-time) từ hệ thống cơ sở dữ liệu mua sắm nội bộ
          </p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-mono">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Grid 4 KPI Cards kết nối CSDL thực tế */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Yêu cầu PR chờ duyệt</span>
            <div className="w-6 h-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
              <FileTextOutlined />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {stats?.pendingPRCount || 0}
            </span>
            <span className="text-xs text-amber-600 font-medium">Cần xử lý</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Tổng giá trị: <span className="font-mono font-medium text-slate-600">{formatCurrency(stats?.pendingPRAmount)}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Đơn PO đang thực hiện</span>
            <div className="w-6 h-6 rounded bg-sky-50 text-sky-600 flex items-center justify-center text-xs">
              <ShoppingOutlined />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {stats?.deliveringPOCount || 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium flex items-center">
              <ArrowUpOutlined className="mr-0.5 text-[10px]" /> Đang giao
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Đơn hàng trong quy trình cung ứng
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Nhà cung cấp đối tác</span>
            <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
              <TeamOutlined />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {stats?.activeVendorCount || 0}
            </span>
            <span className="text-xs text-slate-500">Đối tác</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Điểm Scorecard TB: <span className="font-mono font-semibold text-slate-700">{stats?.avgVendorRating || '4.50'} / 5.0 ★</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Nghiệm thu đạt chuẩn</span>
            <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
              <CheckCircleOutlined />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-emerald-600">
              {stats?.receiptSuccessRate || 100}%
            </span>
            <span className="text-xs text-emerald-600 font-medium">Xuất sắc</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Tỷ lệ hàng đủ số lượng & đúng hẹn
          </div>
        </div>
      </div>

      {/* Khu vực Bảng dữ liệu & Tiến độ ngân sách phòng ban */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bảng PR mới nhất (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-800">
              Yêu Cầu Mua Sắm Gần Đây (PR)
            </div>
            <span className="text-xs text-cyan-600 font-mono font-medium">
              Cập nhật tức thời
            </span>
          </div>
          <div className="p-0">
            <Table
              dataSource={stats?.recentPRs || []}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="middle"
              className="border-0"
            />
          </div>
        </div>

        {/* Cột Tiến độ Ngân sách Phòng ban Thực tế (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-800 pb-3 border-b border-slate-200 mb-4">
            Hạn Mức Ngân Sách Các Phòng Ban
          </div>

          <div className="space-y-4">
            {stats?.departmentBudgets?.map((dept) => {
              const isOver = dept.usedPercent >= 80;
              return (
                <div key={dept.departmentId}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{dept.departmentName}</span>
                    <span className={`font-mono ${isOver ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                      {formatCurrency(dept.usedAmount)} / {formatCurrency(dept.budgetLimit)}
                    </span>
                  </div>
                  <Progress
                    percent={Math.round(dept.usedPercent)}
                    strokeColor={isOver ? '#e11d48' : '#0284c7'}
                    trailColor="#f1f5f9"
                    size="small"
                    status={isOver ? 'exception' : 'normal'}
                  />
                  <div className={`text-[10px] mt-0.5 ${isOver ? 'text-rose-500 font-medium' : 'text-slate-400'}`}>
                    {isOver ? 'Cảnh báo: Chi tiêu sắp vượt trần ngân sách!' : `Đã sử dụng ${Math.round(dept.usedPercent)}% hạn mức`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
