import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Award, Star, Search, Plus, X, CheckCircle2, AlertTriangle, 
  Building2, TrendingUp, History, ShieldCheck, ThumbsUp, DollarSign, Clock
} from 'lucide-react';
import api from '../services/api';
import { NhaCungCap } from '../types';
import { useAuth } from '../context/AuthContext';

interface RankingItem {
  maNhaCungCap: number;
  tenNhaCungCap: string;
  maSoThue: string;
  diemChatLuong: number;
  diemGiaCa: number;
  diemTienDo: number;
  tongDiem: number;
  soLanDanhGia: number;
  soLanBaoGia: number;
  thuHang: number;
}

interface ScoreHistoryItem {
  maDanhGia: number;
  diemChatLuong: number;
  diemGiaCa: number;
  diemTienDo: number;
  tongDiem: number;
  ngayDanhGia: string;
}

interface SupplierRankingsPageProps {
  onBreadcrumbChange?: (sub?: string, show?: boolean) => void;
}

export const SupplierRankingsPage: React.FC<SupplierRankingsPageProps> = ({ onBreadcrumbChange }) => {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [suppliers, setSuppliers] = useState<NhaCungCap[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Rating Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');
  const [scoreQuality, setScoreQuality] = useState<number>(8.5);
  const [scorePrice, setScorePrice] = useState<number>(8.0);
  const [scoreDelivery, setScoreDelivery] = useState<number>(9.0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // History Drawer/Modal
  const [historySupplier, setHistorySupplier] = useState<RankingItem | null>(null);
  const [historyList, setHistoryList] = useState<ScoreHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const [banner, setBanner] = useState<{ type: 'success' | 'error'; title: string; desc?: string } | null>(null);

  const canRate = useMemo(() => {
    return currentUser?.vaiTros?.some(v => 
      v.maVaiTro === 'NHAN_VIEN_MUA_HANG' || v.maVaiTro === 'ADMIN' || v.maVaiTro === 'TRUONG_PHONG'
    );
  }, [currentUser]);

  useEffect(() => {
    if (onBreadcrumbChange) {
      onBreadcrumbChange('Bảng xếp hạng & Đánh giá NCC', false);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rankRes, suppRes] = await Promise.all([
        api.get<RankingItem[]>('/danh-gia/xep-hang'),
        api.get<NhaCungCap[]>('/nha-cung-cap')
      ]);
      setRankings(rankRes.data);
      setSuppliers(suppRes.data);

      // Check query param
      const suppParam = searchParams.get('supplierId');
      if (suppParam) {
        setSelectedSupplierId(Number(suppParam));
        setIsModalOpen(true);
      }
    } catch (err: any) {
      console.error(err);
      showBanner('error', 'Lỗi tải bảng xếp hạng NCC', err.message);
    } finally {
      setLoading(false);
    }
  };

  const showBanner = (type: 'success' | 'error', title: string, desc?: string) => {
    setBanner({ type, title, desc });
    setTimeout(() => setBanner(null), 4500);
  };

  const filteredRankings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rankings;
    return rankings.filter(r => 
      r.tenNhaCungCap.toLowerCase().includes(q) ||
      r.maSoThue.toLowerCase().includes(q)
    );
  }, [rankings, search]);

  const liveAvg = useMemo(() => {
    return ((scoreQuality + scorePrice + scoreDelivery) / 3).toFixed(2);
  }, [scoreQuality, scorePrice, scoreDelivery]);

  const handleOpenRate = (supplierId?: number) => {
    if (supplierId) {
      setSelectedSupplierId(supplierId);
    } else {
      setSelectedSupplierId(suppliers[0]?.maNhaCungCap || '');
    }
    setScoreQuality(8.5);
    setScorePrice(8.0);
    setScoreDelivery(9.0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      setFormError('Vui lòng chọn nhà cung cấp để đánh giá.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await api.post('/danh-gia', {
        maNhaCungCap: selectedSupplierId,
        diemChatLuong: scoreQuality,
        diemGiaCa: scorePrice,
        diemTienDo: scoreDelivery
      });
      showBanner('success', 'Ghi nhận đánh giá thành công', 'Điểm trung bình và thứ hạng của nhà cung cấp đã được cập nhật.');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data || 'Không thể lưu đánh giá.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewHistory = async (item: RankingItem) => {
    setHistorySupplier(item);
    setLoadingHistory(true);
    try {
      const res = await api.get<ScoreHistoryItem[]>(`/danh-gia/nha-cung-cap/${item.maNhaCungCap}`);
      setHistoryList(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
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
          <h1 className="text-2xl font-bold text-slate-900">Bảng xếp hạng & Đánh giá Nhà cung cấp</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi năng lực đối tác dựa trên 3 tiêu chí: Chất lượng sản phẩm, Độ cạnh tranh về giá và Tiến độ giao hàng.
          </p>
        </div>
        {canRate && (
          <button
            onClick={() => handleOpenRate()}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg inline-flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Chấm điểm nhà cung cấp</span>
          </button>
        )}
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {rankings.slice(0, 3).map((top, idx) => {
          const colors = [
            { border: 'border-amber-400', badge: 'bg-amber-100 text-amber-800', medal: '🥇 TOP 1' },
            { border: 'border-slate-300', badge: 'bg-slate-100 text-slate-700', medal: '🥈 TOP 2' },
            { border: 'border-orange-300', badge: 'bg-orange-100 text-orange-800', medal: '🥉 TOP 3' },
          ][idx];

          return (
            <div 
              key={top.maNhaCungCap}
              className={`bg-white rounded-2xl border-2 ${colors.border} p-6 shadow-2xs relative overflow-hidden flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                    {colors.medal}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-lg tabular-nums">
                    <Star className="w-5 h-5 fill-current" />
                    <span>{Number(top.tongDiem).toFixed(1)}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3 truncate" title={top.tenNhaCungCap}>
                  {top.tenNhaCungCap}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">MST: {top.maSoThue}</div>

                <div className="grid grid-cols-3 gap-2 mt-5 p-3 bg-slate-50 rounded-xl text-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{Number(top.diemChatLuong).toFixed(1)}</div>
                    <div className="text-2xs text-slate-400">Chất lượng</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{Number(top.diemGiaCa).toFixed(1)}</div>
                    <div className="text-2xs text-slate-400">Giá cả</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{Number(top.diemTienDo).toFixed(1)}</div>
                    <div className="text-2xs text-slate-400">Tiến độ</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{top.soLanDanhGia} lượt nghiệm thu</span>
                <button
                  onClick={() => handleViewHistory(top)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                >
                  Xem lịch sử
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm nhà cung cấp theo tên, mã số thuế..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Xếp hạng {filteredRankings.length} nhà cung cấp
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium text-xs border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Hạng</th>
                <th className="py-3 px-4">Nhà cung cấp</th>
                <th className="py-3 px-4 text-center">Chất lượng</th>
                <th className="py-3 px-4 text-center">Giá cả</th>
                <th className="py-3 px-4 text-center">Tiến độ giao</th>
                <th className="py-3 px-4 text-center font-bold text-slate-800">Điểm tổng kết</th>
                <th className="py-3 px-4 text-center">Lượt đánh giá</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Đang nạp bảng xếp hạng...</td>
                </tr>
              ) : filteredRankings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Không có dữ liệu nhà cung cấp nào.</td>
                </tr>
              ) : (
                filteredRankings.map((r) => {
                  return (
                    <tr key={r.maNhaCungCap} className="hover:bg-slate-50/75 transition">
                      <td className="py-3.5 px-4 text-center font-bold">
                        {r.thuHang === 1 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 inline-flex items-center justify-center text-xs">1</span>
                        ) : r.thuHang === 2 ? (
                          <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 inline-flex items-center justify-center text-xs">2</span>
                        ) : r.thuHang === 3 ? (
                          <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-800 inline-flex items-center justify-center text-xs">3</span>
                        ) : (
                          <span className="text-slate-500 tabular-nums text-xs font-semibold">#{r.thuHang}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{r.tenNhaCungCap}</div>
                        <div className="text-xs text-slate-500 mt-0.5">MST: {r.maSoThue}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center tabular-nums text-xs">
                        {Number(r.diemChatLuong).toFixed(1)}
                      </td>
                      <td className="py-3.5 px-4 text-center tabular-nums text-xs">
                        {Number(r.diemGiaCa).toFixed(1)}
                      </td>
                      <td className="py-3.5 px-4 text-center tabular-nums text-xs">
                        {Number(r.diemTienDo).toFixed(1)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs border border-amber-200">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{Number(r.tongDiem).toFixed(1)} / 10</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs text-slate-500">
                        {r.soLanDanhGia} lần
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleViewHistory(r)}
                            title="Lịch sử đánh giá"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          {canRate && (
                            <button
                              onClick={() => handleOpenRate(r.maNhaCungCap)}
                              title="Chấm điểm NCC này"
                              className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            >
                              <Star className="w-4 h-4" />
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

      {/* Modal: Chấm điểm nhà cung cấp */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Chấm điểm & Đánh giá Nhà cung cấp</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitScore} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Nhà cung cấp được đánh giá *
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map(s => (
                    <option key={s.maNhaCungCap} value={s.maNhaCungCap}>
                      {s.tenNhaCungCap} (MST: {s.maSoThue})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sliders */}
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>1. Chất lượng sản phẩm / hàng hóa:</span>
                    <span className="tabular-nums text-indigo-600 font-bold">{scoreQuality} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={scoreQuality}
                    onChange={(e) => setScoreQuality(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>2. Mức độ cạnh tranh về giá & thanh toán:</span>
                    <span className="tabular-nums text-indigo-600 font-bold">{scorePrice} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={scorePrice}
                    onChange={(e) => setScorePrice(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>3. Tiến độ giao hàng & hỗ trợ kỹ thuật:</span>
                    <span className="tabular-nums text-indigo-600 font-bold">{scoreDelivery} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={scoreDelivery}
                    onChange={(e) => setScoreDelivery(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Live Score Summary */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <span className="text-xs font-medium text-amber-900">Điểm tổng kết dự kiến:</span>
                <span className="text-lg font-bold tabular-nums text-amber-700 flex items-center gap-1.5">
                  <Star className="w-5 h-5 fill-current" />
                  <span>{liveAvg} / 10.0</span>
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu kết quả chấm điểm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Drawer / Modal */}
      {historySupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Lịch sử đánh giá nghiệm thu</h3>
                <div className="text-xs text-slate-500 mt-0.5">{historySupplier.tenNhaCungCap}</div>
              </div>
              <button onClick={() => setHistorySupplier(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-slate-400">Đang tải lịch sử...</div>
            ) : historyList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Chưa có lịch sử chấm điểm cho nhà cung cấp này.</div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {historyList.map(item => (
                  <div key={item.maDanhGia} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Ngày: {new Date(item.ngayDanhGia).toLocaleDateString('vi-VN')}</span>
                      <span className="font-bold text-amber-600 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{Number(item.tongDiem).toFixed(1)} / 10</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-2xs text-slate-500 bg-white p-2 rounded border border-slate-100">
                      <div>Chất lượng: <strong>{Number(item.diemChatLuong).toFixed(1)}</strong></div>
                      <div>Giá cả: <strong>{Number(item.diemGiaCa).toFixed(1)}</strong></div>
                      <div>Tiến độ: <strong>{Number(item.diemTienDo).toFixed(1)}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setHistorySupplier(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
