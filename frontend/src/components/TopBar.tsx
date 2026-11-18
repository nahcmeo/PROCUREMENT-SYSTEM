import React from 'react';
import { useAuth } from '../context/AuthContext';

interface TopBarProps {
  breadcrumbTitle?: string;
  breadcrumbSubtitle?: string;
  showBreadcrumb?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  breadcrumbTitle = 'Yêu cầu mua sắm',
  breadcrumbSubtitle,
  showBreadcrumb = false
}) => {
  const { currentUser } = useAuth();

  // Tạo chữ cái viết tắt (Initials) ví dụ: Phùng Bảo Trường -> BT, Nguyễn Văn An -> VA
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
    const firstChar = parts[parts.length - 2]?.[0] || '';
    const secondChar = parts[parts.length - 1]?.[0] || '';
    return (firstChar + secondChar).toUpperCase() || 'U';
  };

  const userCode = `NV00${currentUser?.maNguoiDung || 1}`;
  const roleName = currentUser?.vaiTros?.[0]?.tenVaiTro || 'Nhân viên';

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-8 flex items-center justify-between">
      
      {/* BREADCRUMB BÊN TRÁI: Bắt đầu từ Yêu cầu mua sắm (đã bỏ Quản lý mua sắm theo yêu cầu) */}
      {showBreadcrumb ? (
        <nav className="flex items-center gap-2 text-xs">
          <span className={breadcrumbSubtitle ? "text-slate-500 font-medium" : "text-slate-900 font-semibold"}>
            {breadcrumbTitle}
          </span>
          {breadcrumbSubtitle && (
            <>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-semibold">{breadcrumbSubtitle}</span>
            </>
          )}
        </nav>
      ) : (
        <div aria-hidden="true" />
      )}

      {/* THÔNG TIN USER BÊN PHẢI */}
      {currentUser && (
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-900 leading-tight">
              {currentUser.hoVaTen}
            </span>
            <span className="text-xs text-slate-500 mt-0.5">
              {userCode} ({roleName})
            </span>
          </div>

          <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-xs flex items-center justify-center border border-indigo-100 shrink-0">
            {getInitials(currentUser.hoVaTen)}
          </div>
        </div>
      )}

    </header>
  );
};
