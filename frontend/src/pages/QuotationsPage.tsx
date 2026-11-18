import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileSpreadsheet, Plus, Search, Pencil, Trash2, X, CheckCircle2, 
  AlertTriangle, Building2, Calendar, FileText, ArrowRight, Check, Eye
} from 'lucide-react';
import api from '../services/api';
import { BaoGia, NhaCungCap, YeuCauMuaSam, SanPham } from '../types';
import { useAuth } from '../context/AuthContext';

interface QuotationsPageProps {
  onBreadcrumbChange?: (sub?: string, show?: boolean) => void;
}

export const QuotationsPage: React.FC<QuotationsPageProps> = ({ onBreadcrumbChange }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [quotes, setQuotes] = useState<BaoGia[]>([]);
  const [suppliers, setSuppliers] = useState<NhaCungCap[]>([]);
  const [eligiblePRs, setEligiblePRs] = useState<YeuCauMuaSam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingQuote, setEditingQuote] = useState<BaoGia | null>(null);
  const [selectedPRId, setSelectedPRId] = useState<number | ''>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');
  const [quoteItems, setQuoteItems] = useState<{ sanPham: SanPham; soLuong: number; donGiaChao: number }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleteConfirmQuote, setDeleteConfirmQuote] = useState<BaoGia | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; title: string; desc?: string } | null>(null);

  useEffect(() => {
    if (onBreadcrumbChange) {
      onBreadcrumbChange('Quản lý báo giá & RFQ', false);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [quotesRes, suppliersRes, prsRes] = await Promise.all([
        api.get<BaoGia[]>('/bao-gia'),
        api.get<NhaCungCap[]>('/nha-cung-cap'),
        api.get<YeuCauMuaSam[]>('/yeu-cau-mua-sam')
      ]);
      setQuotes(quotesRes.data);
      setSuppliers(suppliersRes.data);

      // Eligible PRs for RFQ/Quotation: DA_DUYET, CHO_BAO_GIA, DA_CHON_NCC
      const eligible = prsRes.data.filter(pr => 
        pr.trangThai === 'DA_DUYET' || pr.trangThai === 'CHO_BAO_GIA' || pr.trangThai === 'DA_CHON_NCC'
      );
      setEligiblePRs(eligible);
    } catch (err: any) {
      console.error(err);
      showBanner('error', 'Lỗi tải danh sách báo giá', err.message);
    } finally {
      setLoading(false);
    }
  };

  const showBanner = (type: 'success' | 'error', title: string, desc?: string) => {
    setBanner({ type, title, desc });
    setTimeout(() => setBanner(null), 4500);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
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

  // Filtered quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const query = search.trim().toLowerCase();
      const code = `BG-${String(q.maBaoGia).padStart(4, '0')}`.toLowerCase();
      const prCode = q.yeuCauMuaSam ? `PR-${String(q.yeuCauMuaSam.maYeuCau).padStart(4, '0')}`.toLowerCase() : '';
      const supplierName = q.nhaCungCap?.tenNhaCungCap?.toLowerCase() || '';

      const matchSearch = !query || code.includes(query) || prCode.includes(query) || supplierName.includes(query);
      const matchSupplier = filterSupplier === 'all' || String(q.nhaCungCap?.maNhaCungCap) === filterSupplier;
      const matchStatus = filterStatus === 'all' || 
        (filterStatus === 'selected' && q.duocLuaChon) ||
        (filterStatus === 'pending' && !q.duocLuaChon);

      return matchSearch && matchSupplier && matchStatus;
    });
  }, [quotes, search, filterSupplier, filterStatus]);

  // When user selects a PR in Create mode, load its products
  const handleSelectPR = (prId: number) => {
    setSelectedPRId(prId);
    const targetPR = eligiblePRs.find(p => p.maYeuCau === prId);
    if (targetPR && targetPR.chiTietList) {
      setQuoteItems(targetPR.chiTietList.map(item => ({
        sanPham: item.sanPham,
        soLuong: item.soLuong,
        donGiaChao: item.donGiaDuKien || 0
      })));
    } else {
      setQuoteItems([]);
    }
  };

  const handleOpenCreate = () => {
    setEditingQuote(null);
    setSelectedPRId('');
    setSelectedSupplierId('');
    setQuoteItems([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: BaoGia) => {
    if (q.duocLuaChon) {
      showBanner('error', 'Không thể chỉnh sửa', 'Báo giá này đã được chốt lựa chọn');
      return;
    }
    setEditingQuote(q);
    setSelectedPRId(q.yeuCauMuaSam?.maYeuCau || '');
    setSelectedSupplierId(q.nhaCungCap?.maNhaCungCap || '');
    setQuoteItems(
      (q.chiTietList || []).map(it => ({
        sanPham: it.sanPham,
        soLuong: it.soLuong,
        donGiaChao: it.donGiaChao
      }))
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  const calculateTotal = useMemo(() => {
    return quoteItems.reduce((sum, item) => sum + (item.soLuong * item.donGiaChao), 0);
  }, [quoteItems]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedPRId) {
      setFormError('Vui lòng chọn phiếu yêu cầu mua sắm.');
      return;
    }
    if (!selectedSupplierId) {
      setFormError('Vui lòng chọn nhà cung cấp gửi báo giá.');
      return;
    }
    if (quoteItems.length === 0) {
      setFormError('Không có sản phẩm nào trong báo giá.');
      return;
    }

    for (const item of quoteItems) {
      if (item.donGiaChao <= 0) {
        setFormError(`Đơn giá chào của "${item.sanPham.tenSanPham}" phải lớn hơn 0.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        maYeuCau: selectedPRId,
        maNhaCungCap: selectedSupplierId,
        maNguoiDung: currentUser?.maNguoiDung,
        chiTietList: quoteItems.map(it => ({
          maSanPham: it.sanPham.maSanPham,
          soLuong: it.soLuong,
          donGiaChao: it.donGiaChao
        }))
      };

      if (editingQuote) {
        await api.put(`/bao-gia/${editingQuote.maBaoGia}`, payload);
        showBanner('success', 'Cập nhật báo giá thành công', `Đã lưu báo giá BG-${String(editingQuote.maBaoGia).padStart(4, '0')}`);
      } else {
        await api.post('/bao-gia', payload);
        showBanner('success', 'Nhập báo giá thành công', 'Báo giá nhà cung cấp đã được lưu.');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data || 'Đã có lỗi xảy ra khi lưu báo giá.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmQuote) return;
    try {
      await api.delete(`/bao-gia/${deleteConfirmQuote.maBaoGia}`);
      showBanner('success', 'Xóa thành công', `Đã xóa báo giá BG-${String(deleteConfirmQuote.maBaoGia).padStart(4, '0')}`);
      setDeleteConfirmQuote(null);
      loadData();
    } catch (err: any) {
      showBanner('error', 'Không thể xóa báo giá', err.response?.data || err.message);
      setDeleteConfirmQuote(null);
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
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Báo giá & RFQ</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gửi yêu cầu báo giá tới nhà cung cấp và nhập liệu bảng chào giá chi tiết cho từng phiếu mua sắm.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/so-sanh-bao-gia')}
            className="h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg inline-flex items-center gap-2 shadow-2xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>So sánh báo giá</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nhập báo giá mới</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Tổng số báo giá</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{quotes.length}</div>
          <div className="text-xs text-slate-500 mt-1">Đã tiếp nhận từ các nhà cung cấp</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-emerald-700">Đã chốt lựa chọn</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{quotes.filter(q => q.duocLuaChon).length}</div>
          <div className="text-xs text-emerald-600 mt-1">Được phê duyệt để tạo đơn PO</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-amber-700">Đang chờ so sánh</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{quotes.filter(q => !q.duocLuaChon).length}</div>
          <div className="text-xs text-amber-600 mt-1">Báo giá đang được cân nhắc</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã BG, mã PR hoặc tên nhà cung cấp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">Tất cả NCC</option>
              {suppliers.map(s => (
                <option key={s.maNhaCungCap} value={String(s.maNhaCungCap)}>{s.tenNhaCungCap}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="selected">Đã được chọn</option>
              <option value="pending">Chưa chọn</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium text-xs border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã báo giá</th>
                <th className="py-3 px-4">Thuộc phiếu PR</th>
                <th className="py-3 px-4">Nhà cung cấp</th>
                <th className="py-3 px-4">Ngày báo giá</th>
                <th className="py-3 px-4 text-right">Tổng tiền báo giá</th>
                <th className="py-3 px-4 text-center">Kết quả</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Đang tải dữ liệu báo giá...</td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Không có báo giá nào phù hợp.</td>
                </tr>
              ) : (
                filteredQuotes.map((q) => {
                  const bgCode = `BG-${String(q.maBaoGia).padStart(4, '0')}`;
                  const prCode = q.yeuCauMuaSam ? `PR-${String(q.yeuCauMuaSam.maYeuCau).padStart(4, '0')}` : '-';
                  return (
                    <tr key={q.maBaoGia} className="hover:bg-slate-50/75 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 tabular-nums">
                        {bgCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 tabular-nums">
                          {prCode}
                        </span>
                        {q.yeuCauMuaSam?.tieuDe && (
                          <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">{q.yeuCauMuaSam.tieuDe}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{q.nhaCungCap?.tenNhaCungCap}</div>
                        <div className="text-xs text-slate-500">MST: {q.nhaCungCap?.maSoThue}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {formatDate(q.ngayBaoGia)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-indigo-600 tabular-nums">
                        {formatCurrency(q.tongTienBaoGia)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {q.duocLuaChon ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã chọn</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Đang xem xét
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {q.yeuCauMuaSam && (
                            <button
                              onClick={() => navigate(`/so-sanh-bao-gia?prId=${q.yeuCauMuaSam.maYeuCau}`)}
                              title="Xem so sánh báo giá"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                            </button>
                          )}
                          {!q.duocLuaChon && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(q)}
                                title="Chỉnh sửa báo giá"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmQuote(q)}
                                title="Xóa báo giá"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
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

      {/* Modal: Nhập / Sửa Báo Giá */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h2 className="text-base font-semibold text-slate-900">
                {editingQuote ? `Chỉnh sửa báo giá BG-${String(editingQuote.maBaoGia).padStart(4, '0')}` : 'Nhập báo giá từ nhà cung cấp'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phiếu yêu cầu mua sắm *
                  </label>
                  <select
                    disabled={!!editingQuote}
                    value={selectedPRId}
                    onChange={(e) => handleSelectPR(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-50"
                  >
                    <option value="">-- Chọn phiếu yêu cầu --</option>
                    {eligiblePRs.map(pr => (
                      <option key={pr.maYeuCau} value={pr.maYeuCau}>
                        PR-{String(pr.maYeuCau).padStart(4, '0')} - {pr.tieuDe || 'Phiếu mua sắm'} ({formatCurrency(pr.tongTienDuKien)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nhà cung cấp chào giá *
                  </label>
                  <select
                    disabled={!!editingQuote}
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-50"
                  >
                    <option value="">-- Chọn nhà cung cấp --</option>
                    {suppliers.map(s => (
                      <option key={s.maNhaCungCap} value={s.maNhaCungCap}>
                        {s.tenNhaCungCap} (MST: {s.maSoThue})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Price Input Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                <div className="bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 border-b border-slate-200 flex justify-between items-center">
                  <span>Chi tiết đơn giá chào từng mặt hàng</span>
                  <span>{quoteItems.length} sản phẩm</span>
                </div>
                {quoteItems.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Vui lòng chọn Phiếu yêu cầu mua sắm để nạp danh sách sản phẩm.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Sản phẩm</th>
                        <th className="py-2.5 px-3 text-center">ĐVT</th>
                        <th className="py-2.5 px-3 text-right">Số lượng</th>
                        <th className="py-2.5 px-3 text-right w-36">Đơn giá chào (đ) *</th>
                        <th className="py-2.5 px-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quoteItems.map((item, idx) => {
                        const subtotal = item.soLuong * item.donGiaChao;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-medium text-slate-900">
                              {item.sanPham.tenSanPham}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-500">
                              {item.sanPham.donViTinh || 'Chiếc'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold">
                              {item.soLuong}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                min="1000"
                                step="1000"
                                value={item.donGiaChao || ''}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setQuoteItems(quoteItems.map((it, i) => i === idx ? { ...it, donGiaChao: val } : it));
                                }}
                                className="w-full px-2 py-1 text-right tabular-nums border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-indigo-600 tabular-nums">
                              {formatCurrency(subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 font-semibold border-t border-slate-200">
                      <tr>
                        <td colSpan={4} className="py-2.5 px-3 text-right text-slate-700">Tổng cộng báo giá:</td>
                        <td className="py-2.5 px-3 text-right font-bold text-indigo-600 text-sm tabular-nums">
                          {formatCurrency(calculateTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || quoteItems.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : (editingQuote ? 'Cập nhật' : 'Lưu báo giá')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Xác nhận xóa báo giá?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa báo giá <strong>BG-{String(deleteConfirmQuote.maBaoGia).padStart(4, '0')}</strong> của nhà cung cấp {deleteConfirmQuote.nhaCungCap?.tenNhaCungCap}?
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmQuote(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
