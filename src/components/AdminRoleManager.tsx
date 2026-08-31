import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Lock, 
  Database,
  ExternalLink,
  Crown,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Copy,
  Check,
  Code,
  Pencil,
  X,
  Save,
  User
} from 'lucide-react';
import { 
  fetchAllProfiles, 
  updateProfileRole, 
  updateProfileByAdminService,
  linkUserToMemberService
} from '../services/supabaseService';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabase';
import { UserProfile, Role, ClanInfo, ClanMember } from '../types';
import { getMemberOrder } from '../utils/genealogyUtils';

interface AdminRoleManagerProps {
  currentUserRole: Role;
  clanInfo: ClanInfo;
  currentUserProfile: UserProfile | null;
  members?: ClanMember[];
  onOpenAuth: () => void;
  onRoleUpdated?: () => void;
  onMemberLinked?: () => void;
}

export const AdminRoleManager: React.FC<AdminRoleManagerProps> = ({
  currentUserRole,
  clanInfo,
  currentUserProfile,
  members = [],
  onOpenAuth,
  onRoleUpdated,
  onMemberLinked,
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Edit user profile modal states
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLinkedMemberId, setEditLinkedMemberId] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Sorted members for selector (generation ascending, then order_in_family)
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.generation !== b.generation) {
        return a.generation - b.generation;
      }
      const aOrd = getMemberOrder(a);
      const bOrd = getMemberOrder(b);
      if (aOrd !== bOrd) {
        return aOrd - bOrd;
      }
      return a.fullName.localeCompare(b.fullName, 'vi');
    });
  }, [members]);

  const loadProfiles = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetchAllProfiles();
      if (res.profiles) {
        setProfiles(res.profiles);
      }
      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setUpdatingId(userId);
    setStatusMessage(null);

    try {
      const res = await updateProfileRole(userId, newRole);
      if (res.success) {
        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
        setStatusMessage({ 
          type: 'success', 
          text: `Đã cập nhật quyền thành "${newRole === 'admin' ? 'Quản Trị Viên (Admin)' : newRole === 'support' ? 'Hỗ Trợ (Support)' : 'Thành Viên (Member)'}" thành công!` 
        });
        if (onRoleUpdated) {
          onRoleUpdated();
        }
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Không thể cập nhật quyền.' });
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLinkMember = async (userId: string, memberId: string | null) => {
    setUpdatingId(userId);
    setStatusMessage(null);

    try {
      const res = await linkUserToMemberService(userId, memberId);
      if (res.success) {
        const targetMember = memberId ? members.find(m => m.id === memberId) : null;
        const targetProfile = profiles.find(p => p.id === userId);
        
        if (targetMember) {
          setStatusMessage({
            type: 'success',
            text: `Đã liên kết tài khoản "${targetProfile?.full_name || targetProfile?.email}" với "${targetMember.fullName} (Đời ${targetMember.generation})" thành công!`
          });
        } else {
          setStatusMessage({
            type: 'success',
            text: `Đã hủy liên kết hồ sơ phả hệ của tài khoản "${targetProfile?.full_name || targetProfile?.email}".`
          });
        }

        if (onMemberLinked) {
          onMemberLinked();
        }
        if (onRoleUpdated) {
          onRoleUpdated();
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Lỗi khi liên kết tài khoản với thành viên phả hệ.'
        });
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleOpenEdit = (profile: UserProfile) => {
    setEditingProfile(profile);
    setEditFullName(profile.full_name || '');
    setEditPhone(profile.phone || '');
    const currentLinked = members.find(m => m.userId === profile.id);
    setEditLinkedMemberId(currentLinked?.id || '');
    setEditError(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    if (!editFullName.trim()) {
      setEditError('Vui lòng nhập họ và tên.');
      return;
    }

    setSavingProfile(true);
    setEditError(null);

    try {
      // 1. Update Profile info
      const res = await updateProfileByAdminService(
        editingProfile.id,
        editFullName,
        editPhone
      );

      if (!res.success) {
        setEditError(res.error || 'Lỗi cập nhật thông tin tài khoản.');
        return;
      }

      // 2. Update Member link if changed
      const currentLinked = members.find(m => m.userId === editingProfile.id);
      const newLinkedId = editLinkedMemberId || null;
      if (currentLinked?.id !== newLinkedId) {
        const linkRes = await linkUserToMemberService(editingProfile.id, newLinkedId);
        if (!linkRes.success) {
          setEditError(linkRes.error || 'Lỗi cập nhật liên kết thành viên phả hệ.');
          return;
        }
      }

      if (res.profile) {
        setProfiles(prev => prev.map(p => p.id === editingProfile.id ? res.profile! : p));
        setStatusMessage({
          type: 'success',
          text: `Đã cập nhật thông tin tài khoản "${res.profile.full_name}" thành công!`,
        });
        setEditingProfile(null);
        if (onMemberLinked) {
          onMemberLinked();
        }
        if (onRoleUpdated) {
          onRoleUpdated();
        }
      }
    } catch (err: any) {
      setEditError(err.message || 'Lỗi kết nối khi cập nhật tài khoản.');
    } finally {
      setSavingProfile(false);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    return (
      (p.full_name && p.full_name.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q)) ||
      p.role.includes(q)
    );
  });

  const adminCount = profiles.filter(p => p.role === 'admin').length;
  const supportCount = profiles.filter(p => p.role === 'support').length;
  const memberCount = profiles.filter(p => p.role === 'member').length;

  const isAdmin = currentUserRole === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1c0e09] via-[#36130b] to-[#1c0e09] rounded-3xl p-6 sm:p-8 text-amber-50 shadow-xl border border-amber-900/60 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase font-serif-clan tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Hệ Thống Phân Quyền & Quản Trị Tài Khoản</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-clan text-white">
              Quản Trị Gán Role — {clanInfo.clanSurname} Tộc
            </h1>
            <p className="text-sm text-stone-300 mt-1 max-w-2xl">
              Quản lý danh sách người dùng đã đăng ký qua Supabase Auth, gán quyền Admin / Support / Member theo đúng chuẩn RLS Security.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadProfiles}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-amber-200 border border-amber-900/60 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm Mới</span>
            </button>

            <button
              onClick={() => setShowSqlModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Xem SQL Schema</span>
            </button>
          </div>
        </div>
      </div>

      {/* Permission Notification if not Admin */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-stone-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-amber-900">
              Bạn đang xem ở chế độ: {currentUserRole === 'support' ? 'Ban Hỗ Trợ (Support)' : 'Thành Viên (Member)'}
            </div>
            <p className="text-stone-600">
              Theo chính sách bảo mật Supabase RLS (<code>profiles_admin_manage_roles</code>), chỉ tài khoản có quyền <strong>Admin</strong> mới được thay đổi role của các thành viên khác.
            </p>
          </div>
        </div>
      )}

      {/* Guidance Card for First Admin Setup (Only shows when there are no Admins yet) */}
      {adminCount === 0 && (
        <div className="p-4 rounded-2xl bg-stone-900 text-stone-300 text-xs border border-amber-950/80 leading-relaxed">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1.5">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Hướng dẫn kích hoạt Admin đầu tiên trên Supabase:</span>
          </div>
          <ol className="list-decimal pl-5 space-y-1 text-stone-400">
            <li>Chạy toàn bộ đoạn mã <strong>SQL Schema (Production-Ready)</strong> trong Supabase Dashboard &gt; SQL Editor.</li>
            <li>Vào <strong>Authentication &gt; Providers</strong> &gt; Bật Email (hoặc Email OTP).</li>
            <li>Người dùng đầu tiên đăng ký sẽ có <code>role = 'member'</code>. Vào <strong>Table Editor &gt; profiles</strong> &gt; sửa cột role thành <code>admin</code>.</li>
            <li>Sau khi có Admin đầu tiên, bạn có thể dùng trực tiếp trang quản trị này để phân quyền cho mọi thành viên dòng họ.</li>
          </ol>
        </div>
      )}

      {/* Status Messages */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-stone-400 font-medium block mb-1">Tổng tài khoản:</span>
          <span className="text-2xl font-bold font-serif-clan text-stone-900">{profiles.length}</span>
        </div>

        <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200">
          <span className="text-red-800 font-medium block mb-1">Quản Trị Viên (Admin):</span>
          <span className="text-2xl font-bold font-serif-clan text-red-900">{adminCount}</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
          <span className="text-amber-800 font-medium block mb-1">Ban Hỗ Trợ (Support):</span>
          <span className="text-2xl font-bold font-serif-clan text-amber-900">{supportCount}</span>
        </div>

        <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200">
          <span className="text-sky-800 font-medium block mb-1">Thành Viên (Member):</span>
          <span className="text-2xl font-bold font-serif-clan text-sky-900">{memberCount}</span>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, email, vai trò..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-amber-600"
          />
        </div>

        <div className="text-xs text-stone-500 font-medium">
          Hiển thị <strong>{filteredProfiles.length}</strong> / {profiles.length} tài khoản
        </div>
      </div>

      {/* User Profiles Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3.5 px-4 sm:px-6">Họ Và Tên</th>
                <th className="py-3.5 px-4 sm:px-6">Email / Liên Hệ</th>
                <th className="py-3.5 px-4 sm:px-6">Hồ Sơ Cây Phả Hệ</th>
                <th className="py-3.5 px-4 sm:px-6">Vai Trò Hiện Tại</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Gán Quyền (Gán Role)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400 italic">
                    Không tìm thấy tài khoản nào khớp với tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => {
                  const isUpdating = updatingId === p.id;
                  const linkedMember = members.find(m => m.userId === p.id);

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Name */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            p.role === 'admin' 
                              ? 'bg-red-100 text-red-900 border border-red-300' 
                              : p.role === 'support' 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                              : 'bg-sky-100 text-sky-900 border border-sky-300'
                          }`}>
                            {p.full_name ? p.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 text-sm">
                              {p.full_name || 'Chưa cập nhật tên'}
                            </div>
                            <div className="text-[11px] text-stone-400 font-mono">
                              ID: {p.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="space-y-0.5">
                          {p.email && (
                            <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                              <Mail className="w-3.5 h-3.5 text-stone-400" />
                              <span>{p.email}</span>
                            </div>
                          )}
                          {p.phone && (
                            <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                              <Phone className="w-3.5 h-3.5 text-stone-400" />
                              <span>{p.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Linked Family Tree Member */}
                      <td className="py-4 px-4 sm:px-6">
                        {linkedMember ? (
                          <div className="flex items-center gap-1.5">
                            <div className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 font-semibold text-xs flex items-center gap-1.5 shadow-2xs">
                              <UserCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span className="truncate max-w-[150px] sm:max-w-[200px]" title={`${linkedMember.fullName} (Đời ${linkedMember.generation}, ${linkedMember.branch})`}>
                                {linkedMember.fullName} (Đời {linkedMember.generation})
                              </span>
                            </div>
                            {isAdmin && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleLinkMember(p.id, null)}
                                className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                                title="Hủy liên kết tài khoản này"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {isAdmin ? (
                              <select
                                value=""
                                disabled={isUpdating}
                                onChange={(e) => {
                                  if (e.target.value) handleLinkMember(p.id, e.target.value);
                                }}
                                className="px-2.5 py-1.5 bg-stone-50 hover:bg-white border border-dashed border-stone-300 hover:border-amber-500 rounded-xl text-xs text-stone-600 focus:outline-none focus:border-amber-600 cursor-pointer disabled:opacity-50 max-w-[210px] font-medium"
                                aria-label="Chọn thành viên phả hệ để liên kết"
                              >
                                <option value="">+ Chọn thành viên liên kết...</option>
                                {sortedMembers.map(m => {
                                  const isTaken = members.some(other => other.id === m.id && other.userId && other.userId !== p.id);
                                  return (
                                    <option key={m.id} value={m.id} disabled={isTaken}>
                                      Đời {m.generation}: {m.fullName} ({m.branch || 'Chi Trưởng'}) {isTaken ? '(Đã liên kết)' : ''}
                                    </option>
                                  );
                                })}
                              </select>
                            ) : (
                              <span className="text-stone-400 italic text-[11px]">Chưa liên kết</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Current Role Badge */}
                      <td className="py-4 px-4 sm:px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider ${
                          p.role === 'admin'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : p.role === 'support'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-sky-100 text-sky-800 border border-sky-300'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            p.role === 'admin' ? 'bg-red-600' : p.role === 'support' ? 'bg-amber-600' : 'bg-sky-600'
                          }`}></span>
                          <span>
                            {p.role === 'admin' ? 'Quản Trị Viên' : p.role === 'support' ? 'Ban Hỗ Trợ' : 'Thành Viên'}
                          </span>
                        </span>
                      </td>

                      {/* Action Role Selector & Edit button */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            disabled={!isAdmin}
                            className="p-1.5 px-2.5 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-300 hover:border-amber-400 transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                            title={`Chỉnh sửa thông tin & liên kết của ${p.full_name || p.email}`}
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-700" />
                            <span className="hidden sm:inline">Sửa</span>
                          </button>

                          <select
                            value={p.role}
                            disabled={!isAdmin || isUpdating}
                            onChange={(e) => handleRoleChange(p.id, e.target.value as Role)}
                            className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-600 cursor-pointer disabled:opacity-50"
                            aria-label={`Thay đổi role cho ${p.full_name || p.email}`}
                          >
                            <option value="admin">Quản Trị Viên (Admin)</option>
                            <option value="support">Ban Hỗ Trợ (Support)</option>
                            <option value="member">Thành Viên (Member)</option>
                          </select>

                          {isUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Profile Modal (Admin only) */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-300 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-5 bg-[#1c0e09] text-white border-b border-amber-900/60">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold font-serif-clan text-base text-amber-100">
                    Sửa Thông Tin Tài Khoản
                  </h3>
                  <p className="text-[11px] text-amber-300/80 font-mono">
                    {editingProfile.email || `ID: ${editingProfile.id.slice(0, 8)}...`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Email (Readonly) */}
              {editingProfile.email && (
                <div className="space-y-1">
                  <label className="block text-stone-500 font-semibold">Email đăng ký (Cố định):</label>
                  <div className="px-3.5 py-2 bg-stone-100 border border-stone-200 rounded-xl text-stone-600 font-medium select-all">
                    {editingProfile.email}
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-stone-700 font-bold">
                  Họ và Tên <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="VD: Vương Cường..."
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-semibold focus:outline-none focus:border-amber-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-stone-700 font-bold">
                  Số điện thoại liên hệ
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="VD: 0988123456..."
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-semibold focus:outline-none focus:border-amber-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Linked Clan Member in Family Tree */}
              <div className="space-y-1">
                <label className="block text-stone-700 font-bold">
                  Liên kết với thành viên trong cây phả hệ
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                  <select
                    value={editLinkedMemberId}
                    onChange={(e) => setEditLinkedMemberId(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs font-semibold focus:outline-none focus:border-amber-600 focus:bg-white cursor-pointer"
                  >
                    <option value="">-- Chưa liên kết với hồ sơ phả hệ nào --</option>
                    {sortedMembers.map((m) => {
                      const isTakenByOther = members.some(
                        (other) => other.id === m.id && other.userId && other.userId !== editingProfile.id
                      );
                      return (
                        <option key={m.id} value={m.id} disabled={isTakenByOther}>
                          Đời {m.generation}: {m.fullName} ({m.branch || 'Chi Trưởng'}) {isTakenByOther ? '(Đã liên kết với tài khoản khác)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                  Khi được liên kết, người dùng này có thể tự đổi ảnh đại diện cá nhân của mình trong cây phả hệ qua mục "Hồ Sơ Của Tôi".
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  disabled={savingProfile}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu Thay Đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline SQL Schema Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-stone-300 overflow-hidden">
            <div className="flex items-center justify-between p-5 bg-[#1c0e09] text-white border-b border-amber-900/60">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold font-serif-clan text-lg text-amber-100">SQL Schema & RLS Policies (Production-Ready)</h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <p className="text-stone-600">
                  Dán toàn bộ đoạn mã SQL này vào <strong>Supabase Dashboard &gt; SQL Editor</strong> để khởi tạo bảng <code>profiles</code>, <code>members</code>, <code>events</code> và các chính sách bảo mật RLS.
                </p>
                <button
                  onClick={handleCopySql}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer ml-3"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Đã sao chép!' : 'Sao chép SQL'}</span>
                </button>
              </div>

              <div className="bg-stone-900 text-amber-100 p-4 rounded-2xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-96 border border-stone-800">
                <pre>{SUPABASE_SQL_SCHEMA}</pre>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-5 py-2 rounded-xl bg-stone-800 text-white font-bold text-xs hover:bg-stone-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
