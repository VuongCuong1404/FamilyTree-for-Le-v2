import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as f3 from 'family-chart';
import 'family-chart/styles/family-chart.css';
import { 
  TreePine, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter, 
  Users, 
  Layers, 
  Heart, 
  Printer, 
  Maximize2,
  Calendar,
  Flame,
  Lock,
  LogIn
} from 'lucide-react';
import { ClanMember, ClanInfo, UserProfile } from '../types';
import { calculateAgeInfo, getGenderVisuals, calculateClanStats, getMemberOrder } from '../utils/genealogyUtils';

interface FamilyTreeViewerProps {
  members: ClanMember[];
  clanInfo: ClanInfo;
  onSelectMember: (member: ClanMember) => void;
  onAddChild: (parentMember: ClanMember) => void;
  currentUserProfile?: UserProfile | null;
  onOpenAuth?: () => void;
}

// Escape HTML utility for safe card rendering
function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Filter members while guaranteeing tree connectivity to the root
function filterMembersForTree(
  members: ClanMember[],
  selectedBranch: string,
  selectedGenFilter: number | 'all'
): ClanMember[] {
  let list = members;

  if (selectedGenFilter !== 'all') {
    list = list.filter(m => m.generation <= selectedGenFilter);
  }

  if (selectedBranch !== 'all') {
    const branchMemberIds = new Set<string>();
    list.forEach(m => {
      if (m.branch === selectedBranch) {
        branchMemberIds.add(m.id);
        // Include ancestors to maintain DAG link to root
        let curr: ClanMember | undefined = m;
        while (curr && curr.parentId) {
          branchMemberIds.add(curr.parentId);
          curr = list.find(x => x.id === curr?.parentId);
        }
      }
    });

    // Always include generation 1 root members
    list.forEach(m => {
      if (m.generation === 1 || !m.parentId) {
        branchMemberIds.add(m.id);
      }
    });

    list = list.filter(m => branchMemberIds.has(m.id));
  }

  return list;
}

// Convert ClanMember[] to family-chart Datum[]
function convertClanMembersToChartData(members: ClanMember[]) {
  const memberMap = new Map<string, ClanMember>();
  members.forEach(m => memberMap.set(m.id, m));

  const childrenMap = new Map<string, string[]>();
  members.forEach(m => {
    if (m.parentId) {
      const arr = childrenMap.get(m.parentId) || [];
      arr.push(m.id);
      arr.sort((aId, bId) => {
        const aMem = memberMap.get(aId);
        const bMem = memberMap.get(bId);
        const aOrder = getMemberOrder(aMem);
        const bOrder = getMemberOrder(bMem);
        if (aOrder !== bOrder) return aOrder - bOrder;
        return aId.localeCompare(bId);
      });
      childrenMap.set(m.parentId, arr);
    }
  });

  return members.map(m => {
    const parents: string[] = [];
    if (m.parentId && members.some(x => x.id === m.parentId)) {
      parents.push(m.parentId);
    }
    if (m.motherId && m.motherId !== m.parentId && members.some(x => x.id === m.motherId)) {
      parents.push(m.motherId);
    }

    const rawChildren = (childrenMap.get(m.id) || []).filter(cid => members.some(x => x.id === cid));
    const children = rawChildren.sort((aId, bId) => {
      const aMem = memberMap.get(aId);
      const bMem = memberMap.get(bId);
      const aOrder = getMemberOrder(aMem);
      const bOrder = getMemberOrder(bMem);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return aId.localeCompare(bId);
    });

    return {
      id: m.id,
      data: {
        'first name': m.fullName,
        'last name': '',
        gender: (m.gender === 'male' ? 'M' : 'F') as 'M' | 'F',
        rawMember: m,
      },
      rels: {
        parents,
        spouses: [] as string[],
        children,
      },
    };
  });
}

