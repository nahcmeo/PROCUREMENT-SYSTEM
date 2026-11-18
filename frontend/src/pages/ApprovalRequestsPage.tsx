import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  RotateCcw, 
  Check, 
  CheckCircle2, 
  X, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ShoppingBag,
  Info,
  Calendar,
  User,
  Building,
  FileText,
  DollarSign
} from 'lucide-react';
import api from '../services/api';
import { YeuCauMuaSam, NguoiDung } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface ApprovalRequestsPageProps {
  onBreadcrumbChange?: (sub?: string, show?: boolean) => void;
}

export const ApprovalRequestsPage: React.FC<ApprovalRequestsPageProps> = ({ onBreadcrumbChange }) => {
  const { currentUser } = useAuth();

  // Chế độ hiển thị: 'list' (danh sách) | 'detail' (chi tiết & quyết định duyệt)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  // Dữ liệu chính
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPR, setSelectedPR] = useState<any | null>(null);

  // Bộ lọc & Tìm kiếm
  const [search, setSearch] = useState('');
  const [limitFilter, setLimitFilter] = useState<'all' | 'within' | 'over'>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form phê duyệt / từ chối
  const [approvalNote, setApprovalNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'PHE_DUYET' | 'TU_CHOI';
  }>({
    isOpen: false,
    type: 'PHE_DUYET'
  });

  // Xử lý phê duyệt hàng loạt
  const [selectedPrIds, setSelectedPrIds] = useState<number[]>([]);
  const [batchModal, setBatchModal] = useState<{
    isOpen: boolean;
    type: 'PHE_DUYET' | 'TU_CHOI';
  }>({
    isOpen: false,
    type: 'PHE_DUYET'
  });
  const [batchNote, setBatchNote] = useState('');
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Thông báo Toast / Banner
  const [banner, setBanner] = useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    desc?: string;
  } | null>(null);

  // Hạn mức của người dùng đăng nhập hiện tại
  const userRoleCode = currentUser?.vaiTros?.[0]?.maVaiTro || 'TRUONG_PHONG';
  const isDirector = userRoleCode === 'GIAM_DOC';
  const [approverLimit, setApproverLimit] = useState<number>(isDirector ? 1000000000 : 50000000);
  const approverRoleTitle = isDirector ? 'NPD2 (Ban Giám Đốc)' : 'NPD1 (Trưởng phòng)';
  const limitLabel = isDirector 
    ? `Không giới hạn / Trên ${new Intl.NumberFormat('vi-VN').format(approverLimit)} ₫` 
    : `Tối đa ${new Intl.NumberFormat('vi-VN').format(approverLimit)} ₫`;

  // Tự động ẩn thông báo sau 4 giây
  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => {
      setBanner(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [banner]);

  // Cập nhật Breadcrumb với Header phía trên
  useEffect(() => {
    if (!onBreadcrumbChange) return;
    if (viewMode === 'detail') {
      onBreadcrumbChange('Chi tiết chờ duyệt', true);
    } else {
      onBreadcrumbChange(undefined, false);
    }
  }, [viewMode, onBreadcrumbChange]);

  // Helpers định dạng tiền tệ & mã phiếu
  const formatMoney = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
  };

  const formatNumberOnly = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatCode = (pr: any) => {
    if (!pr) return 'PR-0000';
    if (pr.maCode) return pr.maCode;
    const num = pr.maYeuCau || 1;
    const dateStr = pr.ngayTao ? pr.ngayTao.substring(0, 10).replace(/-/g, '') : '20261106';
    return `PR-${dateStr}-${String(num).padStart(3, '0')}`;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '--/--/----';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return isoString;
    }
  };

  // Tải danh sách yêu cầu chờ duyệt & hạn mức
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Tải hạn mức thực tế từ DB
      try {
        const hmRes = await api.get<any[]>('/han-muc');
        if (hmRes.data && Array.isArray(hmRes.data)) {
          const matched = hmRes.data.find(h => h.vaiTro?.maVaiTro === userRoleCode);
          if (matched && matched.soTienToiDa) {
            setApproverLimit(Number(matched.soTienToiDa));
          }
        }
      } catch (e) {
        console.warn('Could not load dynamic limits, using fallback');
      }

      // 2. Tải yêu cầu mua sắm chờ duyệt
      const res = await api.get<any[]>('/yeu-cau-mua-sam');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        // Lấy các phiếu chờ duyệt (cấp 1 hoặc cấp 2)
        const pending = res.data.filter(r => 
          r.trangThai === 'CHO_DUYET' || r.trangThai === 'CHO_DUYET_CAP_2'
        );
        setRequests(pending);
      } else {
        // Mock dữ liệu mẫu bám sát 100% Figma khi database chưa có
        setRequests([
          {
            maYeuCau: 3,
            maCode: 'PR-20261106-003',
            tieuDe: 'Trang bị 04 laptop văn phòng',
            tongTienDuKien: 72000000,
            trangThai: 'CHO_DUYET',
            ngayTao: '2026-11-06T08:30:00',
            nguoiYeuCau: { maNguoiDung: 12, hoVaTen: 'Lê Hoàng Anh', phongBan: 'Phòng Kinh Doanh' },
            chiTietList: [
              { maChiTietYeuCau: 1, sanPham: { tenSanPham: 'Laptop Dell Latitude 3540', donViTinh: 'Chiếc' }, soLuong: 4, donGiaDuKien: 18000000 }
            ]
          },
          {
            maYeuCau: 1,
            maCode: 'PR-20261105-001',
            tieuDe: 'Laptop và màn hình văn phòng',
            tongTienDuKien: 45600000,
            trangThai: 'CHO_DUYET',
            ngayTao: '2026-11-05T09:15:00',
            nguoiYeuCau: { maNguoiDung: 1, hoVaTen: 'Phùng Bảo Trường', phongBan: 'Phòng CNTT' },
            chiTietList: [
              { maChiTietYeuCau: 2, sanPham: { tenSanPham: 'Laptop Lenovo ThinkPad E14', donViTinh: 'Chiếc' }, soLuong: 2, donGiaDuKien: 16800000 },
              { maChiTietYeuCau: 3, sanPham: { tenSanPham: 'Màn hình Dell P2425H 24 inch', donViTinh: 'Chiếc' }, soLuong: 3, donGiaDuKien: 4000000 }
            ]
          },
          {
            maYeuCau: 2,
            maCode: 'PR-20261103-002',
            tieuDe: 'Ghế làm việc văn phòng',
            tongTienDuKien: 15000000,
            trangThai: 'CHO_DUYET',
            ngayTao: '2026-11-03T14:20:00',
            nguoiYeuCau: { maNguoiDung: 1, hoVaTen: 'Phùng Bảo Trường', phongBan: 'Phòng CNTT' },
            chiTietList: [
              { maChiTietYeuCau: 4, sanPham: { tenSanPham: 'Ghế xoay văn phòng công thái học Ergonomic', donViTinh: 'Chiếc' }, soLuong: 5, donGiaDuKien: 3000000 }
            ]
          }
        ]);
      }
    } catch {
      // Dữ liệu mẫu fallback khi backend offline
      setRequests([
        {
          maYeuCau: 3,
          maCode: 'PR-20261106-003',
          tieuDe: 'Trang bị 04 laptop văn phòng',
          tongTienDuKien: 72000000,
          trangThai: 'CHO_DUYET',
          ngayTao: '2026-11-06T08:30:00',
          nguoiYeuCau: { maNguoiDung: 12, hoVaTen: 'Lê Hoàng Anh', phongBan: 'Phòng Kinh Doanh' },
          chiTietList: [
            { maChiTietYeuCau: 1, sanPham: { tenSanPham: 'Laptop Dell Latitude 3540', donViTinh: 'Chiếc' }, soLuong: 4, donGiaDuKien: 18000000 }
          ]
        },
        {
          maYeuCau: 1,
          maCode: 'PR-20261105-001',
          tieuDe: 'Laptop và màn hình văn phòng',
          tongTienDuKien: 45600000,
          trangThai: 'CHO_DUYET',
          ngayTao: '2026-11-05T09:15:00',
          nguoiYeuCau: { maNguoiDung: 1, hoVaTen: 'Phùng Bảo Trường', phongBan: 'Phòng CNTT' },
          chiTietList: [
            { maChiTietYeuCau: 2, sanPham: { tenSanPham: 'Laptop Lenovo ThinkPad E14', donViTinh: 'Chiếc' }, soLuong: 2, donGiaDuKien: 16800000 },
            { maChiTietYeuCau: 3, sanPham: { tenSanPham: 'Màn hình Dell P2425H 24 inch', donViTinh: 'Chiếc' }, soLuong: 3, donGiaDuKien: 4000000 }
          ]
        },
        {
          maYeuCau: 2,
          maCode: 'PR-20261103-002',
          tieuDe: 'Ghế làm việc văn phòng',
          tongTienDuKien: 15000000,
          trangThai: 'CHO_DUYET',
          ngayTao: '2026-11-03T14:20:00',
          nguoiYeuCau: { maNguoiDung: 1, hoVaTen: 'Phùng Bảo Trường', phongBan: 'Phòng CNTT' },
          chiTietList: [
            { maChiTietYeuCau: 4, sanPham: { tenSanPham: 'Ghế xoay văn phòng công thái học Ergonomic', donViTinh: 'Chiếc' }, soLuong: 5, donGiaDuKien: 3000000 }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tính toán 3 thẻ KPI theo đúng chuẩn Figma
  const stats = useMemo(() => {
    const pendingList = requests.filter(r => {
      if (isDirector) {
        return r.trangThai === 'CHO_DUYET_CAP_2' || r.trangThai === 'CHO_DUYET';
      }
      return r.trangThai === 'CHO_DUYET';
    });
    const pendingCount = pendingList.length;
    const pendingAmount = pendingList.reduce((acc, r) => acc + (Number(r.tongTienDuKien) || 0), 0);
    
    // Trong hạn mức vs Vượt hạn mức
    const withinLimitList = pendingList.filter(r => (Number(r.tongTienDuKien) || 0) <= approverLimit);
    const withinLimitCount = withinLimitList.length;
    const overLimitCount = pendingCount - withinLimitCount;

    return {
      pendingCount,
      pendingAmount,
      withinLimitCount,
      overLimitCount
    };
  }, [requests, approverLimit, isDirector]);

  // Bộ lọc danh sách
  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter(item => {
      // Chỉ xem phiếu đang chờ duyệt phù hợp cấp thẩm quyền
      const isPending = item.trangThai === 'CHO_DUYET' || item.trangThai === 'CHO_DUYET_CAP_2';
      if (!isPending) return false;

      if (!isDirector && item.trangThai === 'CHO_DUYET_CAP_2') return false;

      const codeStr = formatCode(item).toLowerCase();
      const titleStr = (item.tieuDe || '').toLowerCase();
      const userStr = (item.nguoiYeuCau?.hoVaTen || '').toLowerCase();
      const userCodeStr = `nv00${item.nguoiYeuCau?.maNguoiDung || ''}`.toLowerCase();

      const matchSearch = !q || codeStr.includes(q) || titleStr.includes(q) || userStr.includes(q) || userCodeStr.includes(q);

      let matchLimit = true;
      const amount = Number(item.tongTienDuKien) || 0;
      if (limitFilter === 'within') matchLimit = amount <= approverLimit;
      else if (limitFilter === 'over') matchLimit = amount > approverLimit;

      return matchSearch && matchLimit;
    });
  }, [requests, search, limitFilter, approverLimit]);

  // Phân trang
  useEffect(() => {
    setCurrentPage(1);
  }, [search, limitFilter, dateFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredRequests.length);
  const paginatedRequests = useMemo(() => {
    return filteredRequests.slice(startIndex, endIndex);
  }, [filteredRequests, startIndex, endIndex]);

  const selectedPRs = useMemo(() => {
    return requests.filter(r => selectedPrIds.includes(r.maYeuCau));
  }, [requests, selectedPrIds]);

  const selectedTotalAmount = useMemo(() => {
    return selectedPRs.reduce((sum, r) => sum + (Number(r.tongTienDuKien) || 0), 0);
  }, [selectedPRs]);

  const handleToggleSelect = (prId: number) => {
    setSelectedPrIds(prev =>
      prev.includes(prId) ? prev.filter(id => id !== prId) : [...prev, prId]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedRequests.map(r => r.maYeuCau);
      setSelectedPrIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedRequests.map(r => r.maYeuCau));
      setSelectedPrIds(prev => prev.filter(id => !pageIds.has(id)));
    }
  };

  const isAllPageSelected = paginatedRequests.length > 0 && paginatedRequests.every(r => selectedPrIds.includes(r.maYeuCau));
  const isPartiallySelected = paginatedRequests.some(r => selectedPrIds.includes(r.maYeuCau)) && !isAllPageSelected;

  const handleBatchConfirmAction = async () => {
    if (selectedPrIds.length === 0) return;
    const { type } = batchModal;
    setBatchSubmitting(true);

    try {
      const results = await Promise.allSettled(
        selectedPrIds.map(prId => 
          api.post(`/yeu-cau-mua-sam/${prId}/phe-duyet`, {
            maNguoiDung: currentUser?.maNguoiDung || 3,
            quyetDinh: type,
            yKien: batchNote.trim() || (type === 'PHE_DUYET' ? 'Phê duyệt hàng loạt' : 'Từ chối hàng loạt')
          })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed === 0) {
        setBanner({
          type: type === 'PHE_DUYET' ? 'success' : 'warning',
          title: type === 'PHE_DUYET' ? `Phê duyệt thành công ${successful} yêu cầu` : `Đã từ chối ${successful} yêu cầu`,
          desc: `Tất cả các phiếu đã chọn được cập nhật trạng thái đồng loạt.`
        });
      } else {
        setBanner({
          type: 'warning',
          title: `Xử lý xong ${successful}/${selectedPrIds.length} yêu cầu`,
          desc: `${failed} yêu cầu xử lý không thành công do không đúng trạng thái hoặc vượt hạn mức.`
        });
      }

      setBatchModal({ isOpen: false, type: 'PHE_DUYET' });
      setSelectedPrIds([]);
      setBatchNote('');
      loadData();
    } catch (err: any) {
      setBanner({
        type: 'error',
        title: 'Lỗi khi xử lý hàng loạt',
        desc: err.message || 'Đã có lỗi xảy ra.'
      });
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Mở màn hình xem chi tiết và phê duyệt
  const handleOpenDetail = async (pr: any) => {
    setSelectedPR(pr);
    setApprovalNote('');
    setViewMode('detail');

    // Tải chi tiết sản phẩm nếu chưa có
    if (!pr.chiTietList || pr.chiTietList.length === 0) {
      try {
        const res = await api.get(`/yeu-cau-mua-sam/${pr.maYeuCau}`);
        if (res.data) {
          setSelectedPR(res.data);
        }
      } catch (err) {
        console.log('Không thể tải chi tiết, dùng thông tin hiện tại');
      }
    }
  };

  // Xác nhận thực hiện phê duyệt / từ chối
  const handleConfirmDecision = async () => {
    if (!selectedPR) return;
    const { type } = confirmModal;
    setSubmitting(true);

    try {
      // Gọi API backend
      await api.post(`/yeu-cau-mua-sam/${selectedPR.maYeuCau}/phe-duyet`, {
        maNguoiDung: currentUser?.maNguoiDung || 3,
        quyetDinh: type,
        yKien: approvalNote
      });

      setBanner({
        type: type === 'PHE_DUYET' ? 'success' : 'warning',
        title: type === 'PHE_DUYET' ? 'Đã phê duyệt yêu cầu thành công' : 'Đã từ chối yêu cầu',
        desc: `Phiếu ${formatCode(selectedPR)} đã được cập nhật trạng thái.`
      });

      // Cập nhật lại state danh sách
      setRequests(prev => prev.filter(r => r.maYeuCau !== selectedPR.maYeuCau));
      setConfirmModal({ isOpen: false, type: 'PHE_DUYET' });
      setViewMode('list');
      setSelectedPR(null);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : '') || err.message || 'Thao tác không thành công';
      setBanner({
        type: 'error',
        title: 'Lỗi thực hiện phê duyệt',
        desc: errMsg
      });
      setConfirmModal({ isOpen: false, type: 'PHE_DUYET' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* TOAST NOTIFICATION BANNER */}
      {banner && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-md transition-all ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : banner.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : banner.type === 'error' ? (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm">
            <p className="font-semibold">{banner.title}</p>
            {banner.desc && <p className="text-xs opacity-90 mt-0.5">{banner.desc}</p>}
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MÀN HÌNH DANH SÁCH CHỜ DUYỆT (viewMode === 'list')                      */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-6">

          {/* HEADER THEO ĐÚNG FIGMA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Danh sách chờ duyệt
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Xem xét và quyết định các yêu cầu mua sắm.
              </p>
            </div>
          </div>

          {/* TÓM TẮT DANH SÁCH: 3 THẺ KPI THEO ĐÚNG CHUẨN FIGMA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* THẺ 1: YÊU CẦU CHỜ DUYỆT */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-sm font-normal text-slate-500">Yêu cầu chờ duyệt</span>
              <div className="text-3xl font-semibold text-[#B45309] mt-2">
                {String(stats.pendingCount).padStart(2, '0')}
              </div>
              <span className="text-xs font-medium text-slate-500 mt-2 block">
                Cần xem xét
              </span>
            </div>

            {/* THẺ 2: TỔNG TIỀN DỰ KIẾN */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-sm font-normal text-slate-500">Tổng tiền dự kiến</span>
              <div className="text-3xl font-semibold text-slate-900 mt-2 truncate">
                {formatMoney(stats.pendingAmount)}
              </div>
              <span className="text-xs font-medium text-slate-500 mt-2 block">
                {String(stats.pendingCount).padStart(2, '0')} yêu cầu chờ duyệt
              </span>
            </div>

            {/* THẺ 3: TRONG HẠN MỨC CỦA BẠN */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-sm font-normal text-slate-500">Trong hạn mức của bạn</span>
              <div className="text-3xl font-semibold text-[#15803D] mt-2">
                {String(stats.withinLimitCount).padStart(2, '0')}
              </div>
              <span className="text-xs font-medium text-slate-500 mt-2 block">
                {stats.overLimitCount > 0 
                  ? `${String(stats.overLimitCount).padStart(2, '0')} yêu cầu vượt hạn mức` 
                  : 'Tất cả trong hạn mức'}
              </span>
            </div>
          </div>

          {/* BANNER HẠN MỨC PHÊ DUYỆT THEO CHUẨN FIGMA */}
          <div className="bg-[#EEF2FF] border border-indigo-100 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100/70 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-slate-900">
                  Hạn mức {isDirector ? 'NPD2' : 'NPD1'}
                </span>
                <span className="font-semibold text-[#4F46E5]">
                  {limitLabel}
                </span>
              </div>
            </div>
            <div className="text-xs text-indigo-700 bg-white/80 border border-indigo-200/60 px-3 py-1 rounded-full font-medium">
              Vai trò: {approverRoleTitle}
            </div>
          </div>

          {/* CARD BẢNG DANH SÁCH CHỜ DUYỆT */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            
            {/* Header Bảng: Title & Pill badge */}
            <div className="px-6 py-4.5 border-b border-slate-200 flex items-center gap-3">
              <h2 className="font-semibold text-base text-slate-900">
                Yêu cầu chờ duyệt {isDirector ? 'NPD2' : 'NPD1'}
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFFBEB] text-[#B45309] border border-amber-200/60">
                {isDirector ? 'Chờ duyệt cấp 2' : 'Chờ duyệt cấp 1'}
              </span>
            </div>

            {/* Thanh Tìm Kiếm & Bộ Lọc */}
            <div className="p-5 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-end gap-4">
              
              {/* Tìm kiếm */}
              <div className="flex-1 min-w-[240px]">
                <label className="block text-sm font-medium text-slate-900 mb-1.5">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Mã phiếu, nội dung, người đề nghị…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] h-10"
                  />
                </div>
              </div>

              {/* Lọc Hạn Mức */}
              <div className="w-52">
                <label className="block text-sm font-medium text-slate-900 mb-1.5">
                  Hạn mức duyệt
                </label>
                <select
                  value={limitFilter}
                  onChange={(e) => setLimitFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] h-10 cursor-pointer"
                >
                  <option value="all">Tất cả hạn mức</option>
                  <option value="within">Trong hạn mức của bạn</option>
                  <option value="over">Vượt hạn mức</option>
                </select>
              </div>

              {/* Lọc Ngày Tạo */}
              <div className="w-44">
                <label className="block text-sm font-medium text-slate-900 mb-1.5">
                  Ngày tạo
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] h-10 cursor-pointer"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="7days">7 ngày qua</option>
                  <option value="30days">30 ngày qua</option>
                </select>
              </div>

              {/* Nút Làm Mới */}
              <button
                type="button"
                onClick={loadData}
                className="h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Làm mới</span>
              </button>
            </div>

            {/* BẢNG DỮ LIỆU */}
            {loading ? (
              <div className="p-8 space-y-4">
                <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
                <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-slate-100 rounded w-4/6 animate-pulse" />
                <div className="flex items-center justify-center gap-2 pt-4 text-slate-500 text-sm">
                  <RotateCcw className="w-4 h-4 animate-spin text-[#4F46E5]" />
                  <span>Đang tải danh sách chờ duyệt…</span>
                </div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 text-[#15803D]">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Không có yêu cầu nào chờ phê duyệt
                </h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  Tất cả các phiếu mua sắm trong phạm vi của bạn đã được xử lý xong.
                </p>
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(''); setLimitFilter('all'); }}
                    className="mt-4 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    Xóa điều kiện tìm kiếm
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] text-xs font-medium text-slate-500">
                      <th className="py-3 px-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={isAllPageSelected}
                          ref={input => {
                            if (input) input.indeterminate = isPartiallySelected;
                          }}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          title="Chọn tất cả trên trang này"
                        />
                      </th>
                      <th className="py-3 px-6">Mã phiếu / Nội dung</th>
                      <th className="py-3 px-6 w-60">Người đề nghị</th>
                      <th className="py-3 px-6 text-right w-52">Tổng dự kiến (₫)</th>
                      <th className="py-3 px-6 w-44">Trạng thái {isDirector ? 'NPD2' : 'NPD1'}</th>
                      <th className="py-3 px-6 w-40">Ngày tạo / Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {paginatedRequests.map((item) => {
                      const codeStr = formatCode(item);
                      const isOverLimit = (Number(item.tongTienDuKien) || 0) > approverLimit;
                      const isSelected = selectedPrIds.includes(item.maYeuCau);

                      return (
                        <tr 
                          key={item.maYeuCau} 
                          className={`hover:bg-slate-50/70 transition-colors group ${isSelected ? 'bg-indigo-50/40' : ''}`}
                        >
                          {/* Checkbox chọn hàng */}
                          <td className="py-4 px-4 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(item.maYeuCau)}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>

                          {/* Mã phiếu / Nội dung */}
                          <td className="py-4 px-6 align-middle">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(item)}
                              className="text-left block group/link cursor-pointer"
                              title={`Xem chi tiết ${codeStr}`}
                            >
                              <span className="font-medium text-[#4F46E5] group-hover/link:underline block text-sm">
                                {codeStr}
                              </span>
                              <span className="text-slate-500 text-xs block mt-1 line-clamp-1 max-w-md font-normal group-hover/link:text-slate-800">
                                {item.tieuDe || 'Chưa có tiêu đề'}
                              </span>
                            </button>
                          </td>

                          {/* Người đề nghị */}
                          <td className="py-4 px-6 align-middle">
                            <span className="font-normal text-slate-900 block text-sm">
                              {item.nguoiYeuCau?.hoVaTen || 'Phùng Bảo Trường'}
                            </span>
                            <span className="text-xs text-slate-500 font-medium block mt-0.5">
                              NV0{item.nguoiYeuCau?.maNguoiDung ? String(item.nguoiYeuCau.maNguoiDung).padStart(2, '0') : '01'}
                            </span>
                          </td>

                          {/* Tổng dự kiến (₫) */}
                          <td className="py-4 px-6 align-middle text-right">
                            <span className="font-semibold text-slate-900 text-sm">
                              {formatNumberOnly(item.tongTienDuKien)}
                            </span>
                            {isOverLimit && (
                              <span className="text-[11px] text-amber-600 block mt-0.5 font-medium">
                                Vượt hạn mức {isDirector ? 'NPD2' : 'NPD1'}
                              </span>
                            )}
                          </td>

                          {/* Trạng thái NPD1 / NPD2 */}
                          <td className="py-4 px-6 align-middle">
                            <StatusBadge 
                              status={item.trangThai} 
                              labelOverride={isDirector ? 'Chờ duyệt cấp 2' : 'Chờ duyệt cấp 1'} 
                            />
                          </td>

                          {/* Ngày tạo / Thao tác */}
                          <td className="py-4 px-6 align-middle">
                            <div className="space-y-1">
                              <span className="text-xs text-slate-500 block">
                                {formatDate(item.ngayTao)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenDetail(item)}
                                className="text-xs font-medium text-[#4F46E5] hover:underline cursor-pointer inline-flex items-center"
                              >
                                <span>Xem chi tiết</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Phân Trang Chuẩn */}
            {filteredRequests.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
                <div>
                  Hiển thị {startIndex + 1}–{endIndex} trong {filteredRequests.length} yêu cầu
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span>Số dòng:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="border border-slate-200 rounded-lg px-2 py-1 bg-white text-xs text-slate-700 cursor-pointer"
                    >
                      <option value={5}>5 / trang</option>
                      <option value={10}>10 / trang</option>
                      <option value={20}>20 / trang</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={`h-8 px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        currentPage <= 1
                          ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      Trước
                    </button>

                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pNum = idx + 1;
                      return (
                        <button
                          key={pNum}
                          type="button"
                          onClick={() => setCurrentPage(pNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition cursor-pointer ${
                            pNum === currentPage
                              ? 'bg-[#4F46E5] text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {pNum}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={`h-8 px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        currentPage >= totalPages
                          ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* THANH TÁC VỤ NỔI CHO DUYỆT HÀNG LOẠT (FLOATING ACTION BAR) */}
          {viewMode === 'list' && selectedPrIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                  {selectedPrIds.length}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    Đã chọn {selectedPrIds.length} phiếu yêu cầu
                  </div>
                  <div className="text-xs text-slate-300">
                    Tổng dự kiến: <span className="font-semibold text-emerald-400 tabular-nums">{formatMoney(selectedTotalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-700" />

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedPrIds([])}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Bỏ chọn
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBatchModal({ isOpen: true, type: 'TU_CHOI' });
                    setBatchNote('');
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Từ chối ({selectedPrIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBatchModal({ isOpen: true, type: 'PHE_DUYET' });
                    setBatchNote('');
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Phê duyệt hàng loạt ({selectedPrIds.length})</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MÀN HÌNH CHI TIẾT & QUYẾT ĐỊNH DUYỆT (viewMode === 'detail')           */}
      {/* ========================================================================= */}
      {viewMode === 'detail' && selectedPR && (
        <div className="space-y-6">

          {/* THANH ĐIỀU HƯỚNG QUAY LẠI */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setViewMode('list'); setSelectedPR(null); }}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách chờ duyệt</span>
            </button>
          </div>

          {/* HEADER CHI TIẾT PHIẾU */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#4F46E5] bg-indigo-50 px-2.5 py-1 rounded-md">
                  {formatCode(selectedPR)}
                </span>
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Chờ duyệt cấp 1
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-2">
                {selectedPR.tieuDe || 'Chưa có tiêu đề'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Ngày tạo: {formatDate(selectedPR.ngayTao)} - Người lập: {selectedPR.nguoiYeuCau?.hoVaTen || 'Phùng Bảo Trường'}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-medium text-slate-500">Tổng ngân sách dự kiến</span>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">
                {formatMoney(selectedPR.tongTienDuKien)}
              </div>
            </div>
          </div>

          {/* CẢNH BÁO HẠN MỨC */}
          {(Number(selectedPR.tongTienDuKien) || 0) > approverLimit ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold">Phiếu này vượt quá hạn mức phê duyệt của bạn ({formatMoney(approverLimit)})</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Tổng dự kiến là {formatMoney(selectedPR.tongTienDuKien)}. Khi bạn phê duyệt, hệ thống sẽ tự động chuyển tiếp lên cấp thẩm quyền cao hơn ({isDirector ? 'Hội đồng quản trị' : 'Ban Giám Đốc'}) để duyệt vòng cuối.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-900">
                <p className="font-semibold">Phiếu nằm trong hạn mức phê duyệt ({formatMoney(approverLimit)})</p>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Quyết định phê duyệt của bạn sẽ có hiệu lực trực tiếp để chuyển phiếu sang giai đoạn báo giá và mua sắm.
                </p>
              </div>
            </div>
          )}

          {/* BẢNG DANH MỤC HÀNG HÓA / THIẾT BỊ CHI TIẾT */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-semibold text-sm text-slate-900">
                Danh sách sản phẩm / vật tư đề nghị mua sắm
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-medium text-slate-500">
                    <th className="py-3 px-6 w-12 text-center">STT</th>
                    <th className="py-3 px-6">Tên sản phẩm / Quy cách</th>
                    <th className="py-3 px-6 w-28 text-center">Đơn vị tính</th>
                    <th className="py-3 px-6 w-28 text-right">Số lượng</th>
                    <th className="py-3 px-6 w-44 text-right">Đơn giá dự kiến</th>
                    <th className="py-3 px-6 w-48 text-right">Thành tiền (₫)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(selectedPR.chiTietList && selectedPR.chiTietList.length > 0) ? (
                    selectedPR.chiTietList.map((it: any, idx: number) => {
                      const totalItem = (Number(it.soLuong) || 0) * (Number(it.donGiaDuKien) || 0);
                      return (
                        <tr key={it.maChiTietYeuCau || idx} className="hover:bg-slate-50/60">
                          <td className="py-3.5 px-6 text-center text-slate-500 text-xs">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-6 font-medium text-slate-900">
                            {it.sanPham?.tenSanPham || it.tenSanPham || 'Vật tư mua sắm'}
                          </td>
                          <td className="py-3.5 px-6 text-center text-slate-600 text-xs">
                            {it.sanPham?.donViTinh || it.donViTinh || 'Chiếc'}
                          </td>
                          <td className="py-3.5 px-6 text-right font-medium text-slate-900">
                            {it.soLuong}
                          </td>
                          <td className="py-3.5 px-6 text-right text-slate-600 text-xs">
                            {formatNumberOnly(it.donGiaDuKien)} ₫
                          </td>
                          <td className="py-3.5 px-6 text-right font-semibold text-slate-900">
                            {formatNumberOnly(totalItem)} ₫
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                        Không có dữ liệu dòng sản phẩm
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/80 font-bold text-slate-900 border-t border-slate-200">
                    <td colSpan={5} className="py-3 px-6 text-right text-xs uppercase tracking-wide">
                      Tổng cộng dự kiến:
                    </td>
                    <td className="py-3 px-6 text-right text-base text-[#4F46E5]">
                      {formatMoney(selectedPR.tongTienDuKien)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* KHỐI QUYẾT ĐỊNH PHÊ DUYỆT (DECISION BOX) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#4F46E5]" />
              <span>Quyết định phê duyệt</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Ý kiến phê duyệt / Lý do từ chối
              </label>
              <textarea
                rows={3}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Nhập ghi chú hoặc lý do phê duyệt / từ chối phiếu đề nghị này..."
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: true, type: 'TU_CHOI' })}
                className="h-10 px-5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-sm inline-flex items-center gap-2 cursor-pointer transition"
              >
                <XCircle className="w-4 h-4" />
                <span>Từ chối duyệt</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: true, type: 'PHE_DUYET' })}
                className="h-10 px-6 rounded-lg bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] text-white font-medium text-sm inline-flex items-center gap-2 cursor-pointer transition shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Phê duyệt yêu cầu</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* MODAL XÁC NHẬN PHÊ DUYỆT / TỪ CHỐI */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                confirmModal.type === 'PHE_DUYET' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {confirmModal.type === 'PHE_DUYET' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {confirmModal.type === 'PHE_DUYET' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
                </h3>
                <p className="text-xs text-slate-500">
                  Phiếu {formatCode(selectedPR)}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {confirmModal.type === 'PHE_DUYET'
                ? `Bạn đang chuẩn bị phê duyệt yêu cầu "${selectedPR?.tieuDe}" với tổng ngân sách ${formatMoney(selectedPR?.tongTienDuKien)}.`
                : `Bạn có chắc chắn muốn từ chối yêu cầu "${selectedPR?.tieuDe}"? Hành động này sẽ yêu cầu nhân viên chỉnh sửa lại phiếu.`}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setConfirmModal({ isOpen: false, type: 'PHE_DUYET' })}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDecision}
                className={`px-5 py-2 rounded-lg text-white text-sm font-medium inline-flex items-center gap-2 cursor-pointer transition ${
                  confirmModal.type === 'PHE_DUYET'
                    ? 'bg-[#15803D] hover:bg-[#166534]'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting && <RotateCcw className="w-4 h-4 animate-spin" />}
                <span>
                  {confirmModal.type === 'PHE_DUYET' ? 'Đồng ý phê duyệt' : 'Đồng ý từ chối'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN PHÊ DUYỆT / TỪ CHỐI HÀNG LOẠT */}
      {batchModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                batchModal.type === 'PHE_DUYET' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {batchModal.type === 'PHE_DUYET' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {batchModal.type === 'PHE_DUYET' ? 'Phê duyệt hàng loạt' : 'Từ chối hàng loạt'}
                </h3>
                <p className="text-xs text-slate-500">
                  Áp dụng cho {selectedPrIds.length} phiếu yêu cầu đã chọn
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Số lượng phiếu:</span>
                <span className="font-semibold text-slate-900">{selectedPrIds.length} phiếu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng ngân sách dự kiến:</span>
                <span className="font-semibold text-emerald-600 tabular-nums">{formatMoney(selectedTotalAmount)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                {batchModal.type === 'PHE_DUYET' ? 'Ý kiến phê duyệt (tùy chọn)' : 'Lý do từ chối (bắt buộc)'}
              </label>
              <textarea
                value={batchNote}
                onChange={(e) => setBatchNote(e.target.value)}
                rows={3}
                placeholder={batchModal.type === 'PHE_DUYET' ? 'Ghi chú phê duyệt hàng loạt...' : 'Nhập lý do từ chối các phiếu này...'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={batchSubmitting}
                onClick={() => setBatchModal({ isOpen: false, type: 'PHE_DUYET' })}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={batchSubmitting || (batchModal.type === 'TU_CHOI' && !batchNote.trim())}
                onClick={handleBatchConfirmAction}
                className={`px-5 py-2 rounded-lg text-white text-sm font-medium inline-flex items-center gap-2 cursor-pointer transition ${
                  batchModal.type === 'PHE_DUYET'
                    ? 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'
                    : 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50'
                }`}
              >
                {batchSubmitting && <RotateCcw className="w-4 h-4 animate-spin" />}
                <span>
                  {batchModal.type === 'PHE_DUYET' ? 'Xác nhận duyệt tất cả' : 'Xác nhận từ chối'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ApprovalRequestsPage;
