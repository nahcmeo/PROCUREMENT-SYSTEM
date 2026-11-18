import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { PurchaseRequestsPage } from './pages/PurchaseRequestsPage';
import { ApprovalRequestsPage } from './pages/ApprovalRequestsPage';
import { LoginPage } from './pages/LoginPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { ApprovalLimitsPage } from './pages/ApprovalLimitsPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { QuoteComparisonPage } from './pages/QuoteComparisonPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { SupplierRankingsPage } from './pages/SupplierRankingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { CategoriesProductsPage } from './pages/CategoriesProductsPage';
import { ErrorBoundary } from './components/ErrorBoundary';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [breadcrumbState, setBreadcrumbState] = React.useState<{ sub?: string; show: boolean }>({
    sub: undefined,
    show: false
  });
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleBreadcrumbChange = React.useCallback((sub?: string, show: boolean = false) => {
    setBreadcrumbState({ sub, show });
  }, []);

  // Xác định tiêu đề module theo đường dẫn
  const getPageTitle = (path: string) => {
    if (path.startsWith('/tai-khoan')) return 'Quản lý tài khoản & Phân quyền';
    if (path.startsWith('/han-muc')) return 'Cài đặt hạn mức phê duyệt';
    if (path.startsWith('/phe-duyet')) return 'Phê duyệt';
    if (path.startsWith('/yeu-cau-mua-sam')) return 'Yêu cầu mua sắm';
    if (path.startsWith('/nha-cung-cap')) return 'Hồ sơ nhà cung cấp';
    if (path.startsWith('/bao-gia')) return 'Quản lý báo giá & RFQ';
    if (path.startsWith('/so-sanh-bao-gia')) return 'So sánh & Lựa chọn NCC';
    if (path.startsWith('/don-mua-hang')) return 'Đơn mua hàng PO & Nghiệm thu';
    if (path.startsWith('/xep-hang-ncc')) return 'Bảng xếp hạng NCC';
    if (path.startsWith('/bao-cao')) return 'Báo cáo thống kê';
    if (path.startsWith('/danh-muc-san-pham') || path.startsWith('/danh-muc')) return 'Danh mục & Sản phẩm';
    return 'Yêu cầu mua sắm';
  };

  const currentTitle = getPageTitle(location.pathname);

  // Xác định đường dẫn mặc định khi đăng nhập theo vai trò
  const getDefaultRoute = () => {
    const roles = currentUser?.vaiTros?.map(v => v.maVaiTro) || [];
    if (roles.includes('ADMIN')) return '/tai-khoan';
    if (roles.includes('TRUONG_PHONG') || roles.includes('GIAM_DOC')) return '/phe-duyet';
    return '/yeu-cau-mua-sam';
  };

  // Nếu chưa đăng nhập, hiển thị màn hình Đăng nhập
  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans antialiased text-slate-800">
      {/* 1. SIDEBAR TRÁI TOÀN BỘ CHIỀU CAO */}
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
      
      {/* 2. KHỐI NỘI DUNG BÊN PHẢI (Offset bằng độ rộng Sidebar: pl-64 hoặc pl-16) */}
      <div className={`flex-1 flex flex-col min-w-0 ${sidebarCollapsed ? 'pl-16' : 'pl-64'} min-h-screen transition-[padding] duration-200`}>
        <TopBar 
          breadcrumbTitle={currentTitle}
          breadcrumbSubtitle={breadcrumbState.sub} 
          showBreadcrumb={breadcrumbState.show} 
        />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <ErrorBoundary>
            <Routes>
            <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
            
            {/* UC 3.3.5 & 3.3.6: Yêu cầu mua sắm */}
            <Route 
              path="/yeu-cau-mua-sam" 
              element={<PurchaseRequestsPage onBreadcrumbChange={handleBreadcrumbChange} />} 
            />

            {/* UC 3.3.7: Phê duyệt yêu cầu theo hạn mức */}
            <Route 
              path="/phe-duyet" 
              element={<ApprovalRequestsPage onBreadcrumbChange={handleBreadcrumbChange} />} 
            />

            {/* UC 3.3.2: Quản lý tài khoản & Phân quyền */}
            <Route 
              path="/tai-khoan" 
              element={<UsersManagementPage onBreadcrumbChange={handleBreadcrumbChange} />} 
            />

            {/* UC 3.3.3: Cài đặt hạn mức phê duyệt */}
            <Route 
              path="/han-muc" 
              element={<ApprovalLimitsPage onBreadcrumbChange={handleBreadcrumbChange} />} 
            />

            {/* UC 3.3.4: Quản lý hồ sơ nhà cung cấp */}
            <Route 
              path="/nha-cung-cap" 
              element={<SuppliersPage onBreadcrumbChange={handleBreadcrumbChange} />} 
            />
            <Route 
              path="/ho-so-nha-cung-cap" 
              element={<Navigate to="/nha-cung-cap" replace />} 
            />

            {/* UC 3.3.8 & 3.3.9: Quản lý báo giá & Lập RFQ */}
            <Route 
              path="/bao-gia" 
              element={<QuotationsPage onBreadcrumbChange={handleBreadcrumbChange} />} 
            />

            {/* UC 3.3.10 & 3.3.12: So sánh báo giá & Lựa chọn NCC */}
            <Route 
              path="/so-sanh-bao-gia" 
              element={<QuoteComparisonPage onBreadcrumbChange={handleBreadcrumbChange} />} 
            />

            {/* UC 3.3.13 & 3.3.14: Quản lý đơn mua hàng PO & Nghiệm thu */}
            <Route 
              path="/don-mua-hang" 
              element={<PurchaseOrdersPage onBreadcrumbChange={handleBreadcrumbChange} />} 
            />

            {/* UC 3.3.11: Xếp hạng & Đánh giá nhà cung cấp */}
            <Route 
              path="/xep-hang-ncc" 
              element={<SupplierRankingsPage onBreadcrumbChange={handleBreadcrumbChange} />} 
            />

            {/* UC 3.3.15: Báo cáo thống kê */}
            <Route 
              path="/bao-cao" 
              element={<ReportsPage onBreadcrumbChange={handleBreadcrumbChange} />} 
            />

            {/* Quản lý Danh mục & Sản phẩm */}
            <Route 
              path="/danh-muc-san-pham" 
              element={<CategoriesProductsPage onBreadcrumbChange={handleBreadcrumbChange} />} 
            />
            <Route 
              path="/danh-muc" 
              element={<Navigate to="/danh-muc-san-pham" replace />} 
            />

            <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
          </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
