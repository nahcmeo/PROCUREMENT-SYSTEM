import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PRManagement from './pages/PRManagement';
import RFQManagement from './pages/RFQManagement';
import POManagement from './pages/POManagement';
import VendorManagement from './pages/VendorManagement';
import UserAdmin from './pages/UserAdmin';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Impeccable Theme Tokens: Corporate Navy & Precision Enterprise
const themeConfig = {
  token: {
    colorPrimary: '#0f172a',
    colorInfo: '#0284c7',
    colorSuccess: '#059669',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorLink: '#0284c7',
    borderRadius: 6,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 13,
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 36,
      paddingContentHorizontal: 16,
      fontWeight: 500,
    },
    Table: {
      borderRadius: 6,
      headerBg: '#f8fafc',
      headerColor: '#475569',
      headerSplitColor: 'transparent',
      borderColor: '#e2e8f0',
      rowHoverBg: '#f1f5f9',
    },
    Card: {
      borderRadiusLG: 8,
      borderColor: '#e2e8f0',
    },
    Input: {
      borderRadius: 6,
      controlHeight: 36,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 36,
    },
  },
};

export default function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="pr" element={<PRManagement />} />
            <Route path="rfq" element={<RFQManagement />} />
            <Route path="po" element={<POManagement />} />
            <Route path="receipts" element={<POManagement />} />
            <Route path="vendors" element={<VendorManagement />} />
            <Route path="users" element={<UserAdmin />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
