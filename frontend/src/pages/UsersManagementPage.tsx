import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Pencil, Trash2, X, Check, Lock, Unlock, 
  AlertTriangle, Shield, User, Mail, Phone, Building, CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { NguoiDung, VaiTro } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface UsersManagementPageProps {
  onBreadcrumbChange?: (sub?: string, show?: boolean) => void;
}

export const UsersManagementPage: React.FC<UsersManagementPageProps> = ({ onBreadcrumbChange }) => {
  const [users, setUsers] = useState<NguoiDung[]>([]);
  const [roles, setRoles] = useState<VaiTro[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<NguoiDung | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<NguoiDung | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; title: string; desc?: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    tenDangNhap: '',
    matKhau: '',
    hoVaTen: '',
    email: '',
    soDienThoai: '',
    phongBan: 'Phòng Mua Sắm',
    maVaiTro: 'NHAN_VIEN_YEU_CAU'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (onBreadcrumbChange) {
      onBreadcrumbChange('Quản lý người dùng & phân quyền', false);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get<NguoiDung[]>('/nguoi-dung'),
        api.get<VaiTro[]>('/nguoi-dung/vai-tro').catch(() => ({ data: [] }))
      ]);
      setUsers(usersRes.data);
      if (rolesRes.data && rolesRes.data.length > 0) {
        setRoles(rolesRes.data);
      } else {
        // Fallback default roles
        setRoles([
          { maVaiTro: 'ADMIN', tenVaiTro: 'Quản trị viên' },
          { maVaiTro: 'NHAN_VIEN_YEU_CAU', tenVaiTro: 'Nhân viên yêu cầu' },
          { maVaiTro: 'TRUONG_PHONG', tenVaiTro: 'Trưởng phòng (NPD1)' },
          { maVaiTro: 'GIAM_DOC', tenVaiTro: 'Giám đốc (NPD2)' },
          { maVaiTro: 'NHAN_VIEN_MUA_HANG', tenVaiTro: 'Nhân viên Mua hàng' }
        ]);
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
      showBanner('error', 'Không thể tải danh sách người dùng', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const showBanner = (type: 'success' | 'error', title: string, desc?: string) => {
    setBanner({ type, title, desc });
    setTimeout(() => {
      setBanner(null);
    }, 4500);
  };

  const filteredUsers = useMemo(() => {
    return (users || []).filter(u => {
      if (!u) return false;
      const q = search.trim().toLowerCase();
      const matchSearch = !q || 
        (u.tenDangNhap && u.tenDangNhap.toLowerCase().includes(q)) ||
        (u.hoVaTen && u.hoVaTen.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phongBan && u.phongBan.toLowerCase().includes(q)) ||
        (u.soDienThoai && u.soDienThoai.includes(q));

      const uRoles = Array.isArray(u.vaiTros) ? u.vaiTros : [];
      const matchRole = selectedRole === 'all' || 
        uRoles.some(v => v?.maVaiTro === selectedRole);

      const matchStatus = selectedStatus === 'all' ||
        (selectedStatus === 'active' && u.trangThai) ||
        (selectedStatus === 'locked' && !u.trangThai);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, selectedRole, selectedStatus]);

  // Metric stats
  const stats = useMemo(() => {
    const list = users || [];
    const total = list.length;
    const active = list.filter(u => u?.trangThai).length;
    const locked = total - active;
    return { total, active, locked };
  }, [users]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      tenDangNhap: '',
      matKhau: '123456',
      hoVaTen: '',
      email: '',
      soDienThoai: '',
      phongBan: 'Phòng Mua Sắm',
      maVaiTro: 'NHAN_VIEN_YEU_CAU'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: NguoiDung) => {
    setEditingUser(user);
    setFormData({
      tenDangNhap: user.tenDangNhap,
      matKhau: '',
      hoVaTen: user.hoVaTen,
      email: user.email || '',
      soDienThoai: user.soDienThoai || '',
      phongBan: user.phongBan || 'Phòng Mua Sắm',
      maVaiTro: (user.vaiTros && user.vaiTros[0]?.maVaiTro) || 'NHAN_VIEN_YEU_CAU'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.hoVaTen.trim()) {
      setFormError('Họ và tên không được để trống.');
      return;
    }

    if (!editingUser) {
      if (!formData.tenDangNhap.trim()) {
        setFormError('Tên đăng nhập không được để trống.');
        return;
      }
      if (!formData.matKhau.trim()) {
        setFormError('Mật khẩu không được để trống.');
        return;
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError('Định dạng email không hợp lệ.');
      return;
    }

    if (formData.soDienThoai && !/^\d{9,11}$/.test(formData.soDienThoai)) {
      setFormError('Số điện thoại phải từ 9 đến 11 chữ số.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        // Update user
        const updatePayload: any = {
          hoVaTen: formData.hoVaTen.trim(),
          email: formData.email.trim() || null,
          soDienThoai: formData.soDienThoai.trim() || null,
          phongBan: formData.phongBan
        };
        if (formData.matKhau.trim()) {
          updatePayload.matKhau = formData.matKhau.trim();
        }

        await api.put(`/nguoi-dung/${editingUser.maNguoiDung}`, updatePayload);

        // Update role if changed
        if ((editingUser.vaiTros && editingUser.vaiTros[0]?.maVaiTro) !== formData.maVaiTro) {
          await api.put(`/nguoi-dung/${editingUser.maNguoiDung}/vai-tro`, {
            maVaiTroList: [formData.maVaiTro]
          });
        }

        showBanner('success', 'Cập nhật thành công', `Đã lưu thông tin tài khoản ${editingUser.tenDangNhap}`);
      } else {
        // Create user
        await api.post('/nguoi-dung', {
          tenDangNhap: formData.tenDangNhap.trim(),
          matKhau: formData.matKhau.trim(),
          hoVaTen: formData.hoVaTen.trim(),
          email: formData.email.trim() || null,
          soDienThoai: formData.soDienThoai.trim() || null,
          phongBan: formData.phongBan,
          maVaiTro: formData.maVaiTro
        });
        showBanner('success', 'Thêm mới thành công', `Tài khoản ${formData.tenDangNhap} đã sẵn sàng.`);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data || 'Đã có lỗi xảy ra khi lưu người dùng.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: NguoiDung) => {
    try {
      await api.put(`/nguoi-dung/${user.maNguoiDung}/trang-thai`);
      showBanner(
        'success', 
        user.trangThai ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản', 
        `Tài khoản ${user.tenDangNhap} hiện ở trạng thái ${user.trangThai ? 'Bị khóa' : 'Hoạt động'}`
      );
      loadData();
    } catch (err: any) {
      showBanner('error', 'Thao tác không thành công', err.response?.data || err.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      await api.delete(`/nguoi-dung/${deleteConfirmUser.maNguoiDung}`);
      showBanner('success', 'Xóa tài khoản thành công', `Đã xóa tài khoản ${deleteConfirmUser.tenDangNhap}`);
      setDeleteConfirmUser(null);
      loadData();
    } catch (err: any) {
      showBanner('error', 'Không thể xóa tài khoản', err.response?.data || err.message);
      setDeleteConfirmUser(null);
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
          <h1 className="text-2xl font-bold text-slate-900">Quản lý tài khoản & Phân quyền</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý danh sách người dùng nội bộ, cấp quyền và trạng thái hoạt động.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg inline-flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm người dùng</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Tổng tài khoản</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-1">Toàn bộ nhân sự trong hệ thống</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-emerald-700">Đang hoạt động</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.active}</div>
          <div className="text-xs text-emerald-600 mt-1">Được phép đăng nhập & thao tác</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-rose-700">Đã khóa</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.locked}</div>
          <div className="text-xs text-rose-500 mt-1">Bị đình chỉ quyền truy cập</div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, username, email, SĐT, phòng ban..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">Tất cả vai trò</option>
              {roles.map(r => (
                <option key={r.maVaiTro} value={r.maVaiTro}>{r.tenVaiTro}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Đã khóa</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium text-xs border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tài khoản & Họ tên</th>
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4">Liên hệ</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Không tìm thấy người dùng phù hợp.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.maNguoiDung} className="hover:bg-slate-50/75 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{u.hoVaTen}</div>
                      <div className="text-xs text-slate-500 mt-0.5">@{u.tenDangNhap}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {u.phongBan || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs space-y-0.5">
                      {u.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />{u.email}</div>}
                      {u.soDienThoai && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{u.soDienThoai}</div>}
                      {!u.email && !u.soDienThoai && <span className="text-slate-400">-</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(u.vaiTros || []).map(r => (
                          <span 
                            key={r?.maVaiTro || Math.random()}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                          >
                            {r?.tenVaiTro || r?.maVaiTro || 'Chưa gán'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={u.trangThai ? 'HOAT_DONG' : 'KHOA'} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {/* Toggle lock */}
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.trangThai ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            u.trangThai 
                              ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' 
                              : 'text-amber-600 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.trangThai ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Chỉnh sửa"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteConfirmUser(u)}
                          title="Xóa tài khoản"
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

      {/* Modal: Thêm / Sửa người dùng */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-semibold text-slate-900">
                {editingUser ? `Chỉnh sửa tài khoản @${editingUser.tenDangNhap}` : 'Thêm mới tài khoản người dùng'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tên đăng nhập *
                  </label>
                  <input
                    type="text"
                    disabled={!!editingUser}
                    value={formData.tenDangNhap}
                    onChange={(e) => setFormData({ ...formData, tenDangNhap: e.target.value })}
                    placeholder="vd: nguyen.van.a"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {editingUser ? 'Mật khẩu mới (bỏ trống nếu giữ nguyên)' : 'Mật khẩu *'}
                  </label>
                  <input
                    type="password"
                    value={formData.matKhau}
                    onChange={(e) => setFormData({ ...formData, matKhau: e.target.value })}
                    placeholder={editingUser ? '••••••' : 'Nhập mật khẩu'}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={formData.hoVaTen}
                  onChange={(e) => setFormData({ ...formData, hoVaTen: e.target.value })}
                  placeholder="vd: Nguyễn Văn A"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@company.vn"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formData.soDienThoai}
                    onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                    placeholder="0912345678"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phòng ban
                  </label>
                  <select
                    value={formData.phongBan}
                    onChange={(e) => setFormData({ ...formData, phongBan: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Phòng IT">Phòng IT</option>
                    <option value="Phòng Mua Sắm">Phòng Mua Sắm</option>
                    <option value="Phòng Kỹ Thuật">Phòng Kỹ Thuật</option>
                    <option value="Phòng Kế Toán">Phòng Kế Toán</option>
                    <option value="Phòng Hành Chính">Phòng Hành Chính</option>
                    <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Vai trò hệ thống *
                  </label>
                  <select
                    value={formData.maVaiTro}
                    onChange={(e) => setFormData({ ...formData, maVaiTro: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {roles.map(r => (
                      <option key={r.maVaiTro} value={r.maVaiTro}>{r.tenVaiTro}</option>
                    ))}
                  </select>
                </div>
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
                  {submitting ? 'Đang lưu...' : (editingUser ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Xác nhận xóa tài khoản?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa tài khoản <strong>{deleteConfirmUser.hoVaTen}</strong> (@{deleteConfirmUser.tenDangNhap})?
                Hành động này không thể hoàn tác nếu tài khoản chưa gắn với dữ liệu mua sắm.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
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
