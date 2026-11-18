export interface VaiTro {
  maVaiTro: string;
  tenVaiTro: string;
  moTa?: string;
}

export interface NguoiDung {
  maNguoiDung: number;
  tenDangNhap: string;
  matKhau?: string;
  hoVaTen: string;
  email: string;
  soDienThoai?: string;
  phongBan: string;
  trangThai: boolean;
  vaiTros: VaiTro[];
}

export interface HanMucPheDuyet {
  maHanMuc: number;
  soTienToiThieu: number;
  soTienToiDa: number;
  vaiTro: VaiTro;
}

export interface DanhMucHang {
  maDanhMuc: number;
  tenDanhMuc: string;
  moTa?: string;
}

export interface SanPham {
  maSanPham: number;
  tenSanPham: string;
  donViTinh: string;
  danhMuc: DanhMucHang;
}

export interface NhaCungCap {
  maNhaCungCap: number;
  tenNhaCungCap: string;
  maSoThue: string;
  soDienThoai: string;
  email: string;
  diaChi: string;
}

export interface DanhGiaNhaCungCap {
  maDanhGia: number;
  diemChatLuong: number;
  diemGiaCa: number;
  diemTienDo: number;
  tongDiem: number;
  ngayDanhGia: string;
  nhaCungCap: NhaCungCap;
}

export interface ChiTietYeuCau {
  maChiTietYeuCau?: number;
  sanPham: SanPham;
  soLuong: number;
  donGiaDuKien: number;
}

export interface YeuCauMuaSam {
  maYeuCau?: number;
  tieuDe?: string;
  nguoiYeuCau: NguoiDung;
  tongTienDuKien: number;
  trangThai: 'CHO_DUYET' | 'CHO_DUYET_CAP_2' | 'DA_DUYET' | 'TU_CHOI' | 'CHO_BAO_GIA' | 'DA_CHON_NCC' | 'DA_HOAN_THANH';
  ngayTao: string;
  chiTietList?: ChiTietYeuCau[];
}

export interface NhatKyPheDuyet {
  maNhatKy: number;
  yeuCauMuaSam: YeuCauMuaSam;
  nguoiPheDuyet: NguoiDung;
  yKienPheDuyet: string;
  quyetDinh: 'PHE_DUYET' | 'TU_CHOI';
  ngayDuyet: string;
}

export interface ChiTietBaoGia {
  maChiTietBaoGia?: number;
  sanPham: SanPham;
  soLuong: number;
  donGiaChao: number;
  thanhTien: number;
}

export interface BaoGia {
  maBaoGia?: number;
  nhaCungCap: NhaCungCap;
  nguoiNhap: NguoiDung;
  yeuCauMuaSam: YeuCauMuaSam;
  ngayBaoGia: string;
  tongTienBaoGia: number;
  duocLuaChon: boolean;
  chiTietList?: ChiTietBaoGia[];
}

export interface ChiTietDonMuaHang {
  maChiTietDonHang?: number;
  sanPham: SanPham;
  soLuongMua: number;
  soLuongThucNhan: number;
  donGiaChot: number;
  thanhTien: number;
}

export interface DonMuaHang {
  maDonHang?: number;
  soDonHang: string;
  ngayDatHang: string;
  tongTien: number;
  trangThai: 'MOI_TAO' | 'DA_GUI_NCC' | 'DANG_GIAO_HANG' | 'DA_NHAN_DU' | 'DA_HUY';
  nhaCungCap: NhaCungCap;
  nguoiLapDon: NguoiDung;
  yeuCauMuaSam?: YeuCauMuaSam;
  baoGia?: BaoGia;
  chiTietList?: ChiTietDonMuaHang[];
}

export interface XepHangNhaCungCap {
  nhaCungCap: NhaCungCap;
  diemChatLuongTB: number;
  diemGiaCaTB: number;
  diemTienDoTB: number;
  diemTongTB: number;
  soLanDanhGia: number;
  thuHang?: number;
}

export interface ThongKeBaoCao {
  tongChiTieu: number;
  tongTietKiem: number;
  tongDonHang: number;
  tiLeHoanThanh: number;
  donHangTheoTrangThai: Record<string, number>;
  chiTieuTheoPhongBan: Record<string, number>;
}
