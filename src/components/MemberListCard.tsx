import React, { useMemo } from 'react';
import { 
  Heart, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar, 
  ChevronRight 
} from 'lucide-react';
import { ClanMember } from '../types';
import { calculateAgeInfo, getGenderVisuals } from '../utils/genealogyUtils';

export interface MemberListCardProps {
  member: ClanMember;
  allMembers?: ClanMember[];
  showPhone?: boolean;
  showOccupation?: boolean;
  showSpouse?: boolean;
  showAddress?: boolean;
  onClick?: () => void;
  variant?: 'generation' | 'directory';
  className?: string;
}

export const MemberListCard: React.FC<MemberListCardProps> = React.memo(({
  member,
  allMembers = [],
  showPhone = false,
  showOccupation = false,
  showSpouse = true,
  showAddress = true,
  onClick,
  variant,
  className = '',
}) => {
  // Logic tính tuổi và thông tin sinh/mất
  const ageInfo = calculateAgeInfo(member.birthYear, member.deathYear, member.isAlive);

  // Màu sắc và nhãn giới tính
  const genderVisual = getGenderVisuals(member.gender, member.generation);

  // Xử lý tên phối ngẫu thống nhất: ưu tiên spouseIds → spouseList → spouse cũ
  const spouseText = useMemo(() => {
    const spNamesFromIds = (member.spouseIds && member.spouseIds.length > 0)
      ? member.spouseIds.map(sid => allMembers.find(x => x.id === sid)?.fullName).filter(Boolean)
      : [];

    if (spNamesFromIds.length > 0) {
      return spNamesFromIds.join(', ');
    }

    if (member.spouseList && member.spouseList.length > 0) {
      return member.spouseList.map(s => s.name + (s.note ? ` (${s.note})` : '')).join(', ');
    }

    if (member.spouse && !/^[0-9a-f-]{36}$/i.test(member.spouse.trim())) {
      return member.spouse;
    }

    return '';
  }, [member.spouseIds, member.spouseList, member.spouse, allMembers]);

  // Xác định thân mẫu chuẩn qua giới tính thật (không phụ thuộc tên trường)
  const motherText = useMemo(() => {
    const linkedParent = member.parentId ? allMembers.find(m => m.id === member.parentId) : null;
    const linkedMotherById = member.motherId ? allMembers.find(m => m.id === member.motherId) : null;

    const father = linkedParent?.gender === 'male' ? linkedParent : (linkedMotherById?.gender === 'male' ? linkedMotherById : null);
    const mother = linkedParent?.gender === 'female' ? linkedParent : (linkedMotherById?.gender === 'female' ? linkedMotherById : null);

    if (mother?.fullName) {
      return mother.fullName;
    }
    if (member.motherName) {
      const trimmedMotherName = member.motherName.trim();
      const fatherFullName = father?.fullName?.trim();
      if (!fatherFullName || trimmedMotherName.toLowerCase() !== fatherFullName.toLowerCase()) {
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedMotherName)) {
          return allMembers.find(m => m.id === trimmedMotherName)?.fullName || '';
        }
        return trimmedMotherName;
      }
    }
    return '';
  }, [member.parentId, member.motherId, member.motherName, allMembers]);

  // Xác định layout hiển thị (Danh bạ vs Danh sách theo đời)
  const isDirectory = variant === 'directory' || (variant === undefined && Boolean(showPhone || showOccupation));

  // Layout 1: Tra Cứu Danh Bạ (Directory variant)
  if (isDirectory) {
    return (
      <div
        onClick={onClick}
        className={`bg-white rounded-2xl border border-stone-200 hover:border-amber-500 p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between ${className}`}
      >
        <div>
          {/* Top Info */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold font-serif-clan uppercase ${
                member.generation === 1 
                  ? 'bg-red-800 text-amber-100'
                  : 'bg-amber-100 text-amber-900'
              }`}>
                Đời {member.generation}
              </span>

              {/* Gender Badge */}
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 ${genderVisual.badgeClass}`}>
                <span>{genderVisual.symbol}</span>
                <span>{member.gender === 'male' ? 'Nam Đinh' : 'Nữ Giới'}</span>
              </span>

              <span className="text-xs font-semibold text-stone-600 truncate max-w-[90px]">
                {member.branch}
              </span>
            </div>

            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              member.isAlive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
            }`}>
              {member.isAlive ? '• Còn sống' : '• Tiền nhân'}
            </span>
          </div>

          {/* Main Name & Title */}
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold font-serif-clan text-base shrink-0 shadow-xs ${genderVisual.avatarBg}`}>
              {genderVisual.title}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-lg font-serif-clan text-stone-900 group-hover:text-amber-800 transition-colors truncate">
                  {member.fullName}
                </h3>
                {member.title && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                    {member.title}
                  </span>
                )}
              </div>

              {/* Accurate Age / Lifespan Display */}
              <div className="text-xs font-semibold text-stone-700 mt-1">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                  member.isAlive 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/70' 
                    : 'bg-amber-50 text-amber-900 border border-amber-200/70'
                }`}>
                  {ageInfo.formattedText}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Info details */}
          <div className="mt-4 space-y-1.5 text-xs text-stone-600 border-t border-stone-100 pt-3">
            {showPhone && member.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <a 
                  href={`tel:${member.phone}`} 
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-stone-900 hover:text-amber-800 hover:underline"
                >
                  {member.phone}
                </a>
              </div>
            )}

            {showAddress && member.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span className="truncate">{member.address}</span>
              </div>
            )}

            {showOccupation && member.occupation && (
              <div className="flex items-center gap-2 text-stone-500">
                <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{member.occupation}</span>
              </div>
            )}

            {!member.isAlive && member.lunarDeathDate && (
              <div className="flex items-center gap-2 text-red-800 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-red-700 shrink-0" />
                <span>Kỵ nhật: {member.lunarDeathDate}</span>
              </div>
            )}

            {motherText && (
              <div className="flex items-center gap-2 text-rose-800 text-xs">
                <span className="font-semibold text-rose-600 shrink-0">Mẹ:</span>
                <span className="truncate font-medium">{motherText}</span>
              </div>
            )}

            {showSpouse && spouseText && (
              <div className="flex items-center gap-2 text-stone-500">
                <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">Phối ngẫu: {spouseText}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          <span className="text-amber-800 font-semibold group-hover:underline flex items-center gap-1">
            Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
          </span>

          {showPhone && member.phone && (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <a
                href={`tel:${member.phone}`}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium flex items-center gap-1"
                title="Gọi điện thoại"
              >
                <Phone className="w-3 h-3" />
                <span>Gọi</span>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Layout 2: Danh Sách Theo Đời (Generation variant)
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-stone-50 hover:bg-amber-50/70 border border-stone-200 hover:border-amber-400 transition-all cursor-pointer group shadow-xs hover:shadow-md ${className}`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
            {member.branch}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${genderVisual.badgeClass}`}>
            {genderVisual.label}
          </span>
        </div>

        <span className={`text-[11px] font-bold ${member.isAlive ? 'text-emerald-700' : 'text-stone-500'}`}>
          {member.isAlive ? '• Còn sống' : '• Tiền nhân'}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold font-serif-clan text-xs shadow-xs ${genderVisual.avatarBg}`}>
          {genderVisual.title}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-base font-serif-clan text-stone-900 group-hover:text-amber-900 transition-colors truncate">
            {member.fullName} {member.title ? `(${member.title})` : ''}
          </h4>

          <div className="text-xs font-semibold text-stone-700 mt-1">
            {ageInfo.formattedText}
          </div>

          {motherText && (
            <div className="text-xs text-rose-800 mt-1 truncate flex items-center gap-1">
              <span className="font-semibold text-rose-600 shrink-0">Mẹ:</span>
              <span className="truncate font-medium">{motherText}</span>
            </div>
          )}

          {showSpouse && spouseText && (
            <div className="text-xs text-stone-500 mt-1 truncate flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-500 shrink-0" />
              <span title={spouseText}>
                Phối ngẫu: {spouseText}
              </span>
            </div>
          )}

          {showAddress && member.address && (
            <div className="text-xs text-stone-500 mt-0.5 truncate">
              Nơi ở: {member.address}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MemberListCard.displayName = 'MemberListCard';

export default MemberListCard;
