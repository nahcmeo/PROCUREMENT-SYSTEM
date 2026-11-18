import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Layers, Plus, Search, Pencil, Trash2, X, CheckCircle2, 
  AlertTriangle, FolderTree, Tag, ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { DanhMucHang, SanPham } from '../types';

interface CategoriesProductsPageProps {
  onBreadcrumbChange?: (sub?: string, show?: boolean) => void;
}

export const CategoriesProductsPage: React.FC<CategoriesProductsPageProps> = ({ onBreadcrumbChange }) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'products'>('products');

  const [categories, setCategories] = useState<DanhMucHang[]>([]);
  const [products, setProducts] = useState<SanPham[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modal Category
  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(false);
  const [editingCat, setEditingCat] = useState<DanhMucHang | null>(null);
  const [catName, setCatName] = useState<string>('');
  const [catDesc, setCatDesc] = useState<string>('');
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<DanhMucHang | null>(null);

  // Modal Product
  const [isProdModalOpen, setIsProdModalOpen] = useState<boolean>(false);
  const [editingProd, setEditingProd] = useState<SanPham | null>(null);
  const [prodName, setProdName] = useState<string>('');
  const [prodUnit, setProdUnit] = useState<string>('Chiếc');
  const [prodCatId, setProdCatId] = useState<number | ''>('');
  const [deleteConfirmProd, setDeleteConfirmProd] = useState<SanPham | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; title: string; desc?: string } | null>(null);

  useEffect(() => {
    if (onBreadcrumbChange) {
      onBreadcrumbChange('Danh mục & Sản phẩm', false);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catsRes, prodsRes] = await Promise.all([
        api.get<DanhMucHang[]>('/danh-muc'),
        api.get<SanPham[]>('/san-pham')
      ]);
      setCategories(catsRes.data);
      setProducts(prodsRes.data);
    } catch (err: any) {
      console.error(err);
      showBanner('error', 'Lỗi tải danh mục sản phẩm', err.message);
    } finally {
      setLoading(false);
    }
  };

  const showBanner = (type: 'success' | 'error', title: string, desc?: string) => {
    setBanner({ type, title, desc });
    setTimeout(() => setBanner(null), 4500);
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q || 
        p.tenSanPham.toLowerCase().includes(q) ||
        (p.danhMuc?.tenDanhMuc && p.danhMuc.tenDanhMuc.toLowerCase().includes(q)) ||
        (p.donViTinh && p.donViTinh.toLowerCase().includes(q));

      const matchCat = filterCategory === 'all' || String(p.danhMuc?.maDanhMuc) === filterCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, filterCategory]);

  // Filter categories
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(c => 
      c.tenDanhMuc.toLowerCase().includes(q) ||
      (c.moTa && c.moTa.toLowerCase().includes(q))
    );
  }, [categories, search]);

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setFormError('Tên danh mục không được để trống.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingCat) {
        await api.put(`/danh-muc/${editingCat.maDanhMuc}`, {
          tenDanhMuc: catName.trim(),
          moTa: catDesc.trim() || undefined
        });
        showBanner('success', 'Cập nhật danh mục thành công', `Đã lưu danh mục ${catName}`);
      } else {
        await api.post('/danh-muc', {
          tenDanhMuc: catName.trim(),
          moTa: catDesc.trim() || undefined
        });
        showBanner('success', 'Thêm mới danh mục thành công', `Đã tạo danh mục ${catName}`);
      }
      setIsCatModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data || 'Không thể lưu danh mục.');
    } finally {
      setSubmitting(false);
    }
  };

  // Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      setFormError('Tên sản phẩm không được để trống.');
      return;
    }
    if (!prodUnit.trim()) {
      setFormError('Đơn vị tính không được để trống.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const payload: any = {
        tenSanPham: prodName.trim(),
        donViTinh: prodUnit.trim()
      };
      if (prodCatId) payload.maDanhMuc = prodCatId;

      if (editingProd) {
        await api.put(`/san-pham/${editingProd.maSanPham}`, payload);
        showBanner('success', 'Cập nhật sản phẩm thành công', `Đã lưu thông tin ${prodName}`);
      } else {
        await api.post('/san-pham', payload);
        showBanner('success', 'Thêm mới sản phẩm thành công', `Sản phẩm ${prodName} đã sẵn sàng trong catalog.`);
      }
      setIsProdModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data || 'Không thể lưu sản phẩm.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCat = async () => {
    if (!deleteConfirmCat) return;
    try {
      await api.delete(`/danh-muc/${deleteConfirmCat.maDanhMuc}`);
      showBanner('success', 'Xóa thành công', `Đã xóa danh mục ${deleteConfirmCat.tenDanhMuc}`);
      setDeleteConfirmCat(null);
      loadData();
    } catch (err: any) {
      showBanner('error', 'Không thể xóa danh mục', err.response?.data || err.message);
      setDeleteConfirmCat(null);
    }
  };

  const handleDeleteProd = async () => {
    if (!deleteConfirmProd) return;
    try {
      await api.delete(`/san-pham/${deleteConfirmProd.maSanPham}`);
      showBanner('success', 'Xóa thành công', `Đã xóa sản phẩm ${deleteConfirmProd.tenSanPham}`);
      setDeleteConfirmProd(null);
      loadData();
    } catch (err: any) {
      showBanner('error', 'Không thể xóa sản phẩm', err.response?.data || err.message);
      setDeleteConfirmProd(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
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
          <h1 className="text-2xl font-bold text-slate-900">Danh mục hàng & Sản phẩm</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý cây phân loại danh mục và danh mục hàng hóa vật tư dùng chung cho việc lập PR, báo giá và đơn mua hàng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'products' ? (
            <button
              onClick={() => {
                setEditingProd(null);
                setProdName('');
                setProdUnit('Chiếc');
                setProdCatId(categories[0]?.maDanhMuc || '');
                setFormError(null);
                setIsProdModalOpen(true);
              }}
              className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm sản phẩm mới</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingCat(null);
                setCatName('');
                setCatDesc('');
                setFormError(null);
                setIsCatModalOpen(true);
              }}
              className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm danh mục mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'products'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Sản phẩm & Hàng hóa ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'categories'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Danh mục phân loại ({categories.length})</span>
        </button>
      </div>

      {/* Content for Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên sản phẩm, danh mục, đơn vị tính..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map(c => (
                  <option key={c.maDanhMuc} value={String(c.maDanhMuc)}>{c.tenDanhMuc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã SP</th>
                  <th className="py-3 px-4">Tên sản phẩm / vật tư</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4 text-center">Đơn vị tính</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">Đang tải danh mục sản phẩm...</td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">Không tìm thấy sản phẩm nào.</td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.maSanPham} className="hover:bg-slate-50/75 transition">
                      <td className="py-3.5 px-4 tabular-nums font-semibold text-slate-700 text-xs">
                        SP{String(p.maSanPham).padStart(4, '0')}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {p.tenSanPham}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {p.danhMuc?.tenDanhMuc || 'Chung'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-600 text-xs">
                        {p.donViTinh}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingProd(p);
                              setProdName(p.tenSanPham);
                              setProdUnit(p.donViTinh);
                              setProdCatId(p.danhMuc?.maDanhMuc || '');
                              setFormError(null);
                              setIsProdModalOpen(true);
                            }}
                            title="Chỉnh sửa sản phẩm"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmProd(p)}
                            title="Xóa sản phẩm"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content for Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-24">Mã DM</th>
                  <th className="py-3 px-4">Tên danh mục</th>
                  <th className="py-3 px-4">Mô tả chi tiết</th>
                  <th className="py-3 px-4 text-center">Số sản phẩm</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((c) => {
                  const countInCat = products.filter(p => p.danhMuc?.maDanhMuc === c.maDanhMuc).length;
                  return (
                    <tr key={c.maDanhMuc} className="hover:bg-slate-50/75 transition">
                      <td className="py-3.5 px-4 tabular-nums font-semibold text-slate-700 text-xs">
                        DM#{c.maDanhMuc}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {c.tenDanhMuc}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {c.moTa || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                          {countInCat} SP
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingCat(c);
                              setCatName(c.tenDanhMuc);
                              setCatDesc(c.moTa || '');
                              setFormError(null);
                              setIsCatModalOpen(true);
                            }}
                            title="Sửa danh mục"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmCat(c)}
                            title="Xóa danh mục"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Thêm / Sửa Danh mục */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                {editingCat ? `Sửa danh mục #${editingCat.maDanhMuc}` : 'Thêm mới danh mục'}
              </h2>
              <button onClick={() => setIsCatModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="vd: Thiết bị văn phòng, Phần cứng CNTT..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mô tả danh mục
                </label>
                <textarea
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Mô tả phạm vi các hàng hóa vật tư thuộc danh mục này..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : (editingCat ? 'Cập nhật' : 'Tạo mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thêm / Sửa Sản phẩm */}
      {isProdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                {editingProd ? `Sửa sản phẩm SP${String(editingProd.maSanPham).padStart(4, '0')}` : 'Thêm mới sản phẩm'}
              </h2>
              <button onClick={() => setIsProdModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tên sản phẩm / vật tư *
                </label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="vd: Laptop Dell XPS 15, Bàn làm việc..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Đơn vị tính *
                  </label>
                  <input
                    type="text"
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    placeholder="Chiếc, Bộ, Hộp, Kg..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Danh mục phân loại
                  </label>
                  <select
                    value={prodCatId}
                    onChange={(e) => setProdCatId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c.maDanhMuc} value={c.maDanhMuc}>{c.tenDanhMuc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProdModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : (editingProd ? 'Cập nhật' : 'Tạo mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Category */}
      {deleteConfirmCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Xác nhận xóa danh mục?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa danh mục <strong>{deleteConfirmCat.tenDanhMuc}</strong>? Hệ thống sẽ chặn nếu danh mục đang chứa sản phẩm.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmCat(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteCat}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg shadow-xs transition cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Product */}
      {deleteConfirmProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Xác nhận xóa sản phẩm?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Bạn có chắc muốn xóa sản phẩm <strong>{deleteConfirmProd.tenSanPham}</strong>?
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmProd(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteProd}
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
