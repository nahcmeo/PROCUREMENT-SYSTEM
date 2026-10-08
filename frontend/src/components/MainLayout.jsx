import React from 'react';
import { Layout, Menu, Button, Tag, Avatar, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  FileProtectOutlined,
  SolutionOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const userJson = localStorage.getItem('user');
  const currentUser = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Quản trị viên
          </span>
        );
      case 'APPROVER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Người phê duyệt
          </span>
        );
      case 'PURCHASER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
            NV Mua hàng
          </span>
        );
      case 'REQUESTER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            NV Đề xuất
          </span>
        );
      default:
        return <Tag>{role}</Tag>;
    }
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Tổng quan (Dashboard)' },
    { key: '/pr', icon: <FileProtectOutlined />, label: 'Yêu cầu Mua sắm (PR)' },
    { key: '/rfq', icon: <SolutionOutlined />, label: 'Báo giá sản phẩm (RFQ)' },
    { key: '/po', icon: <ShoppingOutlined />, label: 'Quản lý Đơn hàng (PO)' },
    { key: '/receipts', icon: <CheckCircleOutlined />, label: 'Nghiệm thu & Nhận hàng' },
    { key: '/vendors', icon: <TeamOutlined />, label: 'Hồ sơ Nhà cung cấp' },
    ...(currentUser?.role === 'ADMIN' ? [
      { key: '/users', icon: <UserOutlined />, label: 'Quản lý Người dùng' },
      { key: '/settings', icon: <SettingOutlined />, label: 'Cài đặt Hạn mức' }
    ] : [])
  ];

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sider với tông Midnight Navy #090d16 chuẩn Linear/Enterprise */}
      <Sider
        width={240}
        style={{
          backgroundColor: '#090d16',
          borderRight: '1px solid #1e293b',
        }}
      >
        <div className="h-14 flex items-center px-5 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
              <ApartmentOutlined className="text-sm" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wider text-slate-100 uppercase">
                Procure<span className="text-cyan-400">Hub</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight leading-none">
                Enterprise v1.0
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 py-3">
          <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Hệ thống mua sắm
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{
              backgroundColor: 'transparent',
              borderRight: 'none',
              fontSize: '13px',
              fontWeight: 450,
            }}
          />
        </div>
      </Sider>

      <Layout style={{ backgroundColor: '#f8fafc' }}>
        {/* Header với viền tóc hairline border #e2e8f0 */}
        <Header
          style={{
            height: 56,
            lineHeight: '56px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400">DACN</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-medium text-slate-700">Hệ thống Mua sắm & Đánh giá Nhà cung cấp</span>
          </div>

          <Space size="middle">
            {currentUser && (
              <div className="flex items-center space-x-3 pr-3 border-r border-slate-200">
                <Avatar
                  size="small"
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#38bdf8',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
                </Avatar>
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-xs font-medium text-slate-800">{currentUser.fullName}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{currentUser.departmentName || 'Hệ thống'}</span>
                </div>
                {getRoleBadge(currentUser.role)}
              </div>
            )}
            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              type="text"
              size="small"
              className="text-slate-500 hover:text-rose-600 text-xs font-medium"
            >
              Đăng xuất
            </Button>
          </Space>
        </Header>

        {/* Nội dung chính */}
        <Content style={{ padding: '24px 28px', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
