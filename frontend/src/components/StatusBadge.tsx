import React from 'react';

interface StatusBadgeProps {
  status: string;
  amount?: number;
  labelOverride?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, amount, labelOverride, className = '' }) => {
  let bg = 'bg-[#FFFBEB]';
  let text = 'text-[#B45309]';
  let border = 'border-[#FDE68A]';
  let dot = 'bg-[#F59E0B]';
  let label = labelOverride || status;

  switch (status) {
    case 'CHO_DUYET':
      bg = 'bg-[#FFFBEB]';
      text = 'text-[#B45309]';
      border = 'border-[#FDE68A]';
      dot = 'bg-[#F59E0B]';
      label = labelOverride || 'Chờ duyệt';
      break;

    case 'CHO_DUYET_CAP_2':
      bg = 'bg-[#ECFDF5]';
      text = 'text-[#065F46]';
      border = 'border-[#A7F3D0]';
      dot = 'bg-[#10B981]';
      label = labelOverride || 'NPD1 đã duyệt';
      break;

    case 'DA_DUYET':
      bg = 'bg-[#ECFDF5]';
      text = 'text-[#065F46]';
      border = 'border-[#A7F3D0]';
      dot = 'bg-[#10B981]';
      const isLevel2 = (amount || 0) >= 50000000;
      label = labelOverride || (isLevel2 ? 'NPD2 đã duyệt' : 'NPD1 đã duyệt');
      break;

    case 'CHO_BAO_GIA':
    case 'DANG_MUA':
      bg = 'bg-[#EFF6FF]';
      text = 'text-[#1D4ED8]';
      border = 'border-[#BFDBFE]';
      dot = 'bg-[#3B82F6]';
      label = labelOverride || 'Đang mua';
      break;

    case 'DA_CHON_NCC':
      bg = 'bg-[#EFF6FF]';
      text = 'text-[#1D4ED8]';
      border = 'border-[#BFDBFE]';
      dot = 'bg-[#3B82F6]';
      label = labelOverride || 'Đã chọn NCC';
      break;

    case 'DA_HOAN_THANH':
    case 'DA_NHAN_DU':
      bg = 'bg-[#ECFDF5]';
      text = 'text-[#065F46]';
      border = 'border-[#A7F3D0]';
      dot = 'bg-[#10B981]';
      label = labelOverride || (status === 'DA_NHAN_DU' ? 'Đã nhận đủ' : 'Đã hoàn thành');
      break;

    case 'TU_CHOI':
    case 'DA_HUY':
      bg = 'bg-[#FEF2F2]';
      text = 'text-[#991B1B]';
      border = 'border-[#FECACA]';
      dot = 'bg-[#EF4444]';
      label = labelOverride || (status === 'DA_HUY' ? 'Đã hủy' : 'Từ chối duyệt');
      break;

    // PO Statuses
    case 'MOI_TAO':
      bg = 'bg-[#F8FAFC]';
      text = 'text-[#475569]';
      border = 'border-[#CBD5E1]';
      dot = 'bg-[#94A3B8]';
      label = labelOverride || 'Mới tạo';
      break;

    case 'DA_GUI_NCC':
      bg = 'bg-[#EFF6FF]';
      text = 'text-[#1D4ED8]';
      border = 'border-[#BFDBFE]';
      dot = 'bg-[#3B82F6]';
      label = labelOverride || 'Đã gửi NCC';
      break;

    case 'DANG_GIAO_HANG':
      bg = 'bg-[#FFFBEB]';
      text = 'text-[#B45309]';
      border = 'border-[#FDE68A]';
      dot = 'bg-[#F59E0B]';
      label = labelOverride || 'Đang giao hàng';
      break;

    // Active / Locked
    case 'HOAT_DONG':
    case 'ACTIVE':
    case 'true':
      bg = 'bg-[#ECFDF5]';
      text = 'text-[#065F46]';
      border = 'border-[#A7F3D0]';
      dot = 'bg-[#10B981]';
      label = labelOverride || 'Đang hoạt động';
      break;

    case 'KHOA':
    case 'INACTIVE':
    case 'false':
      bg = 'bg-[#FEF2F2]';
      text = 'text-[#991B1B]';
      border = 'border-[#FECACA]';
      dot = 'bg-[#EF4444]';
      label = labelOverride || 'Đã khóa';
      break;

    default:
      bg = 'bg-slate-50';
      text = 'text-slate-700';
      border = 'border-slate-200';
      dot = 'bg-slate-400';
      label = labelOverride || status;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${bg} ${text} border ${border} text-xs font-medium whitespace-nowrap shadow-2xs select-none ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0 mr-1.5`} />
      <span className="truncate">{label}</span>
    </span>
  );
};
