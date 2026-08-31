import React, { useState } from 'react';
import { 
  X, 
  MessageCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Phone, 
  ShieldCheck, 
  Users, 
  QrCode,
  Sparkles
} from 'lucide-react';
import { ClanInfo } from '../types';

interface ZaloConnectModalProps {
  clanInfo: ClanInfo;
  onClose: () => void;
}

export const ZaloConnectModal: React.FC<ZaloConnectModalProps> = ({
  clanInfo,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(clanInfo.zaloGroupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border-2 border-blue-600/40 shadow-2xl max-w-lg w-full overflow-hidden relative text-stone-900 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white p-6 sm:p-8 relative text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-blue-900/60 hover:bg-blue-950 text-blue-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center mx-auto mb-3 text-white shadow-lg">
            <MessageCircle className="w-9 h-9 fill-current" />
          </div>

          <div className="text-xs font-bold uppercase tracking-widest text-blue-200 font-serif-clan">
            Kênh Kết Nối Chính Thức
          </div>
          <h2 className="text-2xl font-bold font-serif-clan mt-1 text-white">
            Nhóm Zalo Họ {clanInfo.clanSurname}
          </h2>
          <p className="text-xs text-blue-100 mt-1 max-w-xs mx-auto">
            Gắn kết con cháu nội ngoại trên khắp mọi miền Tổ quốc và kiều bào nước ngoài.
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6 text-center">
          
          {/* QR Code Frame */}
          <div className="inline-block p-4 rounded-3xl bg-white border-2 border-blue-200 shadow-lg relative group">
            <img
              src={clanInfo.zaloQrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(clanInfo.zaloGroupUrl)}`}
              alt="Mã QR Zalo Dòng Họ"
              className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto rounded-xl"
            />
            <div className="text-[11px] text-stone-500 font-medium mt-2 flex items-center justify-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span>Quét mã bằng ứng dụng Zalo trên điện thoại</span>
            </div>
          </div>

          {/* Direct Link Action */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={clanInfo.zaloGroupUrl}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs font-mono text-stone-700 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Đã chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            <a
              href={clanInfo.zaloGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all hover:scale-105"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Mở Trực Tiếp Trên Ứng Dụng Zalo</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Clan Secretary Contact */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-left space-y-2">
            <div className="font-bold text-stone-800 flex items-center gap-1.5 font-serif-clan">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Hỗ trợ phê duyệt thành viên mới:</span>
            </div>
            <p className="text-stone-600">
              Khi tham gia nhóm, bà con vui lòng đổi tên theo cú pháp: <br />
              <strong className="text-blue-700">[Họ Tên - Chi/Đời - Nơi ở]</strong> (Ví dụ: <em>Lê Khắc Nam - Chi 2 Đời 5 - Hà Nội</em>)
            </p>
            <div className="pt-1 flex items-center gap-2 text-stone-700">
              <Phone className="w-3.5 h-3.5 text-amber-700" />
              <span>Liên hệ Ban Liên Lạc: <strong>{clanInfo.contactLeaderName}</strong> ({clanInfo.contactLeaderPhone})</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-stone-300 hover:bg-stone-400 text-stone-800 font-semibold text-xs transition-colors"
          >
            Đóng Lại
          </button>
        </div>

      </div>
    </div>
  );
};
