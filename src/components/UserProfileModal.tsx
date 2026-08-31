import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Save,
  Camera,
  Upload,
  UserCheck,
  Trash2
} from 'lucide-react';
import { UserProfile, Role, ClanMember } from '../types';
import { updateOwnProfileService, updateMyAvatarService } from '../services/supabaseService';
import { compressImageFile } from '../utils/genealogyUtils';

interface UserProfileModalProps {
  isOpen: boolean;
  currentUserProfile: UserProfile | null;
  members?: ClanMember[];
  onClose: () => void;
  onProfileUpdated: (updatedProfile: UserProfile) => void;
  onAvatarUpdated?: (memberId: string, newAvatarUrl: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  currentUserProfile,
  members = [],
  onClose,
  onProfileUpdated,
  onAvatarUpdated,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [newAvatarToSave, setNewAvatarToSave] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const linkedMember = currentUserProfile 
    ? members.find(m => m.userId === currentUserProfile.id) 
    : undefined;

  useEffect(() => {
    if (currentUserProfile) {
      setFullName(currentUserProfile.full_name || '');
      setPhone(currentUserProfile.phone || '');
      setAvatarPreview(linkedMember?.avatar || '');
      setNewAvatarToSave(null);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [currentUserProfile, linkedMember?.avatar, isOpen]);

  if (!isOpen || !currentUserProfile) return null;

  const roleLabel = currentUserProfile.role === 'admin' 
    ? 'Quản Trị Viên (Admin)' 
    : currentUserProfile.role === 'support' 
    ? 'Ban Hỗ Trợ (Support)' 
    : 'Thành Viên (Member)';

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WebP).');
      return;
    }

    setIsCompressing(true);
    setErrorMessage(null);

    try {
      // Compress to lightweight Base64
      const compressed = await compressImageFile(file, 400, 400, 0.82);
      setAvatarPreview(compressed);
      setNewAvatarToSave(compressed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi nén ảnh đại diện.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    setNewAvatarToSave('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập Họ và Tên của bạn.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Update Profile Info
      const res = await updateOwnProfileService(currentUserProfile.id, fullName, phone);
      if (!res.success || !res.profile) {
        setErrorMessage(res.error || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
        return;
      }

      // 2. If avatar was changed and user is linked to a tree member, call secure RPC update_my_avatar
      if (newAvatarToSave !== null && linkedMember) {
        const avatarRes = await updateMyAvatarService(newAvatarToSave);
        if (!avatarRes.success) {
          setErrorMessage(avatarRes.error || 'Đã lưu họ tên nhưng không thể cập nhật ảnh đại diện trong gia phả.');
          onProfileUpdated(res.profile);
          return;
        }

        if (onAvatarUpdated) {
          onAvatarUpdated(linkedMember.id, newAvatarToSave);
        }
      }

      setSuccessMessage('Cập nhật thông tin hồ sơ và ảnh đại diện thành công!');
      onProfileUpdated(res.profile);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã xảy ra lỗi khi lưu thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-stone-300 shadow-2xl max-w-lg w-full overflow-hidden relative text-stone-900 my-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2a130c] to-[#451e12] p-5 sm:p-6 text-amber-50 relative border-b border-amber-900/60">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-amber-200 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif-clan tracking-tight text-white">
                Hồ Sơ Của Tôi
              </h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Cập nhật thông tin cá nhân & ảnh đại diện trong cây phả hệ
              </p>
            </div>
          </div>
        </div>

        {/* Content & Form */}
        <div className="p-6">
          {/* User Account Info Banner */}
          <div className="mb-5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                Email đăng nhập:
              </span>
              <span className="font-semibold text-stone-800 truncate max-w-[200px]">
                {currentUserProfile.email || 'Chưa cung cấp'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-stone-200/60">
              <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                Vai trò hệ thống:
              </span>
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${
                currentUserProfile.role === 'admin' ? 'bg-red-100 text-red-900 border border-red-300' :
                currentUserProfile.role === 'support' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                'bg-sky-100 text-sky-900 border border-sky-300'
              }`}>
                {roleLabel}
              </span>
            </div>

            {/* Linked clan member status */}
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-stone-200/60">
              <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-stone-400" />
                Hồ sơ trong phả hệ:
              </span>
              {linkedMember ? (
                <span className="font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-md text-[11px]">
                  {linkedMember.fullName} (Đời {linkedMember.generation})
                </span>
              ) : (
                <span className="text-stone-400 italic text-[11px]">
                  Chưa liên kết
                </span>
              )}
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-5 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Avatar Section: Enabled when linked to a clan member */}
            {linkedMember ? (
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-700" />
                    <span>Ảnh Đại Diện Cây Phả Hệ</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-medium">
                    (Bảo mật qua Supabase RPC)
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Avatar Circle Preview */}
                  <div className="relative w-18 h-18 rounded-2xl overflow-hidden bg-white border-2 border-amber-700/30 shadow-inner shrink-0 flex items-center justify-center">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Ảnh đại diện" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-400">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                    {isCompressing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải ảnh mới</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={loading || isCompressing}
                        />
                      </label>

                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={loading || isCompressing}
                          className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 border border-stone-300 hover:border-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Xóa ảnh đại diện"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Gỡ</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Hệ thống tự động nén kích thước ảnh tối ưu để load nhanh trên cây gia phả.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-stone-600 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  Tài khoản của bạn chưa được liên kết với thành viên trong cây phả hệ. Khi Quản Trị Viên (Admin) gán liên kết, bạn sẽ có thể tự cập nhật ảnh đại diện của mình tại đây.
                </p>
              </div>
            )}

            {/* Field 1: Họ và Tên */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Họ và Tên Tài Khoản <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Lê Văn Cường"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-600 outline-none transition-all"
                />
              </div>
            </div>

            {/* Field 2: Số điện thoại */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Số Điện Thoại Liên Lạc
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0912345678"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-600 outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Số điện thoại giúp Ban Trị Sự và bà con trong dòng họ dễ dàng liên hệ khi cần.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || isCompressing}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || isCompressing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu Hồ Sơ</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

