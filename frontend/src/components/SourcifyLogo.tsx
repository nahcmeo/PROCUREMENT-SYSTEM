import React from 'react';
import logoImg from '../assets/logo.png';

interface SourcifyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const SourcifyLogo: React.FC<SourcifyLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const imgHeight = size === 'sm' ? 'h-7' : size === 'lg' ? 'h-10' : 'h-8';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* BÊN TRÁI: LOGO BẠN DÁN VÀO */}
      <img
        src={logoImg}
        alt="Sourcify Logo"
        className={`${imgHeight} w-auto object-contain shrink-0`}
      />

      {/* BÊN PHẢI: TÊN THƯƠNG HIỆU BASIC */}
      {showText && (
        <span className={`font-bold tracking-tight text-slate-900 font-sans ${textSize}`}>
          Sourcify
        </span>
      )}
    </div>
  );
};
