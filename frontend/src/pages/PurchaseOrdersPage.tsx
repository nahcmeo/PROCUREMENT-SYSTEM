import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Plus, Search, Pencil, Trash2, X, CheckCircle2, 
  AlertTriangle, Building2, Calendar, FileText, Check, Truck, 
  PackageCheck, Eye, Star, ArrowRight, ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { DonMuaHang, YeuCauMuaSam, BaoGia, NhaCungCap } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

interface PurchaseOrdersPageProps {
  onBreadcrumbChange?: (sub?: string, show?: boolean) => void;
}

export const PurchaseOrdersPage: React.FC<PurchaseOrdersPageProps> = ({ onBreadcrumbChange }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<DonMuaHang[]>([]);
  const [eligiblePrs, setEligiblePrs] = useState<{ yeuCau: YeuCauMuaSam; baoGia: BaoGia; nhaCungCap: NhaCungCap }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal / Detail state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedEligiblePrId, setSelectedEligiblePrId] = useState<number | ''>('');
  const [selectedOrder, setSelectedOrder] = useState<DonMuaHang | null>(null);
  const [isReceivingModalOpen, setIsReceivingModalOpen] = useState<boolean>(false);
  const [receivingItems, setReceivingItems] = useState<{ maChiTietDonHang: number; soLuongMua: number; soLuongThucNhan: number; tenSanPham: string; donViTinh: string; donGiaChot: number }[]>([]);
  const [newStatus, setNewStatus] = useState<string>('');
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<DonMuaHang | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; title: string; desc?: string } | null>(null);

  useEffect(() => {
    if (onBreadcrumbChange) {
      onBreadcrumbChange('Đơn mua hàng PO & Nghiệm thu', false);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, eligibleRes] = await Promise.all([
        api.get<DonMuaHang[]>('/don-mua-hang'),
        api.get<any[]>('/don-mua-hang/eligible-prs').catch(() => ({ data: [] }))
      ]);
      setOrders(ordersRes.data);
      setEligiblePrs(eligibleRes.data);
    } catch (err: any) {
      console.error(err);
      showBanner('error', 'Lỗi tải danh sách đơn mua hàng', err.message);
    } finally {
      setLoading(false);
    }
  };

  const showBanner = (type: 'success' | 'error', title: string, desc?: string) => {
    setBanner({ type, title, desc });
    setTimeout(() => setBanner(null), 4500);
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // KPI Stats
  const stats = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter(o => o.trangThai === 'DA_NHAN_DU').length;
    const delivering = orders.filter(o => o.trangThai === 'DANG_GIAO_HANG' || o.trangThai === 'DA_GUI_NCC').length;
    const totalValue = orders.reduce((sum, o) => sum + (o.tongTien || 0), 0);
    return { total, completed, delivering, totalValue };
  }, [orders]);

  // Filtered
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q || 
        o.soDonHang.toLowerCase().includes(q) ||
        (o.nhaCungCap?.tenNhaCungCap && o.nhaCungCap.tenNhaCungCap.toLowerCase().includes(q)) ||
        (o.yeuCauMuaSam && `pr-${String(o.yeuCauMuaSam.maYeuCau).padStart(4, '0')}`.includes(q));

      const matchStatus = filterStatus === 'all' || o.trangThai === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [orders, search, filterStatus]);

  // Create PO
  const handleCreatePO = async () => {
    if (!selectedEligiblePrId) {
      setFormError('Vui lòng chọn phiếu yêu cầu mua sắm đã có nhà cung cấp trúng thầu.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await api.post<DonMuaHang>('/don-mua-hang', {
        maYeuCau: selectedEligiblePrId,
        maNguoiDung: currentUser?.maNguoiDung
      });
      showBanner('success', 'Lập đơn PO thành công', `Đơn hàng ${res.data.soDonHang} đã được tạo.`);
      setIsCreateOpen(false);
      setSelectedEligiblePrId('');
      loadData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data || 'Không thể tạo đơn hàng PO.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Receiving Modal
  const handleOpenReceiving = (order: DonMuaHang) => {
    setSelectedOrder(order);
    setNewStatus(order.trangThai);
    if (order.chiTietList) {
      setReceivingItems(order.chiTietList.map(it => ({
        maChiTietDonHang: it.maChiTietDonHang!,
        soLuongMua: it.soLuongMua,
        soLuongThucNhan: it.soLuongThucNhan || 0,
        tenSanPham: it.sanPham?.tenSanPham || 'Sản phẩm',
        donViTinh: it.sanPham?.donViTinh || 'Chiếc',
        donGiaChot: it.donGiaChot
      })));
    } else {
      setReceivingItems([]);
    }
    setFormError(null);
    setIsReceivingModalOpen(true);
  };

  // Quick fill all received
  const handleFillAllReceived = () => {
    setReceivingItems(prev => prev.map(it => ({ ...it, soLuongThucNhan: it.soLuongMua })));
    setNewStatus('DA_NHAN_DU');
  };

  // Save receiving status
  const handleSaveReceiving = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setFormError(null);
    setSubmitting(true);

    try {
      await api.put(`/don-mua-hang/${selectedOrder.maDonHang}/trang-thai`, {
        trangThai: newStatus,
        chiTietList: receivingItems.map(it => ({
          maChiTietDonHang: it.maChiTietDonHang,
          soLuongThucNhan: it.soLuongThucNhan
        }))
      });

      showBanner('success', 'Cập nhật trạng thái thành công', `Đơn hàng ${selectedOrder.soDonHang} đã cập nhật sang "${newStatus}".`);
      setIsReceivingModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data || 'Không thể cập nhật tiến độ đơn hàng.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete PO
  const handleDeletePO = async () => {
    if (!deleteConfirmOrder) return;
    try {
      await api.delete(`/don-mua-hang/${deleteConfirmOrder.maDonHang}`);
      showBanner('success', 'Xóa thành công', `Đã xóa đơn hàng ${deleteConfirmOrder.soDonHang}`);
      setDeleteConfirmOrder(null);
      loadData();
    } catch (err: any) {
      showBanner('error', 'Không thể xóa đơn hàng', err.response?.data || err.message);
      setDeleteConfirmOrder(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {banner && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${
          banner.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-3">
            {banner.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
            <div>
              <div className="font-semibold text-sm">{banner.title}</div>
              {banner.desc && <div className="text-xs opacity-90 mt-0.5">{banner.desc}</div>}
            </div>
          </div>
          <button onClick={() => setBanner(null)} className="p-1 hover:bg-black/5 rounded cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Đơn mua hàng (PO) & Nghiệm thu</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi hành trình thực hiện hợp đồng mua sắm, giao vận và nghiệm thu số lượng hàng thực nhận vào kho.
          </p>
        </div>
        <button
          onClick={() => {
            setIsCreateOpen(true);
            setFormError(null);
          }}
          className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg inline-flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Lập đơn hàng PO</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Tổng số PO</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-1">Đơn hàng đã ký phát hành</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-amber-700">Đang giao vận</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.delivering}</div>
          <div className="text-xs text-amber-600 mt-1">Chờ hàng về đến kho</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-emerald-700">Đã nhận đủ hàng</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.completed}</div>
          <div className="text-xs text-emerald-600 mt-1">Nghiệm thu hoàn tất 100%</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-indigo-700">Tổng giá trị PO</div>
          <div className="text-xl font-bold tabular-nums text-indigo-600 mt-2">{formatCurrency(stats.totalValue)}</div>
          <div className="text-xs text-slate-500 mt-1">Cam kết chi ngân sách</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã PO (PO-2026-xxxx), nhà cung cấp, mã PR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="MOI_TAO">Mới tạo</option>
              <option value="DA_GUI_NCC">Đã gửi NCC</option>
              <option value="DANG_GIAO_HANG">Đang giao hàng</option>
              <option value="DA_NHAN_DU">Đã nhận đủ</option>
              <option value="DA_HUY">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium text-xs border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Số đơn hàng (PO)</th>
                <th className="py-3 px-4">Thuộc phiếu PR</th>
                <th className="py-3 px-4">Nhà cung cấp</th>
                <th className="py-3 px-4">Ngày đặt</th>
                <th className="py-3 px-4 text-right">Tổng thanh toán</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Đang tải đơn mua hàng...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Không tìm thấy đơn hàng nào.</td>
                </tr>
              ) : (
                filteredOrders.map((po) => {
                  const prCode = po.yeuCauMuaSam ? `PR-${String(po.yeuCauMuaSam.maYeuCau).padStart(4, '0')}` : '-';
                  const isFinished = po.trangThai === 'DA_NHAN_DU';
                  return (
                    <tr key={po.maDonHang} className="hover:bg-slate-50/75 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 tabular-nums">{po.soDonHang}</div>
                        <div className="text-xs text-slate-400">Người lập: {po.nguoiLapDon?.hoVaTen || 'Mua hàng'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 tabular-nums">
                          {prCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{po.nhaCungCap?.tenNhaCungCap}</div>
                        <div className="text-xs text-slate-400">MST: {po.nhaCungCap?.maSoThue}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {formatDate(po.ngayDatHang)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(po.tongTien)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={po.trangThai} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Track / Receive button */}
                          <button
                            onClick={() => handleOpenReceiving(po)}
                            title="Theo dõi & Nghiệm thu hàng"
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                          >
                            <PackageCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{isFinished ? 'Xem nghiệm thu' : 'Nghiệm thu'}</span>
                          </button>

                          {/* Rate supplier if finished */}
                          {isFinished && (
                            <button
                              onClick={() => navigate(`/xep-hang-ncc?supplierId=${po.nhaCungCap?.maNhaCungCap}`)}
                              title="Đánh giá nhà cung cấp cho đơn này"
                              className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            >
                              <Star className="w-4 h-4 fill-amber-400" />
                            </button>
                          )}

                          {/* Delete if MOI_TAO */}
                          {po.trangThai === 'MOI_TAO' && (
                            <button
                              onClick={() => setDeleteConfirmOrder(po)}
                              title="Xóa đơn hàng mới tạo"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Lập đơn hàng PO mới từ PR */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Lập đơn mua hàng (Purchase Order)</h2>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Chọn Phiếu yêu cầu đã chốt Nhà cung cấp *
              </label>
              {eligiblePrs.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  Hiện không có phiếu yêu cầu mua sắm nào ở trạng thái đã chốt nhà cung cấp mà chưa lập PO.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {eligiblePrs.map(item => {
                    const isSelected = selectedEligiblePrId === item.yeuCau.maYeuCau;
                    return (
                      <div 
                        key={item.yeuCau.maYeuCau}
                        onClick={() => setSelectedEligiblePrId(item.yeuCau.maYeuCau!)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' 
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-900">
                            PR-{String(item.yeuCau.maYeuCau).padStart(4, '0')} - {item.yeuCau.tieuDe || 'Phiếu yêu cầu'}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            NCC trúng thầu: <strong>{item.nhaCungCap?.tenNhaCungCap}</strong>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-indigo-600 text-sm tabular-nums">
                            {formatCurrency(item.baoGia?.tongTienBaoGia)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreatePO}
                disabled={submitting || !selectedEligiblePrId}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Đang tạo...' : 'Xác nhận phát hành PO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Theo dõi & Nghiệm thu nhận hàng (UC 3.3.14) */}
      {isReceivingModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Theo dõi & Nghiệm thu - {selectedOrder.soDonHang}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  NCC: {selectedOrder.nhaCungCap?.tenNhaCungCap} - Đặt ngày: {formatDate(selectedOrder.ngayDatHang)}
                </div>
              </div>
              <button onClick={() => setIsReceivingModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReceiving} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Status Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cập nhật trạng thái đơn hàng:
                  </label>
                  <select
                    disabled={selectedOrder.trangThai === 'DA_NHAN_DU' || selectedOrder.trangThai === 'DA_HUY'}
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="MOI_TAO">Mới tạo</option>
                    <option value="DA_GUI_NCC">Đã gửi NCC</option>
                    <option value="DANG_GIAO_HANG">Đang giao hàng</option>
                    <option value="DA_NHAN_DU">Đã nhận đủ (Nghiệm thu hoàn tất)</option>
                    <option value="DA_HUY">Đã hủy</option>
                  </select>
                </div>

                {selectedOrder.trangThai !== 'DA_NHAN_DU' && selectedOrder.trangThai !== 'DA_HUY' && (
                  <button
                    type="button"
                    onClick={handleFillAllReceived}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Nghiệm thu nhận đủ 100%</span>
                  </button>
                )}
              </div>

              {/* Receiving Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                <div className="bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 border-b border-slate-200 flex justify-between items-center">
                  <span>Số lượng thực nhận tại kho</span>
                  <span className="text-slate-400 font-normal">Yêu cầu nhận đủ để đóng đơn</span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Tên hàng hóa</th>
                      <th className="py-2.5 px-3 text-center">ĐVT</th>
                      <th className="py-2.5 px-3 text-right">SL Mua</th>
                      <th className="py-2.5 px-3 text-right w-36">SL Thực nhận *</th>
                      <th className="py-2.5 px-3 text-center">Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receivingItems.map((item, idx) => {
                      const isFull = item.soLuongThucNhan >= item.soLuongMua;
                      const isPartial = item.soLuongThucNhan > 0 && item.soLuongThucNhan < item.soLuongMua;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {item.tenSanPham}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-500">
                            {item.donViTinh}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                            {item.soLuongMua}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              max={item.soLuongMua * 2}
                              disabled={selectedOrder.trangThai === 'DA_NHAN_DU' || selectedOrder.trangThai === 'DA_HUY'}
                              value={item.soLuongThucNhan}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setReceivingItems(receivingItems.map((it, i) => i === idx ? { ...it, soLuongThucNhan: val } : it));
                              }}
                              className="w-full px-2 py-1 text-right tabular-nums font-semibold border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isFull ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-emerald-50 text-emerald-700">
                                Đủ hàng
                              </span>
                            ) : isPartial ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-amber-50 text-amber-700">
                                Giao 1 phần
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium bg-slate-100 text-slate-500">
                                Chưa nhận
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsReceivingModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer"
                >
                  Đóng
                </button>
                {selectedOrder.trangThai !== 'DA_NHAN_DU' && selectedOrder.trangThai !== 'DA_HUY' && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Đang cập nhật...' : 'Lưu kết quả nghiệm thu'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Xác nhận xóa đơn hàng PO?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa đơn hàng <strong>{deleteConfirmOrder.soDonHang}</strong>? Chỉ các đơn hàng ở trạng thái Mới tạo mới được phép xóa.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmOrder(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeletePO}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg shadow-xs transition cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
