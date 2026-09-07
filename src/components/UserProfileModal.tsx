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
  Trash2,
  ArrowRightLeft,
  Info,
  Trees
} from 'lucide-react';
import { UserProfile, ClanMember } from '../types';
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

  // 1. Account Avatar (profiles.avatar_url)
  const [accountAvatar, setAccountAvatar] = useState<string>('');
  const [isAccountAvatarChanged, setIsAccountAvatarChanged] = useState<boolean>(false);
  const [isCompressingAccount, setIsCompressingAccount] = useState<boolean>(false);

  // 2. Tree Avatar (members.avatar_url)
  const [treeAvatar, setTreeAvatar] = useState<string>('');
  const [isTreeAvatarChanged, setIsTreeAvatarChanged] = useState<boolean>(false);
  const [isCompressingTree, setIsCompressingTree] = useState<boolean>(false);

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
      setAccountAvatar(currentUserProfile.avatar_url || '');
      setIsAccountAvatarChanged(false);

      setTreeAvatar(linkedMember?.avatar || '');
      setIsTreeAvatarChanged(false);

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

  // Handler for Account Avatar (profiles.avatar_url)
  const handleAccountAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WebP).');
      return;
    }

    setIsCompressingAccount(true);
    setErrorMessage(null);

    try {
      const compressed = await compressImageFile(file, 360, 360, 0.82);
      setAccountAvatar(compressed);
      setIsAccountAvatarChanged(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi nén ảnh tài khoản.');
    } finally {
      setIsCompressingAccount(false);
      e.target.value = '';
    }
  };

  const handleRemoveAccountAvatar = () => {
    setAccountAvatar('');
    setIsAccountAvatarChanged(true);
  };

  // Handler for Tree Avatar (members.avatar_url)
  const handleTreeAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WebP).');
      return;
    }

    setIsCompressingTree(true);
    setErrorMessage(null);

    try {
      const compressed = await compressImageFile(file, 360, 360, 0.82);
      setTreeAvatar(compressed);
      setIsTreeAvatarChanged(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi nén ảnh trên cây phả hệ.');
    } finally {
      setIsCompressingTree(false);
      e.target.value = '';
    }
  };

  const handleRemoveTreeAvatar = () => {
    setTreeAvatar('');
    setIsTreeAvatarChanged(true);
  };

  const handleSyncAccountAvatarToTree = () => {
    if (!accountAvatar) {
      setErrorMessage('Bạn chưa có ảnh tài khoản để đồng bộ sang cây phả hệ.');
      return;
    }
    setTreeAvatar(accountAvatar);
    setIsTreeAvatarChanged(true);
    setSuccessMessage('Đã sao chép ảnh tài khoản sang cây phả hệ. Bấm "Lưu Hồ Sơ" để cập nhật.');
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
      // 1. Update Profile Info & Account Avatar
      const res = await updateOwnProfileService(
        currentUserProfile.id,
        fullName.trim(),
        phone.trim(),
        isAccountAvatarChanged ? (accountAvatar.trim() || null) : undefined
      );

      if (!res.success || !res.profile) {
        setErrorMessage(res.error || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
        return;
      }

      // 2. If tree avatar was changed and user is linked to a tree member, call update_my_avatar RPC
      if (isTreeAvatarChanged && linkedMember) {
        const finalTreeAvatar = treeAvatar.trim() || null;
        const avatarRes = await updateMyAvatarService(finalTreeAvatar);
        if (!avatarRes.success) {
          setErrorMessage(avatarRes.error || 'Đã lưu hồ sơ cá nhân nhưng không thể cập nhật ảnh trên cây gia phả.');
          onProfileUpdated(res.profile);
          return;
        }

        if (onAvatarUpdated) {
          onAvatarUpdated(linkedMember.id, finalTreeAvatar || '');
        }
      }

      if (res.warning) {
        setSuccessMessage(`Cập nhật thông tin thành công! (${res.warning})`);
      } else {
        setSuccessMessage('Cập nhật thông tin hồ sơ và ảnh thành công!');
      }

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
        className="bg-white rounded-3xl border border-stone-300 shadow-2xl max-w-xl w-full overflow-hidden relative text-stone-900 my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2a130c] to-[#451e12] p-5 sm:p-6 text-amber-50 relative border-b border-amber-900/60 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-amber-200 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 overflow-hidden">
              {accountAvatar ? (
                <img src={accountAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif-clan tracking-tight text-white">
                Hồ Sơ Của Tôi
              </h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Quản lý ảnh đại diện tài khoản &amp; ảnh thành viên trên cây gia phả
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* User Account Info Banner */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                Email đăng nhập:
              </span>
              <span className="font-semibold text-stone-800 truncate max-w-[220px]">
                {currentUserProfile.email || 'Chưa cung cấp'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-stone-200/60">
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
            <div className="flex items-center justify-between pt-1.5 border-t border-stone-200/60">
              <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-stone-400" />
                Vị trí trong phả hệ:
              </span>
              {linkedMember ? (
                <span className="font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                  <span>{linkedMember.fullName}</span>
                  <span className="text-amber-700">(Đời {linkedMember.generation} - {linkedMember.branch})</span>
                </span>
              ) : (
                <span className="text-stone-500 italic text-[11px] bg-stone-200/60 px-2 py-0.5 rounded">
                  Chưa liên kết
                </span>
              )}
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ========================================================= */}
            {/* SECTION 1: ẢNH ĐẠI DIỆN TÀI KHOẢN (profiles.avatar_url)     */}
            {/* ========================================================= */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-stone-700" />
                  <span className="font-bold text-stone-900 text-sm">1. Ảnh Đại Diện Tài Khoản</span>
                </div>
                <span className="text-[11px] font-medium text-stone-600 bg-stone-200/70 px-2 py-0.5 rounded-md">
                  Nhận diện tài khoản
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                {/* Avatar Preview */}
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-stone-300 shadow-inner shrink-0 flex items-center justify-center">
                  {accountAvatar ? (
                    <img 
                      src={accountAvatar} 
                      alt="Ảnh tài khoản" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-stone-400 p-1 text-center">
                      <User className="w-7 h-7 text-stone-300" />
                    </div>
                  )}

                  {isCompressingAccount && (
                    <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload & Remove controls */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{accountAvatar ? 'Đổi ảnh tài khoản' : 'Tải ảnh tài khoản'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAccountAvatarFile}
                        className="hidden"
                        disabled={loading || isCompressingAccount}
                      />
                    </label>

                    {accountAvatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAccountAvatar}
                        disabled={loading || isCompressingAccount}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-stone-600 hover:text-rose-700 border border-stone-300 hover:border-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Gỡ ảnh tài khoản"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Gỡ ảnh</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Ảnh nhận diện cá nhân khi đăng nhập và hiển thị trên thanh công cụ.
                  </p>
                </div>
              </div>

              {!linkedMember && (
                <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 text-[11px] flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Tài khoản của bạn chưa được liên kết với một vị trí trên cây phả hệ. Bạn vẫn có thể tải ảnh tài khoản tại đây để Ban Quản Trị dễ nhận diện và liên kết.
                  </span>
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* SECTION 2: ẢNH THÀNH VIÊN TRÊN CÂY PHẢ HỆ (members.avatar) */}
            {/* ========================================================= */}
            {linkedMember ? (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trees className="w-4 h-4 text-amber-800" />
                    <span className="font-bold text-stone-900 text-sm">2. Ảnh Đại Diện Trên Cây Phả Hệ</span>
                  </div>
                  <span className="text-[11px] font-medium text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                    Hiện trên sơ đồ cây
                  </span>
                </div>

                <div className="text-xs text-amber-900/90 font-medium">
                  Vị trí liên kết: <strong className="text-amber-950">{linkedMember.fullName}</strong> (Đời {linkedMember.generation} - {linkedMember.branch})
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                  {/* Tree Avatar Preview */}
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-amber-700/40 shadow-inner shrink-0 flex items-center justify-center">
                    {treeAvatar ? (
                      <img 
                        src={treeAvatar} 
                        alt="Ảnh trên cây" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-400 p-1 text-center">
                        <User className="w-7 h-7 text-stone-300" />
                      </div>
                    )}

                    {isCompressingTree && (
                      <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{treeAvatar ? 'Đổi ảnh cây' : 'Tải ảnh cho cây'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleTreeAvatarFile}
                          className="hidden"
                          disabled={loading || isCompressingTree}
                        />
                      </label>

                      {accountAvatar && accountAvatar !== treeAvatar && (
                        <button
                          type="button"
                          onClick={handleSyncAccountAvatarToTree}
                          disabled={loading || isCompressingTree}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Sao chép ảnh tài khoản sang ảnh trên cây"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-amber-800" />
                          <span>Dùng ảnh tài khoản</span>
                        </button>
                      )}

                      {treeAvatar && (
                        <button
                          type="button"
                          onClick={handleRemoveTreeAvatar}
                          disabled={loading || isCompressingTree}
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-stone-600 hover:text-rose-700 border border-stone-300 hover:border-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Gỡ ảnh trên cây phả hệ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Gỡ ảnh</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Ảnh này hiển thị trên sơ đồ cây phả hệ, hồ sơ chi tiết và danh bạ dòng họ.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-stone-600 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-stone-800">2. Ảnh Đại Diện Trên Cây Phả Hệ (Chưa mở khóa)</div>
                  <p className="leading-relaxed text-[11px]">
                    Tài khoản của bạn chưa được liên kết với một vị trí trên cây phả hệ. Khi Quản Trị Viên (Admin) gán liên kết, bạn sẽ có thể tự cập nhật hoặc đồng bộ ảnh đại diện trên cây gia phả.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SECTION 3: THÔNG TIN HỌ TÊN & SỐ ĐIỆN THOẠI                */}
            {/* ========================================================= */}
            <div className="space-y-3.5 pt-1">
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
                  Giúp Ban Trị Sự và bà con trong dòng họ dễ dàng kết nối khi cần.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || isCompressingAccount || isCompressingTree}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || isCompressingAccount || isCompressingTree}
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
