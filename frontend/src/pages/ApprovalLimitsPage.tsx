import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Pencil, CheckCircle2, AlertTriangle, X, Info, 
  ArrowRight, ShieldAlert, SlidersHorizontal, DollarSign
} from 'lucide-react';
import api from '../services/api';
import { HanMucPheDuyet } from '../types';

interface ApprovalLimitsPageProps {
  onBreadcrumbChange?: (sub?: string, show?: boolean) => void;
}

export const ApprovalLimitsPage: React.FC<ApprovalLimitsPageProps> = ({ onBreadcrumbChange }) => {
  const [limits, setLimits] = useState<HanMucPheDuyet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingLimit, setEditingLimit] = useState<HanMucPheDuyet | null>(null);
  const [minInput, setMinInput] = useState<string>('');
  const [maxInput, setMaxInput] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; title: string; desc?: string } | null>(null);

  useEffect(() => {
    if (onBreadcrumbChange) {
      onBreadcrumbChange('Cài đặt hạn mức phê duyệt', false);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get<HanMucPheDuyet[]>('/han-muc');
      setLimits(res.data);
    } catch (err: any) {
      console.error(err);
      showBanner('error', 'Lỗi tải dữ liệu hạn mức', err.message);
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

  const handleOpenEdit = (hm: HanMucPheDuyet) => {
    setEditingLimit(hm);
    setMinInput(String(hm.soTienToiThieu));
    setMaxInput(String(hm.soTienToiDa));
    setFormError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLimit) return;

    const min = parseFloat(minInput);
    const max = parseFloat(maxInput);

    if (isNaN(min) || min < 0) {
      setFormError('Số tiền tối thiểu phải là số lớn hơn hoặc bằng 0.');
      return;
    }
    if (isNaN(max) || max <= 0) {
      setFormError('Số tiền tối đa phải lớn hơn 0.');
      return;
    }
    if (max <= min) {
      setFormError('Số tiền tối đa phải lớn hơn số tiền tối thiểu.');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/han-muc/${editingLimit.maHanMuc}`, {
        soTienToiThieu: min,
        soTienToiDa: max
      });
      showBanner('success', 'Cập nhật hạn mức thành công', `Đã cập nhật hạn mức phê duyệt cho vai trò ${editingLimit.vaiTro.tenVaiTro}`);
      setEditingLimit(null);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data || 'Không thể cập nhật hạn mức');
    } finally {
      setSaving(false);
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
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Hệ thống kiểm soát thẩm quyền 2 cấp tuần tự</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Cài đặt hạn mức phê duyệt</h1>
        <p className="text-sm text-slate-500 mt-1">
          Thiết lập ngưỡng ngân sách thẩm quyền phê duyệt phiếu yêu cầu mua sắm cho từng cấp quản lý (2 cấp tuần tự).
        </p>
      </div>

      {/* Dải phổ hạn mức trực quan (Horizon Barometer) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span>Phổ phân cấp hạn mức ngân sách</span>
          </div>
          <span className="text-xs text-slate-500">
            Ngưỡng chuyển tiếp tự động lên Cấp 2: <strong className="text-indigo-600 font-bold tabular-nums">50.000.000 ₫</strong>
          </span>
        </div>

        {/* Spectrum Bar */}
        <div className="relative pt-6 pb-2">
          <div className="h-3.5 w-full bg-slate-100 rounded-full flex overflow-hidden p-0.5 border border-slate-200">
            <div className="h-full rounded-l-full bg-emerald-500 transition-all duration-300 relative" style={{ width: '35%' }} title="Vùng Cấp 1 (≤ 50 triệu)">
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
            <div className="h-full rounded-r-full bg-indigo-600 transition-all duration-300 relative" style={{ width: '65%' }} title="Vùng Cấp 2 (> 50 triệu)">
              <div className="absolute inset-0 bg-white/10" />
            </div>
          </div>

          {/* Threshold Pin */}
          <div className="absolute top-0.5 left-[35%] -translate-x-1/2 flex flex-col items-center">
            <div className="px-2 py-0.5 bg-slate-900 text-white rounded text-xs font-bold shadow-sm whitespace-nowrap tabular-nums">
              50 Triệu ₫
            </div>
            <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.5" />
          </div>

          <div className="flex justify-between items-center text-xs text-slate-600 pt-2 font-medium">
            <span className="text-emerald-700 font-semibold">0 ₫</span>
            <span className="text-emerald-600 font-medium hidden sm:inline">Vùng Cấp 1 (Trưởng phòng duyệt xong là hoàn tất)</span>
            <span className="text-indigo-600 font-medium hidden sm:inline">Vùng Cấp 2 (Tự động chuyển tiếp Giám đốc duyệt)</span>
            <span className="text-indigo-700 font-semibold">Không giới hạn</span>
          </div>
        </div>
      </div>

      {/* Limits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-400">Đang tải cấu hình hạn mức...</div>
        ) : limits.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400">Chưa có dữ liệu hạn mức.</div>
        ) : (
          limits.map((hm) => {
            const isDirector = hm.vaiTro?.maVaiTro === 'GIAM_DOC';
            return (
              <div 
                key={hm.maHanMuc}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-xs transition relative overflow-hidden flex flex-col justify-between"
              >
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${isDirector ? 'bg-indigo-600' : 'bg-emerald-500'}`} />

                <div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isDirector ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {isDirector ? 'Cấp 2 (NPD2)' : 'Cấp 1 (NPD1)'}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(hm)}
                      className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-xs font-medium transition cursor-pointer inline-flex items-center gap-1.5"
                      title="Chỉnh sửa hạn mức"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa</span>
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mt-3">{hm.vaiTro?.tenVaiTro}</h3>
                  <p className="text-xs text-slate-500 mt-1">{hm.vaiTro?.moTa || 'Phê duyệt phiếu yêu cầu theo hạn mức được giao'}</p>

                  <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Phạm vi thẩm quyền:</span>
                      <span className="font-semibold text-slate-800">
                        {isDirector ? 'Từ trên 50 triệu trở lên' : 'Dưới hoặc bằng 50 triệu'}
                      </span>
                    </div>
                    <div className="h-px bg-slate-200" />
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Mức tối thiểu:</span>
                      <span className="font-semibold text-slate-900 text-sm tabular-nums">{formatCurrency(hm.soTienToiThieu)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Mức tối đa:</span>
                      <span className="font-bold text-indigo-600 text-base tabular-nums">{formatCurrency(hm.soTienToiDa)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Mã hạn mức: #{hm.maHanMuc}</span>
                  <button
                    onClick={() => handleOpenEdit(hm)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Cấu hình lại hạn mức &rarr;</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {editingLimit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-semibold text-slate-900">
                Cài đặt hạn mức - {editingLimit.vaiTro?.tenVaiTro}
              </h2>
              <button 
                onClick={() => setEditingLimit(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Số tiền tối thiểu (VNĐ) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1000"
                    value={minInput}
                    onChange={(e) => setMinInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="0"
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Hiện tại: {formatCurrency(Number(minInput) || 0)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Số tiền tối đa (VNĐ) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1000000"
                    value={maxInput}
                    onChange={(e) => setMaxInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="50000000"
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Hiện tại: {formatCurrency(Number(maxInput) || 0)}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingLimit(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
