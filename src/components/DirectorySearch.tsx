import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Phone, 
  MapPin, 
  UserCheck, 
  Filter, 
  Layers, 
  Building2, 
  Heart, 
  Award, 
  ChevronRight, 
  ExternalLink, 
  MessageCircle, 
  Download, 
  Printer, 
  Users, 
  Flame, 
  Calendar,
  Lock,
  LogIn
} from 'lucide-react';
import { ClanMember, ClanInfo, Gender, UserProfile } from '../types';
import { calculateAgeInfo, getGenderVisuals, calculateClanStats, getMemberOrder } from '../utils/genealogyUtils';

interface DirectorySearchProps {
  members: ClanMember[];
  clanInfo: ClanInfo;
  onSelectMember: (member: ClanMember) => void;
  onOpenZalo: () => void;
  currentUserProfile?: UserProfile | null;
  onOpenAuth?: () => void;
}

export const DirectorySearch: React.FC<DirectorySearchProps> = ({
  members,
  clanInfo,
  onSelectMember,
  onOpenZalo,
  currentUserProfile,
  onOpenAuth,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [genFilter, setGenFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alive' | 'deceased'>('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const stats = useMemo(() => calculateClanStats(members), [members]);

  const branches = useMemo(() => {
    return Array.from(new Set(members.map(m => m.branch).filter(Boolean)));
  }, [members]);

  const locations = useMemo(() => {
    const locs = members.map(m => m.address).filter(Boolean) as string[];
    const cities = new Set<string>();
    locs.forEach(l => {
      if (l.includes('Hà Nội')) cities.add('Hà Nội');
      else if (l.includes('Hưng Yên')) cities.add('Hưng Yên');
      else if (l.includes('Hồ Chí Minh') || l.includes('TP.HCM')) cities.add('TP. Hồ Chí Minh');
      else if (l.includes('Đà Nẵng')) cities.add('Đà Nẵng');
      else if (l.includes('Bắc Ninh')) cities.add('Bắc Ninh');
      else if (l.includes('Thái Nguyên')) cities.add('Thái Nguyên');
      else if (l.includes('Vũng Tàu')) cities.add('Vũng Tàu');
    });
    return Array.from(cities);
  }, [members]);

  const filteredMembers = useMemo(() => {
    const list = members.filter((m) => {
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = m.fullName.toLowerCase().includes(q);
        const matchPhone = m.phone ? m.phone.includes(q) : false;
        const matchSpouse = m.spouse ? m.spouse.toLowerCase().includes(q) : false;
        const matchAddr = m.address ? m.address.toLowerCase().includes(q) : false;
        const matchJob = m.occupation ? m.occupation.toLowerCase().includes(q) : false;
        const matchTitle = m.title ? m.title.toLowerCase().includes(q) : false;
        if (!matchName && !matchPhone && !matchSpouse && !matchAddr && !matchJob && !matchTitle) {
          return false;
        }
      }

      // Gender filter
      if (genderFilter !== 'all' && m.gender !== genderFilter) {
        return false;
      }

      // Branch
      if (branchFilter !== 'all' && m.branch !== branchFilter) {
        return false;
      }

      // Generation
      if (genFilter !== 'all' && m.generation !== genFilter) {
        return false;
      }

      // Status
      if (statusFilter === 'alive' && !m.isAlive) return false;
      if (statusFilter === 'deceased' && m.isAlive) return false;

      // Location
      if (locationFilter !== 'all') {
        if (!m.address || !m.address.includes(locationFilter)) return false;
      }

      return true;
    });

    // Sort: Generation ascending -> Order in family ascending -> ID alphabetical
    return list.sort((a, b) => {
      if (a.generation !== b.generation) {
        return a.generation - b.generation;
      }
      const aOrder = getMemberOrder(a);
      const bOrder = getMemberOrder(b);
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return a.id.localeCompare(b.id);
    });
  }, [members, searchTerm, genderFilter, branchFilter, genFilter, statusFilter, locationFilter]);

  const exportCSV = () => {
    const headers = ["Họ và Tên", "Giới Tính", "Đời Thứ", "Chi Nhánh", "Tuổi / Niên Đại", "Tình Trạng", "Số Điện Thoại", "Địa Chỉ", "Nghề Nghiệp"];
    const rows = filteredMembers.map(m => {
      const ageInfo = calculateAgeInfo(m.birthYear, m.deathYear, m.isAlive);
      return [
        m.fullName,
        m.gender === 'male' ? 'Nam ♂' : 'Nữ ♀',
        `Đời ${m.generation}`,
        m.branch,
        `"${ageInfo.formattedText}"`,
        m.isAlive ? 'Còn sống' : 'Tiền nhân',
        m.phone || '',
        `"${m.address || ''}"`,
        `"${m.occupation || ''}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `danh_ba_gia_pha_${clanInfo.clanSurname}_toc.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentUserProfile) {
    return (
      <div className="min-h-[75vh] bg-stone-100 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden text-center p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-700 shadow-inner">
            <Search className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold font-serif-clan tracking-wide">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Bảo Mật Danh Bạ Nội Tộc</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-clan text-stone-900">
              Vui lòng đăng nhập để tra cứu danh bạ con cháu
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Danh bạ liên lạc, số điện thoại và địa chỉ của các thế hệ trong dòng họ {clanInfo.clanSurname} được bảo mật cho thành viên nội tộc.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.02]"
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>Đăng Nhập (Google / Email)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-16">
      
      {/* Header Banner */}
      <div className="bg-[#24140e] text-amber-50 border-b border-amber-900/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 font-serif-clan">
              <span>Hệ Thống Tra Cứu Danh Bạ Huyết Thống</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-clan text-white mt-1">
              Danh Bạ Con Cháu — {clanInfo.name}
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-1">
              Tra cứu đầy đủ thông tin: Giới tính (Nam ♂ / Nữ ♀), Tuổi hiện tại / Hưởng thọ, Số điện thoại và Ngành chi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 border border-amber-900/60 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Xuất File CSV / Excel</span>
            </button>

            <button
              onClick={onOpenZalo}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/30"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Zalo Dòng Họ</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-amber-900/40 flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-stone-300">
          <div className="flex items-center gap-1.5 bg-stone-900/80 px-2.5 py-1 rounded-lg border border-amber-900/40">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Tổng: <strong className="text-white">{stats.total}</strong> thành viên</span>
          </div>

          <div className="flex items-center gap-1.5 bg-sky-950/60 text-sky-200 px-2.5 py-1 rounded-lg border border-sky-800/50">
            <span>Nam ♂:</span>
            <strong className="text-white">{stats.male} ({stats.malePercent}%)</strong>
          </div>

          <div className="flex items-center gap-1.5 bg-rose-950/60 text-rose-200 px-2.5 py-1 rounded-lg border border-rose-800/50">
            <span>Nữ ♀:</span>
            <strong className="text-white">{stats.female} ({stats.femalePercent}%)</strong>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-950/60 text-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-800/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Còn sống: <strong className="text-white">{stats.living}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-900/80 text-stone-300 px-2.5 py-1 rounded-lg border border-amber-900/40">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Tiền nhân: <strong className="text-white">{stats.deceased}</strong></span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Search & Filter Controls Card */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-md space-y-4">
          
          {/* Main Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Nhập tên thành viên, danh xưng, số điện thoại, nơi ở, hoặc nghề nghiệp để tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-3 text-stone-400 hover:text-stone-700 text-sm font-semibold"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Quick Filter Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
            
            {/* Quick Gender Filter (Tất cả, Nam ♂, Nữ ♀) */}
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Giới tính:</label>
              <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200">
                <button
                  type="button"
                  onClick={() => setGenderFilter('all')}
                  className={`flex-1 py-1 rounded-lg text-center font-bold transition-all text-[11px] ${
                    genderFilter === 'all' ? 'bg-amber-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('male')}
                  className={`flex-1 py-1 rounded-lg text-center font-bold transition-all text-[11px] ${
                    genderFilter === 'male' ? 'bg-sky-600 text-white shadow-xs' : 'text-sky-700 hover:bg-sky-100'
                  }`}
                >
                  Nam ♂
                </button>
                <button
                  type="button"
                  onClick={() => setGenderFilter('female')}
                  className={`flex-1 py-1 rounded-lg text-center font-bold transition-all text-[11px] ${
                    genderFilter === 'female' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Nữ ♀
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Tình trạng:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none"
              >
                <option value="all">Tất cả ({members.length})</option>
                <option value="alive">Đang sinh sống ({stats.living})</option>
                <option value="deceased">Tiền nhân ({stats.deceased})</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Chi phái:</label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none"
              >
                <option value="all">Tất cả các Chi</option>
                {branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Generation Filter */}
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Thế hệ (Đời):</label>
              <select
                value={genFilter}
                onChange={(e) => setGenFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none"
              >
                <option value="all">Tất cả thế hệ (1 - 7)</option>
                <option value={1}>Đời 1 (Cụ Thủy Tổ)</option>
                <option value={2}>Đời 2</option>
                <option value={3}>Đời 3</option>
                <option value={4}>Đời 4</option>
                <option value={5}>Đời 5 (Đương đại)</option>
                <option value={6}>Đời 6 (Thế hệ trẻ)</option>
                <option value={7}>Đời 7 (Hậu duệ)</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-stone-600 font-semibold mb-1">Tỉnh / Thành phố:</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none"
              >
                <option value="all">Tất cả địa phương</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Result Count and Clear Filters */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-600">
            <div>
              Tìm thấy <strong>{filteredMembers.length}</strong> kết quả phù hợp
            </div>
            {(searchTerm || genderFilter !== 'all' || branchFilter !== 'all' || genFilter !== 'all' || statusFilter !== 'all' || locationFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setGenderFilter('all');
                  setBranchFilter('all');
                  setGenFilter('all');
                  setStatusFilter('all');
                  setLocationFilter('all');
                }}
                className="text-amber-800 font-semibold hover:underline"
              >
                Đặt lại toàn bộ bộ lọc
              </button>
            )}
          </div>

        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member) => {
            const ageInfo = calculateAgeInfo(member.birthYear, member.deathYear, member.isAlive);
            const genderVisual = getGenderVisuals(member.gender, member.generation);

            return (
              <div
                key={member.id}
                onClick={() => onSelectMember(member)}
                className="bg-white rounded-2xl border border-stone-200 hover:border-amber-500 p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
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
                    {member.phone && (
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

                    {member.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span className="truncate">{member.address}</span>
                      </div>
                    )}

                    {member.occupation && (
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

                    {member.spouse && (
                      <div className="flex items-center gap-2 text-stone-500">
                        <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">Phối ngẫu: {member.spouse}</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-amber-800 font-semibold group-hover:underline flex items-center gap-1">
                    Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                  </span>

                  {member.phone && (
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
          })}
        </div>

      </div>

    </div>
  );
};
