# SOURCIFY · HỆ THỐNG THIẾT KẾ (DESIGN SYSTEM)
> **Phiên bản:** 1.0.0 · **Ngày cập nhật:** 07/11/2026  
> **Nguyên tắc cốt lõi:** Chính xác, nhất quán, dễ mở rộng, tập trung vào nghiệp vụ Mua sắm Nội bộ & Đánh giá Nhà cung cấp.

---

## 1. Nhận diện thương hiệu (Brand Identity)

- **Tên thương hiệu:** `Sourcify`
- **Định vị:** Giao diện quản lý mua sắm nội bộ chuẩn doanh nghiệp.
- **Cấu trúc Logo:**
  - **Bên trái:** Biểu tượng Logo thực tế của dự án (`logo.png` trong `frontend/src/assets/logo.png`).
  - **Bên phải:** Tên thương hiệu **Sourcify** (Font `Be Vietnam Pro`, weight SemiBold/Bold, chữ tối màu `text-slate-900`).
  - **Layout:** Căn giữa theo trục dọc (`items-center`), khoảng cách `gap-2.5` đến `gap-3`.

```tsx
// Cấu trúc logo chuẩn
<div className="flex items-center gap-2.5">
  <img src={logoImg} alt="Sourcify Logo" className="h-8 w-auto object-contain" />
  <span className="font-bold text-xl tracking-tight text-slate-900">Sourcify</span>
</div>
```

---

## 2. Hệ thống Typography (Kiểu chữ)

- **Font Family mặc định:** `"Be Vietnam Pro", Helvetica, sans-serif`
- **Đặc tả các cấp bậc Typography:**

| Tên Style | Kích thước (Font Size) | Chiều cao dòng (Line Height) | Độ đậm (Font Weight) | Khoảng cách chữ (Letter Spacing) | Ứng dụng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Heading XL** | `32px` (`2rem`) | `40px` | `600` (SemiBold) | `0px` | Tiêu đề trang chính, màn hình chào mừng |
| **Heading L** | `24px` (`1.5rem`) | `32px` | `600` (SemiBold) | `0px` | Tiêu đề phân hệ (Module), tiêu đề Modal lớn |
| **Heading M** | `20px` (`1.25rem`) | `28px` | `600` (SemiBold) | `0px` | Tiêu đề khối / Section Header / Card Header |
| **Heading S** | `16px` (`1rem`) | `24px` | `600` (SemiBold) | `0px` | Tiêu đề bảng, tiêu đề cảnh báo/dialog |
| **Body Medium** | `14px` (`0.875rem`) | `22px` | `500` (Medium) | `0px` | Nội dung form, nhãn quan trọng, menu active |
| **Body Regular** | `14px` (`0.875rem`) | `22px` | `400` (Regular) | `0px` | Nội dung văn bản thông thường, giá trị bảng |
| **Label Small** | `12px` (`0.75rem`) | `16px` | `500` (Medium) | `0px` | Nhãn cột bảng, badge trạng thái, timestamp |

---

## 3. Bảng màu (Color Palette)

### 3.1. Màu nguyên thủy (Primitives Tokens)

#### Indigo (Tone màu chủ đạo - Brand & Action)
- `indigo-50`: `rgba(238, 242, 255, 1)` (`#EEF2FF`) - Nền item menu được chọn, hover tinh tế
- `indigo-600`: `rgba(79, 70, 229, 1)` (`#4F46E5`) - Màu hành động chính (Primary Action), nút CTA
- `indigo-700`: `rgba(67, 56, 202, 1)` (`#4338CA`) - Màu hover của nút chính

#### Slate (Tone màu trung tính - Neutral / Surfaces / Text)
- `slate-50`: `rgba(248, 250, 252, 1)` (`#F8FAFC`) - Nền canvas toàn trang (`background-canvas`)
- `slate-100`: `rgba(241, 245, 249, 1)` (`#F1F5F9`) - Nền phụ (`surface-subtle`), viền bảng phụ
- `slate-200`: `rgba(226, 232, 240, 1)` (`#E2E8F0`) - Đường kẻ viền mặc định (`border-default`)
- `slate-400`: `rgba(148, 163, 184, 1)` (`#94A3B8`) - Icon mờ, placeholder input
- `slate-600`: `rgba(71, 85, 105, 1)` (`#475569`) - Chữ thứ cấp (`text-secondary`), mô tả
- `slate-900`: `rgba(15, 23, 42, 1)` (`#0F172A`) - Chữ chính (`text-primary`), tiêu đề đậm

#### Status Primitives (Màu trạng thái nghiệp vụ)
- **Xanh lá (Thành công / Phê duyệt):** `green-50` (`#F0FDF4`) / `green-700` (`#15803D`)
- **Vàng hổ phách (Chờ xử lý / Chờ duyệt):** `amber-50` (`#FFFBEB`) / `amber-700` (`#B45309`)
- **Xanh dương (Đang mua / RFQ):** `blue-50` (`#EFF6FF`) / `blue-700` (`#1D4ED8`)
- **Đỏ (Từ chối / Nguy hiểm):** `red-50` (`#FEF2F2`) / `red-700` (`#B91C1C`)

---

### 3.2. Màu ngữ nghĩa (Semantic Tokens)

Áp dụng trong code qua biến CSS và class Tailwind:

