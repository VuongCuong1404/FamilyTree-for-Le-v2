import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  Download, 
  Printer, 
  Users, 
  Flame, 
  Calendar, 
  Lock, 
  LogIn,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { ClanMember, ClanInfo, Gender, UserProfile, Role } from '../types';
import { 
  calculateAgeInfo, 
  getGenderVisuals, 
  calculateClanStats, 
  getMemberOrder, 
  compareMembersForList,
  getGenerationRomanTitle,
  removeVietnameseAccents
} from '../utils/genealogyUtils';
import { MemberListCard } from './MemberListCard';

interface DirectorySearchProps {
  members: ClanMember[];
  clanInfo: ClanInfo;
  onSelectMember: (member: ClanMember) => void;
  onOpenZalo: () => void;
  currentUserProfile?: UserProfile | null;
  currentUserRole?: Role;
  onOpenAuth?: () => void;
}

// Định nghĩa kiểu hàng ảo (Virtual Item) để virtualize cả header đời và hàng thẻ thành viên
type DirectoryVirtualItem =
  | {
      type: 'generation_header';
      id: string;
      genNum: number;
      romanTitle: string;
      count: number;
      isCollapsed: boolean;
    }
  | {
      type: 'member_row';
      id: string;
      members: ClanMember[];
      variant: 'directory' | 'generation';
      genNum?: number;
    };

