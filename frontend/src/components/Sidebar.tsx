import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Building2,
  ShieldCheck,
  LogOut,
  Users,
  Sliders,
  Layers,
  FileSpreadsheet,
  ShoppingBag,
  Award,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { SourcifyLogo } from './SourcifyLogo';

interface NavItemConfig {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

interface NavSection {
  title: string;
  items: NavItemConfig[];
}

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed = false, 
  onToggleCollapse 
}) => {
  const { currentUser, logout } = useAuth();

  const navSections: NavSection[] = [
    {
      title: 'Tổng quan & Phê duyệt',
      items: [
        {
          to: '/yeu-cau-mua-sam',
          label: 'Yêu cầu mua sắm',
          icon: FileText,
          roles: ['NHAN_VIEN_YEU_CAU', 'TRUONG_PHONG', 'GIAM_DOC', 'NHAN_VIEN_MUA_HANG', 'ADMIN']
        },
        {
          to: '/phe-duyet',
          label: 'Phê duyệt yêu cầu',
          icon: ShieldCheck,
          roles: ['TRUONG_PHONG', 'GIAM_DOC', 'ADMIN']
        },
        {
          to: '/bao-cao',
          label: 'Báo cáo thống kê',
          icon: BarChart3,
          roles: ['NHAN_VIEN_MUA_HANG', 'TRUONG_PHONG', 'GIAM_DOC', 'ADMIN']
        }
      ]
    },
    {
      title: 'Mua sắm & Nhà cung cấp',
      items: [
        {
          to: '/nha-cung-cap',
          label: 'Hồ sơ nhà cung cấp',
          icon: Building2,
          roles: ['NHAN_VIEN_MUA_HANG', 'ADMIN']
        },
        {
          to: '/bao-gia',
          label: 'Quản lý báo giá & RFQ',
          icon: FileSpreadsheet,
          roles: ['NHAN_VIEN_MUA_HANG', 'ADMIN']
        },
        {
          to: '/so-sanh-bao-gia',
          label: 'So sánh & Chọn NCC',
          icon: FileSpreadsheet,
          roles: ['NHAN_VIEN_MUA_HANG', 'TRUONG_PHONG', 'GIAM_DOC', 'ADMIN']
        },
        {
          to: '/don-mua-hang',
          label: 'Đơn mua hàng PO',
          icon: ShoppingBag,
          roles: ['NHAN_VIEN_MUA_HANG', 'ADMIN']
        },
        {
          to: '/xep-hang-ncc',
          label: 'Xếp hạng nhà cung cấp',
          icon: Award,
          roles: ['NHAN_VIEN_MUA_HANG', 'TRUONG_PHONG', 'GIAM_DOC', 'NHAN_VIEN_YEU_CAU', 'ADMIN']
        }
      ]
    },
    {
      title: 'Hệ thống & Cấu hình',
      items: [
        {
          to: '/tai-khoan',
          label: 'Quản lý tài khoản',
          icon: Users,
          roles: ['ADMIN']
        },
        {
          to: '/han-muc',
          label: 'Cài đặt hạn mức',
          icon: Sliders,
          roles: ['ADMIN']
        },
        {
          to: '/danh-muc-san-pham',
          label: 'Danh mục & Sản phẩm',
          icon: Layers,
          roles: ['ADMIN', 'NHAN_VIEN_MUA_HANG']
        }
      ]
    }
  ];

  const userRoles = currentUser?.vaiTros?.map(v => v.maVaiTro) || [];
  const roleName = currentUser?.vaiTros?.[0]?.tenVaiTro || 'Nhân viên đề nghị';

  return (
    <aside 
      className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col justify-between z-30 select-none transition-all duration-200`}
    >
      {/* KHỐI TRÊN: LOGO & MENU */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* LOGO & COLLAPSE TOGGLE */}
        <div className={`h-16 ${collapsed ? 'px-3 justify-center' : 'px-5 justify-between'} flex items-center border-b border-slate-100 shrink-0`}>
          <NavLink to="/" className="focus:outline-none flex items-center">
            <SourcifyLogo size="md" showText={!collapsed} />
          </NavLink>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer ${collapsed ? 'hidden' : 'block'}`}
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* MENU ITEMS BY SECTION */}
        <nav className="px-3 pt-3 pb-4 space-y-4 overflow-y-auto flex-1">
          {navSections.map((sec, secIdx) => {
            const visibleItems = sec.items.filter(item => 
              item.roles.some(r => userRoles.includes(r))
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={sec.title} className="space-y-1">
                {/* SECTION HEADER */}
                {!collapsed ? (
                  <div className="px-3 pt-1 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {sec.title}
                  </div>
                ) : secIdx > 0 ? (
                  <div className="h-px bg-slate-100 my-2 mx-1" />
                ) : null}

                {/* ITEMS */}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `flex items-center ${collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2'} rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* KHỐI DƯỚI: THÔNG TIN VAI TRÒ & NÚT ĐĂNG XUẤT */}
      <div className="border-t border-slate-200 p-2.5 space-y-1 shrink-0 bg-white">
        {onToggleCollapse && collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Mở rộng menu"
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer mb-1"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="truncate font-medium">{roleName}</span>
          </div>
        ) : (
          <div className="flex justify-center p-2 text-slate-400" title={roleName}>
            <ShieldCheck className="w-4 h-4" />
          </div>
        )}

        <button
          type="button"
          onClick={logout}
          title={collapsed ? 'Đăng xuất' : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2 text-left'} text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};
