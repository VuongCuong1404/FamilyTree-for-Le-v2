import React, { useMemo, useState } from 'react';
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
  Trash2,
  Search,
  UserCheck,
  Sparkles,
  Check,
  Loader2
} from 'lucide-react';
import { ClanMember, ClanInfo, Role } from '../types';
import { calculateAgeInfo, getGenderVisuals } from '../utils/genealogyUtils';
import { generateUUID } from '../services/supabaseService';

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
  onAddSpouseLink?: (targetMember: ClanMember, spouseMember: ClanMember, isNew?: boolean) => Promise<void> | void;
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
  onAddSpouseLink,
}) => {
  if (!member) return null;

  const ageInfo = calculateAgeInfo(member.birthYear, member.deathYear, member.isAlive);
  const genderVisual = getGenderVisuals(member.gender, member.generation);

  const canEdit = currentUserRole === 'admin' || currentUserRole === 'support';
  const canDelete = currentUserRole === 'admin';

  // Sub-modal state for "+ Thêm Phối Ngẫu"
  const [isAddSpouseModalOpen, setIsAddSpouseModalOpen] = useState(false);
  const [addSpouseTab, setAddSpouseTab] = useState<'existing' | 'new'>('existing');
  const [spouseSearchTerm, setSpouseSearchTerm] = useState('');
  const [selectedExistingMemberId, setSelectedExistingMemberId] = useState<string | null>(null);

  const [newSpouseName, setNewSpouseName] = useState('');
  const [newSpouseGender, setNewSpouseGender] = useState<'male' | 'female'>('female');
  const [newSpouseBirthYear, setNewSpouseBirthYear] = useState('');
  const [newSpouseIsAlive, setNewSpouseIsAlive] = useState(true);
  const [isSubmittingSpouse, setIsSubmittingSpouse] = useState(false);

  // Find Parents based on real gender
  const linkedParent = member.parentId ? allMembers.find(m => m.id === member.parentId) : null;
  const linkedMotherById = member.motherId ? allMembers.find(m => m.id === member.motherId) : null;
  const father = linkedParent?.gender === 'male' ? linkedParent : (linkedMotherById?.gender === 'male' ? linkedMotherById : null);
  const mother = linkedParent?.gender === 'female' ? linkedParent : (linkedMotherById?.gender === 'female' ? linkedMotherById : null);

  // Find Linked Spouses
  const linkedSpouseMembers = useMemo(() => {
    const direct = member.spouseIds || [];
    const reverse = allMembers.filter(m => m.id !== member.id && m.spouseIds?.includes(member.id)).map(m => m.id);
    const combined = Array.from(new Set([...direct, ...reverse]));
    return combined.map(id => allMembers.find(m => m.id === id)).filter((m): m is ClanMember => Boolean(m));
  }, [member, allMembers]);

  // Candidate existing members for Tab 1
  const candidateExistingMembers = useMemo(() => {
    if (!member) return [];
    const linkedIds = new Set(linkedSpouseMembers.map(m => m.id));
    linkedIds.add(member.id);

    return allMembers
      .filter(m => !linkedIds.has(m.id))
      .filter(m => {
        if (!spouseSearchTerm.trim()) return true;
        const q = spouseSearchTerm.toLowerCase();
        return (
          m.fullName.toLowerCase().includes(q) ||
          m.branch.toLowerCase().includes(q) ||
          `đời ${m.generation}`.includes(q) ||
          (m.birthYear && String(m.birthYear).includes(q))
        );
      });
  }, [allMembers, member, linkedSpouseMembers, spouseSearchTerm]);

  const handleOpenAddSpouseModal = () => {
    if (currentUserRole === 'member') {
      alert('Tài khoản Thành viên (Member) chỉ có quyền xem. Vui lòng chuyển sang tài khoản Quản Trị Viên (Admin) hoặc Ban Hỗ Trợ (Support) để thêm phối ngẫu.');
      return;
    }
    setAddSpouseTab('existing');
    setSpouseSearchTerm('');
    setSelectedExistingMemberId(null);
    setNewSpouseName('');
    setNewSpouseGender(member.gender === 'male' ? 'female' : 'male');
    setNewSpouseBirthYear('');
    setNewSpouseIsAlive(member.isAlive);
    setIsAddSpouseModalOpen(true);
  };

  const handleConfirmLinkExisting = async () => {
    if (!selectedExistingMemberId || !onAddSpouseLink) return;
    const existingSpouse = allMembers.find(m => m.id === selectedExistingMemberId);
    if (!existingSpouse) return;

    try {
      setIsSubmittingSpouse(true);
      await onAddSpouseLink(member, existingSpouse, false);
      setIsAddSpouseModalOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi liên kết phối ngẫu.');
    } finally {
      setIsSubmittingSpouse(false);
    }
  };

  const handleConfirmCreateNewSpouse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSpouseName.trim()) {
      alert('Vui lòng nhập Họ và tên của phối ngẫu.');
      return;
    }
    if (!onAddSpouseLink) return;

    try {
      setIsSubmittingSpouse(true);
      const newMemberObj: ClanMember = {
        id: generateUUID(),
        fullName: newSpouseName.trim(),
        gender: newSpouseGender,
        generation: member.generation,
        branch: member.branch || 'Chi Trưởng',
        birthYear: newSpouseBirthYear.trim() ? Number(newSpouseBirthYear) || newSpouseBirthYear.trim() : undefined,
        isAlive: newSpouseIsAlive,
        parentId: null,
        motherId: null,
        spouse: member.fullName,
        spouseIds: [member.id],
        role: 'member',
      };

      await onAddSpouseLink(member, newMemberObj, true);
      setIsAddSpouseModalOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi tạo phối ngẫu mới.');
    } finally {
      setIsSubmittingSpouse(false);
    }
  };

  // Find Children
  const children = useMemo(() => {
    return allMembers.filter(m => m.parentId === member.id || m.motherId === member.id);
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
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-bold font-serif-clan text-2xl shadow-xl shrink-0 overflow-hidden ${genderVisual.avatarBg}`}>
              {member.avatar ? (
                <img src={member.avatar} alt={member.fullName} className="w-full h-full object-cover" />
              ) : (
                genderVisual.title
              )}
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
              {father ? (
                <button
                  onClick={() => onSelectMember(father)}
                  className="font-bold text-stone-900 hover:text-amber-800 flex items-center gap-1 text-sm text-left group"
                >
                  <span>{father.fullName}</span>
                  <span className="text-xs text-stone-500 font-normal">({father.title || `Đời ${father.generation}`})</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <span className="text-stone-600 italic">Thủy Tổ khởi phái (Đời I)</span>
              )}
            </div>

            {/* Mother info */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <span className="text-stone-400 font-medium block mb-1">Thân mẫu (Mẹ):</span>
              {mother ? (
                <button
                  onClick={() => onSelectMember(mother)}
                  className="font-bold text-stone-900 hover:text-amber-800 flex items-center gap-1 text-sm text-left group"
                >
                  <span>{mother.fullName}</span>
                  <span className="text-xs text-stone-500 font-normal">({mother.title || `Đời ${mother.generation}`})</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : member.motherName ? (
                <span className="font-bold text-stone-900 text-sm">{member.motherName}</span>
              ) : (
                <span className="text-stone-500 italic text-sm">Chưa có thông tin</span>
              )}
            </div>

            {/* Spouse info */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 sm:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-stone-500 font-medium text-xs">Phối ngẫu (Vợ / Chồng):</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={handleOpenAddSpouseModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-2xs cursor-pointer hover:scale-105"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-500/20" />
                    <span>+ Thêm Phối Ngẫu</span>
                  </button>
                )}
              </div>
              {linkedSpouseMembers.length > 0 ? (
                <div className="space-y-2">
                  {linkedSpouseMembers.map((spMem) => (
                    <button
                      key={spMem.id}
                      onClick={() => onSelectMember(spMem)}
                      className="w-full text-left font-bold text-stone-900 hover:text-amber-800 flex items-center justify-between gap-1 text-sm group p-2 rounded-xl bg-white border border-stone-200/80 hover:border-rose-400 shadow-2xs transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20 shrink-0" />
                        <span className="truncate">{spMem.fullName}</span>
                        <span className="text-xs text-stone-500 font-normal shrink-0">
                          (Đời {spMem.generation} • {spMem.branch})
                        </span>
                        {spMem.birthYear && (
                          <span className="text-[11px] text-stone-400 font-normal hidden sm:inline">
                            • Sinh {spMem.birthYear}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  ))}
                </div>
              ) : member.spouseList && member.spouseList.length > 0 ? (
                <div className="space-y-1.5">
                  {member.spouseList.map((sp, sIdx) => (
                    <div key={sIdx} className="flex flex-wrap items-center gap-1.5 text-sm">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20 shrink-0" />
                      <span className="font-bold text-stone-900">{sp.name}</span>
                      {sp.note && (
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          {sp.note}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm text-stone-500 italic py-1">
                  <span>{member.spouse || 'Chưa liên kết phối ngẫu trong gia phả'}</span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={handleOpenAddSpouseModal}
                      className="text-xs font-semibold text-rose-700 hover:text-rose-800 hover:underline not-italic cursor-pointer"
                    >
                      Bấm để thêm ngay
                    </button>
                  )}
                </div>
              )}
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
                type="button"
                onClick={handleOpenAddSpouseModal}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Thêm hoặc liên kết phối ngẫu (vợ / chồng)"
              >
                <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-500/20" />
                <span>+ Thêm Phối Ngẫu</span>
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => onAddChild(member)}
                className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Thêm Con Cháu</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>

      {/* Sub-modal: Thêm Phối Ngẫu */}
      {isAddSpouseModalOpen && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-lg w-full overflow-hidden text-stone-900 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-900 via-[#381119] to-stone-900 text-white p-5 relative">
              <button
                type="button"
                onClick={() => setIsAddSpouseModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-900/60 hover:bg-stone-900 text-stone-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400/30" />
                <h3 className="text-lg font-bold font-serif-clan tracking-wide">
                  Thêm Phối Ngẫu (Vợ / Chồng)
                </h3>
              </div>
              <p className="text-xs text-rose-200">
                Liên kết phối ngẫu hai chiều cho: <strong className="text-white">{member.fullName}</strong> ({member.gender === 'male' ? 'Nam Đinh' : 'Nữ Giới'}, Đời {member.generation} - {member.branch})
              </p>
            </div>

            {/* Tab switchers */}
            <div className="p-3 bg-stone-100/80 border-b border-stone-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddSpouseTab('existing')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  addSpouseTab === 'existing'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Chọn người có sẵn</span>
              </button>

              <button
                type="button"
                onClick={() => setAddSpouseTab('new')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  addSpouseTab === 'new'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tạo người mới</span>
              </button>
            </div>

            {/* Tab 1: Chọn người có sẵn */}
            {addSpouseTab === 'existing' && (
              <div className="p-5 space-y-4">
                <p className="text-xs text-stone-600 leading-relaxed">
                  Tìm kiếm và chọn một thành viên đã có trong danh sách dòng họ để liên kết làm vợ/chồng. Hệ thống sẽ tự động cập nhật vào danh sách phối ngẫu của cả 2 người.
                </p>

                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={spouseSearchTerm}
                    onChange={(e) => setSpouseSearchTerm(e.target.value)}
                    placeholder="Tìm theo họ tên, chi phái, đời..."
                    className="w-full pl-9 pr-14 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:border-rose-500 focus:outline-none"
                    autoFocus
                  />
                  {spouseSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setSpouseSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-semibold cursor-pointer"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {/* Candidate list */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 border border-stone-200 rounded-2xl p-2 bg-stone-50/50">
                  {candidateExistingMembers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-stone-400 italic">
                      Không tìm thấy thành viên nào phù hợp. Bạn có thể chuyển sang tab &quot;Tạo người mới&quot; để tạo nhanh hồ sơ.
                    </div>
                  ) : (
                    candidateExistingMembers.map((cand) => {
                      const isSelected = selectedExistingMemberId === cand.id;
                      return (
                        <div
                          key={cand.id}
                          onClick={() => setSelectedExistingMemberId(cand.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-rose-50 border-rose-400 shadow-xs'
                              : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                          }`}
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              cand.gender === 'male' ? 'bg-blue-100 text-blue-900' : 'bg-rose-100 text-rose-900'
                            }`}>
                              {cand.gender === 'male' ? 'Nam' : 'Nữ'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-stone-900 truncate flex items-center gap-1.5">
                                <span>{cand.fullName}</span>
                                <span className="text-[11px] font-normal text-stone-500">
                                  (Đời {cand.generation} • {cand.branch})
                                </span>
                              </div>
                              <div className="text-[10.5px] text-stone-500">
                                {cand.birthYear ? `Sinh ${cand.birthYear}` : 'Chưa rõ năm sinh'} {cand.isAlive ? '• Còn sống' : '• Tiền nhân'}
                              </div>
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-rose-600 border-rose-600 text-white'
                              : 'border-stone-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedExistingMemberId && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600 shrink-0 fill-rose-500/20" />
                    <div>
                      Đã chọn: <strong>{allMembers.find(m => m.id === selectedExistingMemberId)?.fullName}</strong> — sẽ liên kết phối ngẫu hai chiều với <strong>{member.fullName}</strong>.
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setIsAddSpouseModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-700 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmLinkExisting}
                    disabled={!selectedExistingMemberId || isSubmittingSpouse}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {isSubmittingSpouse ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang liên kết...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Xác Nhận Liên Kết</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Tạo người mới */}
            {addSpouseTab === 'new' && (
              <form onSubmit={handleConfirmCreateNewSpouse} className="p-5 space-y-4">
                <p className="text-xs text-stone-600 leading-relaxed">
                  Nhập thông tin cơ bản để tạo nhanh hồ sơ thành viên mới và tự động liên kết làm phối ngẫu của <strong>{member.fullName}</strong> trong 1 thao tác duy nhất.
                </p>

                {/* Full name */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Họ và tên phối ngẫu: <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newSpouseName}
                    onChange={(e) => setNewSpouseName(e.target.value)}
                    placeholder={member.gender === 'male' ? "Ví dụ: Bà Hoàng Thị Minh Châu" : "Ví dụ: Ông Nguyễn Văn Hải"}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:border-rose-500 focus:outline-none font-medium"
                    autoFocus
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Giới tính: <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewSpouseGender('female')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        newSpouseGender === 'female'
                          ? 'bg-rose-100 border-rose-500 text-rose-950 shadow-2xs'
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>Nữ Giới (Bà)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewSpouseGender('male')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        newSpouseGender === 'male'
                          ? 'bg-blue-100 border-blue-500 text-blue-950 shadow-2xs'
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Nam Đinh (Ông)</span>
                    </button>
                  </div>
                </div>

                {/* Birth year and IsAlive */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Năm sinh (Tùy chọn):
                    </label>
                    <input
                      type="text"
                      value={newSpouseBirthYear}
                      onChange={(e) => setNewSpouseBirthYear(e.target.value)}
                      placeholder={member.birthYear ? `Khoảng ${member.birthYear}` : "Ví dụ: 1972"}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Tình trạng:
                    </label>
                    <div className="flex items-center gap-2 h-9">
                      <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newSpouseIsAlive}
                          onChange={(e) => setNewSpouseIsAlive(e.target.checked)}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span className={newSpouseIsAlive ? "font-bold text-emerald-700" : "text-stone-500"}>
                          {newSpouseIsAlive ? 'Còn sống' : 'Đã tạ thế'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  * Hồ sơ sẽ được tự động gán cùng Đời thứ {member.generation}, cùng {member.branch}, và tự động liên kết 2 chiều với <strong>{member.fullName}</strong>.
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setIsAddSpouseModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-700 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSpouse || !newSpouseName.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {isSubmittingSpouse ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang tạo & liên kết...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tạo & Liên Kết Ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
