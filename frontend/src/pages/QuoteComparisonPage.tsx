import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  FileSpreadsheet, Check, CheckCircle2, AlertTriangle, Building2, 
  ArrowRight, Award, ShieldCheck, DollarSign, Clock, Star, ShoppingBag, X
} from 'lucide-react';
import api from '../services/api';
import { BaoGia, YeuCauMuaSam, XepHangNhaCungCap } from '../types';
import { useAuth } from '../context/AuthContext';

interface QuoteComparisonPageProps {
  onBreadcrumbChange?: (sub?: string, show?: boolean) => void;
}

interface RankingInfo {
  maNhaCungCap: number;
  diemChatLuong: number;
  diemGiaCa: number;
  diemTienDo: number;
  tongDiem: number;
  soLanDanhGia: number;
  thuHang?: number;
}

export const QuoteComparisonPage: React.FC<QuoteComparisonPageProps> = ({ onBreadcrumbChange }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [prsWithQuotes, setPrsWithQuotes] = useState<YeuCauMuaSam[]>([]);
  const [selectedPRId, setSelectedPRId] = useState<number | null>(null);
  const [currentPR, setCurrentPR] = useState<YeuCauMuaSam | null>(null);
  const [quotes, setQuotes] = useState<BaoGia[]>([]);
  const [rankings, setRankings] = useState<Record<number, RankingInfo>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; title: string; desc?: string } | null>(null);

  const canChooseSupplier = useMemo(() => {
    return currentUser?.vaiTros?.some(v => v.maVaiTro === 'NHAN_VIEN_MUA_HANG' || v.maVaiTro === 'ADMIN');
  }, [currentUser]);

  useEffect(() => {
    if (onBreadcrumbChange) {
      onBreadcrumbChange('So sánh báo giá & Lựa chọn NCC', false);
    }
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [prsRes, rankingsRes] = await Promise.all([
        api.get<YeuCauMuaSam[]>('/yeu-cau-mua-sam'),
        api.get<any[]>('/danh-gia/xep-hang').catch(() => ({ data: [] }))
      ]);

      // Map rankings by supplier ID (support both flat and nested models safely)
      const rankMap: Record<number, RankingInfo> = {};
      if (Array.isArray(rankingsRes.data)) {
        rankingsRes.data.forEach((r: any) => {
          const sId = r.maNhaCungCap || (r.nhaCungCap && r.nhaCungCap.maNhaCungCap);
          if (sId) {
            rankMap[sId] = {
              maNhaCungCap: sId,
              diemChatLuong: Number(r.diemChatLuong ?? r.diemChatLuongTB ?? 0),
              diemGiaCa: Number(r.diemGiaCa ?? r.diemGiaCaTB ?? 0),
              diemTienDo: Number(r.diemTienDo ?? r.diemTienDoTB ?? 0),
              tongDiem: Number(r.tongDiem ?? r.diemTongTB ?? 0),
              soLanDanhGia: Number(r.soLanDanhGia ?? 0),
              thuHang: r.thuHang
            };
          }
        });
      }
      setRankings(rankMap);

      // Only show PRs that are approved, in RFQ, or selected
      const relevantPRs = prsRes.data.filter(p => 
        p.trangThai === 'DA_DUYET' || p.trangThai === 'CHO_BAO_GIA' || p.trangThai === 'DA_CHON_NCC' || p.trangThai === 'DA_HOAN_THANH'
      );
      setPrsWithQuotes(relevantPRs);

      // Check query param
      const paramId = searchParams.get('prId');
      if (paramId) {
        const found = relevantPRs.find(p => p.maYeuCau === Number(paramId));
        if (found) {
          handleSelectPR(found.maYeuCau!);
          return;
        }
      }

      if (relevantPRs.length > 0) {
        handleSelectPR(relevantPRs[0].maYeuCau!);
      }
    } catch (err: any) {
      console.error(err);
      showBanner('error', 'Lỗi tải dữ liệu so sánh', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPR = async (prId: number) => {
    setSelectedPRId(prId);
    try {
      const res = await api.get<{ yeuCau: YeuCauMuaSam; baoGiaList: BaoGia[] }>(`/bao-gia/so-sanh/${prId}`);
      setCurrentPR(res.data.yeuCau);
      setQuotes(res.data.baoGiaList);
    } catch (err: any) {
      console.error(err);
      showBanner('error', 'Lỗi nạp bảng so sánh', err.message);
    }
  };

  const showBanner = (type: 'success' | 'error', title: string, desc?: string) => {
    setBanner({ type, title, desc });
    setTimeout(() => setBanner(null), 4500);
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  // Find lowest quote
  const lowestQuote = useMemo(() => {
    if (quotes.length === 0) return null;
    return quotes.reduce((min, q) => q.tongTienBaoGia < min.tongTienBaoGia ? q : min, quotes[0]);
  }, [quotes]);

  const handleChooseSupplier = async (quoteId: number) => {
    setSelectingId(quoteId);
    try {
      await api.post(`/bao-gia/${quoteId}/chon`);
      showBanner('success', 'Đã lựa chọn nhà cung cấp thành công', 'Phiếu yêu cầu đã chuyển sang trạng thái Đã chọn NCC. Bạn có thể tiến hành lập đơn mua hàng PO.');
      if (selectedPRId) {
        handleSelectPR(selectedPRId);
      }
    } catch (err: any) {
      console.error(err);
      showBanner('error', 'Không thể chọn báo giá', err.response?.data || err.message);
    } finally {
      setSelectingId(null);
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

      {/* Header & PR Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">So sánh báo giá & Lựa chọn NCC</h1>
          <p className="text-sm text-slate-500 mt-1">
            Bảng ma trận đối chiếu báo giá của các nhà cung cấp, phân tích chênh lệch ngân sách và chốt báo giá trúng thầu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Chọn phiếu PR:</label>
          <select
            value={selectedPRId || ''}
            onChange={(e) => handleSelectPR(Number(e.target.value))}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[260px] shadow-2xs"
          >
            {prsWithQuotes.map(pr => (
              <option key={pr.maYeuCau} value={pr.maYeuCau}>
                PR-{String(pr.maYeuCau).padStart(4, '0')} - {pr.tieuDe || 'Phiếu yêu cầu'} ({formatCurrency(pr.tongTienDuKien)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PR Summary Card */}
      {currentPR && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 tabular-nums">
                PR-{String(currentPR.maYeuCau).padStart(4, '0')}
              </span>
              <span className="font-semibold text-slate-900 text-lg">
                {currentPR.tieuDe || 'Yêu cầu mua sắm thiết bị'}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-4 pt-1">
              <span>Người tạo: <strong>{currentPR.nguoiYeuCau?.hoVaTen}</strong> ({currentPR.nguoiYeuCau?.phongBan})</span>
              <span>Ngày tạo: <strong>{new Date(currentPR.ngayTao).toLocaleDateString('vi-VN')}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Ngân sách dự toán được duyệt:</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">{formatCurrency(currentPR.tongTienDuKien)}</div>
            </div>

            {currentPR.trangThai === 'DA_CHON_NCC' && (
              <button
                onClick={() => navigate('/don-mua-hang')}
                className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg inline-flex items-center gap-2 shadow-xs transition cursor-pointer text-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Tiến hành tạo đơn PO</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Comparison Scorecard Grid */}
      {quotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Chưa có báo giá nào cho phiếu yêu cầu này</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Vui lòng sang mục Quản lý Báo giá để nhập ít nhất 01 bảng chào giá từ nhà cung cấp để thực hiện so sánh.
          </p>
          <button
            onClick={() => navigate('/bao-gia')}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-xs transition cursor-pointer"
          >
            Nhập báo giá ngay
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Supplier Cards Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotes.map((q) => {
              const isWinner = q.duocLuaChon;
              const isLowest = lowestQuote?.maBaoGia === q.maBaoGia;
              const variance = currentPR ? q.tongTienBaoGia - currentPR.tongTienDuKien : 0;
              const variancePct = currentPR && currentPR.tongTienDuKien > 0 
                ? ((variance / currentPR.tongTienDuKien) * 100).toFixed(1) 
                : '0';
              const rank = rankings[q.nhaCungCap?.maNhaCungCap];

              return (
                <div 
                  key={q.maBaoGia}
                  className={`bg-white rounded-2xl border transition shadow-2xs overflow-hidden flex flex-col justify-between ${
                    isWinner 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20' 
                      : isLowest 
                      ? 'border-indigo-400' 
                      : 'border-slate-200'
                  }`}
                >
                  {/* Banner header for Winner or Lowest */}
                  {isWinner ? (
                    <div className="bg-emerald-600 text-white py-1.5 px-4 text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Báo giá được chọn</span>
                      <Award className="w-3.5 h-3.5" />
                    </div>
                  ) : isLowest ? (
                    <div className="bg-indigo-600 text-white py-1.5 px-4 text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Giá chào thấp nhất</span>
                      <span>Tiết kiệm {Math.abs(Number(variancePct))}%</span>
                    </div>
                  ) : null}

                  <div className="p-6 space-y-4">
                    {/* Supplier info */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-500 tabular-nums">BG-{String(q.maBaoGia).padStart(4, '0')}</div>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">{q.nhaCungCap?.tenNhaCungCap}</h3>
                        <div className="text-xs text-slate-500 mt-0.5">MST: {q.nhaCungCap?.maSoThue}</div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Total Price */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-xs text-slate-500">Tổng giá chào thầu:</div>
                      <div className="text-xl font-bold tabular-nums text-indigo-600 mt-1">
                        {formatCurrency(q.tongTienBaoGia)}
                      </div>
                      <div className="text-xs mt-1.5 flex items-center gap-1">
                        {variance < 0 ? (
                          <span className="text-emerald-600 font-medium">
                            Giảm {formatCurrency(Math.abs(variance))} ({Math.abs(Number(variancePct))}%) so với dự toán
                          </span>
                        ) : variance > 0 ? (
                          <span className="text-rose-600 font-medium">
                            Tăng {formatCurrency(variance)} (+{variancePct}%) so với dự toán
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">Bằng với dự toán</span>
                        )}
                      </div>
                    </div>

                    {/* Supplier Scorecard */}
                    {rank && (
                      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                        <div className="font-semibold text-slate-700 flex items-center justify-between">
                          <span>Điểm tín nhiệm NCC:</span>
                          <span className="text-amber-500 font-bold flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{rank.tongDiem.toFixed(1)} / 10</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-slate-500 bg-slate-50 p-2 rounded-lg text-2xs">
                          <div>
                            <div className="font-semibold text-slate-800">{rank.diemChatLuong.toFixed(1)}</div>
                            <div>Chất lượng</div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{rank.diemGiaCa.toFixed(1)}</div>
                            <div>Giá cả</div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{rank.diemTienDo.toFixed(1)}</div>
                            <div>Tiến độ</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-slate-50/75 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {q.chiTietList?.length || 0} mục hàng
                    </span>

                    {canChooseSupplier && (
                      isWinner ? (
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <Check className="w-4 h-4" /> Đã lựa chọn
                        </span>
                      ) : (
                        <button
                          onClick={() => handleChooseSupplier(q.maBaoGia!)}
                          disabled={selectingId === q.maBaoGia}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                          {selectingId === q.maBaoGia ? 'Đang chọn...' : 'Chọn nhà cung cấp'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Item Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Bảng chi tiết giá chào từng dòng sản phẩm</h3>
              <span className="text-xs text-slate-500">So sánh đơn giá & thành tiền từng nhà cung cấp</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 min-w-[200px]">Mặt hàng / Sản phẩm</th>
                    <th className="py-3 px-4 text-center">ĐVT</th>
                    <th className="py-3 px-4 text-right">SL</th>
                    <th className="py-3 px-4 text-right bg-slate-100/70 font-semibold text-slate-700 min-w-[140px]">
                      Dự toán PR (đ)
                    </th>
                    {quotes.map(q => (
                      <th 
                        key={q.maBaoGia} 
                        className={`py-3 px-4 text-right min-w-[150px] ${
                          q.duocLuaChon ? 'bg-emerald-50 text-emerald-900 font-bold' : ''
                        }`}
                      >
                        {q.nhaCungCap?.tenNhaCungCap}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentPR?.chiTietList?.map((prItem, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {prItem.sanPham.tenSanPham}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500">
                          {prItem.sanPham.donViTinh || 'Chiếc'}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {prItem.soLuong}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums bg-slate-50/50 text-slate-700">
                          {formatCurrency(prItem.donGiaDuKien)}
                        </td>
                        {quotes.map(q => {
                          const quoteItem = q.chiTietList?.find(ci => ci.sanPham.maSanPham === prItem.sanPham.maSanPham);
                          const unitPrice = quoteItem?.donGiaChao || 0;
                          return (
                            <td 
                              key={q.maBaoGia} 
                              className={`py-3 px-4 text-right tabular-nums ${
                                q.duocLuaChon ? 'bg-emerald-50/30' : ''
                              }`}
                            >
                              <div className="font-semibold text-slate-900">
                                {formatCurrency(unitPrice)}
                              </div>
                              <div className="text-2xs text-slate-400">
                                = {formatCurrency(unitPrice * prItem.soLuong)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-right text-slate-700">Tổng cộng:</td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-900 bg-slate-100/70">
                      {formatCurrency(currentPR?.tongTienDuKien)}
                    </td>
                    {quotes.map(q => (
                      <td 
                        key={q.maBaoGia} 
                        className={`py-3 px-4 text-right tabular-nums text-sm ${
                          q.duocLuaChon ? 'bg-emerald-100/60 text-emerald-900 font-extrabold' : 'text-indigo-600 font-bold'
                        }`}
                      >
                        {formatCurrency(q.tongTienBaoGia)}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
