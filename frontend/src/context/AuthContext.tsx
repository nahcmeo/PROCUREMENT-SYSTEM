import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NguoiDung } from '../types';
import api from '../services/api';

interface AuthContextType {
  currentUser: NguoiDung | null;
  users: NguoiDung[];
  login: (tenDangNhap: string, matKhau: string) => Promise<void>;
  quickLogin: (tenDangNhap: string) => Promise<void>;
  logout: () => void;
}

const defaultSeedUsers: NguoiDung[] = [
  {
    maNguoiDung: 2,
    tenDangNhap: 'nv_an',
    hoVaTen: 'Nguyễn Văn An',
    email: 'an.nv@company.com',
    phongBan: 'Phòng Marketing',
    trangThai: true,
    vaiTros: [{ maVaiTro: 'NHAN_VIEN_YEU_CAU', tenVaiTro: 'Nhân viên yêu cầu' }]
  },
  {
    maNguoiDung: 3,
    tenDangNhap: 'tp_binh',
    hoVaTen: 'Trần Thị Bình',
    email: 'binh.tt@company.com',
    phongBan: 'Phòng Marketing',
    trangThai: true,
    vaiTros: [{ maVaiTro: 'TRUONG_PHONG', tenVaiTro: 'Trưởng phòng (Người duyệt < 50tr)' }]
  },
  {
    maNguoiDung: 4,
    tenDangNhap: 'gd_cuong',
    hoVaTen: 'Lê Hoàng Cường',
    email: 'cuong.lh@company.com',
    phongBan: 'Ban Giám Đốc',
    trangThai: true,
    vaiTros: [{ maVaiTro: 'GIAM_DOC', tenVaiTro: 'Giám đốc (Người duyệt ≥ 50tr)' }]
  },
  {
    maNguoiDung: 5,
    tenDangNhap: 'mh_dung',
    hoVaTen: 'Phạm Quốc Dũng',
    email: 'dung.pq@company.com',
    phongBan: 'Phòng Mua Sắm',
    trangThai: true,
    vaiTros: [{ maVaiTro: 'NHAN_VIEN_MUA_HANG', tenVaiTro: 'Nhân viên Mua hàng' }]
  },
  {
    maNguoiDung: 1,
    tenDangNhap: 'admin',
    hoVaTen: 'Quản Trị Viên Hệ Thống',
    email: 'admin@company.com',
    phongBan: 'Phòng CNTT',
    trangThai: true,
    vaiTros: [{ maVaiTro: 'ADMIN', tenVaiTro: 'Quản trị viên' }]
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<NguoiDung[]>(defaultSeedUsers);
  const [currentUser, setCurrentUser] = useState<NguoiDung | null>(() => {
    const saved = localStorage.getItem('procurehub_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    // Tải danh sách user từ backend nếu có
    api.get<NguoiDung[]>('/auth/users')
      .then(res => {
        if (res.data && res.data.length > 0) {
          setUsers(res.data);
        }
      })
      .catch(() => {
        console.log('Sử dụng danh sách user mặc định');
      });
  }, []);

  const login = async (tenDangNhap: string, matKhau: string): Promise<void> => {
    try {
      const res = await api.post<NguoiDung>('/auth/login', { tenDangNhap, matKhau });
      setCurrentUser(res.data);
      localStorage.setItem('procurehub_user', JSON.stringify(res.data));
    } catch (err: any) {
      // Fallback nếu backend offline
      const localFound = users.find(u => u.tenDangNhap === tenDangNhap);
      if (localFound && matKhau === '123456') {
        setCurrentUser(localFound);
        localStorage.setItem('procurehub_user', JSON.stringify(localFound));
        return;
      }
      const message = err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không chính xác';
      throw new Error(message);
    }
  };

  const quickLogin = async (tenDangNhap: string): Promise<void> => {
    await login(tenDangNhap, '123456');
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('procurehub_user');
  };

  return (
    <AuthContext.Provider value={{ currentUser, users, login, quickLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
