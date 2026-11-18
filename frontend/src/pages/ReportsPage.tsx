import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, Download, Calendar, Filter, DollarSign, TrendingDown, 
  ShoppingBag, CheckCircle2, Clock, XCircle, RotateCcw, AlertTriangle, X
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface ReportStats {
  tongTienDuKien: number;
  tongTienThucTe: number;
  chenhLechTietKiem: number;
  tongSoPR: number;
  tongSoPO: number;
  prTheoTrangThai: Record<string, number>;
  poTheoTrangThai: Record<string, number>;
  danhSachPR: any[];
  danhSachPO: any[];
}

interface ReportsPageProps {
  onBreadcrumbChange?: (sub?: string, show?: boolean) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onBreadcrumbChange }) => {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tuNgay, setTuNgay] = useState<string>('');
  const [denNgay, setDenNgay] = useState<string>('');
  const [phongBan, setPhongBan] = useState<string>('all');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; title: string; desc?: string } | null>(null);

  useEffect(() => {
    if (onBreadcrumbChange) {
      onBreadcrumbChange('Báo cáo thống kê & Phân tích', false);
    }
    loadData();
  }, []);

  const loadData = async (from = tuNgay, to = denNgay, dept = phongBan) => {
    setLoading(true);
    try {
      const params: any = {};
      if (from) params.tuNgay = from;
      if (to) params.denNgay = to;
      if (dept && dept !== 'all') params.phongBan = dept;

      const res = await api.get<ReportStats>('/bao-cao/thong-ke', { params });
      setStats(res.data);
    } catch (err: any) {
      console.error(err);
      setBanner({
        type: 'error',
        title: 'Lỗi tải báo cáo thống kê',
        desc: err.response?.data || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(tuNgay, denNgay, phongBan);
  };

  const handleReset = () => {
    setTuNgay('');
    setDenNgay('');
    setPhongBan('all');
    loadData('', '', 'all');
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  // Export CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (!stats || !stats.danhSachPO) return;

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'Số đơn PO,Ngày đặt,Mã PR,Nhà cung cấp,Phòng ban yêu cầu,Tổng tiền thanh toán (VNĐ),Trạng thái\n';

    stats.danhSachPO.forEach((po) => {
      const soPo = `"${po.soDonHang}"`;
      const ngayDat = `"${new Date(po.ngayDatHang).toLocaleDateString('vi-VN')}"`;
      const prCode = po.yeuCauMuaSam ? `"PR-${String(po.yeuCauMuaSam.maYeuCau).padStart(4, '0')}"` : '""';
      const ncc = `"${po.nhaCungCap?.tenNhaCungCap || ''}"`;
      const pb = `"${po.yeuCauMuaSam?.nguoiYeuCau?.phongBan || ''}"`;
      const tongTien = po.tongTien || 0;
      const st = `"${po.trangThai}"`;

      csvContent += `${soPo},${ngayDat},${prCode},${ncc},${pb},${tongTien},${st}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BaoCaoMuaSam_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {banner && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${
          banner.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
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
          <h1 className="text-2xl font-bold text-slate-900">Báo cáo thống kê mua sắm</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng hợp dữ liệu chi tiêu, hiệu quả đàm phán giá và tỷ lệ hoàn tất đơn hàng theo thời gian thực.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={!stats || !stats.danhSachPO || stats.danhSachPO.length === 0}
          className="h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg inline-flex items-center gap-2 shadow-2xs transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-indigo-600" />
          <span>Xuất dữ liệu CSV</span>
        </button>
      </div>

      {/* Filter Card */}
      <form onSubmit={handleFilter} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Từ ngày:</label>
            <input
              type="date"
              value={tuNgay}
              onChange={(e) => setTuNgay(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Đến ngày:</label>
            <input
              type="date"
              value={denNgay}
              onChange={(e) => setDenNgay(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phòng ban đề xuất:</label>
            <select
              value={phongBan}
              onChange={(e) => setPhongBan(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">Tất cả phòng ban</option>
              <option value="Phòng IT">Phòng IT</option>
              <option value="Phòng Mua Sắm">Phòng Mua Sắm</option>
              <option value="Phòng Kỹ Thuật">Phòng Kỹ Thuật</option>
              <option value="Phòng Kế Toán">Phòng Kế Toán</option>
              <option value="Phòng Hành Chính">Phòng Hành Chính</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span>Lọc số liệu</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="h-10 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm transition cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* KPI Cards */}
      {stats && (() => {
        const tietKiemPct = stats.tongTienDuKien > 0 && stats.chenhLechTietKiem > 0
          ? Math.round((stats.chenhLechTietKiem / stats.tongTienDuKien) * 100)
          : 0;

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Tổng chi thực tế */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Tổng chi thực tế (PO)</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tabular-nums text-slate-900 tracking-tight">
                  {formatCurrency(stats.tongTienThucTe)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {stats.tongSoPO} đơn hàng phát hành
                </div>
              </div>
            </div>

            {/* 2. Dự toán được duyệt */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Dự toán được duyệt (PR)</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tabular-nums text-slate-900 tracking-tight">
                  {formatCurrency(stats.tongTienDuKien)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {stats.tongSoPR} phiếu yêu cầu mua sắm
                </div>
              </div>
            </div>

            {/* 3. Ngân sách tiết kiệm (Hero Metric Anchor) */}
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900">Ngân sách tiết kiệm</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums text-emerald-900 tracking-tight">
                    {formatCurrency(stats.chenhLechTietKiem)}
                  </span>
                  {tietKiemPct > 0 && (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded tabular-nums">
                      {tietKiemPct}%
                    </span>
                  )}
                </div>
                <div className="text-xs text-emerald-700 font-medium mt-1">
                  Hiệu quả đấu thầu & đàm phán giá
                </div>
              </div>
            </div>

            {/* 4. Hoàn thành nghiệm thu */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Hoàn thành nghiệm thu</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tabular-nums text-slate-900 tracking-tight">
                  {stats.poTheoTrangThai?.DA_NHAN_DU || 0} / {stats.tongSoPO}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Đơn hàng đã nhận đủ 100%
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Status Breakdown Charts / Progress bars */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PR Status Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">Phân bổ Phiếu yêu cầu (PR)</h3>
              <span className="text-xs text-slate-400 tabular-nums">{stats.tongSoPR} phiếu</span>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { label: 'Chờ duyệt', count: stats.prTheoTrangThai?.CHO_DUYET || 0, color: 'bg-amber-400' },
                { label: 'Đã phê duyệt', count: stats.prTheoTrangThai?.DA_DUYET || 0, color: 'bg-indigo-500' },
                { label: 'Đang mua sắm (RFQ/Chốt)', count: stats.prTheoTrangThai?.DANG_MUA || 0, color: 'bg-blue-500' },
                { label: 'Đã hoàn thành', count: stats.prTheoTrangThai?.DA_HOAN_THANH || 0, color: 'bg-emerald-500' },
                { label: 'Từ chối duyệt', count: stats.prTheoTrangThai?.TU_CHOI || 0, color: 'bg-rose-500' },
              ].map(item => {
                const pct = stats.tongSoPR > 0 ? ((item.count / stats.tongSoPR) * 100).toFixed(0) : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>{item.label}</span>
                      <span>{item.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PO Status Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">Tiến độ Đơn mua hàng (PO)</h3>
              <span className="text-xs text-slate-400 tabular-nums">{stats.tongSoPO} đơn</span>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { label: 'Mới tạo', count: stats.poTheoTrangThai?.MOI_TAO || 0, color: 'bg-slate-400' },
                { label: 'Đã gửi nhà cung cấp', count: stats.poTheoTrangThai?.DA_GUI_NCC || 0, color: 'bg-blue-500' },
                { label: 'Đang giao vận chuyển', count: stats.poTheoTrangThai?.DANG_GIAO_HANG || 0, color: 'bg-amber-400' },
                { label: 'Đã nhận đủ tại kho', count: stats.poTheoTrangThai?.DA_NHAN_DU || 0, color: 'bg-emerald-500' },
                { label: 'Đã hủy đơn', count: stats.poTheoTrangThai?.DA_HUY || 0, color: 'bg-rose-400' },
              ].map(item => {
                const pct = stats.tongSoPO > 0 ? ((item.count / stats.tongSoPO) * 100).toFixed(0) : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>{item.label}</span>
                      <span>{item.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Orders Activity Table */}
      {stats && stats.danhSachPO && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">Chi tiết giao dịch mua sắm gần đây</h3>
            <span className="text-xs text-slate-500 tabular-nums">{stats.danhSachPO.length} giao dịch</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                <tr>
                  <th className="py-3 px-4">Số đơn PO</th>
                  <th className="py-3 px-4">Thuộc PR</th>
                  <th className="py-3 px-4">Nhà cung cấp</th>
                  <th className="py-3 px-4">Phòng ban</th>
                  <th className="py-3 px-4">Ngày đặt</th>
                  <th className="py-3 px-4 text-right">Tổng thanh toán</th>
                  <th className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.danhSachPO.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">Không có đơn hàng nào trong khoảng thời gian đã chọn.</td>
                  </tr>
                ) : (
                  stats.danhSachPO.map((po: any) => (
                    <tr key={po.maDonHang} className="hover:bg-slate-50/75 transition">
                      <td className="py-3 px-4 font-bold tabular-nums text-slate-900">{po.soDonHang}</td>
                      <td className="py-3 px-4 tabular-nums text-indigo-600 font-medium">
                        {po.yeuCauMuaSam ? `PR-${String(po.yeuCauMuaSam.maYeuCau).padStart(4, '0')}` : '-'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{po.nhaCungCap?.tenNhaCungCap}</td>
                      <td className="py-3 px-4 text-slate-500">{po.yeuCauMuaSam?.nguoiYeuCau?.phongBan || '-'}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(po.ngayDatHang).toLocaleDateString('vi-VN')}</td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums text-slate-900">{formatCurrency(po.tongTien)}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={po.trangThai} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
