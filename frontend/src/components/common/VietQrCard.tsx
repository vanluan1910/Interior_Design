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
  size?: 'small' | 'default' | 'large';
  template?: 'compact' | 'compact2' | 'qr_only';
}

export const getBankBin = (name: string) => {
  if (!name) return 'MB';
  const n = name.toUpperCase();
  if (n.includes('MBBANK') || n.includes('MB BANK') || n.includes('QUÂN ĐỘI') || n.includes('970422')) return 'MB';
  if (n.includes('VIETCOMBANK') || n.includes('VCB') || n.includes('NGOẠI THƯƠNG') || n.includes('970436')) return 'VCB';
  if (n.includes('TECHCOMBANK') || n.includes('TCB') || n.includes('KỸ THƯƠNG') || n.includes('970407')) return 'TCB';
  if (n.includes('VIETINBANK') || n.includes('CTG') || n.includes('CÔNG THƯƠNG') || n.includes('970415')) return 'ICB';
  if (n.includes('BIDV') || n.includes('ĐẦU TƯ') || n.includes('970418')) return 'BIDV';
  if (n.includes('ACB') || n.includes('Á CHÂU') || n.includes('970416')) return 'ACB';
  if (n.includes('VPBANK') || n.includes('VPB') || n.includes('THỊNH VƯỢNG') || n.includes('970432')) return 'VPB';
  if (n.includes('TPBANK') || n.includes('TPB') || n.includes('TIÊN PHONG') || n.includes('970423')) return 'TPB';
  if (n.includes('AGRIBANK') || n.includes('VBA') || n.includes('NÔNG NGHIỆP') || n.includes('970405')) return 'VBA';
  if (n.includes('HDBANK') || n.includes('HDB') || n.includes('PHÁT TRIỂN') || n.includes('970437')) return 'HDB';
  if (n.includes('SACOMBANK') || n.includes('STB') || n.includes('SÀI GÒN THƯƠNG TÍN') || n.includes('970403')) return 'STB';
  if (n.includes('VIB') || n.includes('QUỐC TẾ') || n.includes('970441')) return 'VIB';
  if (n.includes('SHB') || n.includes('SÀI GÒN - HÀ NỘI') || n.includes('970443')) return 'SHB';
  if (n.includes('MSB') || n.includes('HÀNG HẢI') || n.includes('970426')) return 'MSB';
  if (n.includes('OCB') || n.includes('PHƯƠNG ĐÔNG') || n.includes('970448')) return 'OCB';
  if (n.includes('SEABANK') || n.includes('ĐÔNG NAM Á') || n.includes('970440')) return 'SEAB';
  if (n.includes('LPBANK') || n.includes('LIENVIETPOSTBANK') || n.includes('BƯU ĐIỆN') || n.includes('970449')) return 'LPB';
  if (n.includes('EXIMBANK') || n.includes('EIB') || n.includes('XUẤT NHẬP KHẨU') || n.includes('970431')) return 'EIB';
  if (n.includes('BACABANK') || n.includes('BẮC Á') || n.includes('970409')) return 'BAB';
  if (n.includes('PVCOMBANK') || n.includes('ĐẠI CHÚNG') || n.includes('970412')) return 'PVCB';
  if (n.includes('NAMABANK') || n.includes('NAM Á') || n.includes('970428')) return 'NAB';
  return 'MB';
};

export const VietQrCard: React.FC<VietQrCardProps> = ({
  bankName,
  accountNumber,
  accountName,
  paymentPrefix = '',
  orderCode = '1001',
  amount = 0,
  className = '',
  showDetails = true,
  size = 'default',
  template,
}) => {
  const [debouncedParams, setDebouncedParams] = React.useState({
    bankName,
    accountNumber,
    accountName,
    paymentPrefix,
    orderCode,
    amount,
    template,
  });

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedParams({
        bankName,
        accountNumber,
        accountName,
        paymentPrefix,
        orderCode,
        amount,
        template,
      });
    }, 400);
    return () => clearTimeout(handler);
  }, [bankName, accountNumber, accountName, paymentPrefix, orderCode, amount, template]);

  if (!debouncedParams.accountNumber || !debouncedParams.accountNumber.trim()) {
    return (
      <div className={`py-6 px-4 text-slate-400 text-center bg-slate-50 border border-slate-200 rounded w-full max-w-[260px] ${className}`}>
        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center text-base">
          🏦
        </div>
        <p className="text-xs font-semibold text-slate-600 m-0">Xem trước mã VietQR</p>
        <p className="text-[11px] text-slate-400 m-0 mt-1">Vui lòng nhập số tài khoản &amp; tên chủ TK</p>
      </div>
    );
  }

  const bankBin = getBankBin(debouncedParams.bankName);
  const transferContent = `${debouncedParams.paymentPrefix} ${debouncedParams.orderCode}`.trim();
  const tmpl = debouncedParams.template || (size === 'small' ? 'compact' : 'compact2');
  const qrUrl = `https://img.vietqr.io/image/${bankBin}-${debouncedParams.accountNumber.trim()}-${tmpl}.png?amount=${debouncedParams.amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent((debouncedParams.accountName || '').trim())}`;

  const isSmall = size === 'small';

  return (
    <div className={`w-full ${isSmall ? 'max-w-[125px] p-1' : 'max-w-[260px] p-2.5'} bg-slate-50 rounded border border-slate-200 ${className}`}>
      <div className={`bg-white p-1 rounded border border-slate-100 shadow-xs flex items-center justify-center ${isSmall || !showDetails ? 'min-h-0' : 'min-h-[160px]'}`}>
        <img
          src={qrUrl}
          alt="Mã QR Chuyển Khoản"
          className="w-full h-auto object-contain rounded"
          loading="lazy"
        />
      </div>

      {showDetails && (
        <div className="mt-2 text-left space-y-1 bg-white p-2 rounded border border-slate-100 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-[10px]">Ngân hàng:</span>
            <span className="font-semibold text-slate-800 text-right truncate max-w-[120px] text-[10px]">
              {debouncedParams.bankName || 'Chưa chọn'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-[10px]">Số tài khoản:</span>
            <span className="font-mono font-bold text-[#784e34] text-[11px]">{debouncedParams.accountNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-[10px]">Chủ TK:</span>
            <span className="font-bold text-slate-800 text-right uppercase text-[10px] truncate max-w-[120px]">
              {debouncedParams.accountName || '---'}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-100 pt-1">
            <span className="text-slate-500 text-[10px]">Cú pháp:</span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-[10px]">
              {transferContent}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VietQrCard;