export const DirectorySearch: React.FC<DirectorySearchProps> = ({
  members,
  clanInfo,
  onSelectMember,
  onOpenZalo,
  currentUserProfile,
  currentUserRole,
  onOpenAuth,
}) => {
  // Chế độ hiển thị: Mặc định 'by_generation' (Theo đời), tùy chọn 'flat' (Danh sách phẳng)
  const [viewMode, setViewMode] = useState<'by_generation' | 'flat'>('by_generation');

  // Input tìm kiếm thực tế & tìm kiếm đã debounce 250ms để tối ưu hiệu năng
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [genFilter, setGenFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alive' | 'deceased'>('all');
  const [locationFilter, setLocationFilter] = useState('all');
  // Sắp xếp: Mặc định "Theo đời & chi", tùy chọn "Theo tên A-Z"
  const [sortBy, setSortBy] = useState<'generation_branch' | 'name_asc'>('generation_branch');

  // Trạng thái thu gọn/mở rộng từng thế hệ (đời) trong chế độ 'by_generation'
  const [collapsedGens, setCollapsedGens] = useState<Set<number>>(new Set());

  // Trạng thái mở rộng / thu gọn thanh tìm kiếm và bộ lọc (mặc định mở đầy đủ)
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Ref cho ô input tìm kiếm và trạng thái cuộn hiển thị nút FAB
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showScrollSearch, setShowScrollSearch] = useState(false);
  const prevPastThresholdRef = useRef(false);

  // Đo chiều cao thanh sticky để tạo spacer khi sticky active
  const stickyBarRef = useRef<HTMLDivElement>(null);
  const [stickyHeight, setStickyHeight] = useState(56);
  const [isStickyActive, setIsStickyActive] = useState(false);

  // Theo dõi số cột responsive (1 cột trên mobile, 2 trên tablet md, 3 trên desktop lg)
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const updateCols = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 768) {
        setColumns(1);
      } else if (window.innerWidth < 1024) {
        setColumns(2);
      } else {
        setColumns(3);
      }
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  // Debounce search input 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Tính số thế hệ tối đa động từ danh sách thành viên (tối thiểu là 7)
  const maxGen = useMemo(() => {
    const gens = members.map(m => m.generation).filter((g): g is number => typeof g === 'number' && !isNaN(g));
    return Math.max(7, ...gens);
  }, [members]);

  // Options thế hệ từ đời 1 đến maxGen
  const generationOptions = useMemo(() => {
    const list: number[] = [];
    for (let i = 1; i <= maxGen; i++) {
      list.push(i);
    }
    return list;
  }, [maxGen]);

  // Kiểm tra đang có bất kỳ bộ lọc nào được áp dụng không
  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    debouncedSearch.trim() ||
    genderFilter !== 'all' ||
    branchFilter !== 'all' ||
    genFilter !== 'all' ||
    statusFilter !== 'all' ||
    locationFilter !== 'all' ||
    sortBy !== 'generation_branch'
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const isPastThreshold = scrollY > 120;
      setShowScrollSearch(isPastThreshold);
      setIsStickyActive(isPastThreshold);

      // Khi ở đầu trang (<= 120px), luôn mở rộng đầy đủ
      if (scrollY <= 120) {
        setFiltersExpanded(true);
      } else if (!prevPastThresholdRef.current && isPastThreshold) {
        // Khi cuộn từ trên xuống vượt mốc ~120px: tự động thu gọn nếu không đang focus ô tìm kiếm
        if (document.activeElement !== searchInputRef.current) {
          setFiltersExpanded(false);
        }
      }
      prevPastThresholdRef.current = isPastThreshold;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Đo và tự động cập nhật chiều cao thực tế của thanh sticky khi chuyển đổi thu gọn / mở rộng
  useEffect(() => {
    const updateStickyHeight = () => {
      if (stickyBarRef.current) {
        const h = stickyBarRef.current.offsetHeight;
        if (h > 0) {
          setStickyHeight(h);
        }
      }
    };

    updateStickyHeight();

    let ro: ResizeObserver | null = null;
    if (stickyBarRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateStickyHeight();
      });
      ro.observe(stickyBarRef.current);
    }

    window.addEventListener('resize', updateStickyHeight);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateStickyHeight);
    };
  }, [filtersExpanded, showScrollSearch]);

  const handleScrollToSearch = () => {
    // Khi bấm nút kính lúp → setFiltersExpanded(true)
    setFiltersExpanded(true);

    // Sau đó scrollIntoView ô input với { behavior: 'smooth', block: 'start' }
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try {
          searchInputRef.current.focus({ preventScroll: true });
        } catch {
          searchInputRef.current.focus();
        }

        // Đảm bảo khi bàn phím ảo mở trên mobile, ô input vẫn nhìn thấy rõ
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    }, 60);
  };

  const handleOpenFilters = () => {
    setFiltersExpanded(true);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try {
          searchInputRef.current.focus({ preventScroll: true });
        } catch {
          searchInputRef.current.focus();
        }
      }
    }, 60);
  };

  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearch('');
    setGenderFilter('all');
    setBranchFilter('all');
    setGenFilter('all');
    setStatusFilter('all');
    setLocationFilter('all');
    setSortBy('generation_branch');
  }, []);

  // Các chi phái duy nhất trong danh sách
  const branches = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => {
      if (m.branch) set.add(m.branch);
    });
    return Array.from(set);
  }, [members]);

  // Các địa phương (tỉnh/thành) duy nhất trích từ địa chỉ
  const locations = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => {
      if (m.address) {
        const parts = m.address.split(',');
        const city = parts[parts.length - 1]?.trim();
        if (city && city.length > 2) set.add(city);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [members]);

  const stats = useMemo(() => {
    return calculateClanStats(members);
  }, [members]);

  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'editor';

  // Lọc và sắp xếp danh sách thành viên với debouncedSearch
  const filteredMembers = useMemo(() => {
    const list = members.filter(m => {
      // Search term query
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const qUnaccent = removeVietnameseAccents(q);

        const checkText = (text?: string | null) => {
          if (!text) return false;
          const lower = text.toLowerCase();
          return lower.includes(q) || removeVietnameseAccents(lower).includes(qUnaccent);
        };

        const matchName = checkText(m.fullName);
        const matchPhone = m.phone ? m.phone.includes(q) : false;
        const matchSpouse = checkText(m.spouse) || Boolean(m.spouseList && m.spouseList.some(s => checkText(s.name) || checkText(s.note)));
        const matchSpouseIds = Boolean(m.spouseIds && m.spouseIds.some(sid => {
          const sp = members.find(x => x.id === sid);
          return checkText(sp?.fullName);
        }));
        const matchAddr = checkText(m.address);
        const matchJob = checkText(m.occupation);
        const matchTitle = checkText(m.title);
        const matchBranch = checkText(m.branch);

        if (!matchName && !matchPhone && !matchSpouse && !matchSpouseIds && !matchAddr && !matchJob && !matchTitle && !matchBranch) {
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

    // Sắp xếp danh sách thành viên:
    if (sortBy === 'name_asc') {
      return [...list].sort((a, b) => {
        const nameComp = (a.fullName || '').trim().localeCompare((b.fullName || '').trim(), 'vi');
        if (nameComp !== 0) return nameComp;
        return compareMembersForList(a, b);
      });
    }

    // Mặc định: Sắp xếp theo đời & chi phái chuẩn phả hệ họ tộc
    return [...list].sort(compareMembersForList);
  }, [members, debouncedSearch, genderFilter, branchFilter, genFilter, statusFilter, locationFilter, sortBy]);

  // Phân nhóm theo đời (generation)
  const generationGroups = useMemo(() => {
    const groups: { [gen: number]: ClanMember[] } = {};
    filteredMembers.forEach((m) => {
      if (!groups[m.generation]) groups[m.generation] = [];
      groups[m.generation].push(m);
    });
    return groups;
  }, [filteredMembers]);

  const generationKeys = useMemo(() => {
    return Object.keys(generationGroups)
      .map(Number)
      .sort((a, b) => a - b);
  }, [generationGroups]);

  // Toggle thu gọn/mở rộng từng thế hệ
  const toggleGenCollapse = useCallback((genNum: number) => {
    setCollapsedGens((prev) => {
      const next = new Set(prev);
      if (next.has(genNum)) {
        next.delete(genNum);
      } else {
        next.add(genNum);
      }
      return next;
    });
  }, []);

  const collapseAllGens = useCallback(() => {
    setCollapsedGens(new Set(generationKeys));
  }, [generationKeys]);

  const expandAllGens = useCallback(() => {
    setCollapsedGens(new Set());
  }, []);

  // Tạo danh sách Virtual Items tùy theo viewMode
  const virtualItems = useMemo<DirectoryVirtualItem[]>(() => {
    const items: DirectoryVirtualItem[] = [];

    if (viewMode === 'by_generation') {
      generationKeys.forEach((genNum) => {
        const list = generationGroups[genNum] || [];
        if (list.length === 0) return;
        const isCollapsed = collapsedGens.has(genNum);
        const romanTitle = getGenerationRomanTitle(genNum);

        // Header của đời
        items.push({
          type: 'generation_header',
          id: `gen-header-${genNum}`,
          genNum,
          romanTitle,
          count: list.length,
          isCollapsed,
        });

        // Các hàng thành viên (chỉ render nếu đời chưa bị thu gọn)
        if (!isCollapsed) {
          for (let i = 0; i < list.length; i += columns) {
            items.push({
              type: 'member_row',
              id: `gen-${genNum}-row-${i}`,
              members: list.slice(i, i + columns),
              variant: 'generation',
              genNum,
            });
          }
        }
      });
    } else {
      // Danh sách phẳng
      for (let i = 0; i < filteredMembers.length; i += columns) {
        items.push({
          type: 'member_row',
          id: `flat-row-${i}`,
          members: filteredMembers.slice(i, i + columns),
          variant: 'directory',
        });
      }
    }

    return items;
  }, [viewMode, generationKeys, generationGroups, collapsedGens, filteredMembers, columns]);

  // Vùng chứa danh sách và Virtualizer cuộn toàn trang (Window Virtualizer)
  const parentRef = useRef<HTMLDivElement>(null);
  const [parentOffsetTop, setParentOffsetTop] = useState(0);

  useEffect(() => {
    const updateOffset = () => {
      if (parentRef.current) {
        setParentOffsetTop(parentRef.current.offsetTop);
      }
    };
    updateOffset();
    const t = setTimeout(updateOffset, 150);
    window.addEventListener('resize', updateOffset);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updateOffset);
    };
  }, [filtersExpanded, isStickyActive, viewMode, filteredMembers.length]);

  const rowVirtualizer = useWindowVirtualizer({
    count: virtualItems.length,
    estimateSize: (index) => {
      const item = virtualItems[index];
      if (!item) return 200;
      if (item.type === 'generation_header') return 76;
      return item.variant === 'directory' ? 275 : 185;
    },
    overscan: 4,
    scrollMargin: parentRef.current?.offsetTop ?? parentOffsetTop,
  });

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
    link.setAttribute("download", `danh_ba_thanh_vien.csv`);
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
              Danh bạ liên lạc, số điện thoại và địa chỉ của các thế hệ được bảo mật cho thành viên nội tộc.
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
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-32 sm:pb-36">
      
      {/* Header Banner */}
      <div className="bg-[#24140e] text-amber-50 border-b border-amber-900/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 font-serif-clan">
              <span>Hệ Thống Tra Cứu Danh Bạ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-clan text-white mt-1">
              Danh Bạ Con Cháu
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-1">
              Tra cứu đầy đủ thông tin: Giới tính (Nam ♂ / Nữ ♀), Tuổi hiện tại / Hưởng thọ, Số điện thoại và Ngành chi.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* View Mode Toggle Switcher [Theo đời] [Danh sách phẳng] */}
            <div className="bg-stone-900/90 rounded-2xl p-1 flex items-center border border-amber-900/60 text-xs shadow-md">
              <button
                type="button"
                onClick={() => setViewMode('by_generation')}
                className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'by_generation'
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'text-stone-300 hover:text-amber-200'
                }`}
                title="Xem danh bạ gom nhóm theo từng đời (Thế hệ)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Theo Đời</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('flat')}
                className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'flat'
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'text-stone-300 hover:text-amber-200'
                }`}
                title="Xem danh sách liên tục dạng phẳng"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Danh Sách Phẳng</span>
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={exportCSV}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 border border-amber-900/60 text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all hover:scale-105"
                title="Tải bảng danh bạ về máy tính dạng tệp CSV / Excel"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Xuất File CSV / Excel</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-stone-900/80 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-amber-900/40">
            <span className="text-stone-400 text-xs font-medium block">Tổng thành viên</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-serif-clan text-amber-300">{stats.total}</span>
              <span className="text-[11px] text-stone-400">người</span>
            </div>
          </div>

          <div className="bg-stone-900/80 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-amber-900/40">
            <span className="text-stone-400 text-xs font-medium block">Đang sinh sống</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-serif-clan text-emerald-400">{stats.living}</span>
              <span className="text-[11px] text-stone-400">người</span>
            </div>
          </div>

          <div className="bg-stone-900/80 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-amber-900/40">
            <span className="text-stone-400 text-xs font-medium block">Tỷ lệ giới tính</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-bold text-sky-400">{stats.male} Nam</span>
              <span className="text-stone-500">·</span>
              <span className="text-sm font-bold text-rose-400">{stats.female} Nữ</span>
            </div>
          </div>

          <div className="bg-stone-900/80 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-amber-900/40">
            <span className="text-stone-400 text-xs font-medium block">Quy mô thế hệ</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-serif-clan text-amber-400">{maxGen}</span>
              <span className="text-[11px] text-stone-400">đời</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Sticky Filter / Search Toolbar (Sticky, solid white, shadow, z-20) */}
        <div 
          ref={stickyBarRef}
          className="sticky top-0 z-20 transition-all duration-200"
        >
          {!filtersExpanded ? (
            /* Slim Sticky Bar khi thu gọn (Solid white, border rõ ràng, shadow) */
            <div className="bg-white rounded-2xl border border-stone-300 shadow-md px-3.5 py-2.5 sm:px-4 sm:py-3 transition-all flex items-center justify-between gap-3">
              <div 
                onClick={handleOpenFilters}
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
                title="Nhấn để mở đầy đủ thanh tìm kiếm & bộ lọc"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 border border-amber-200/60">
                  <Search className="w-4 h-4 text-amber-800" />
                </div>
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-stone-800 truncate">
                    {searchTerm.trim() ? (
                      <>Từ khóa: <strong className="text-amber-900 font-bold">"{searchTerm}"</strong></>
                    ) : (
                      'Tìm kiếm & Lọc danh bạ'
                    )}
                  </span>
                  <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 text-[11px] font-bold">
                    {filteredMembers.length} kết quả
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-bold">
                    {viewMode === 'by_generation' ? 'Theo đời' : 'Danh sách phẳng'}
                  </span>
                  {hasActiveFilters && (
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100/90 text-amber-900 border border-amber-200/70 text-[10px] font-bold">
                      Đang lọc
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Mode Switch in Slim Sticky */}
                <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMode('by_generation');
                    }}
                    className={`p-1.5 rounded-md transition-all ${
                      viewMode === 'by_generation'
                        ? 'bg-amber-800 text-white shadow-xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                    title="Chế độ theo đời"
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMode('flat');
                    }}
                    className={`p-1.5 rounded-md transition-all ${
                      viewMode === 'flat'
                        ? 'bg-amber-800 text-white shadow-xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                    title="Chế độ danh sách phẳng"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetFilters();
                    }}
                    className="px-2 py-1 text-xs text-amber-800 hover:text-amber-900 font-semibold hover:underline hidden sm:block cursor-pointer"
                  >
                    Xóa lọc
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-800 to-amber-700 hover:from-amber-900 hover:to-amber-800 active:scale-95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  title="Mở thanh tìm kiếm và bộ lọc"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Lọc / Mở</span>
                </button>
              </div>
            </div>
          ) : (
            /* Full Search & Filter Controls Card (Solid white, border rõ ràng, shadow) */
            <div 
              style={{ scrollMarginTop: '90px' }}
              className="scroll-mt-[90px] bg-white rounded-2xl sm:rounded-3xl border border-stone-300 p-4 sm:p-5 shadow-md space-y-3 transition-all"
            >
              {/* Main Search Input & Nút Thu Gọn */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-4 top-3.5 text-stone-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Nhập tên thành viên, danh xưng, số điện thoại, nơi ở, hoặc nghề nghiệp để tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ scrollMarginTop: '90px' }}
                    className="scroll-mt-[90px] w-full pl-12 pr-12 py-3 rounded-2xl bg-stone-50 border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setDebouncedSearch('');
                      }}
                      className="absolute right-4 top-3 text-stone-400 hover:text-stone-700 text-sm font-semibold cursor-pointer"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {showScrollSearch && (
                  <button
                    type="button"
                    onClick={() => setFiltersExpanded(false)}
                    className="px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-600 hover:text-stone-900 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 border border-stone-200"
                    title="Thu gọn bộ lọc"
                  >
                    <ChevronUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Thu gọn</span>
                  </button>
                )}
              </div>

              {/* Quick Filter Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 text-xs">
                
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

                {/* Generation Filter - Động theo maxGen */}
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Thế hệ (Đời):</label>
                  <select
                    value={genFilter}
                    onChange={(e) => setGenFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none"
                  >
                    <option value="all">Tất cả thế hệ (1 - {maxGen})</option>
                    {generationOptions.map((g) => (
                      <option key={g} value={g}>
                        Đời {g} {g === 1 ? '(Cụ Thủy Tổ)' : ''}
                      </option>
                    ))}
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

                {/* Sort Order Selector (Mặc định: Theo đời & chi | Theo tên A-Z) */}
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Sắp xếp:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'generation_branch' | 'name_asc')}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-amber-600 font-medium cursor-pointer"
                  >
                    <option value="generation_branch">Theo đời & chi</option>
                    <option value="name_asc">Theo tên A-Z</option>
                  </select>
                </div>

              </div>

              {/* Bottom line: Result Count, Mode Toggle, and Reset Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 pt-2 border-t border-stone-200/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Tìm thấy <strong>{filteredMembers.length}</strong> kết quả phù hợp</span>
                  {sortBy === 'name_asc' && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold text-[11px]">
                      Sắp xếp tên A-Z
                    </span>
                  )}
                </div>

                {/* Mode Selector inside Expanded Card */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setViewMode('by_generation')}
                      className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        viewMode === 'by_generation'
                          ? 'bg-amber-800 text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>Theo đời</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('flat')}
                      className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        viewMode === 'flat'
                          ? 'bg-amber-800 text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      <span>Danh sách phẳng</span>
                    </button>
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-amber-800 font-semibold hover:underline cursor-pointer"
                    >
                      Đặt lại toàn bộ bộ lọc
                    </button>
                  )}
                  {showScrollSearch && (
                    <button
                      type="button"
                      onClick={() => setFiltersExpanded(false)}
                      className="text-stone-500 hover:text-stone-800 font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                      Thu gọn
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Spacer khi sticky active bằng đúng chiều cao đo được của thanh sticky để ngăn che khuất thẻ thành viên */}
        {isStickyActive && (
          <div
            style={{ height: `${stickyHeight}px` }}
            className="w-full pointer-events-none shrink-0 transition-all duration-150"
            aria-hidden="true"
          />
        )}

        {/* Toolbar điều khiển Mở rộng/Thu gọn toàn bộ các đời (chỉ hiện khi viewMode === 'by_generation') */}
        {viewMode === 'by_generation' && filteredMembers.length > 0 && (
          <div className="flex items-center justify-between gap-3 pt-4 pb-2 text-xs text-stone-600">
            <div className="flex items-center gap-2 flex-wrap">
              <span>Gồm <strong className="text-amber-900 font-bold">{generationKeys.length}</strong> thế hệ</span>
              {collapsedGens.size > 0 && (
                <span className="text-stone-500 text-[11px]">
                  (đang thu gọn {collapsedGens.size}/{generationKeys.length} đời)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAllGens}
                disabled={collapsedGens.size === 0}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-[11px] transition-all cursor-pointer shadow-2xs"
                title="Mở rộng tất cả các đời"
              >
                Mở rộng tất cả
              </button>
              <button
                type="button"
                onClick={collapseAllGens}
                disabled={collapsedGens.size === generationKeys.length}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-[11px] transition-all cursor-pointer shadow-2xs"
                title="Thu gọn tất cả các đời"
              >
                Thu gọn tất cả
              </button>
            </div>
          </div>
        )}

        {/* Container hiển thị danh sách thành viên được tối ưu bằng Window Virtualization */}
        <div ref={parentRef} className="mt-3 relative z-0">
          {filteredMembers.length === 0 ? (
            /* Empty State khi không tìm thấy kết quả */
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-sm max-w-lg mx-auto my-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-amber-700" />
              </div>
              <h3 className="text-lg font-bold font-serif-clan text-stone-900 mb-1.5">
                Không tìm thấy thành viên phù hợp
              </h3>
              <p className="text-xs text-stone-500 mb-5 leading-relaxed">
                Không có dữ liệu thành viên trùng khớp với từ khóa tìm kiếm hoặc các điều kiện lọc đang chọn.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Đặt lại toàn bộ bộ lọc
                </button>
              )}
            </div>
          ) : (
            /* Virtualized Window List Container */
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const item = virtualItems[virtualRow.index];
                if (!item) return null;

                return (
                  <div
                    key={item.id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                    }}
                  >
                    {item.type === 'generation_header' ? (
                      /* Header thế hệ (đời) dạng Accordion có thể click để đóng/mở */
                      <div className="pt-4 pb-3">
                        <div
                          onClick={() => toggleGenCollapse(item.genNum)}
                          className="bg-white hover:bg-amber-50/40 rounded-2xl border border-stone-200 hover:border-amber-400 p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group select-none"
                          title={item.isCollapsed ? `Mở rộng Đời ${item.genNum}` : `Thu gọn Đời ${item.genNum}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-800 to-amber-950 text-amber-100 flex items-center justify-center font-bold font-serif-clan text-sm sm:text-base shrink-0 shadow-sm border border-amber-700/50">
                              {item.genNum}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base sm:text-lg font-bold font-serif-clan text-stone-900 group-hover:text-amber-900 transition-colors">
                                  Thế Hệ Thứ {item.romanTitle}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-900 text-[11px] font-bold border border-amber-200">
                                  {item.count} thành viên
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-500 truncate mt-0.5">
                                {item.isCollapsed ? 'Đang thu gọn (nhấn để xem danh sách)' : 'Nhấn để thu gọn thế hệ này'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-semibold text-amber-800 hidden sm:inline">
                              {item.isCollapsed ? 'Mở rộng' : 'Thu gọn'}
                            </span>
                            <div className="w-7 h-7 rounded-lg bg-stone-100 group-hover:bg-amber-100 text-stone-600 group-hover:text-amber-800 flex items-center justify-center transition-colors">
                              {item.isCollapsed ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronUp className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Hàng hiển thị thẻ thành viên responsive grid */
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pb-4 sm:pb-5">
                        {item.members.map((member) => (
                          <MemberListCard
                            key={member.id}
                            member={member}
                            allMembers={members}
                            variant={item.variant}
                            showPhone={item.variant === 'directory'}
                            showOccupation={item.variant === 'directory'}
                            showSpouse={true}
                            showAddress={true}
                            onClick={() => onSelectMember(member)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Nút tròn cố định góc phải dưới (FAB) cuộn lên và mở tìm kiếm (đặt góc dưới an toàn, không che nút Xem chi tiết) */}
      {showScrollSearch && (
        <button
          type="button"
          onClick={handleScrollToSearch}
          aria-label="Mở bộ lọc & tìm kiếm danh bạ"
          title="Mở bộ lọc & tìm kiếm danh bạ"
          className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-amber-800 to-amber-600 hover:from-amber-900 hover:to-amber-700 active:scale-95 text-white shadow-xl shadow-amber-950/40 border border-amber-400/50 flex items-center justify-center transition-all duration-200 cursor-pointer animate-in fade-in zoom-in-75 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          <Search className="w-5 h-5 text-amber-100" />
        </button>
      )}

    </div>
  );
};

export default DirectorySearch;
