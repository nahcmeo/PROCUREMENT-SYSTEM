import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { SourcifyLogo } from '../components/SourcifyLogo';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [tenDangNhap, setTenDangNhap] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenDangNhap || !matKhau) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(tenDangNhap, matKhau);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-canvas flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-default rounded-2xl shadow-sm border border-border-default overflow-hidden">
        
        {/* HEADER: LOGO TRÁI + TÊN THƯƠNG HIỆU PHẢI */}
        <div className="p-8 text-center border-b border-border-default bg-surface-default">
          <div className="flex justify-center mb-2">
            <SourcifyLogo size="lg" />
          </div>
          <p className="text-xs text-text-secondary mt-2 font-medium">
            Hệ Thống Quản Lý Mua Sắm Nội Bộ &amp; Đánh Giá Nhà Cung Cấp
          </p>
        </div>

        {/* FORM ĐĂNG NHẬP CHUẨN DESIGN SYSTEM */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-status-rejected-background border border-red-200 rounded-lg text-xs text-status-rejected-text flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={tenDangNhap}
                  onChange={(e) => setTenDangNhap(e.target.value)}
                  placeholder="Ví dụ: nv_an, tp_binh, gd_cuong, admin"
                  className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition text-slate-900 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={matKhau}
                  onChange={(e) => setMatKhau(e.target.value)}
                  placeholder="Mật khẩu mặc định: 123456"
                  className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition text-slate-900 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* NÚT ĐĂNG NHẬP */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 px-4 bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] text-white font-semibold text-sm rounded-lg shadow-xs transition disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              <span>{loading ? 'Đang xử lý...' : 'Đăng nhập'}</span>
            </button>
          </form>

        </div>

        {/* FOOTER */}
        <div className="py-3 px-6 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
          Sourcify - Hệ thống Quản lý Mua sắm Nội bộ © 2026
        </div>

      </div>
    </div>
  );
};
