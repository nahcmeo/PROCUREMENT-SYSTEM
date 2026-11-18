---
name: Hệ Thống Mua Sắm Nội Bộ
description: Hệ thống quản lý mua sắm nội bộ doanh nghiệp (Enterprise Procurement Management)
colors:
  primary: "#4F46E5"
  primary-hover: "#4338CA"
  background-canvas: "#F8FAFC"
  border-default: "#E2E8F0"
  surface-default: "#FFFFFF"
  surface-subtle: "#F1F5F9"
  navigation-selected-background: "#EEF2FF"
  text-primary: "#0F172A"
  text-secondary: "#475569"
  text-brand: "#4F46E5"
  status-approved-bg: "#F0FDF4"
  status-approved-text: "#15803D"
  status-pending-bg: "#FFFBEB"
  status-pending-text: "#B45309"
  status-processing-bg: "#EFF6FF"
  status-processing-text: "#1D4ED8"
  status-rejected-bg: "#FEF2F2"
  status-rejected-text: "#B91C1C"
typography:
  display:
    fontFamily: "'Be Vietnam Pro', Helvetica, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: "'Be Vietnam Pro', Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "8px 16px"
---

# Design System

## Overview
Hệ thống thiết kế theo phong cách Enterprise Operate: tinh gọn, rõ ràng, tối ưu cho việc quét nhanh và thao tác nghiệp vụ tần suất cao trong môi trường văn phòng doanh nghiệp.

## Colors
- **Action Primary**: `#4F46E5` (Indigo-600) dùng cho hành động chính, nút tạo mới, xác nhận. Hover: `#4338CA`.
- **Canvas Background**: `#F8FAFC` (Slate-50) tạo nền dịu mắt khi làm việc kéo dài.
- **Surface**: `#FFFFFF` cho card, panel, table; `#F1F5F9` cho sub-surface/header.
- **Text**: `#0F172A` (Slate-900) cho tiêu đề/nội dung chính (đạt chuẩn tương phản cao); `#475569` (Slate-600) cho chú thích; `#64748b` (Slate-500) cho placeholder.
- **Trạng thái**:
  - Đã duyệt / Thành công: Nền `#F0FDF4`, chữ `#15803D`.
  - Chờ duyệt / Cảnh báo: Nền `#FFFBEB`, chữ `#B45309`.
  - Từ chối / Hủy: Nền `#FEF2F2`, chữ `#B91C1C`.
  - Đang xử lý / RFQ: Nền `#EFF6FF`, chữ `#1D4ED8`.

## Typography
- **Bộ font chủ đạo**: `Be Vietnam Pro` (hỗ trợ tiếng Việt hoàn hảo với dấu thanh cân đối, hình khối hiện đại).
- **Số liệu tài chính**: Luôn áp dụng thuộc tính `tabular-nums` để các hàng cột căn gióng chuẩn xác.

## Layout
- Cấu trúc thanh điều hướng bên trái cố định (hỗ trợ thu gọn icon rail 64px và mở rộng 256px với phân nhóm nghiệp vụ rõ ràng).
- Khu vực nội dung chính có TopBar cố định và thanh breadcrumb ngữ cảnh.
- Khoảng cách lề và padding tuân theo hệ lưới 8pt (p-4, p-6, p-8, gap-4, gap-6).

## Elevation & Depth
- Thiết kế phẳng kết hợp bóng đổ nhẹ (shadow-xs, shadow-sm, shadow-md) giúp phân tách rõ ràng lớp thông tin nổi và nền.
- Border viền `#E2E8F0` mảnh 1px định hình rõ các khối ô nhập liệu và bảng dữ liệu.

## Shapes
- Bo góc nhất quán: `rounded-lg` (8px) cho input, button; `rounded-xl` (12px) cho card và modal; `rounded-full` cho badge trạng thái.

## Components
- **Bảng dữ liệu**: Header nền `#F1F5F9`, chữ xám `#475569`, border phân cách `#E2E8F0`, hàng hover `#F8FAFC`.
- **Hộp thoại xác nhận / Modal**: Căn giữa màn hình, backdrop blur nhẹ `#0F172A/40`.
- **Thanh tác vụ nổi (Floating Action Bar)**: Nền tối `#0F172A/95`, backdrop blur, bo tròn 16px, đổ bóng sâu 2xl.

## Do's and Don'ts
- **NÊN**:
  - Dùng `tabular-nums` cho mọi đơn giá, tổng tiền và số lượng.
  - Luôn có nhãn tiếng Việt rõ ràng, dễ hiểu.
  - Đảm bảo độ tương phản màu chữ $\ge 4.5:1$ theo chuẩn WCAG AA.
- **KHÔNG NÊN**:
  - Không dùng hiệu ứng chuyển động chậm chạp hoặc hiệu ứng AI không cần thiết.
  - Không hardcode kích thước cứng cố định cho badge trạng thái.
  - Không bỏ sót trạng thái rỗng (empty state) và chỉ báo đang tải.
