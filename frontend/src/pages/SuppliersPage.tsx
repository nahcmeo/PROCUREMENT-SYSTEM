import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Plus, Search, Pencil, Trash2, X, CheckCircle2, 
  AlertTriangle, Mail, Phone, MapPin, Hash, ExternalLink
} from 'lucide-react';
import api from '../services/api';
import { NhaCungCap } from '../types';

interface SuppliersPageProps {
  onBreadcrumbChange?: (sub?: string, show?: boolean) => void;
}

export const SuppliersPage: React.FC<SuppliersPageProps> = ({ onBreadcrumbChange }) => {
  const [suppliers, setSuppliers] = useState<NhaCungCap[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<NhaCungCap | null>(null);
  const [deleteConfirmSupplier, setDeleteConfirmSupplier] = useState<NhaCungCap | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; title: string; desc?: string } | null>(null);

  // Form
  const [formData, setFormData] = useState({
    tenNhaCungCap: '',
    maSoThue: '',
    soDienThoai: '',
    email: '',
    diaChi: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (onBreadcrumbChange) {
      onBreadcrumbChange('Hồ sơ nhà cung cấp', false);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get<NhaCungCap[]>('/nha-cung-cap');
      setSuppliers(res.data);
    } catch (err: any) {
      console.error(err);
      showBanner('error', 'Lỗi tải danh sách nhà cung cấp', err.message);
    } finally {
      setLoading(false);
    }
  };

  const showBanner = (type: 'success' | 'error', title: string, desc?: string) => {
    setBanner({ type, title, desc });
    setTimeout(() => setBanner(null), 4500);
  };

  const filteredSuppliers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(s => 
      s.tenNhaCungCap.toLowerCase().includes(q) ||
      s.maSoThue.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.soDienThoai && s.soDienThoai.includes(q)) ||
      (s.diaChi && s.diaChi.toLowerCase().includes(q))
    );
  }, [suppliers, search]);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({
      tenNhaCungCap: '',
      maSoThue: '',
      soDienThoai: '',
      email: '',
      diaChi: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: NhaCungCap) => {
    setEditingSupplier(s);
    setFormData({
      tenNhaCungCap: s.tenNhaCungCap,
      maSoThue: s.maSoThue,
      soDienThoai: s.soDienThoai || '',
      email: s.email || '',
      diaChi: s.diaChi || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.tenNhaCungCap.trim()) {
      setFormError('Tên nhà cung cấp không được để trống.');
      return;
    }
    if (!formData.maSoThue.trim()) {
      setFormError('Mã số thuế không được để trống.');
      return;
    }
    if (!formData.soDienThoai.trim() || !/^\d{9,11}$/.test(formData.soDienThoai.trim())) {
      setFormError('Số điện thoại phải từ 9 đến 11 chữ số.');
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setFormError('Định dạng email không hợp lệ.');
      return;
    }
    if (!formData.diaChi.trim()) {
      setFormError('Địa chỉ không được để trống.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingSupplier) {
        await api.put(`/nha-cung-cap/${editingSupplier.maNhaCungCap}`, {
          tenNhaCungCap: formData.tenNhaCungCap.trim(),
          maSoThue: formData.maSoThue.trim(),
          soDienThoai: formData.soDienThoai.trim(),
          email: formData.email.trim(),
          diaChi: formData.diaChi.trim()
        });
        showBanner('success', 'Cập nhật thành công', `Đã lưu hồ sơ nhà cung cấp ${formData.tenNhaCungCap}`);
      } else {
        await api.post('/nha-cung-cap', {
          tenNhaCungCap: formData.tenNhaCungCap.trim(),
          maSoThue: formData.maSoThue.trim(),
          soDienThoai: formData.soDienThoai.trim(),
          email: formData.email.trim(),
          diaChi: formData.diaChi.trim()
        });
        showBanner('success', 'Thêm mới thành công', `Nhà cung cấp ${formData.tenNhaCungCap} đã được đưa vào danh bạ.`);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data || 'Đã có lỗi xảy ra khi lưu nhà cung cấp.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmSupplier) return;
    try {
      await api.delete(`/nha-cung-cap/${deleteConfirmSupplier.maNhaCungCap}`);
      showBanner('success', 'Xóa nhà cung cấp thành công', `Đã xóa hồ sơ ${deleteConfirmSupplier.tenNhaCungCap}`);
      setDeleteConfirmSupplier(null);
      loadData();
    } catch (err: any) {
      showBanner('error', 'Không thể xóa nhà cung cấp', err.response?.data || err.message);
      setDeleteConfirmSupplier(null);
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
          <h1 className="text-2xl font-bold text-slate-900">Hồ sơ nhà cung cấp</h1>
          <p className="text-sm text-slate-500 mt-1">Danh bạ nhà cung cấp, thông tin pháp lý mã số thuế và thông tin liên hệ chính thức.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg inline-flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm nhà cung cấp</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Tổng đối tác NCC</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{suppliers.length}</div>
          <div className="text-xs text-slate-500 mt-1">Đã ký kết và xác minh thông tin</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-indigo-700">Đã kích hoạt MST</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{suppliers.filter(s => !!s.maSoThue).length}</div>
          <div className="text-xs text-indigo-600 mt-1">Có tư cách pháp nhân hợp lệ</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-emerald-700">Kênh liên lạc đầy đủ</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{suppliers.filter(s => !!s.email && !!s.soDienThoai).length}</div>
          <div className="text-xs text-emerald-600 mt-1">Sẵn sàng nhận yêu cầu báo giá RFQ</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên NCC, MST, email, số điện thoại, địa chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Hiển thị {filteredSuppliers.length} nhà cung cấp
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium text-xs border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tên nhà cung cấp</th>
                <th className="py-3 px-4">Mã số thuế</th>
                <th className="py-3 px-4">Thông tin liên hệ</th>
                <th className="py-3 px-4">Địa chỉ trụ sở</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">Đang tải danh bạ NCC...</td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">Không tìm thấy nhà cung cấp nào.</td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s.maNhaCungCap} className="hover:bg-slate-50/75 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>{s.tenNhaCungCap}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">Mã NCC: {s.maNhaCungCap}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200 tabular-nums">
                        {s.maSoThue}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 space-y-1">
                      {s.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{s.email}</span>
                        </div>
                      )}
                      {s.soDienThoai && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{s.soDienThoai}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate" title={s.diaChi}>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{s.diaChi}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Chỉnh sửa hồ sơ"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmSupplier(s)}
                          title="Xóa nhà cung cấp"
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

      {/* Modal: Thêm / Sửa nhà cung cấp */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-semibold text-slate-900">
                {editingSupplier ? `Cập nhật hồ sơ: ${editingSupplier.tenNhaCungCap}` : 'Thêm mới nhà cung cấp'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
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
                  Tên nhà cung cấp *
                </label>
                <input
                  type="text"
                  value={formData.tenNhaCungCap}
                  onChange={(e) => setFormData({ ...formData, tenNhaCungCap: e.target.value })}
                  placeholder="vd: Công ty TNHH Thiết Bị Văn Phòng Sao Mai"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mã số thuế *
                  </label>
                  <input
                    type="text"
                    value={formData.maSoThue}
                    onChange={(e) => setFormData({ ...formData, maSoThue: e.target.value })}
                    placeholder="0101234567"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="text"
                    value={formData.soDienThoai}
                    onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                    placeholder="02438889999"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email liên hệ *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@saomai.vn"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Địa chỉ trụ sở *
                </label>
                <textarea
                  rows={2}
                  value={formData.diaChi}
                  onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
                  placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
                  {submitting ? 'Đang lưu...' : (editingSupplier ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Xác nhận xóa nhà cung cấp?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa nhà cung cấp <strong>{deleteConfirmSupplier.tenNhaCungCap}</strong> (MST: {deleteConfirmSupplier.maSoThue})?
                Hệ thống sẽ từ chối xóa nếu NCC đã có báo giá, đơn mua hàng PO hoặc đánh giá.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmSupplier(null)}
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
