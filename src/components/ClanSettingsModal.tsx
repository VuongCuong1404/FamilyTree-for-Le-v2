// verified: quick switch template removed
import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  Building2, 
  Phone, 
  Download, 
  Upload,
  Layers,
  AlertCircle
} from 'lucide-react';
import { ClanInfo, Role } from '../types';

interface ClanSettingsModalProps {
  clanInfo: ClanInfo;
  currentUserRole?: Role;
  onClose: () => void;
  onSaveClanInfo: (info: ClanInfo) => void;
  onResetData: () => void;
}

export const ClanSettingsModal: React.FC<ClanSettingsModalProps> = ({
  clanInfo,
  currentUserRole = 'member',
  onClose,
  onSaveClanInfo,
  onResetData,
}) => {
  const [name, setName] = useState(clanInfo.name);
  const [clanSurname, setClanSurname] = useState(clanInfo.clanSurname);
  const [subTitle, setSubTitle] = useState(clanInfo.subTitle);
  const [ancestorName, setAncestorName] = useState(clanInfo.ancestorName);
  const [ancestralHallLocation, setAncestralHallLocation] = useState(clanInfo.ancestralHallLocation);
  const [zaloGroupUrl, setZaloGroupUrl] = useState(clanInfo.zaloGroupUrl);
  const [contactLeaderName, setContactLeaderName] = useState(clanInfo.contactLeaderName);
  const [contactLeaderPhone, setContactLeaderPhone] = useState(clanInfo.contactLeaderPhone);

  const isAdmin = currentUserRole === 'admin';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Chỉ tài khoản có quyền Quản Trị Viên (Admin) mới có thể lưu cài đặt dòng họ lên Supabase.');
      return;
    }

    onSaveClanInfo({
      ...clanInfo,
      name: name.trim(),
      clanSurname: clanSurname.trim(),
      subTitle: subTitle.trim(),
      ancestorName: ancestorName.trim(),
      ancestralHallLocation: ancestralHallLocation.trim(),
      zaloGroupUrl: zaloGroupUrl.trim(),
      contactLeaderName: contactLeaderName.trim(),
      contactLeaderPhone: contactLeaderPhone.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border-2 border-amber-800/40 shadow-2xl max-w-xl w-full overflow-hidden relative text-stone-900 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#24140e] text-amber-50 p-6 flex items-center justify-between border-b border-amber-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-700 text-amber-100 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-serif-clan text-white">
                Tùy Chỉnh Thông Tin Họ Tộc
              </h2>
              <p className="text-xs text-amber-200/70">
                Thay đổi tên dòng họ, khẩu hiệu, vị trí từ đường và liên hệ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          
          {/* Permission notice */}
          {!isAdmin && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300 flex items-start gap-2.5 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold">Chế độ xem cài đặt:</span> Bạn đang đăng nhập với vai trò <span className="font-bold uppercase underline">{currentUserRole}</span>. Chỉ <span className="font-bold">Quản Trị Viên (Admin)</span> mới có quyền lưu và đồng bộ cài đặt dòng họ lên Supabase.
              </div>
            </div>
          )}

          {/* Clan Name and Surname */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-stone-700 font-bold mb-1">
                Tiêu đề hiển thị trang chủ (Dòng lớn):
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-semibold"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">Họ dòng tộc:</label>
              <input
                type="text"
                required
                value={clanSurname}
                onChange={(e) => setClanSurname(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-semibold"
              />
            </div>
          </div>

          {/* Slogan */}
          <div>
            <label className="block text-stone-700 font-bold mb-1">
              Khẩu hiệu / Slogan dòng họ:
            </label>
            <input
              type="text"
              required
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900"
            />
          </div>

          {/* Ancestor Name */}
          <div>
            <label className="block text-stone-700 font-bold mb-1">Tên Cụ Thủy Tổ:</label>
            <input
              type="text"
              value={ancestorName}
              onChange={(e) => setAncestorName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900"
            />
          </div>

          {/* Ancestral Hall Location */}
          <div>
            <label className="block text-stone-700 font-bold mb-1">Địa chỉ Từ Đường / Nhà Thờ Họ:</label>
            <input
              type="text"
              value={ancestralHallLocation}
              onChange={(e) => setAncestralHallLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900"
            />
          </div>

          {/* Zalo Group Link */}
          <div>
            <label className="block text-stone-700 font-bold mb-1">Đường dẫn nhóm Zalo họ:</label>
            <input
              type="text"
              value={zaloGroupUrl}
              onChange={(e) => setZaloGroupUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-mono text-xs"
            />
          </div>

          {/* Leader contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Họ tên Trưởng tộc / Liên lạc:</label>
              <input
                type="text"
                value={contactLeaderName}
                onChange={(e) => setContactLeaderName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">Số điện thoại liên lạc:</label>
              <input
                type="text"
                value={contactLeaderPhone}
                onChange={(e) => setContactLeaderPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900"
              />
            </div>
          </div>

          {/* Danger Zone: Reset Data */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onResetData}
              className="text-red-700 hover:text-red-900 font-bold flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục dữ liệu gốc</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Thay Đổi</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