```css
:root {
  --procurement-semantic-action-primary: #4F46E5;
  --procurement-semantic-action-primary-hover: #4338CA;
  --procurement-semantic-background-canvas: #F8FAFC;
  --procurement-semantic-border-default: #E2E8F0;
  --procurement-semantic-surface-default: #FFFFFF;
  --procurement-semantic-surface-subtle: #F1F5F9;
  --procurement-semantic-navigation-selected-background: #EEF2FF;
  --procurement-semantic-focus-ring: #4F46E5;
  
  --procurement-semantic-text-brand: #4F46E5;
  --procurement-semantic-text-primary: #0F172A;
  --procurement-semantic-text-secondary: #475569;

  --procurement-semantic-status-approved-background: #F0FDF4;
  --procurement-semantic-status-approved-text: #15803D;
  --procurement-semantic-status-pending-background: #FFFBEB;
  --procurement-semantic-status-pending-text: #B45309;
  --procurement-semantic-status-processing-background: #EFF6FF;
  --procurement-semantic-status-processing-text: #1D4ED8;
  --procurement-semantic-status-rejected-background: #FEF2F2;
  --procurement-semantic-status-rejected-text: #B91C1C;
}
```

---

## 4. Đặc tả Trạng thái & Thanh tiến trình 5 chấm (Progress Dots)

Chuỗi tiến trình chuẩn trong quy trình Mua sắm:
`Gửi → Chờ duyệt → Phê duyệt → Đang mua → Hoàn tất`

Quy cách thẻ trạng thái (Pill Badge) + Mini Progress Bar (`36px × 4px`, 5 chấm đường kính `4px`, khoảng cách `4px`, bo viền `2px`):

| Trạng thái (Status) | Mã hiển thị | Màu nền / Màu chữ | Tiến độ chấm (5 dots) | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- |
| **Nháp** | `Draft` | Nền `#F1F5F9`, Chữ `#475569` | `0/5` chấm màu | Đang soạn thảo, chưa gửi duyệt |
| **Chờ duyệt** | `CHO_DUYET` | Nền `#FFFBEB`, Chữ `#B45309` | `2/5` chấm `#4F46E5` | Chờ Trưởng phòng / Giám đốc ký |
| **Đã phê duyệt** | `DA_DUYET` | Nền `#F0FDF4`, Chữ `#15803D` | `3/5` chấm `#4F46E5` | Đã ký duyệt, chuyển sang mua sắm |
| **Đang mua (RFQ)** | `CHO_BAO_GIA` | Nền `#EFF6FF`, Chữ `#1D4ED8` | `4/5` chấm `#4F46E5` | Mua hàng đang phát RFQ & lấy báo giá |
| **Từ chối** | `TU_CHOI` | Nền `#FEF2F2`, Chữ `#B91C1C` | `2` chấm `#4F46E5`, chấm 3 màu đỏ `#B91C1C` | Người duyệt từ chối kèm lý do |
| **Hoàn tất** | `DA_HOAN_THANH`| Nền `#F0FDF4`, Chữ `#15803D` | `5/5` chấm `#4F46E5` | Đã nhận hàng và đối soát nghiệm thu |

---

## 5. Quy chuẩn hình học & Linh kiện (Component Specifications)

### 5.1. Nút bấm (Button)
- Chiều cao chuẩn: `40px` (`h-10`).
- Bo góc: `8px` (`rounded-lg`).
- Padding ngang: `16px` (`px-4`).
- Font: `14px`, weight `600` (SemiBold).
- Focus ring: `shadow-[0px_0px_0px_3px_rgba(224,231,255,1.00)]` (vòng xanh nhạt 3px).
- Nút phụ (Secondary): Nền trắng, viền `#E2E8F0`, chữ `#0F172A`, hover `#F1F5F9`.
- Nút nguy hiểm (Danger): Nền `#B91C1C` (`red-700`), hover `#991B1B`.

### 5.2. Trường nhập liệu (Input & Select)
- Chiều cao: `40px` (`h-10`).
- Bo góc: `8px` (`rounded-lg`).
- Nền: `surface-default` (`#FFFFFF`).
- Viền: `1px solid #E2E8F0`. Khi focus chuyển sang viền `#4F46E5` kèm vòng focus 3px.

### 5.3. Bảng dữ liệu (Data Table)
- Chiều cao hàng dữ liệu: Tối thiểu `80px` (`min-h-20` / `h-20`), padding `px-6`.
- Đường kẻ phân cách: `1px solid #E2E8F0`.
- **Quy tắc căn lề số liệu bắt buộc:** 
  - Tên/mô tả phiếu: Căn trái (`text-left`).
  - Số lượng, đơn giá, tổng tiền dự kiến: **Bắt buộc căn phải (`text-right`)**, font đậm rõ ràng.
  - Trạng thái & hành động: Căn giữa (`text-center`).

### 5.4. Hộp thoại xác nhận nguy hiểm (Danger Confirmation Dialog)
- Sử dụng khi thao tác xóa hoặc hủy phiếu yêu cầu mua sắm.
- Cấu trúc:
  - Tiêu đề: `16px` font-semibold text đỏ/tối.
  - Nội dung giải thích hành động không thể hoàn tác.
  - Cặp nút hành động: Nút outline *"Không đồng ý"* (bên trái) và nút đỏ *"Đồng ý xóa"* (bên phải).

---

## 6. Danh mục Bo góc (Border Radii Tokens)

- `rounded-xs`: `4px` (Thẻ nhỏ, badge mini)
- `rounded-sm`: `6px` (Tag con)
- `rounded-lg`: `8px` (Chuẩn cho Button, Input, Card con)
- `rounded-xl`: `12px` (Card tổng quan, Khối danh mục)
- `rounded-2xl`: `16px` (Modal, Hộp thoại chính)
- `rounded-full`: `9999px` (Badge trạng thái hình viên thuốc / Pill)
