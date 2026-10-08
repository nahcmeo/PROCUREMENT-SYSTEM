# DESIGN SYSTEM & VOCABULARY (IMPECCABLE STANDARDS)

## 1. Visual Theme: Corporate Navy & Cyan (Linear-Enterprise)
- **Primary Surface / Canvas**: `#f8fafc` (Slate 50)
- **Card / Container Surface**: `#ffffff` (White with `#e2e8f0` Slate 200 border)
- **Primary Navy**: `#0f172a` (Slate 900)
- **Interactive Cyan Accent**: `#0284c7` (Sky 600) / `#0891b2` (Cyan 600)
- **Sidebar Surface**: `#090d16` (Deep Navy / Midnight) with `#1e293b` borders

## 2. Anti-AI-Slop Directives
- 🚫 **NO generic gradients**: Cấm sử dụng các dải gradient tím hồng (purple-to-blue) vô nghĩa.
- 🚫 **NO excessive radiuses**: Không dùng `rounded-2xl` hay `rounded-3xl`. Mọi thành phần tuân thủ `rounded-md` (6px) hoặc `rounded-lg` (8px).
- 🚫 **NO floating heavy shadows**: Không dùng `shadow-2xl`. Chỉ sử dụng hairline borders (`1px solid #e2e8f0`) kết hợp viền subtle shadow (`0 1px 2px 0 rgb(0 0 0 / 0.05)`).
- 🚫 **NO lazy nested cards**: Tránh đặt card bên trong card với nền xám bệt. Dùng đường kẻ phân chia (dividers) và table grids.

## 3. Typography & Numbers
- **Font Stack**: `system-ui, -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif`
- **Data & Numbers**: Mọi số tiền, mã đơn (PR-XXX, PO-XXX), ngày tháng và phần trăm BẮT BUỘC dùng font Monospace (`font-mono`) và `tabular-nums` để các chữ số thẳng hàng tuyệt đối.
- **Hierarchy**:
  - Page Title: 20px - 24px, Font Weight 600, Text `#0f172a`
  - Section Title: 14px - 16px, Font Weight 600, Text `#1e293b`
  - Body Text: 13px - 14px, Font Weight 400, Text `#334155`
  - Secondary / Helper: 12px, Text `#64748b`

## 4. Semantic Status Badges (High Contrast, Crisp)
- **Approved / Hoàn thành**: Background `#ecfdf5`, Border `#a7f3d0`, Text `#047857` (Emerald)
- **Pending / Chờ duyệt**: Background `#fffbeb`, Border `#fde68a`, Text `#b45309` (Amber)
- **Rejected / Lỗi**: Background `#fef2f2`, Border `#fecaca`, Text `#b91c1c` (Rose)
- **Draft / Nháp**: Background `#f1f5f9`, Border `#cbd5e1`, Text `#475569` (Slate)
- **Delivering / Đang giao**: Background `#f0fdf4`, Border `#bbf7d0`, Text `#15803d` (Green)

## 5. Information Density & Controls
- **Table Density**: Cỡ chữ `13px`, padding `10px 14px`, header nền `#f8fafc` có border dưới rõ ràng.
- **Buttons**:
  - Primary: Nền `#0f172a` (Deep Navy), hover `#1e293b`, chữ trắng, góc bo 6px.
  - Secondary / Outline: Nền trắng, viền `#cbd5e1`, chữ `#0f172a`, hover nền `#f8fafc`.
  - Danger: Nền `#ef4444`, hover `#dc2626`.
