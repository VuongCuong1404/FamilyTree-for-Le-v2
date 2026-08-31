import React, { useMemo } from 'react';
import { 
  X, 
  Phone, 
  MapPin, 
  Mail, 
  Heart, 
  Award, 
  Layers, 
  Calendar, 
  Users, 
  Building2, 
  UserPlus, 
  Edit3,
  ChevronRight,
  Flame,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { ClanMember, ClanInfo, Role } from '../types';
import { calculateAgeInfo, getGenderVisuals } from '../utils/genealogyUtils';

interface MemberDetailModalProps {
  member: ClanMember | null;
  allMembers: ClanMember[];
  clanInfo: ClanInfo;
  currentUserRole?: Role;
  onClose: () => void;
  onSelectMember: (m: ClanMember) => void;
  onAddChild: (parent: ClanMember) => void;
  onEditMember: (m: ClanMember) => void;
  onDeleteMember?: (memberId: string) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  allMembers,
  clanInfo,
  currentUserRole = 'admin',
  onClose,
  onSelectMember,
  onAddChild,
  onEditMember,
  onDeleteMember,
}) => {
  if (!member) return null;

  const ageInfo = calculateAgeInfo(member.birthYear, member.deathYear, member.isAlive);
  const genderVisual = getGenderVisuals(member.gender, member.generation);

  const canEdit = currentUserRole === 'admin' || currentUserRole === 'support';
  const canDelete = currentUserRole === 'admin';

  // Find Parent
  const parent = useMemo(() => {
    return member.parentId ? allMembers.find(m => m.id === member.parentId) : null;
  }, [member, allMembers]);

  // Find Children
  const children = useMemo(() => {
    return allMembers.filter(m => m.parentId === member.id);
  }, [member, allMembers]);

  // Direct Ancestor Lineage Path (from Thủy Tổ to current member)
  const lineagePath = useMemo(() => {
    const path: ClanMember[] = [];
    let cur: ClanMember | undefined = member;
    while (cur) {
      path.unshift(cur);
      cur = cur.parentId ? allMembers.find(m => m.id === cur?.parentId) : undefined;
    }
    return path;
  }, [member, allMembers]);

  const handleDelete = () => {
    if (!onDeleteMember) return;
    if (children.length > 0) {
      if (!window.confirm(`Thành viên "${member.fullName}" đang có ${children.length} người con trong gia phả. Việc xóa thành viên này sẽ tách nhánh con cái. Bạn có chắc chắn muốn xóa?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Bạn có chắc chắn muốn xóa thành viên "${member.fullName}" khỏi gia phả?`)) {
        return;
      }
    }
    onDeleteMember(member.id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-amber-800/30 shadow-2xl max-w-2xl w-full overflow-hidden relative text-stone-900 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Banner */}
        <div className="bg-gradient-to-r from-[#2c1309] via-[#461118] to-[#2c1309] text-amber-50 p-6 sm:p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-stone-900/60 hover:bg-stone-900 text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-bold font-serif-clan text-2xl shadow-xl shrink-0 ${genderVisual.avatarBg}`}>
              {genderVisual.title}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold font-serif-clan uppercase bg-amber-400 text-stone-950">
                  Đời Thứ {member.generation}
                </span>

                <span className={`px-2 py-0.5 rounded-md text-xs font-bold inline-flex items-center gap-1 ${genderVisual.badgeClass}`}>
                  <span>{genderVisual.symbol}</span>
                  <span>{member.gender === 'male' ? 'Nam Đinh' : 'Nữ Giới'}</span>
                </span>

                <span className="text-xs font-semibold text-amber-200">
                  {member.branch}
                </span>
                
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  member.isAlive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-stone-700 text-stone-300'
                }`}>
                  {member.isAlive ? '• Còn sống' : '• Tiền nhân'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold font-serif-clan text-white leading-tight">
                {member.fullName}
              </h2>

              {member.title && (
                <div className="text-sm font-semibold text-amber-300 mt-0.5">
                  Danh xưng: {member.title}
                </div>
              )}

              {/* Age / Lifespan Display */}
              <div className="text-xs font-semibold text-amber-200 mt-1.5 inline-block px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-500/40">
                {ageInfo.formattedText}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* Breadcrumb Lineage Path */}
          {lineagePath.length > 1 && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs">
              <span className="font-bold text-amber-900 uppercase tracking-wide block mb-1.5">
                Dòng Truyền Thống Huyết Thống:
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-stone-700">
                {lineagePath.map((anc, idx) => (
                  <React.Fragment key={anc.id}>
                    <button
                      onClick={() => onSelectMember(anc)}
                      className={`font-semibold hover:underline ${
                        anc.id === member.id ? 'text-amber-900 font-bold' : 'text-stone-600 hover:text-amber-800'
                      }`}
                    >
                      {anc.fullName} (Đời {anc.generation})
                    </button>
                    {idx < lineagePath.length - 1 && (
                      <ChevronRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            {/* Father info */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-stone-400 font-medium block mb-1">Thân phụ (Cha):</span>
              {parent ? (
                <button
                  onClick={() => onSelectMember(parent)}
                  className="font-bold text-stone-900 hover:text-amber-800 flex items-center gap-1 text-sm text-left group"
                >
                  <span>{parent.fullName}</span>
                  <span className="text-xs text-stone-500 font-normal">({parent.title || `Đời ${parent.generation}`})</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <span className="text-stone-600 italic">Thủy Tổ khởi phái (Đời I)</span>
              )}
            </div>

            {/* Spouse info */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-stone-400 font-medium block mb-1">Phối ngẫu (Vợ / Chồng):</span>
              <span className="font-bold text-stone-900 text-sm">
                {member.spouse || (member.spouseList && member.spouseList.length > 0 ? member.spouseList.map(s => s.name).join(', ') : 'Chưa có thông tin')}
              </span>
            </div>

            {/* Contact Phone */}
            {member.phone && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <span className="text-stone-400 font-medium block mb-1">Số điện thoại:</span>
                <a href={`tel:${member.phone}`} className="font-bold text-blue-700 hover:underline text-sm flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{member.phone}</span>
                </a>
              </div>
            )}

            {/* Lunar Death date */}
            {!member.isAlive && member.lunarDeathDate && (
              <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200">
                <span className="text-red-800 font-semibold block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-red-700" />
                  <span>Ngày Giỗ Âm Lịch (Kỵ Nhật):</span>
                </span>
                <span className="font-bold text-red-900 text-sm">{member.lunarDeathDate}</span>
              </div>
            )}

            {/* Resting place */}
            {!member.isAlive && member.restingPlace && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 sm:col-span-2">
                <span className="text-stone-400 font-medium block mb-1">Nơi an nghỉ (Mộ phần):</span>
                <span className="font-semibold text-stone-800 text-sm">{member.restingPlace}</span>
              </div>
            )}

            {/* Occupation or Address */}
            {member.isAlive && (member.occupation || member.address) && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 sm:col-span-2">
                <span className="text-stone-400 font-medium block mb-1">Nghề nghiệp & Nơi cư trú:</span>
                <span className="font-semibold text-stone-800 text-sm">
                  {[member.occupation, member.address].filter(Boolean).join(' • ')}
                </span>
              </div>
            )}
          </div>

          {/* Biography & Achievements */}
          {member.bio && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">Tiểu sử & Sự nghiệp:</h4>
              <p className="text-xs text-stone-700 leading-relaxed p-4 rounded-2xl bg-stone-50 border border-stone-200">
                {member.bio}
              </p>
            </div>
          )}

          {/* Children list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">
                Danh Sách Hậu Duệ (Con Cái) — {children.length} người:
              </h4>
              {canEdit && (
                <button
                  onClick={() => onAddChild(member)}
                  className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Thêm con</span>
                </button>
              )}
            </div>

            {children.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Chưa ghi nhận thông tin con cái trong gia phả.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {children.map((child) => (
                  <div
                    key={child.id}
                    onClick={() => onSelectMember(child)}
                    className="p-3 rounded-xl bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-stone-900 group-hover:text-amber-900 truncate">
                        {child.fullName} {child.title ? `(${child.title})` : ''}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {child.birthYear || 'Chưa rõ'} • {child.gender === 'male' ? 'Con trai' : 'Con gái'}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-700" />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => onEditMember(member)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sửa Thông Tin</span>
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                title="Xóa thành viên khỏi gia phả"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => onAddChild(member)}
                className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Thêm Con Cháu</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
