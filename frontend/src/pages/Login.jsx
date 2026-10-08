import React, { useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await authAPI.login(values);
      const { accessToken, user } = res.data;
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      message.success(`Đăng nhập thành công! Chào mừng ${user.fullName}`);
      navigate('/');
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Đăng nhập thất bại! Kiểm tra username/password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-slate-900 text-cyan-400 mb-3 border border-slate-800 shadow-sm">
            <ApartmentOutlined style={{ fontSize: 20 }} />
          </div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
            Procure<span className="text-cyan-600">Hub</span> Enterprise
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hệ thống Quản lý Mua sắm & Đánh giá Nhà cung cấp
          </p>
        </div>

        {/* Card xác thực */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <Form name="login" onFinish={onFinish} layout="vertical">
            <Form.Item
              name="username"
              label={<span className="text-xs font-medium text-slate-700">Tên đăng nhập</span>}
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
              className="mb-4"
            >
              <Input
                prefix={<UserOutlined className="text-slate-400 text-xs" />}
                placeholder="admin / requester1 / approver1..."
                className="text-xs"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="text-xs font-medium text-slate-700">Mật khẩu</span>}
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
              className="mb-5"
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400 text-xs" />}
                placeholder="Mật khẩu"
                className="text-xs"
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs h-9 border-0"
              >
                Đăng nhập vào hệ thống
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* Test Accounts Box - Bảng gọn gàng thay vì Alert lòe loẹt */}
        <div className="mt-4 p-3 bg-white border border-slate-200/90 rounded-md text-[11px] text-slate-600">
          <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5 flex justify-between items-center">
            <span>Tài khoản dùng thử</span>
            <span className="font-mono text-cyan-600 font-normal">MK: 123456</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
            <div className="px-2 py-1 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-400">admin:</span> <span className="text-slate-800 font-semibold">Admin</span>
            </div>
            <div className="px-2 py-1 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-400">approver1:</span> <span className="text-slate-800 font-semibold">Trưởng phòng</span>
            </div>
            <div className="px-2 py-1 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-400">purchaser1:</span> <span className="text-slate-800 font-semibold">Mua hàng</span>
            </div>
            <div className="px-2 py-1 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-400">requester1:</span> <span className="text-slate-800 font-semibold">Đề xuất</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
