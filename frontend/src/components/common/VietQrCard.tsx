'use client';

import React from 'react';

export interface VietQrCardProps {
  bankName: string;
  accountNumber: string;
  accountName: string;
  paymentPrefix?: string;
  orderCode?: string;
  amount?: number;
  className?: string;
  showDetails?: boolean;
}

export const getBankBin = (name: string) => {
  if (!name) return 'MB';
  if (name.includes('MB Bank') || name.includes('970422')) return 'MB';
  if (name.includes('Vietcombank') || name.includes('970436')) return 'VCB';
  if (name.includes('Techcombank') || name.includes('970407')) return 'TCB';
  if (name.includes('ACB') || name.includes('970416')) return 'ACB';
  if (name.includes('BIDV') || name.includes('970418')) return 'BIDV';
  if (name.includes('VietinBank') || name.includes('970415')) return 'ICB';
  if (name.includes('VPBank') || name.includes('970432')) return 'VPB';
  return 'MB';
};

export const VietQrCard: React.FC<VietQrCardProps> = ({
  bankName,
  accountNumber,
  accountName,
  paymentPrefix = 'D2DH',
  orderCode = '1001',
  amount = 0,
  className = '',
  showDetails = true,
}) => {
  if (!accountNumber) {
    return (
      <div className={`py-12 px-4 text-slate-400 text-center ${className}`}>
        <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
          🏦
        </div>
        <p className="text-xs font-medium">Nhập số tài khoản và chọn ngân hàng để hiển thị mã QR thanh toán</p>
      </div>
    );
  }

  const bankBin = getBankBin(bankName);
  const transferContent = `${paymentPrefix} ${orderCode}`.trim();
  const qrUrl = `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName || '')}`;

  return (
    <div className={`w-full max-w-[280px] bg-slate-50 p-3 rounded-lg border border-slate-200 ${className}`}>
      <div className="bg-white p-2 rounded border border-slate-100 shadow-xs flex items-center justify-center min-h-[220px]">
        <img
          src={qrUrl}
          alt="Mã QR Chuyển Khoản"
          className="w-full h-auto object-contain rounded"
        />
      </div>

      {showDetails && (
        <div className="mt-3 text-left space-y-1.5 bg-white p-3 rounded border border-slate-100 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-[11px]">Ngân hàng:</span>
            <span className="font-semibold text-slate-800 text-right truncate max-w-[140px] text-[11px]">
              {bankName || 'Chưa chọn'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-[11px]">Số tài khoản:</span>
            <span className="font-mono font-bold text-[#784e34]">{accountNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-[11px]">Chủ tài khoản:</span>
            <span className="font-bold text-slate-800 text-right uppercase text-[11px] truncate max-w-[140px]">
              {accountName || '---'}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-100 pt-1.5">
            <span className="text-slate-500 text-[11px]">Cú pháp mẫu:</span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
              {transferContent}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