export const FamilyTreeViewer: React.FC<FamilyTreeViewerProps> = ({
  members,
  clanInfo,
  onSelectMember,
  onAddChild,
  currentUserProfile,
  onOpenAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedGenFilter, setSelectedGenFilter] = useState<number | 'all'>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [showSpouses, setShowSpouses] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'tree' | 'generation_list'>('tree');
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  // Floating Gesture Hint: only shown once per browser and auto-dismissed after 4s
  const [showGestureHint, setShowGestureHint] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('tree_gesture_hint_seen') !== 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!showGestureHint) return;

    const timer = setTimeout(() => {
      setShowGestureHint(false);
      try {
        localStorage.setItem('tree_gesture_hint_seen', 'true');
      } catch {
        // ignore
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [showGestureHint]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  // Group members by Generation
  const generationGroups = useMemo(() => {
    const groups: { [gen: number]: ClanMember[] } = {};
    members.forEach((m) => {
      if (!groups[m.generation]) groups[m.generation] = [];
      groups[m.generation].push(m);
    });
    // Sort members in each generation by order_in_family ascending, fallback to id
    Object.keys(groups).forEach((gKey) => {
      const g = Number(gKey);
      groups[g].sort((a, b) => {
        const aOrder = getMemberOrder(a);
        const bOrder = getMemberOrder(b);
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.id.localeCompare(b.id);
      });
    });
    return groups;
  }, [members]);

  // Branches list
  const branches = useMemo(() => {
    return Array.from(new Set(members.map((m) => m.branch).filter(Boolean)));
  }, [members]);

  // Clan stats
  const stats = useMemo(() => {
    return calculateClanStats(members);
  }, [members]);

  // Check matching search
  const isMatchSearch = (m: ClanMember) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      (m.spouse && m.spouse.toLowerCase().includes(q)) ||
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.occupation && m.occupation.toLowerCase().includes(q))
    );
  };

  // Check gender match
  const isGenderMatch = (m: ClanMember) => {
    if (genderFilter === 'all') return true;
    return m.gender === genderFilter;
  };

  // Build card inner HTML
  const createCardInnerHtml = (d: any) => {
    const member: ClanMember = d.data?.data?.rawMember;
    if (!member) {
      return `<div class="p-3 bg-white rounded-xl shadow border text-stone-600 text-xs">Thành viên</div>`;
    }

    const romanGen = [
      '', 'I (Thủy Tổ)', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'
    ][member.generation] || member.generation;

    const ageInfo = calculateAgeInfo(member.birthYear, member.deathYear, member.isAlive);
    const genderVisual = getGenderVisuals(member.gender, member.generation);

    const isHighlighted = isMatchSearch(member);
    const matchesGender = isGenderMatch(member);

    const cardBgClass = isHighlighted
      ? 'ring-4 ring-amber-400 bg-amber-50 border-amber-600 shadow-xl scale-[1.02]'
      : !matchesGender
      ? 'opacity-35 bg-stone-100/90 border-stone-200 grayscale-30'
      : member.isAlive
      ? 'bg-white border-amber-900/25 hover:border-amber-600 hover:shadow-xl'
      : 'bg-[#faf8f5] border-stone-300/90 hover:border-amber-700 hover:shadow-xl';

    const spouseHtml = showSpouses && (member.spouse || (member.spouseList && member.spouseList.length > 0))
      ? `<div class="mt-2 pt-1.5 border-t border-stone-200/70 text-[11px] flex items-center gap-1 text-stone-700 bg-stone-50/90 -mx-3.5 -mb-3.5 p-2 rounded-b-2xl">
          <span class="text-rose-500 font-bold shrink-0 text-xs">♥</span>
          <span class="text-[10px] text-stone-500 font-medium shrink-0">Phối ngẫu:</span>
          <span class="font-semibold text-stone-800 text-[11px] truncate">
            ${escapeHtml(member.spouse || member.spouseList?.map(s => s.name).join(', ') || '')}
          </span>
        </div>`
      : '';

    const lunarHtml = !member.isAlive && member.lunarDeathDate
      ? `<div class="text-[10.5px] text-red-800 font-semibold mt-0.5 flex items-center gap-1">
          <span>📅 Kỵ nhật: ${escapeHtml(member.lunarDeathDate)}</span>
        </div>`
      : '';

    const occupHtml = member.isAlive && (member.occupation || member.address)
      ? `<div class="text-[10px] text-stone-500 truncate mt-0.5">
          ${escapeHtml(member.occupation || member.address || '')}
        </div>`
      : '';

    return `
      <div class="relative w-[270px] sm:w-[280px] rounded-2xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer shadow-md select-none border-2 ${cardBgClass}">
        <div class="flex items-center justify-between gap-1.5 mb-1.5 pb-1.5 border-b border-stone-100">
          <div class="flex items-center gap-1 flex-wrap">
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold font-serif-clan uppercase tracking-wider ${
              member.generation === 1 
                ? 'bg-red-800 text-amber-200 border border-amber-400/60'
                : 'bg-amber-100/80 text-amber-950 border border-amber-300/60'
            }">
              Đời ${romanGen}
            </span>
            <span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-0.5 ${genderVisual.badgeClass}">
              <span>${genderVisual.symbol}</span>
              <span>${member.gender === 'male' ? 'Nam' : 'Nữ'}</span>
            </span>
            <span class="text-[10px] font-medium text-stone-500 truncate max-w-[80px]">
              ${escapeHtml(member.branch || '')}
            </span>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            ${member.isAlive ? `
              <span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded-md">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Sống
              </span>
            ` : `
              <span class="text-[10px] font-semibold text-stone-600 bg-stone-200/80 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                🔥 Tiền nhân
              </span>
            `}
          </div>
        </div>

        <div class="flex items-start gap-2.5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold font-serif-clan text-xs shadow-md ${genderVisual.avatarBg}">
            ${genderVisual.title}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1 flex-wrap">
              <h4 class="font-bold text-sm sm:text-base font-serif-clan text-stone-950 truncate tracking-tight">
                ${escapeHtml(member.fullName)}
              </h4>
              ${member.title ? `
                <span class="text-[9.5px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                  ${escapeHtml(member.title)}
                </span>
              ` : ''}
            </div>
            <div class="text-[11px] font-semibold text-stone-700 mt-0.5">
              <span class="inline-block px-1 py-0.2 rounded ${
                member.isAlive 
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/70' 
                  : 'bg-amber-50 text-amber-900 border border-amber-200/70'
              }">
                ${escapeHtml(ageInfo.formattedText)}
              </span>
            </div>
            ${lunarHtml}
            ${occupHtml}
          </div>
        </div>
        ${spouseHtml}
      </div>
    `;
  };

  // Initialize and update family-chart library
  useEffect(() => {
    if (!chartContainerRef.current || viewMode !== 'tree') return;

    const container = chartContainerRef.current;
    container.innerHTML = ''; // Clean previous tree instances

    const treeMembers = filterMembersForTree(members, selectedBranch, selectedGenFilter);
    if (treeMembers.length === 0) return;

    const chartData = convertClanMembersToChartData(treeMembers);

    try {
      const chart = f3.createChart(container, chartData);
      chart.setOrientationVertical();
      chart.setCardXSpacing(310);
      chart.setCardYSpacing(210);
      chart.setSingleParentEmptyCard(false);
      chart.setAncestryDepth(10);
      chart.setProgenyDepth(10);

      const f3Card = chart.setCardHtml();
      f3Card.setCardDim({ w: 280, h: 145 });
      f3Card.setCardInnerHtmlCreator((d: any) => createCardInnerHtml(d));
      f3Card.setOnCardClick((e: any, d: any) => {
        const raw = d?.data?.data?.rawMember;
        if (raw) {
          onSelectMember(raw);
        }
      });

      // Fit to container screen on initial render
      chart.updateTree({ initial: true, tree_position: 'fit' });
      chartInstanceRef.current = chart;
    } catch (err) {
      console.error('Error rendering family-chart:', err);
    }

    return () => {
      chartInstanceRef.current = null;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [members, selectedBranch, selectedGenFilter, showSpouses, searchQuery, genderFilter, viewMode]);

  // Zoom and tree position handlers powered by family-chart and D3 Zoom
  const handleZoomIn = () => {
    if (chartInstanceRef.current?.svg) {
      f3.handlers.manualZoom({ amount: 1.25, svg: chartInstanceRef.current.svg, transition_time: 250 });
    }
  };

  const handleZoomOut = () => {
    if (chartInstanceRef.current?.svg) {
      f3.handlers.manualZoom({ amount: 0.8, svg: chartInstanceRef.current.svg, transition_time: 250 });
    }
  };

  const handleFitTree = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.updateTree({ tree_position: 'fit', transition_time: 400 });
    }
  };

  const handleCenterRoot = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.updateTree({ tree_position: 'main_to_middle', transition_time: 400 });
    }
  };

  if (!currentUserProfile) {
    return (
      <div className="min-h-[75vh] bg-stone-100 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden text-center p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-700 shadow-inner">
            <TreePine className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold font-serif-clan tracking-wide">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Bảo Mật Gia Phả Nội Tộc</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-clan text-stone-900">
              Vui lòng đăng nhập để xem thông tin gia phả
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Nhằm bảo mật thông tin huyết thống và danh bạ gia đình, chỉ thành viên đã xác thực tài khoản mới có thể xem chi tiết Sơ đồ Phả hệ dòng họ {clanInfo.clanSurname}.
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
    <div className="min-h-screen bg-stone-100 pb-16">
      
      {/* Top Banner Toolbar */}
      <div className="bg-[#24140e] text-amber-50 border-b border-amber-900/60 sticky top-16 sm:top-20 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          
          {/* Main Top Bar: Title, Collapsible Toggle & View Switchers */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            
            {/* Title & Slogan */}
            <div className="flex items-center gap-2">
              <TreePine className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-bold font-serif-clan text-white leading-tight">
                  Sơ Đồ Phả Hệ 7 Thế Hệ — {clanInfo.clanSurname} Tộc
                </h1>
                <p className="text-[11px] text-amber-200/70 hidden sm:block">
                  Cập nhật đầy đủ Giới tính (Nam ♂ / Nữ ♀), Tuổi hiện tại & Hưởng thọ cho toàn gia tộc
                </p>
              </div>
            </div>

            {/* Actions: Toggle Filter Button & View Mode Switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Toggle Stats & Filters Button */}
              <button
                type="button"
                onClick={() => setIsFilterExpanded(prev => !prev)}
                className="px-2.5 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 active:bg-amber-900/40 text-amber-200 border border-amber-900/60 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title={isFilterExpanded ? "Thu gọn thống kê và bộ lọc" : "Mở rộng thống kê và bộ lọc"}
              >
                <span>{isFilterExpanded ? '▲ Thu gọn bộ lọc' : '▼ Mở bộ lọc & Thống kê'}</span>
              </button>

              {/* View Mode Switcher */}
              <div className="bg-stone-900/90 rounded-xl p-1 flex items-center border border-amber-900/40 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('tree')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-all ${
                    viewMode === 'tree'
                      ? 'bg-amber-700 text-white font-bold shadow-sm'
                      : 'text-stone-300 hover:text-amber-200'
                  }`}
                >
                  Cây Phân Nhánh
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('generation_list')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-all ${
                    viewMode === 'generation_list'
                      ? 'bg-amber-700 text-white font-bold shadow-sm'
                      : 'text-stone-300 hover:text-amber-200'
                  }`}
                >
                  Danh Sách Theo Đời
                </button>
              </div>

              {/* Print / Export on Desktop */}
              <button
                type="button"
                onClick={() => window.print()}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 border border-amber-900/50 text-xs font-semibold cursor-pointer"
                title="In cây phả hệ"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>In Bản Phả Hệ</span>
              </button>
            </div>

          </div>

          {/* Collapsible Section: Statistics & Full Filters */}
          {isFilterExpanded && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-150">
              
              {/* Statistics Strip on Tree Page */}
              <div className="mt-2.5 pt-2.5 border-t border-amber-950/70 flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-stone-300">
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

                <div className="flex items-center gap-1.5 bg-stone-900/80 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-900/40 ml-auto hidden lg:flex">
                  <Layers className="w-3.5 h-3.5" />
                  <span>7 Thế hệ • {branches.length} Chi Phái</span>
                </div>
              </div>

              {/* Filter & Control Bar */}
              <div className="mt-2.5 pt-2.5 border-t border-amber-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                
                {/* Search Box */}
                <div className="relative flex-1 min-w-[170px] max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên, chức vị, phối ngẫu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-stone-900/90 border border-amber-900/50 text-amber-100 placeholder-stone-400 text-xs focus:outline-none focus:border-amber-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-stone-400 hover:text-white font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Quick Gender Filter (Tất cả, Nam ♂, Nữ ♀) */}
                <div className="flex items-center gap-1 bg-stone-900/90 rounded-lg p-1 border border-amber-900/60">
                  <span className="text-[11px] text-stone-400 px-1 font-semibold">Giới tính:</span>
                  <button
                    type="button"
                    onClick={() => setGenderFilter('all')}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      genderFilter === 'all'
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderFilter('male')}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      genderFilter === 'male'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-sky-300 hover:text-sky-100'
                    }`}
                  >
                    <span>Nam ♂</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderFilter('female')}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      genderFilter === 'female'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-rose-300 hover:text-rose-100'
                    }`}
                  >
                    <span>Nữ ♀</span>
                  </button>
                </div>

                {/* Branch Filter */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-stone-300">Chi:</span>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="bg-stone-900 border border-amber-900/60 rounded-lg px-2.5 py-1 text-amber-100 text-xs focus:outline-none"
                  >
                    <option value="all">Tất cả Chi</option>
                    {branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Generation Filter */}
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-stone-300">Đời:</span>
                  <select
                    value={selectedGenFilter}
                    onChange={(e) => setSelectedGenFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="bg-stone-900 border border-amber-900/60 rounded-lg px-2.5 py-1 text-amber-100 text-xs focus:outline-none"
                  >
                    <option value="all">Tất cả Đời (1 - 7)</option>
                    <option value={1}>Đời 1 (Thủy Tổ)</option>
                    <option value={2}>Đến Đời 2</option>
                    <option value={3}>Đến Đời 3</option>
                    <option value={4}>Đến Đời 4</option>
                    <option value={5}>Đến Đời 5</option>
                    <option value={6}>Đến Đời 6</option>
                    <option value={7}>Đến Đời 7</option>
                  </select>
                </div>

                {/* Toggle Spouses */}
                <label className="flex items-center gap-1.5 cursor-pointer text-stone-300 hover:text-amber-200">
                  <input
                    type="checkbox"
                    checked={showSpouses}
                    onChange={(e) => setShowSpouses(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-0"
                  />
                  <span>Hiện Phối ngẫu</span>
                </label>

                {/* Zoom & Fit Toolbar in Filter Bar */}
                {viewMode === 'tree' && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleFitTree}
                      className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-200 text-[11px] font-semibold cursor-pointer flex items-center gap-1"
                      title="Thu nhỏ để xem toàn bộ cây trong 1 màn hình"
                    >
                      <Maximize2 className="w-3 h-3 text-amber-400" />
                      <span>Xem toàn bộ</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCenterRoot}
                      className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] cursor-pointer"
                      title="Căn giữa về Cụ Thủy Tổ"
                    >
                      Về Thủy Tổ
                    </button>

                    <span className="text-stone-600 mx-1">|</span>

                    <button
                      type="button"
                      onClick={handleZoomIn}
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-200 cursor-pointer"
                      title="Phóng to"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-200 cursor-pointer"
                      title="Thu nhỏ"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleFitTree}
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-200 cursor-pointer"
                      title="Xem toàn bộ cây vừa màn hình"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>

      {/* Main View Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* VIEW MODE 1: FAMILY-CHART D3 CANVAS (PINCH-TO-ZOOM, SMOOTH PAN, FOCAL ZOOM, FIT SCREEN) */}
        {viewMode === 'tree' && (
          <div className="w-full relative overflow-hidden bg-parchment rounded-3xl border-2 border-amber-800/30 shadow-xl min-h-[600px] h-[75vh] sm:h-[80vh]">
            
            {/* Subtle Watermark in background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none z-0">
              <span className="font-serif-clan font-bold text-7xl sm:text-9xl text-amber-950 uppercase tracking-widest text-center">
                {clanInfo.clanSurname} TỘC<br />GIA PHẢ
              </span>
            </div>

            {/* Floating Gesture Helper Guide on Tree */}
            {showGestureHint && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none transition-opacity duration-500">
                <div className="bg-stone-900/85 backdrop-blur-xs text-amber-100 text-[11px] px-3 py-1.5 rounded-xl border border-amber-800/40 shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="font-medium">Chạm 2 ngón để zoom • Kéo chuột/ngón tay để di chuyển • Cuộn để phóng to</span>
                </div>
              </div>
            )}

            {/* Floating on-canvas Zoom & Fit Controls (bottom-right) */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-stone-900/90 backdrop-blur-xs p-1.5 rounded-2xl border border-amber-800/50 shadow-xl text-amber-100">
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-amber-800 flex items-center justify-center text-amber-200 cursor-pointer transition-colors"
                title="Phóng to"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-amber-800 flex items-center justify-center text-amber-200 cursor-pointer transition-colors"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleFitTree}
                className="px-2.5 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-amber-800 flex items-center gap-1 text-[11px] font-bold text-amber-300 cursor-pointer transition-colors"
                title="Thu nhỏ để xem toàn bộ cây trong 1 màn hình"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Xem toàn bộ</span>
              </button>
              <button
                type="button"
                onClick={handleCenterRoot}
                className="px-2 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-amber-800 flex items-center gap-1 text-[11px] font-medium text-stone-300 hover:text-white cursor-pointer transition-colors"
                title="Căn về Cụ Thủy Tổ"
              >
                <span>Thủy Tổ</span>
              </button>
            </div>

            {/* DOM Container for family-chart */}
            <div 
              id="familyTreeChartCont"
              ref={chartContainerRef}
              className="w-full h-full relative z-10 f3"
              style={{ minHeight: '600px', height: '100%' }}
            />
          </div>
        )}

        {/* VIEW MODE 2: STRUCTURED GENERATION LIST */}
        {viewMode === 'generation_list' && (
          <div className="space-y-8">
            {Object.keys(generationGroups).sort((a, b) => Number(a) - Number(b)).map((genKey) => {
              const genNum = Number(genKey);
              if (selectedGenFilter !== 'all' && genNum !== selectedGenFilter) return null;
              
              const list = generationGroups[genNum].filter(m => {
                if (selectedBranch !== 'all' && m.branch !== selectedBranch) return false;
                if (genderFilter !== 'all' && m.gender !== genderFilter) return false;
                if (searchQuery.trim() && !isMatchSearch(m)) return false;
                return true;
              });

              if (list.length === 0) return null;

              const romanGen = ['', 'I (Cụ Thủy Tổ)', 'II', 'III', 'IV', 'V (Đương Đại)', 'VI (Thế Hệ Trẻ)', 'VII (Hậu Duệ)'][genNum] || genNum;

              return (
                <div key={genNum} className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-800 text-amber-100 flex items-center justify-center font-bold font-serif-clan text-base">
                        {genNum}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold font-serif-clan text-stone-900">
                          Thế Hệ Thứ {romanGen}
                        </h3>
                        <p className="text-xs text-stone-500">
                          Gồm {list.length} thành viên phù hợp trong thế hệ này
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map((member) => {
                      const ageInfo = calculateAgeInfo(member.birthYear, member.deathYear, member.isAlive);
                      const genderVisual = getGenderVisuals(member.gender, member.generation);

                      return (
                        <div
                          key={member.id}
                          onClick={() => onSelectMember(member)}
                          className="p-5 rounded-2xl bg-stone-50 hover:bg-amber-50/70 border border-stone-200 hover:border-amber-400 transition-all cursor-pointer group shadow-xs hover:shadow-md"
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

                              {member.spouse && (
                                <div className="text-xs text-stone-500 mt-1 truncate flex items-center gap-1">
                                  <Heart className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span>Phối ngẫu: {member.spouse}</span>
                                </div>
                              )}

                              {member.address && (
                                <div className="text-xs text-stone-500 mt-0.5 truncate">
                                  Nơi ở: {member.address}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

