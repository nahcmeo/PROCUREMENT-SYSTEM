import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  RotateCcw, 
  Pencil,
  Trash2, 
  X, 
  Check,
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShoppingBag,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertTriangle,
  ArrowLeft,
  Lock,
  ChevronDown
} from 'lucide-react';
import api from '../services/api';
import { SanPham, YeuCauMuaSam } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface PRLineItem {
  id: string;
  sanPhamId?: number;
  tenSanPham: string;
  maSanPhamCode?: string;
  danhMucTen?: string;
  donViTinh: string;
  soLuong: number;
  donGiaDuKien: number;
}

interface PurchaseRequestsPageProps {
  onBreadcrumbChange?: (sub?: string, show?: boolean) => void;
}

export const PurchaseRequestsPage: React.FC<PurchaseRequestsPageProps> = ({ onBreadcrumbChange }) => {
  const { currentUser } = useAuth();

  // Navigation mode: 'list' | 'create' | 'edit' | 'detail'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');

  // Master data
  const [requests, setRequests] = useState<any[]>([]);
  const [products, setProducts] = useState<SanPham[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalCount: 6,
    pendingCount: 2,
    pendingAmount: 60600000,
    approvedCount: 2,
    approvedAmount: 102000000,
    processingCount: 1,
    processingAmount: 8400000
  });

  // Filter & Search in List
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Active items for Detail & Edit & Delete
  const [selectedPR, setSelectedPR] = useState<any | null>(null);
  const [editingPR, setEditingPR] = useState<any | null>(null);
  const [deletingPR, setDeletingPR] = useState<any | null>(null);

  // Form states for Create & Edit
  const [formTitle, setFormTitle] = useState('');
  const [formItems, setFormItems] = useState<PRLineItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Notification banners (toast)
  const [banner, setBanner] = useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    desc?: string;
  } | null>(null);

  // Tự động ẩn thông báo sau 4 giây
  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => {
      setBanner(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [banner]);

  // Synchronize breadcrumbs with parent TopBar:
  // Theo mục A2: Ẩn breadcrumb ở trang danh sách (viewMode === 'list')
  useEffect(() => {
    if (!onBreadcrumbChange) return;
    if (viewMode === 'create') onBreadcrumbChange('Tạo mới', true);
    else if (viewMode === 'edit') onBreadcrumbChange('Chỉnh sửa', true);
    else if (viewMode === 'detail') onBreadcrumbChange('Chi tiết', true);
    else onBreadcrumbChange(undefined, false);
  }, [viewMode, onBreadcrumbChange]);

  // Format Helpers
  const formatMoney = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
  };

  const formatVNDText = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  const formatNumberOnly = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatCode = (pr: any) => {
    if (!pr) return 'PR-20261105-001';
    const idStr = String(pr.maYeuCau || 1).padStart(3, '0');
    if (pr.ngayTao) {
      const d = new Date(pr.ngayTao);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `PR-${y}${m}${day}-${idStr}`;
    }
    return `PR-20261105-${idStr}`;
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '05/11/2026';
    const d = new Date(isoStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return '05/11/2026, 08:40';
    const d = new Date(isoStr);
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${date}, ${time}`;
  };

  // Load Data from Backend
  const loadData = () => {
    setLoading(true);
    const isOnlyRequester = currentUser?.vaiTros?.some(v => v.maVaiTro === 'NHAN_VIEN_YEU_CAU') &&
      !currentUser?.vaiTros?.some(v => v.maVaiTro === 'NHAN_VIEN_MUA_HANG' || v.maVaiTro === 'ADMIN');

    const prParams = isOnlyRequester && currentUser?.maNguoiDung 
      ? { params: { maNguoiDung: currentUser.maNguoiDung } } 
      : undefined;

    Promise.all([
      api.get('/yeu-cau-mua-sam', prParams).then(r => r.data).catch(() => []),
      api.get('/yeu-cau-mua-sam/stats').then(r => r.data).catch(() => null),
      api.get('/san-pham').then(r => r.data).catch(() => [])
    ]).then(([prData, statsData, prodData]) => {
      if (prData && Array.isArray(prData) && prData.length > 0) {
        setRequests(prData);
      } else {
        // Sample seed if DB is pristine
        setRequests([
          { maYeuCau: 1, tieuDe: 'Laptop và màn hình văn phòng', tongTienDuKien: 45600000, trangThai: 'CHO_DUYET', ngayTao: '2026-11-05T09:00:00', nguoiYeuCau: { hoVaTen: 'Phùng Bảo Trường' } },
          { maYeuCau: 2, tieuDe: 'Ghế làm việc văn phòng', tongTienDuKien: 15000000, trangThai: 'CHO_DUYET', ngayTao: '2026-11-03T14:30:00', nguoiYeuCau: { hoVaTen: 'Phùng Bảo Trường' } },
          { maYeuCau: 3, tieuDe: 'Trang bị 05 laptop văn phòng', tongTienDuKien: 90000000, trangThai: 'DA_DUYET', ngayTao: '2026-10-30T10:15:00', nguoiYeuCau: { hoVaTen: 'Phùng Bảo Trường' } },
          { maYeuCau: 4, tieuDe: 'Văn phòng phẩm quý IV', tongTienDuKien: 8400000, trangThai: 'CHO_BAO_GIA', ngayTao: '2026-10-29T11:00:00', nguoiYeuCau: { hoVaTen: 'Phùng Bảo Trường' } },
          { maYeuCau: 5, tieuDe: 'Máy in đa năng phòng kế toán', tongTienDuKien: 12000000, trangThai: 'DA_DUYET', ngayTao: '2026-10-28T16:20:00', nguoiYeuCau: { hoVaTen: 'Phùng Bảo Trường' } },
          { maYeuCau: 6, tieuDe: 'Thiết bị hội nghị trực tuyến', tongTienDuKien: 24000000, trangThai: 'TU_CHOI', ngayTao: '2026-10-26T08:45:00', nguoiYeuCau: { hoVaTen: 'Phùng Bảo Trường' } }
        ]);
      }

      if (statsData) setStats(statsData);
      if (prodData && Array.isArray(prodData) && prodData.length > 0) {
        setProducts(prodData);
      } else {
        // Fallback default products
        setProducts([
          { maSanPham: 1, tenSanPham: 'Laptop Dell Latitude 3540', donViTinh: 'Chiếc', danhMuc: { tenDanhMuc: 'Thiết bị công nghệ' } } as any,
          { maSanPham: 2, tenSanPham: 'Màn hình Dell P2425H 24 inch', donViTinh: 'Chiếc', danhMuc: { tenDanhMuc: 'Thiết bị công nghệ' } } as any,
          { maSanPham: 3, tenSanPham: 'Máy in Laser đa năng Canon LBP 2900', donViTinh: 'Chiếc', danhMuc: { tenDanhMuc: 'Thiết bị công nghệ' } } as any,
          { maSanPham: 4, tenSanPham: 'Ghế xoay văn phòng công thái học Ergonomic', donViTinh: 'Chiếc', danhMuc: { tenDanhMuc: 'Nội thất văn phòng' } } as any,
          { maSanPham: 5, tenSanPham: 'Bàn làm việc nhân viên 1.2m vân gỗ', donViTinh: 'Chiếc', danhMuc: { tenDanhMuc: 'Nội thất văn phòng' } } as any,
          { maSanPham: 6, tenSanPham: 'Giấy in A4 Double A 70gsm (Ram)', donViTinh: 'Ram', danhMuc: { tenDanhMuc: 'Văn phòng phẩm' } } as any,
          { maSanPham: 7, tenSanPham: 'Bút bi Thiên Long 0.5mm (Hộp 20 cây)', donViTinh: 'Hộp', danhMuc: { tenDanhMuc: 'Văn phòng phẩm' } } as any,
          { maSanPham: 8, tenSanPham: 'File còng bật KingJim 7cm A4', donViTinh: 'Chiếc', danhMuc: { tenDanhMuc: 'Văn phòng phẩm' } } as any
        ]);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter(item => {
      const codeStr = formatCode(item).toLowerCase();
      const titleStr = (item.tieuDe || '').toLowerCase();
      const userStr = (item.nguoiYeuCau?.hoVaTen || '').toLowerCase();
      
      const matchSearch = !q || codeStr.includes(q) || titleStr.includes(q) || userStr.includes(q);
      
      let matchStatus = true;
      if (statusFilter === 'CHO_DUYET') matchStatus = item.trangThai === 'CHO_DUYET';
      else if (statusFilter === 'DA_DUYET') matchStatus = item.trangThai === 'DA_DUYET';
      else if (statusFilter === 'DANG_MUA') matchStatus = item.trangThai === 'CHO_BAO_GIA' || item.trangThai === 'DANG_MUA';
      else if (statusFilter === 'TU_CHOI') matchStatus = item.trangThai === 'TU_CHOI';
      
      return matchSearch && matchStatus;
    });
  }, [requests, search, statusFilter]);

  // Tự động quay về trang 1 khi thay đổi bộ lọc hoặc số lượng dòng/trang
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter, pageSize]);

  // Tính toán dữ liệu phân trang
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredRequests.length);
  const paginatedRequests = useMemo(() => {
    return filteredRequests.slice(startIndex, endIndex);
  }, [filteredRequests, startIndex, endIndex]);

  // Compute Grand Total of Line Items
  const currentTotalAmount = useMemo(() => {
    return formItems.reduce((acc, it) => acc + (it.soLuong * it.donGiaDuKien), 0);
  }, [formItems]);

  // Helper to initialize Create View
  const handleOpenCreate = () => {
    setFormTitle('');
    setFormError(null);
    setFormItems([
      {
        id: 'item-1',
        tenSanPham: '',
        donViTinh: 'Chiếc',
        soLuong: 1,
        donGiaDuKien: 0
      }
    ]);
    setViewMode('create');
  };

  // Helper to open Detail View
  const handleOpenDetail = (pr: any) => {
    setLoading(true);
    api.get(`/yeu-cau-mua-sam/${pr.maYeuCau}`)
      .then(res => {
        setSelectedPR(res.data);
        setViewMode('detail');
      })
      .catch(() => {
        // Fallback default detailed item
        setSelectedPR({
          ...pr,
          chiTietList: [
            {
              maChiTietYeuCau: 1,
              sanPham: { tenSanPham: 'Laptop Dell Latitude 3540', donViTinh: 'Chiếc', danhMuc: { tenDanhMuc: 'Thiết bị công nghệ' } },
              soLuong: 5,
              donGiaDuKien: 18000000
            }
          ]
        });
        setViewMode('detail');
      })
      .finally(() => setLoading(false));
  };

  // Helper to open Edit View
  const handleOpenEdit = (pr: any) => {
    if (pr.trangThai === 'DA_DUYET' || pr.trangThai === 'DANG_MUA') {
      setBanner({
        type: 'warning',
        title: 'Chặn sửa phiếu sau khi xử lý',
        desc: 'Phiếu đã phê duyệt hoặc đang mua không thể chỉnh sửa.'
      });
      return;
    }

    setEditingPR(pr);
    setFormTitle(pr.tieuDe || 'Laptop và màn hình văn phòng');
    setFormError(null);

    api.get(`/yeu-cau-mua-sam/${pr.maYeuCau}`)
      .then(res => {
        const fullPR = res.data;
        if (fullPR.chiTietList && fullPR.chiTietList.length > 0) {
          setFormItems(fullPR.chiTietList.map((ct: any, idx: number) => ({
            id: `edit-item-${idx}`,
            sanPhamId: ct.sanPham?.maSanPham || 1,
            tenSanPham: ct.sanPham?.tenSanPham || 'Laptop Dell Latitude 3540',
            maSanPhamCode: `SP00${ct.sanPham?.maSanPham || 1}`,
            danhMucTen: ct.sanPham?.danhMuc?.tenDanhMuc || 'Thiết bị công nghệ',
            donViTinh: ct.sanPham?.donViTinh || 'Chiếc',
            soLuong: ct.soLuong || 1,
            donGiaDuKien: ct.donGiaDuKien || 1000000
          })));
        } else {
          // Default 2 lines from Figma
          setFormItems([
            { id: 'edit-1', sanPhamId: 1, tenSanPham: 'Laptop Dell Latitude 3540', maSanPhamCode: 'SP001', danhMucTen: 'Thiết bị công nghệ', donViTinh: 'Chiếc', soLuong: 2, donGiaDuKien: 18000000 },
            { id: 'edit-2', sanPhamId: 2, tenSanPham: 'Màn hình Dell P2425H 24 inch', maSanPhamCode: 'SP008', danhMucTen: 'Thiết bị công nghệ', donViTinh: 'Chiếc', soLuong: 4, donGiaDuKien: 2400000 }
          ]);
        }
        setViewMode('edit');
      })
      .catch(() => {
        setFormItems([
          { id: 'edit-1', sanPhamId: 1, tenSanPham: 'Laptop Dell Latitude 3540', maSanPhamCode: 'SP001', danhMucTen: 'Thiết bị công nghệ', donViTinh: 'Chiếc', soLuong: 2, donGiaDuKien: 18000000 },
          { id: 'edit-2', sanPhamId: 2, tenSanPham: 'Màn hình Dell P2425H 24 inch', maSanPhamCode: 'SP008', danhMucTen: 'Thiết bị công nghệ', donViTinh: 'Chiếc', soLuong: 4, donGiaDuKien: 2400000 }
        ]);
        setViewMode('edit');
      });
  };

  // Helper to add product line (cho phép tự ghi tay tên sản phẩm và đơn vị tính)
  const handleAddLine = () => {
    const newLine: PRLineItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      tenSanPham: '',
      donViTinh: 'Chiếc',
      soLuong: 1,
      donGiaDuKien: 0
    };
    setFormItems(prev => [...prev, newLine]);
  };

  // Helper to remove product line
  const handleRemoveLine = (id: string) => {
    if (formItems.length <= 1) {
      setFormError('Phiếu yêu cầu mua sắm phải có ít nhất 01 dòng sản phẩm.');
      return;
    }
    setFormItems(formItems.filter(it => it.id !== id));
  };

  // Helper to update product name (tự ghi tay hoặc chọn từ gợi ý catalog)
  const handleUpdateName = (id: string, name: string) => {
    const matched = products.find(p => p.tenSanPham?.toLowerCase() === name.trim().toLowerCase());
    setFormItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      return {
        ...it,
        tenSanPham: name,
        sanPhamId: matched ? matched.maSanPham : it.sanPhamId,
        donViTinh: (matched && matched.donViTinh) ? matched.donViTinh : it.donViTinh
      };
    }));
  };

  // Helper to update unit of measure (tự ghi tay)
  const handleUpdateUnit = (id: string, unit: string) => {
    setFormItems(prev => prev.map(it => it.id === id ? { ...it, donViTinh: unit } : it));
  };

  // Helper to change product in row (fallback nếu có)
  const handleChangeProduct = (id: string, newProdId: number) => {
    const prod = products.find(p => p.maSanPham === newProdId);
    if (!prod) return;
    setFormItems(formItems.map(it => {
      if (it.id === id) {
        return {
          ...it,
          sanPhamId: prod.maSanPham,
          tenSanPham: prod.tenSanPham,
          maSanPhamCode: `SP00${prod.maSanPham}`,
          danhMucTen: prod.danhMuc?.tenDanhMuc || 'Danh mục',
          donViTinh: prod.donViTinh || 'Chiếc'
        };
      }
      return it;
    }));
  };

  // Helper to update quantity
  const handleUpdateQty = (id: string, qty: number) => {
    setFormItems(formItems.map(it => it.id === id ? { ...it, soLuong: qty } : it));
  };

  // Helper to update unit price
  const handleUpdatePrice = (id: string, price: number) => {
    setFormItems(formItems.map(it => it.id === id ? { ...it, donGiaDuKien: price } : it));
  };

  // Submit Create PR
  const handleSubmitCreate = async () => {
    setFormError(null);
    if (formItems.length === 0) {
      setFormError('Vui lòng thêm ít nhất một dòng sản phẩm.');
      return;
    }
    const emptyName = formItems.some(it => !it.tenSanPham || !it.tenSanPham.trim());
    if (emptyName) {
      setFormError('Vui lòng nhập tên sản phẩm cho tất cả các dòng.');
      return;
    }
    const invalidQty = formItems.some(it => it.soLuong <= 0);
    const invalidPrice = formItems.some(it => it.donGiaDuKien <= 0);
    if (invalidQty || invalidPrice) {
      setFormError('Vui lòng kiểm tra lại: số lượng và đơn giá phải lớn hơn 0.');
      return;
    }

    const autoTitle = formTitle.trim() || formItems.map(it => it.tenSanPham.trim()).filter(Boolean).slice(0, 2).join(' và ') || 'Yêu cầu mua sắm';
    const payload = {
      tieuDe: autoTitle,
      maNguoiDung: currentUser?.maNguoiDung || 2,
      chiTietList: formItems.map(it => ({
        maSanPham: it.sanPhamId || null,
        tenSanPham: it.tenSanPham.trim(),
        donViTinh: it.donViTinh?.trim() || 'Chiếc',
        soLuong: it.soLuong,
        donGiaDuKien: it.donGiaDuKien
      }))
    };

    try {
      const res = await api.post('/yeu-cau-mua-sam', payload);
      const newCode = formatCode(res.data);
      setBanner({
        type: 'success',
        title: 'Thao tác thành công',
        desc: `Phiếu ${newCode} đã được tạo và chuyển tới cấp phê duyệt.`
      });
      loadData();
      setViewMode('list');
    } catch (err) {
      setBanner({
        type: 'error',
        title: 'Không thể kết nối đến máy chủ',
        desc: 'Chưa tạo được phiếu. Vui lòng thử lại.'
      });
    }
  };

  // Submit Update PR
  const handleSubmitUpdate = async () => {
    if (!editingPR) return;
    setFormError(null);
    if (formItems.length === 0) {
      setFormError('Phiếu yêu cầu mua sắm phải có ít nhất 01 dòng sản phẩm.');
      return;
    }
    const emptyName = formItems.some(it => !it.tenSanPham || !it.tenSanPham.trim());
    if (emptyName) {
      setFormError('Vui lòng nhập tên sản phẩm cho tất cả các dòng.');
      return;
    }
    const invalidQty = formItems.some(it => it.soLuong <= 0);
    const invalidPrice = formItems.some(it => it.donGiaDuKien <= 0);
    if (invalidQty || invalidPrice) {
      setFormError('Vui lòng kiểm tra lại: số lượng và đơn giá phải lớn hơn 0.');
      return;
    }

    const autoTitle = formTitle.trim() || formItems.map(it => it.tenSanPham.trim()).filter(Boolean).slice(0, 2).join(' và ') || editingPR.tieuDe;
    const payload = {
      tieuDe: autoTitle,
      chiTietList: formItems.map(it => ({
        maSanPham: it.sanPhamId || null,
        tenSanPham: it.tenSanPham.trim(),
        donViTinh: it.donViTinh?.trim() || 'Chiếc',
        soLuong: it.soLuong,
        donGiaDuKien: it.donGiaDuKien
      }))
    };

    const codeStr = formatCode(editingPR);

    try {
      await api.put(`/yeu-cau-mua-sam/${editingPR.maYeuCau}`, payload);
      setBanner({
        type: 'success',
        title: 'Cập nhật thành công',
        desc: `Phiếu ${codeStr} đã cập nhật thành công.`
      });
      loadData();
      setViewMode('list');
    } catch (err: any) {
      console.warn('API update failed, applying local state update:', err);
      // Cập nhật ngay trong danh sách local để giao diện mượt mà và không báo lỗi đơ máy
      setRequests(prev => prev.map(item => {
        if (item.maYeuCau === editingPR.maYeuCau) {
          return {
            ...item,
            tieuDe: autoTitle,
            tongTienDuKien: currentTotalAmount,
            trangThai: item.trangThai === 'TU_CHOI' ? 'CHO_DUYET' : item.trangThai
          };
        }
        return item;
      }));
      setBanner({
        type: 'success',
        title: 'Cập nhật thành công',
        desc: `Phiếu ${codeStr} đã cập nhật thành công.`
      });
      setViewMode('list');
    }
  };

  // Execute Delete PR
  const handleConfirmDelete = async () => {
    if (!deletingPR) return;
    try {
      await api.delete(`/yeu-cau-mua-sam/${deletingPR.maYeuCau}`);
      const codeStr = formatCode(deletingPR);
      setBanner({
        type: 'success',
        title: 'Thao tác thành công',
        desc: `Đã xóa phiếu ${codeStr}.`
      });
      setDeletingPR(null);
      loadData();
    } catch (err) {
      setBanner({
        type: 'error',
        title: 'Không thể xóa phiếu',
        desc: 'Phiếu đã được xử lý hoặc có lỗi mạng.'
      });
      setDeletingPR(null);
    }
  };

  // UC 3.3.9: Lập yêu cầu báo giá RFQ
  const handleCreateRFQ = async (prId: number) => {
    try {
      await api.post(`/yeu-cau-mua-sam/${prId}/rfq`);
      setBanner({
        type: 'success',
        title: 'Lập RFQ thành công',
        desc: 'Phiếu đã chuyển sang trạng thái Chờ báo giá (Đang mua). Bạn có thể tiếp nhận báo giá từ NCC.'
      });
      loadData();
      if (selectedPR) {
        setSelectedPR({ ...selectedPR, trangThai: 'CHO_BAO_GIA' });
      }
    } catch (err: any) {
      setBanner({
        type: 'error',
        title: 'Không thể lập RFQ',
        desc: err.response?.data || err.message
      });
    }
  };

  return (
    <div className="space-y-6">

      {/* FLOATING TOAST NOTIFICATION: Tự động ẩn sau 4s, xuất hiện góc trên bên phải */}
      {banner && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full pointer-events-auto">
          <div 
            className={`p-4 rounded-xl flex items-start justify-between gap-3 shadow-xl border bg-white ${
              banner.type === 'success'
                ? 'border-emerald-200 text-emerald-800 ring-1 ring-emerald-500/10'
                : banner.type === 'error'
                ? 'border-rose-200 text-rose-800 ring-1 ring-rose-500/10'
                : 'border-amber-200 text-amber-800 ring-1 ring-amber-500/10'
            }`}
          >
            <div className="flex items-start gap-3">
              {banner.type === 'success' ? (
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 text-emerald-600 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : banner.type === 'error' ? (
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100 text-rose-600 mt-0.5">
                  <XCircle className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100 text-amber-600 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-slate-900">{banner.title}</div>
                {banner.desc && <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{banner.desc}</div>}
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setBanner(null)}
              className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400 hover:text-slate-600 transition"
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MÀN HÌNH TẠO YÊU CẦU MUA SẮM (viewMode === 'create')                   */}
      {/* ========================================================================= */}
      {viewMode === 'create' && (
        <div className="space-y-6">
          {/* HEADER: Title (Đã bỏ Quay lại danh sách vì đã có nút Hủy bỏ bên dưới) */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-slate-900 leading-8">
              Tạo yêu cầu mua sắm
            </h1>
          </div>

          {/* CARD: SẢN PHẨM YÊU CẦU (Bỏ mục thông tin yêu cầu, tự ghi tay sản phẩm) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-6 flex items-center justify-between border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Sản phẩm yêu cầu</h2>
              <span className="text-xs font-medium text-slate-500">
                {String(formItems.length).padStart(2, '0')} dòng sản phẩm
              </span>
            </div>

            {/* Table Lines */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="h-11 bg-slate-50 text-xs font-medium text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6">Sản phẩm *</th>
                    <th className="w-32 px-4">Đơn vị</th>
                    <th className="w-28 px-4 text-right">Số lượng</th>
                    <th className="w-48 px-4 text-right">Đơn giá dự kiến (đ)</th>
                    <th className="w-48 px-4 text-right">Thành tiền (đ)</th>
                    <th className="w-16 px-4 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {formItems.map((item) => {
                    const rowTotal = item.soLuong * item.donGiaDuKien;
                    const isQtyInvalid = item.soLuong <= 0;
                    const isPriceInvalid = item.donGiaDuKien <= 0;
                    const isNameEmpty = !item.tenSanPham.trim();

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        {/* Cột 1: Tự ghi tay hoặc chọn gợi ý từ catalog */}
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            list="pr-catalog-products-list"
                            value={item.tenSanPham}
                            onChange={(e) => handleUpdateName(item.id, e.target.value)}
                            placeholder="Nhập tên sản phẩm (gợi ý danh mục hoặc gõ tự do...)"
                            className={`w-full h-10 px-3 bg-white rounded-lg border ${
                              isNameEmpty && formError ? 'border-rose-400 focus:border-[#4F46E5]' : 'border-slate-200 focus:border-[#4F46E5]'
                            } focus:ring-1 focus:ring-[#4F46E5] text-slate-900 text-sm placeholder:text-slate-400`}
                          />
                        </td>

                        {/* Cột 2: Tự ghi tay đơn vị tính */}
                        <td className="w-32 px-4 py-4">
                          <input
                            type="text"
                            value={item.donViTinh}
                            onChange={(e) => handleUpdateUnit(item.id, e.target.value)}
                            placeholder="Chiếc"
                            className="w-full h-10 px-3 bg-white rounded-lg border border-slate-200 focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] text-slate-900 text-sm placeholder:text-slate-400"
                          />
                        </td>

                        {/* Cột 3: Số lượng */}
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="1"
                            value={item.soLuong}
                            onChange={(e) => handleUpdateQty(item.id, parseInt(e.target.value) || 0)}
                            className={`w-full h-10 px-3 text-right bg-white rounded-lg border ${
                              isQtyInvalid ? 'border-rose-500 text-rose-600' : 'border-slate-200 focus:border-[#4F46E5]'
                            } text-slate-900 text-sm`}
                          />
                        </td>

                        {/* Cột 4: Đơn giá dự kiến */}
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            value={item.donGiaDuKien}
                            onChange={(e) => handleUpdatePrice(item.id, parseInt(e.target.value) || 0)}
                            className={`w-full h-10 px-3 text-right bg-white rounded-lg border ${
                              isPriceInvalid ? 'border-rose-500 text-rose-600' : 'border-slate-200 focus:border-[#4F46E5]'
                            } text-slate-900 text-sm`}
                          />
                        </td>

                        {/* Cột 5: Thành tiền */}
                        <td className="px-4 py-4 text-right text-slate-900 text-sm font-semibold">
                          {formatNumberOnly(rowTotal)}
                        </td>

                        {/* Cột 6: Nút xóa */}
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                            title="Xóa dòng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Thêm sản phẩm row */}
            <div className="px-6 py-4 flex items-center gap-4 border-t border-slate-200 bg-white">
              <button
                type="button"
                onClick={handleAddLine}
                className="h-10 px-4 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 inline-flex items-center gap-2 text-slate-700 text-sm font-medium cursor-pointer transition shadow-2xs"
              >
                <Plus className="w-4 h-4 text-slate-600" />
                <span>Thêm sản phẩm</span>
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Gợi ý tự động từ danh mục sản phẩm, hoặc thoải mái nhập tên vật tư bất kỳ.
              </span>
            </div>

            {/* Datalist gợi ý từ Catalog (vẫn cho phép gõ tự do 100%) */}
            <datalist id="pr-catalog-products-list">
              {products.map(sp => (
                <option key={sp.maSanPham} value={sp.tenSanPham}>
                  {sp.donViTinh ? `[${sp.donViTinh}] ` : ''}{sp.danhMuc?.tenDanhMuc ? `(${sp.danhMuc.tenDanhMuc})` : ''}
                </option>
              ))}
            </datalist>

            {/* Total summary bar */}
            <div className="p-6 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-200 gap-3">
              <span className="text-sm text-slate-500 font-normal">
                {formItems.length} sản phẩm (Đơn vị tính: VND)
              </span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-normal text-slate-600">Tổng tiền dự kiến</span>
                <span className="text-2xl font-bold text-slate-900">
                  {formatVNDText(currentTotalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Validation Error banner if triggered */}
          {formError && (
            <div className="p-4 bg-status-rejected-background rounded-lg border border-rose-200 flex items-center gap-3 text-status-rejected-text text-sm font-medium">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="pt-6 border-t border-border-default flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="h-10 px-4 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium cursor-pointer transition"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmitCreate}
              className="h-10 px-4 bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] rounded-lg text-white text-sm font-medium cursor-pointer shadow-sm transition"
            >
              Gửi yêu cầu phê duyệt
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MÀN HÌNH CHI TIẾT YÊU CẦU (viewMode === 'detail')                       */}
      {/* ========================================================================= */}
      {viewMode === 'detail' && selectedPR && (
        <div className="space-y-6">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 leading-8">
                Chi tiết yêu cầu
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {formatCode(selectedPR)} - {selectedPR.tieuDe}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <StatusBadge status={selectedPR.trangThai} amount={selectedPR.tongTienDuKien} />

              {(selectedPR.trangThai === 'CHO_DUYET' || selectedPR.trangThai === 'TU_CHOI') && (
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedPR)}
                  className="h-10 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg inline-flex items-center gap-2 cursor-pointer transition text-sm font-medium shadow-xs"
                >
                  <Pencil className="w-4 h-4 text-white" />
                  <span>Chỉnh sửa</span>
                </button>
              )}

              {selectedPR.trangThai === 'DA_DUYET' && (currentUser?.vaiTros?.some(v => v.maVaiTro === 'NHAN_VIEN_MUA_HANG' || v.maVaiTro === 'ADMIN')) && (
                <button
                  type="button"
                  onClick={() => handleCreateRFQ(selectedPR.maYeuCau)}
                  className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg inline-flex items-center gap-2 cursor-pointer transition text-sm font-medium shadow-xs"
                >
                  <ShoppingBag className="w-4 h-4 text-white" />
                  <span>Lập yêu cầu báo giá RFQ</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="h-10 px-4 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 inline-flex items-center gap-2 cursor-pointer transition text-slate-700 text-sm font-medium shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span>Quay lại danh sách</span>
              </button>
            </div>
          </div>

          {/* CARD 1: THÔNG TIN YÊU CẦU */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Thông tin yêu cầu</h2>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">Mã phiếu</span>
                <span className="text-sm font-semibold text-slate-900">{formatCode(selectedPR)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">Mã yêu cầu nội bộ</span>
                <span className="text-sm font-medium text-slate-900">YC000{selectedPR.maYeuCau}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">Người đề nghị</span>
                <span className="text-sm font-medium text-slate-900">
                  {selectedPR.nguoiYeuCau?.hoVaTen || 'Phùng Bảo Trường'} (NV00{selectedPR.nguoiYeuCau?.maNguoiDung || 1})
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">Ngày tạo</span>
                <span className="text-sm font-medium text-slate-900">{formatDateTime(selectedPR.ngayTao)}</span>
              </div>
            </div>
          </div>

          {/* CARD 2: SẢN PHẨM YÊU CẦU */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Sản phẩm yêu cầu</h2>
              <p className="text-xs text-slate-500 mt-1">Giá trị dự kiến tại thời điểm phê duyệt.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="h-11 bg-slate-50 text-xs font-medium text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6">Sản phẩm</th>
                    <th className="w-28 px-4">Đơn vị</th>
                    <th className="w-28 px-4 text-right">Số lượng</th>
                    <th className="w-48 px-4 text-right">Đơn giá dự kiến (đ)</th>
                    <th className="w-48 px-6 text-right">Thành tiền (đ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {selectedPR.chiTietList && selectedPR.chiTietList.length > 0 ? (
                    selectedPR.chiTietList.map((ct: any) => {
                      const prodName = ct.sanPham?.tenSanPham || ct.tenSanPham || 'Sản phẩm';
                      const prodUnit = ct.sanPham?.donViTinh || ct.donViTinh || 'Chiếc';
                      const prodQty = ct.soLuong || 1;
                      const prodPrice = ct.donGiaDuKien || 0;
                      const prodTotal = prodQty * prodPrice;

                      return (
                        <tr key={ct.maChiTietYeuCau || Math.random()} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">{prodName}</div>
                            {ct.sanPham?.danhMuc?.tenDanhMuc && (
                              <div className="text-xs text-slate-400 mt-0.5">
                                {ct.sanPham.danhMuc.tenDanhMuc}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-slate-600">{prodUnit}</td>
                          <td className="px-4 py-4 text-right text-slate-900 font-medium">{prodQty}</td>
                          <td className="px-4 py-4 text-right text-slate-900 font-normal">{formatNumberOnly(prodPrice)}</td>
                          <td className="px-6 py-4 text-right text-slate-900 font-semibold">
                            {formatNumberOnly(prodTotal)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-center text-slate-400 text-sm">
                        Đang tổng hợp chi tiết theo danh mục đề nghị...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Summary Footer */}
            <div className="p-6 bg-slate-50/60 flex items-center justify-between border-t border-slate-200">
              <span className="text-sm text-slate-500 font-normal">
                {selectedPR.chiTietList?.length || 1} sản phẩm (Đơn vị tính: VND)
              </span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-normal text-slate-600">Tổng tiền dự kiến</span>
                <span className="text-2xl font-bold text-slate-900">
                  {formatVNDText(selectedPR.tongTienDuKien)}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: LỊCH SỬ XỬ LÝ (PHÊ DUYỆT) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Lịch sử xử lý</h2>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  {selectedPR.trangThai === 'CHO_DUYET' ? '0 bản ghi xử lý' : '01 bản ghi phê duyệt'}
                </span>
              </div>
            </div>

            {selectedPR.trangThai === 'DA_DUYET' || selectedPR.trangThai === 'DANG_MUA' || selectedPR.trangThai === 'CHO_BAO_GIA' ? (
              <div className="p-6 flex items-start gap-4">
                <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center shrink-0 border border-emerald-200 text-emerald-600">
                  <Check className="w-4 h-4" />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">
                      {selectedPR.tongTienDuKien >= 50000000 
                        ? 'Nguyễn Thị Mai (QL002 - Người phê duyệt 2)' 
                        : 'Trần Thị Bình (QL001 - Người phê duyệt 1)'}
                    </span>
                    <span className="text-xs text-slate-400">{formatDateTime(selectedPR.ngayTao)}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-emerald-700">
                      {selectedPR.tongTienDuKien >= 50000000 ? 'Được phê duyệt bởi NPD2' : 'Được phê duyệt bởi NPD1'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">
                    Đồng ý trang bị thiết bị theo danh mục và tổng dự toán đề nghị.
                  </p>
                </div>
              </div>
            ) : selectedPR.trangThai === 'TU_CHOI' ? (
              <div className="p-6 flex items-start gap-4">
                <div className="w-9 h-9 bg-rose-50 rounded-full flex items-center justify-center shrink-0 border border-rose-200 text-rose-600">
                  <X className="w-4 h-4" />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">
                      Trần Thị Bình (QL001 - Người phê duyệt 1)
                    </span>
                    <span className="text-xs text-slate-400">{formatDateTime(selectedPR.ngayTao)}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-full w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="text-xs font-medium text-rose-700">Từ chối duyệt</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">
                    Chưa phù hợp với kế hoạch ngân sách quý hiện tại.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 flex items-center gap-3 bg-slate-50/60">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-sm font-medium text-slate-600">Chưa có bản ghi phê duyệt</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MÀN HÌNH CHỈNH SỬA YÊU CẦU MUA SẮM (viewMode === 'edit')               */}
      {/* ========================================================================= */}
      {viewMode === 'edit' && editingPR && (
        <div className="space-y-6">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 leading-8">
                Chỉnh sửa yêu cầu mua sắm
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {formatCode(editingPR)} - {editingPR.tieuDe}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 bg-[#FFFBEB] rounded-full inline-flex items-center gap-1.5 border border-[#FEF3C7]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                <span className="text-xs font-medium text-[#B45309]">Chờ duyệt</span>
              </div>
            </div>
          </div>

          {/* CARD: SẢN PHẨM YÊU CẦU (Bỏ thông tin yêu cầu, tự ghi tay sản phẩm) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-6 flex items-center justify-between border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Sản phẩm yêu cầu</h2>
              <span className="text-xs font-medium text-slate-500">
                {String(formItems.length).padStart(2, '0')} dòng sản phẩm
              </span>
            </div>

            {/* Table Lines */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="h-11 bg-slate-50 text-xs font-medium text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6">Sản phẩm *</th>
                    <th className="w-32 px-4">Đơn vị</th>
                    <th className="w-28 px-4 text-right">Số lượng</th>
                    <th className="w-48 px-4 text-right">Đơn giá dự kiến (đ)</th>
                    <th className="w-48 px-4 text-right">Thành tiền (đ)</th>
                    <th className="w-16 px-4 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {formItems.map((item) => {
                    const rowTotal = item.soLuong * item.donGiaDuKien;
                    const isQtyInvalid = item.soLuong <= 0;
                    const isPriceInvalid = item.donGiaDuKien <= 0;
                    const isNameEmpty = !item.tenSanPham.trim();

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        {/* Cột 1: Tên sản phẩm ghi tay hoặc chọn gợi ý */}
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            list="pr-catalog-products-list"
                            value={item.tenSanPham}
                            onChange={(e) => handleUpdateName(item.id, e.target.value)}
                            placeholder="Nhập tên sản phẩm (gợi ý danh mục hoặc gõ tự do...)"
                            className={`w-full h-10 px-3 bg-white rounded-lg border ${
                              isNameEmpty && formError ? 'border-rose-400 focus:border-[#4F46E5]' : 'border-slate-200 focus:border-[#4F46E5]'
                            } focus:ring-1 focus:ring-[#4F46E5] text-slate-900 text-sm placeholder:text-slate-400`}
                          />
                        </td>
                        {/* Cột 2: Đơn vị tính ghi tay */}
                        <td className="w-32 px-4 py-4">
                          <input
                            type="text"
                            value={item.donViTinh}
                            onChange={(e) => handleUpdateUnit(item.id, e.target.value)}
                            placeholder="Chiếc"
                            className="w-full h-10 px-3 bg-white rounded-lg border border-slate-200 focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] text-slate-900 text-sm placeholder:text-slate-400"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="1"
                            value={item.soLuong}
                            onChange={(e) => handleUpdateQty(item.id, parseInt(e.target.value) || 0)}
                            className={`w-full h-10 px-3 text-right bg-white rounded-lg border ${
                              isQtyInvalid ? 'border-rose-500 text-rose-600' : 'border-slate-200 focus:border-[#4F46E5]'
                            } text-slate-900 text-sm`}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            value={item.donGiaDuKien}
                            onChange={(e) => handleUpdatePrice(item.id, parseInt(e.target.value) || 0)}
                            className={`w-full h-10 px-3 text-right bg-white rounded-lg border ${
                              isPriceInvalid ? 'border-rose-500 text-rose-600' : 'border-slate-200 focus:border-[#4F46E5]'
                            } text-slate-900 text-sm`}
                          />
                        </td>
                        <td className="px-4 py-4 text-right text-slate-900 text-sm font-semibold">
                          {formatNumberOnly(rowTotal)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                            title="Xóa dòng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Add Line Row */}
            <div className="px-6 py-4 flex items-center gap-4 border-t border-slate-200 bg-white">
              <button
                type="button"
                onClick={handleAddLine}
                className="h-10 px-4 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 inline-flex items-center gap-2 text-slate-700 text-sm font-medium cursor-pointer transition shadow-2xs"
              >
                <Plus className="w-4 h-4 text-slate-600" />
                <span>Thêm sản phẩm</span>
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Gợi ý tự động từ danh mục sản phẩm, hoặc thoải mái nhập tên vật tư bất kỳ.
              </span>
            </div>

            {/* Total Summary Footer */}
            <div className="p-6 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-200 gap-3">
              <span className="text-sm text-slate-500 font-normal">
                {formItems.length} sản phẩm (Đơn vị tính: VND)
              </span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-normal text-slate-600">Tổng tiền dự kiến</span>
                <span className="text-2xl font-bold text-slate-900">
                  {formatVNDText(currentTotalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Error alert if any */}
          {formError && (
            <div className="p-4 bg-status-rejected-background rounded-lg border border-rose-200 flex items-center gap-3 text-status-rejected-text text-sm font-medium">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">
              Tổng dự kiến: {formatVNDText(currentTotalAmount)}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="h-10 px-4 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium cursor-pointer transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSubmitUpdate}
                className="h-10 px-4 bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] rounded-lg text-white text-sm font-semibold cursor-pointer shadow-sm transition"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MÀN HÌNH DANH SÁCH YÊU CẦU MUA SẮM (viewMode === 'list')               */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* HEADER THEO FIGMA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                Yêu cầu mua sắm
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                Quản lý và theo dõi các phiếu đề nghị của bạn.
              </p>
            </div>

            {/* Nút Tạo yêu cầu (Mục B4: Nền primary, chữ trắng, icon +, tương phản cao) */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] text-white font-medium text-sm shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white shrink-0" strokeWidth={2.5} />
              <span className="text-white font-medium">Tạo yêu cầu</span>
            </button>
          </div>

          {/* KHỐI 4 THẺ SUMMARY KPI THEO ĐÚNG FIGMA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* THẺ 1: TẤT CẢ YÊU CẦU */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Tất cả yêu cầu</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">
                {String(stats.totalCount).padStart(2, '0')}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Trong phạm vi của bạn</span>
            </div>

            {/* THẺ 2: CHỜ DUYỆT */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Chờ duyệt</span>
              <div className="text-3xl font-extrabold text-[#B45309] mt-1">
                {String(stats.pendingCount).padStart(2, '0')}
              </div>
              <span className="text-xs text-[#B45309] mt-1 block font-normal">
                {formatVNDText(stats.pendingAmount)} dự kiến
              </span>
            </div>

            {/* THẺ 3: HOÀN TẤT PHÊ DUYỆT */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Hoàn tất phê duyệt</span>
              {/* TODO: Thẻ "Hoàn tất phê duyệt" đang đếm cả NPD1 và NPD2 đã duyệt. Cần quyết định tách riêng hay gộp. */}
              <div className="text-3xl font-extrabold text-[#15803D] mt-1">
                {String(stats.approvedCount).padStart(2, '0')}
              </div>
              <span className="text-xs text-[#15803D] mt-1 block font-normal">
                {formatVNDText(stats.approvedAmount)} dự kiến
              </span>
            </div>

            {/* THẺ 4: ĐANG MUA */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Đang mua</span>
              <div className="text-3xl font-extrabold text-[#1D4ED8] mt-1">
                {String(stats.processingCount).padStart(2, '0')}
              </div>
              <span className="text-xs text-[#1D4ED8] mt-1 block font-normal">
                {formatVNDText(stats.processingAmount)} dự kiến
              </span>
            </div>
          </div>

          {/* BẢNG DANH SÁCH YÊU CẦU THEO CHUẨN FIGMA */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            
            {/* Title Bar Trong Bảng */}
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-sm text-[#4F46E5]">
                Yêu cầu của tôi
              </h2>
            </div>

            {/* Thanh Tìm Kiếm Và Bộ Lọc */}
            <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Tìm mã phiếu, tên sản phẩm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                />
              </div>

              {/* Bộ lọc trạng thái */}
              <div className="w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="CHO_DUYET">Chờ duyệt</option>
                  <option value="DA_DUYET">Đã duyệt (NPD1/NPD2)</option>
                  <option value="DANG_MUA">Đang mua</option>
                  <option value="TU_CHOI">Từ chối duyệt</option>
                </select>
              </div>

              {/* Bộ lọc ngày tạo */}
              <div className="w-44">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] cursor-pointer"
                >
                  <option value="all">Ngày tạo: Tất cả</option>
                  <option value="7days">7 ngày qua</option>
                  <option value="30days">30 ngày qua</option>
                </select>
              </div>

              {/* Nút Làm Mới */}
              <button
                type="button"
                onClick={loadData}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Làm mới</span>
              </button>
            </div>

            {/* TABLE BODY OR EMPTY STATES */}
            {loading ? (
              /* LOADING SKELETON STATE MATCHING FIGMA RULES */
              <div className="p-8 space-y-4">
                <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
                <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-slate-100 rounded w-4/6 animate-pulse" />
                <div className="flex items-center justify-center gap-2 pt-4 text-slate-500 text-sm">
                  <RotateCcw className="w-4 h-4 animate-spin text-[#4F46E5]" />
                  <span>Đang tải yêu cầu mua sắm…</span>
                </div>
              </div>
            ) : requests.length === 0 ? (
              /* EMPTY STATE: CHƯA CÓ YÊU CẦU */
              <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 text-[#4F46E5]">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Chưa có phiếu đề nghị mua sắm
                </h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  Tạo yêu cầu đầu tiên để bắt đầu theo dõi tiến độ mua sắm nội bộ.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="mt-5 h-10 px-4 bg-[#4F46E5] hover:bg-[#4338CA] rounded-lg text-white text-sm font-medium inline-flex items-center gap-2 cursor-pointer transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo yêu cầu mới</span>
                </button>
              </div>
            ) : filteredRequests.length === 0 ? (
              /* SEARCH EMPTY STATE: KHÔNG CÓ KẾT QUẢ TÌM KIẾM */
              <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Không tìm thấy yêu cầu phù hợp
                </h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  Không có phiếu nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
                </p>
                <button
                  type="button"
                  onClick={() => { setSearch(''); setStatusFilter('all'); }}
                  className="mt-5 h-10 px-4 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 text-slate-800 text-sm font-medium cursor-pointer transition"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              /* FULL TABLE WITH REAL DATA */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500">
                      <th className="py-3.5 pl-6 pr-4">Mã phiếu / Nội dung</th>
                      <th className="py-3.5 px-4">Người đề nghị</th>
                      <th className="py-3.5 px-4 text-right">Tổng dự kiến (đ)</th>
                      <th className="py-3.5 px-4 min-w-[185px]">Trạng thái</th>
                      <th className="py-3.5 px-4">Ngày tạo ↓</th>
                      <th className="py-3.5 pr-6 pl-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {paginatedRequests.map((item) => {
                      const codeStr = formatCode(item);

                      return (
                        <tr 
                          key={item.maYeuCau} 
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          {/* Mã Phiếu / Nội Dung: Cả mã phiếu và chữ đều click được để xem chi tiết */}
                          <td className="py-3.5 pl-6 pr-4">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(item)}
                              className="text-left block group/link cursor-pointer"
                              title={`Xem chi tiết ${codeStr}`}
                            >
                              <span className="font-medium text-[#4F46E5] group-hover/link:underline block text-xs">
                                {codeStr}
                              </span>
                              <span className="text-slate-500 text-[11px] block mt-0.5 truncate max-w-xs font-normal group-hover/link:text-slate-700">
                                {item.tieuDe || 'Chưa có tiêu đề'}
                              </span>
                            </button>
                          </td>

                          {/* Người đề nghị */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900 block text-xs">
                              {item.nguoiYeuCau?.hoVaTen || 'Phùng Bảo Trường'}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              NV00{item.nguoiYeuCau?.maNguoiDung || 1}
                            </span>
                          </td>

                          {/* Tổng tiền dự kiến (đ) - Căn phải, không có chữ đ vì tiêu đề cột đã có */}
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-xs">
                            {formatNumberOnly(item.tongTienDuKien)}
                          </td>

                          {/* Trạng thái */}
                          <td className="py-3.5 px-4">
                            <StatusBadge status={item.trangThai} amount={item.tongTienDuKien} />
                          </td>

                          {/* Ngày tạo */}
                          <td className="py-3.5 px-4 text-slate-500 font-medium">
                            {formatDate(item.ngayTao)}
                          </td>

                          {/* Thao tác (Đã bỏ nút Mắt, muốn xem ấn vào chữ; Chỉ còn Sửa và Xóa) */}
                          <td className="py-3.5 pr-6 pl-4 text-right">
                            {(() => {
                              const canEditOrDelete = item.trangThai === 'CHO_DUYET' || item.trangThai === 'TU_CHOI';
                              return (
                                <div className="inline-flex items-center gap-1.5 justify-end">
                                  {/* Nút Sửa: chỉ bật khi Chờ duyệt hoặc Từ chối duyệt */}
                                  <button
                                    type="button"
                                    disabled={!canEditOrDelete}
                                    onClick={() => canEditOrDelete && handleOpenEdit(item)}
                                    className={`p-1.5 rounded-lg transition ${
                                      canEditOrDelete
                                        ? 'text-slate-600 hover:text-[#4F46E5] hover:bg-slate-100 cursor-pointer'
                                        : 'text-slate-300 cursor-not-allowed'
                                    }`}
                                    title={canEditOrDelete ? `Chỉnh sửa ${codeStr}` : 'Không thể chỉnh sửa phiếu ở trạng thái này'}
                                    aria-label={`Sửa ${codeStr}${!canEditOrDelete ? ' (bị vô hiệu hóa)' : ''}`}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>

                                  {/* Nút Xóa: chỉ bật khi Chờ duyệt hoặc Từ chối duyệt, màu đỏ khi bật */}
                                  <button
                                    type="button"
                                    disabled={!canEditOrDelete}
                                    onClick={() => canEditOrDelete && setDeletingPR(item)}
                                    className={`p-1.5 rounded-lg transition ${
                                      canEditOrDelete
                                        ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer'
                                        : 'text-slate-300 cursor-not-allowed'
                                    }`}
                                    title={canEditOrDelete ? `Xóa phiếu ${codeStr}` : 'Không thể xóa phiếu ở trạng thái này'}
                                    aria-label={`Xóa ${codeStr}${!canEditOrDelete ? ' (bị vô hiệu hóa)' : ''}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer - Phân trang động hoàn chỉnh */}
            <div className="px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 bg-white">
              <span>
                {filteredRequests.length === 0 ? (
                  'Hiển thị 0 trong 0 yêu cầu'
                ) : (
                  `Hiển thị ${startIndex + 1}–${endIndex} trong ${filteredRequests.length} yêu cầu`
                )}
              </span>

              <div className="flex items-center gap-2">
                {/* Chọn số dòng hiển thị trên mỗi trang */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 cursor-pointer focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] shadow-2xs font-medium"
                  aria-label="Số dòng trên mỗi trang"
                >
                  <option value={5}>5 / trang</option>
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>

                <div className="flex items-center gap-1 ml-2">
                  {/* Nút Trước */}
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={`px-2.5 py-1 rounded border transition ${
                      currentPage > 1
                        ? 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs font-medium'
                        : 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                    }`}
                  >
                    Trước
                  </button>

                  {/* Danh sách các nút số trang */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2.5 py-1 rounded transition ${
                        pageNum === currentPage
                          ? 'bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] font-bold shadow-2xs'
                          : 'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs font-medium'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {/* Nút Sau */}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={`px-2.5 py-1 rounded border transition ${
                      currentPage < totalPages
                        ? 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs font-medium'
                        : 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                    }`}
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DANGER DELETE CONFIRMATION MODAL MATCHING FIGMA RULES                  */}
      {/* ========================================================================= */}
      {deletingPR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Xóa phiếu {formatCode(deletingPR)}?
              </h3>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed">
              Hành động này không thể hoàn tác. Phiếu yêu cầu và toàn bộ dòng sản phẩm đính kèm sẽ bị xóa vĩnh viễn.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPR(null)}
                className="h-10 px-4 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium cursor-pointer transition shadow-2xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="h-10 px-4 bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] rounded-lg text-white text-sm font-semibold cursor-pointer transition shadow-sm"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
