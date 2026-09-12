import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as f3 from 'family-chart';
import 'family-chart/styles/family-chart.css';
import { jsPDF } from 'jspdf';
import { domToJpeg } from 'modern-screenshot';
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
  Maximize2,
  Calendar,
  Flame,
  Lock,
  LogIn,
  FileDown,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { ClanMember, ClanInfo, UserProfile, Role } from '../types';
import { calculateAgeInfo, getGenderVisuals, calculateClanStats, getMemberOrder, removeVietnameseAccents } from '../utils/genealogyUtils';

interface FamilyTreeViewerProps {
  members: ClanMember[];
  clanInfo: ClanInfo;
  onSelectMember: (member: ClanMember) => void;
  onAddChild: (parentMember: ClanMember) => void;
  currentUserProfile?: UserProfile | null;
  currentUserRole?: Role;
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

// Convert integer to Roman numeral dynamically without bounds
function toRomanNumeral(num: number): string {
  if (num <= 0) return String(num);
  const romanLookup: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I']
  ];
  let result = '';
  let remainder = num;
  for (const [val, roman] of romanLookup) {
    while (remainder >= val) {
      result += roman;
      remainder -= val;
    }
  }
  return result;
}

/**
 * Filter members for tree display based on branch, generation, and spouses toggle.
 */
function filterMembersForTree(
  members: ClanMember[],
  selectedBranch: string,
  selectedGenFilter: number | 'all',
  showSpouses: boolean
): ClanMember[] {
  let result = [...members];

  // 1. Filter by branch
  if (selectedBranch !== 'all') {
    const branchMembers = result.filter(m => m.branch === selectedBranch);
    const branchIds = new Set<string>();

    const collectDescendantsAndAncestors = (memberId: string) => {
      if (branchIds.has(memberId)) return;
      branchIds.add(memberId);

      // Add parent
      const member = members.find(m => m.id === memberId);
      if (member?.parentId) {
        collectDescendantsAndAncestors(member.parentId);
      }

      // Add children
      const children = members.filter(m => m.parentId === memberId);
      children.forEach(c => collectDescendantsAndAncestors(c.id));
    };

    branchMembers.forEach(m => collectDescendantsAndAncestors(m.id));
    result = result.filter(m => branchIds.has(m.id));
  }

  // 2. Filter by generation limit
  if (selectedGenFilter !== 'all') {
    result = result.filter(m => m.generation <= selectedGenFilter);
  }

  return result;
}

/**
 * Converts ClanMember list into family-chart compatible data array.
 */
function convertClanMembersToChartData(members: ClanMember[], showSpouses: boolean): any[] {
  const memberMap = new Map<string, ClanMember>();
  members.forEach(m => memberMap.set(m.id, m));

  const childrenMap = new Map<string, string[]>();
  members.forEach(m => {
    if (m.parentId && memberMap.has(m.parentId)) {
      if (!childrenMap.has(m.parentId)) {
        childrenMap.set(m.parentId, []);
      }
      childrenMap.get(m.parentId)!.push(m.id);
    }
  });

  // Sort children by order in family
  for (const [pId, cIds] of childrenMap.entries()) {
    cIds.sort((a, b) => {
      const mA = memberMap.get(a);
      const mB = memberMap.get(b);
      return getMemberOrder(mA) - getMemberOrder(mB);
    });
  }

  const chartData: any[] = [];

  members.forEach(m => {
    const rels: any = {
      children: childrenMap.get(m.id) || [],
      parents: []
    };

    if (m.parentId && memberMap.has(m.parentId)) {
      rels.parents.push(m.parentId);
    }

    if (showSpouses) {
      const spouses: string[] = [];
      if (m.spouseIds && m.spouseIds.length > 0) {
        m.spouseIds.forEach(sId => {
          if (memberMap.has(sId) && !spouses.includes(sId)) {
            spouses.push(sId);
          }
        });
      }
      if (spouses.length > 0) {
        rels.spouses = spouses;
      }
    }

    chartData.push({
      id: m.id,
      data: {
        rawMember: m,
        id: m.id,
        gender: m.gender === 'female' ? 'F' : 'M',
        first_name: m.fullName,
        last_name: '',
        birthday: m.birthYear ? String(m.birthYear) : '',
        deathday: m.deathYear ? String(m.deathYear) : '',
        avatar: m.avatar || '',
        title: m.title || '',
        branch: m.branch || '',
        generation: m.generation,
        isAlive: m.isAlive
      },
      rels
    });
  });

  return chartData;
}

export const FamilyTreeViewer: React.FC<FamilyTreeViewerProps> = ({
  members,
  clanInfo,
  onSelectMember,
  onAddChild,
  currentUserProfile,
  currentUserRole,
  onOpenAuth,
}) => {
  // Tree Controls State
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedGenFilter, setSelectedGenFilter] = useState<number | 'all'>('all');
  const [showSpouses, setShowSpouses] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingJpg, setIsExportingJpg] = useState<boolean>(false);

  // Dynamic max generation
  const maxGen = useMemo(() => {
    const gens = members.map(m => m.generation).filter((g): g is number => typeof g === 'number' && !isNaN(g));
    return Math.max(7, ...gens);
  }, [members]);

  const generationOptions = useMemo(() => {
    const list: number[] = [];
    for (let i = 1; i <= maxGen; i++) {
      list.push(i);
    }
    return list;
  }, [maxGen]);

  // Mobile Topbar collapse
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  const isAdmin = currentUserRole === 'admin' || currentUserProfile?.role === 'admin';

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

  // Branches list
  const branches = useMemo(() => {
    return Array.from(new Set(members.map((m) => m.branch).filter(Boolean)));
  }, [members]);

  // Clan stats
  const stats = useMemo(() => {
    return calculateClanStats(members);
  }, [members]);

  // Check matching search
  const isMatchSearch = (m: ClanMember | undefined | null) => {
    if (!m) return false;
    const trimmed = searchQuery.trim();
    if (!trimmed) return false;
    const q = trimmed.toLowerCase();
    const qUnaccent = removeVietnameseAccents(q);

    const checkText = (text?: string | null) => {
      if (!text) return false;
      const lower = text.toLowerCase();
      return lower.includes(q) || removeVietnameseAccents(lower).includes(qUnaccent);
    };

    const matchSpouseList = m.spouseList && m.spouseList.some(s => checkText(s.name) || checkText(s.note));
    const matchSpouseIds = m.spouseIds && m.spouseIds.some(sid => {
      const sp = members.find(x => x.id === sid);
      return checkText(sp?.fullName);
    });

    return (
      checkText(m.fullName) ||
      checkText(m.spouse) ||
      Boolean(matchSpouseList) ||
      Boolean(matchSpouseIds) ||
      checkText(m.title) ||
      checkText(m.occupation) ||
      checkText(m.address) ||
      checkText(m.branch) ||
      checkText(m.motherName)
    );
  };

  // Check gender match
  const isGenderMatch = (m: ClanMember) => {
    if (genderFilter === 'all') return true;
    return m.gender === genderFilter;
  };

  // Build card inner HTML with boosted text sizes (minimum 11-12px) for crisp readability
  const createCardInnerHtml = (d: any) => {
    const member: ClanMember | undefined =
      d?.data?.data?.rawMember ||
      d?.data?.rawMember ||
      d?.rawMember ||
      members.find(x => x.id === (d?.data?.id || d?.id || d?.data?.data?.id));
    if (!member) {
      return `<div class="p-3 bg-white rounded-xl shadow border text-stone-600 text-xs">Thành viên</div>`;
    }

    const romanGen = member.generation === 1 ? 'I (Thủy Tổ)' : toRomanNumeral(member.generation);

    const ageInfo = calculateAgeInfo(member.birthYear, member.deathYear, member.isAlive);
    const genderVisual = getGenderVisuals(member.gender, member.generation);

    const hasSearch = Boolean(searchQuery && searchQuery.trim());
    const isHighlighted = isMatchSearch(member);
    const matchesGender = isGenderMatch(member);

    const cardBgClass = isHighlighted
      ? 'ring-4 ring-amber-500 bg-amber-50/95 border-amber-600 shadow-2xl scale-[1.03] z-20 ring-offset-2 ring-offset-white'
      : hasSearch
      ? 'opacity-30 grayscale-[40%] bg-stone-100/90 border-stone-300'
      : !matchesGender
      ? 'opacity-35 bg-stone-100/90 border-stone-200 grayscale-30'
      : member.isAlive
      ? 'bg-white border-amber-900/25 hover:border-amber-600 hover:shadow-xl'
      : 'bg-[#faf8f5] border-stone-300/90 hover:border-amber-700 hover:shadow-xl';

    const spouseNames = (member.spouseIds && member.spouseIds.length > 0)
      ? member.spouseIds.map(sid => members.find(x => x.id === sid)?.fullName).filter(Boolean)
      : [];
    const formattedSpouses = spouseNames.length > 0
      ? spouseNames.join(', ')
      : (member.spouseList && member.spouseList.length > 0
          ? member.spouseList.map(s => s.name + (s.note ? ` (${s.note})` : '')).join(', ')
          : (member.spouse || ''));

    // Xác định đúng Cha / Mẹ theo giới tính thật (tránh nhầm lẫn khi parentId là mẹ hoặc motherName ghi nhầm tên cha)
    const linkedParent = member.parentId ? members.find(x => x.id === member.parentId) : null;
    const linkedMotherById = member.motherId ? members.find(x => x.id === member.motherId) : null;
    const father = linkedParent?.gender === 'male' ? linkedParent : (linkedMotherById?.gender === 'male' ? linkedMotherById : null);
    const mother = linkedParent?.gender === 'female' ? linkedParent : (linkedMotherById?.gender === 'female' ? linkedMotherById : null);

    let actualMotherName = '';
    if (mother?.fullName) {
      actualMotherName = mother.fullName;
    } else if (member.motherName) {
      const trimmedMotherName = member.motherName.trim();
      const fatherFullName = father?.fullName?.trim();
      if (!fatherFullName || trimmedMotherName.toLowerCase() !== fatherFullName.toLowerCase()) {
        actualMotherName = trimmedMotherName;
      }
    }

    // Secondary label "Mẹ: {tên}" for children with clear 11px font size
    let motherHtml = '';
    if (actualMotherName) {
      motherHtml = `<div class="text-[11px] font-semibold text-rose-800 bg-rose-50/90 border border-rose-200/80 rounded px-1.5 py-0.5 mt-1 inline-flex items-center gap-1 max-w-full truncate" title="Thân mẫu: ${escapeHtml(actualMotherName)}">
          <span class="text-rose-500 font-bold shrink-0">Mẹ:</span>
          <span class="truncate font-medium text-stone-800">${escapeHtml(actualMotherName)}</span>
        </div>`;
    }

    const spouseHtml = showSpouses && formattedSpouses
      ? `<div class="mt-2 pt-1.5 border-t border-stone-200/70 text-xs flex items-center gap-1 text-stone-700 bg-stone-50/90 -mx-3.5 -mb-3.5 p-2 rounded-b-2xl">
          <span class="text-rose-500 font-bold shrink-0 text-xs">♥</span>
          <span class="text-[11px] text-stone-500 font-medium shrink-0">Phối ngẫu:</span>
          <span class="font-semibold text-stone-800 text-xs truncate" title="${escapeHtml(formattedSpouses)}">
            ${escapeHtml(formattedSpouses)}
          </span>
        </div>`
      : '';

    const lunarHtml = !member.isAlive && member.lunarDeathDate
      ? `<div class="text-[11.5px] text-red-800 font-semibold mt-0.5 flex items-center gap-1">
          <span>📅 Kỵ nhật: ${escapeHtml(member.lunarDeathDate)}</span>
        </div>`
      : '';

    const occupHtml = member.isAlive && (member.occupation || member.address)
      ? `<div class="text-[11px] text-stone-600 truncate mt-0.5">
          ${escapeHtml(member.occupation || member.address || '')}
        </div>`
      : '';

    return `
      <div class="relative w-[270px] sm:w-[280px] rounded-2xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer shadow-md select-none border-2 ${cardBgClass}">
        <div class="flex items-center justify-between gap-1.5 mb-1.5 pb-1.5 border-b border-stone-100">
          <div class="flex items-center gap-1 flex-wrap">
            <span class="px-2 py-0.5 rounded-md text-[11px] font-bold font-serif-clan uppercase tracking-wider ${
              member.generation === 1 
                ? 'bg-red-800 text-amber-200 border border-amber-400/60'
                : 'bg-amber-100/80 text-amber-950 border border-amber-300/60'
            }">
              Đời ${romanGen}
            </span>
            <span class="px-1.5 py-0.5 rounded-md text-[11px] font-bold inline-flex items-center gap-0.5 ${genderVisual.badgeClass}">
              <span>${genderVisual.symbol}</span>
              <span>${member.gender === 'male' ? 'Nam' : 'Nữ'}</span>
            </span>
            <span class="text-[11px] font-semibold text-stone-600 truncate max-w-[90px]">
              ${escapeHtml(member.branch || '')}
            </span>
            ${isHighlighted ? `
              <span class="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-600 text-white shadow-xs inline-flex items-center gap-0.5">
                <span>🎯 Khớp</span>
              </span>
            ` : ''}
          </div>
          <div class="flex items-center gap-1 shrink-0">
            ${member.isAlive ? `
              <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded-md">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Sống
              </span>
            ` : `
              <span class="text-[11px] font-semibold text-stone-600 bg-stone-200/80 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                🔥 Tiền nhân
              </span>
            `}
          </div>
        </div>

        <div class="flex items-start gap-2.5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold font-serif-clan text-xs shadow-md overflow-hidden relative ${genderVisual.avatarBg}" data-fallback-initial="${escapeHtml(genderVisual.title)}">
            ${member.avatar ? `
              <img src="${escapeHtml(member.avatar)}" alt="${escapeHtml(member.fullName)}" class="w-full h-full object-cover rounded-xl member-avatar-img" crossOrigin="anonymous" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
              <span class="member-avatar-fallback hidden w-full h-full items-center justify-center">${genderVisual.title}</span>
            ` : `
              <span class="member-avatar-fallback w-full h-full flex items-center justify-center">${genderVisual.title}</span>
            `}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1 flex-wrap">
              <h4 class="font-bold text-base font-serif-clan ${isHighlighted ? 'text-amber-950 font-black underline decoration-amber-500 decoration-2' : 'text-stone-950'} truncate tracking-tight">
                ${escapeHtml(member.fullName)}
              </h4>
              ${member.title ? `
                <span class="text-[11px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                  ${escapeHtml(member.title)}
                </span>
              ` : ''}
            </div>
            <div class="text-xs font-semibold text-stone-700 mt-0.5">
              <span class="inline-block px-1 py-0.2 rounded ${
                member.isAlive 
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/70' 
                  : 'bg-amber-50 text-amber-900 border border-amber-200/70'
              }">
                ${escapeHtml(ageInfo.formattedText)}
              </span>
            </div>
            ${motherHtml}
            ${lunarHtml}
            ${occupHtml}
          </div>
        </div>
        ${spouseHtml}
      </div>
    `;
  };

  // Filter members for the tree display
  const treeMembers = useMemo(() => {
    return filterMembersForTree(members, selectedBranch, selectedGenFilter, showSpouses);
  }, [members, selectedBranch, selectedGenFilter, showSpouses]);

  // Chart data
  const chartData = useMemo(() => {
    if (treeMembers.length === 0) return [];
    return convertClanMembersToChartData(treeMembers, showSpouses);
  }, [treeMembers, showSpouses]);

  // Initial & reactive chart rendering
  // Khôi phục chuẩn xác thư viện family-chart bằng f3.createChart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;
    if (chartData.length === 0) {
      container.innerHTML = `
        <div class="h-full min-h-[400px] flex items-center justify-center text-stone-400 font-serif-clan text-lg">
          Không có dữ liệu hiển thị theo bộ lọc đã chọn
        </div>
      `;
      chartInstanceRef.current = null;
      return;
    }

    container.innerHTML = '';

    const rootMember = treeMembers.find(m => m.generation === 1) || treeMembers[0];
    const rootId = rootMember ? rootMember.id : chartData[0].id;

    try {
      const chart = (f3 as any).createChart(container, chartData);
      chart.setOrientationVertical();
      chart.setCardXSpacing(310);
      chart.setCardYSpacing(210);
      chart.setSingleParentEmptyCard(false);
      chart.setAncestryDepth(Math.max(10, maxGen + 2));
      chart.setProgenyDepth(Math.max(10, maxGen + 2));

      if (rootId && chart.store) {
        chart.store.updateMainId(rootId);
      }

      const f3Card = chart.setCardHtml();
      f3Card.setCardDim({ w: 280, h: 145 });
      f3Card.setCardInnerHtmlCreator((d: any) => createCardInnerHtml(d));
      f3Card.setOnCardClick((e: any, d: any) => {
        const raw = d?.data?.data?.rawMember || d?.data?.rawMember;
        if (raw) {
          onSelectMember(raw);
        }
      });

      // Fit tree ban đầu nhanh và mượt mà
      chart.updateTree({ initial: true, tree_position: 'fit', transition_time: 0 });
      chartInstanceRef.current = chart;

      // Click card delegation fallback
      container.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const cardEl = target.closest('.card_cont') || target.closest('.card') || target.closest('.f3-card');
        if (cardEl) {
          const cardId = cardEl.getAttribute('data-id') || cardEl.getAttribute('id');
          if (cardId) {
            const cleanId = cardId.replace('card_', '').replace('node_', '');
            const clickedMember = members.find(m => m.id === cleanId);
            if (clickedMember) {
              onSelectMember(clickedMember);
            }
          }
        }
      });
    } catch (err) {
      console.error('Lỗi khi render sơ đồ cây family-chart:', err);
    }

    return () => {
      chartInstanceRef.current = null;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [chartData, maxGen, searchQuery, genderFilter]);

  // Manual Zoom In (hỗ trợ cả f3.handlers.manualZoom và fallback)
  const handleZoomIn = () => {
    if (chartInstanceRef.current?.svg && (f3 as any).handlers?.manualZoom) {
      (f3 as any).handlers.manualZoom({ amount: 1.25, svg: chartInstanceRef.current.svg, transition_time: 0 });
    } else if (chartInstanceRef.current) {
      chartInstanceRef.current.updateTree({
        tree_position: 'custom',
        scale: (chartInstanceRef.current.store?.state?.scale || 1) * 1.25,
        transition_time: 0
      });
    }
  };

  // Manual Zoom Out
  const handleZoomOut = () => {
    if (chartInstanceRef.current?.svg && (f3 as any).handlers?.manualZoom) {
      (f3 as any).handlers.manualZoom({ amount: 0.8, svg: chartInstanceRef.current.svg, transition_time: 0 });
    } else if (chartInstanceRef.current) {
      chartInstanceRef.current.updateTree({
        tree_position: 'custom',
        scale: Math.max(0.15, (chartInstanceRef.current.store?.state?.scale || 1) * 0.8),
        transition_time: 0
      });
    }
  };

  // Fit Entire Tree
  const handleFitTree = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.updateTree({ tree_position: 'fit', transition_time: 0 });
    }
  };

  // Center on Root Member (Thủy Tổ)
  const handleCenterRoot = () => {
    if (!chartInstanceRef.current) return;
    const rootMember = treeMembers.find(m => m.generation === 1) || treeMembers[0];
    if (rootMember) {
      try {
        if (chartInstanceRef.current.store) {
          chartInstanceRef.current.store.updateMainId(rootMember.id);
        }
        chartInstanceRef.current.updateTree({
          tree_position: 'main_to_middle',
          transition_time: 0
        });
      } catch {
        chartInstanceRef.current.updateTree({ tree_position: 'fit', transition_time: 0 });
      }
    }
  };

  /**
   * Chuẩn bị layout cây ở kích thước thật và tỉ lệ thẻ ~200px (thay vì co nhỏ để vừa màn hình)
   * Giữ nguyên logic setupTreeForExport hiện tại theo đúng chỉ đạo.
   */
  const setupTreeForExport = (chartCont: HTMLElement) => {
    // 1. Quét tọa độ min/max của tất cả thẻ và đường nối cây
    const chartStoreTree = (chartInstanceRef.current as any)?.store?.getTree?.();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    if (chartStoreTree?.data && Array.isArray(chartStoreTree.data) && chartStoreTree.data.length > 0) {
      for (const datum of chartStoreTree.data) {
        if (typeof datum.x === 'number' && typeof datum.y === 'number') {
          if (datum.x < minX) minX = datum.x;
          if (datum.x + 280 > maxX) maxX = datum.x + 280;
          if (datum.y < minY) minY = datum.y;
          if (datum.y + 145 > maxY) maxY = datum.y + 145;
        }
      }
    }

    // Quét thêm các thẻ DOM .card_cont
    const cardElements = chartCont.querySelectorAll('.card_cont');
    cardElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const transform = htmlEl.style.transform;
      const match = /translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(transform);
      if (match) {
        const x = parseFloat(match[1]);
        const y = parseFloat(match[2]);
        if (!isNaN(x) && !isNaN(y)) {
          if (x < minX) minX = x;
          if (x + 280 > maxX) maxX = x + 280;
          if (y < minY) minY = y;
          if (y + 145 > maxY) maxY = y + 145;
        }
      }
    });

    // Quét đường nối SVG .links_view
    const linksView = chartCont.querySelector('svg.main_svg .links_view') as SVGGElement | null;
    if (linksView && typeof linksView.getBBox === 'function') {
      try {
        const bbox = linksView.getBBox();
        if (bbox.width > 0 && bbox.height > 0) {
          if (bbox.x < minX) minX = bbox.x;
          if (bbox.x + bbox.width > maxX) maxX = bbox.x + bbox.width;
          if (bbox.y < minY) minY = bbox.y;
          if (bbox.y + bbox.height > maxY) maxY = bbox.y + bbox.height;
        }
      } catch {
        // Bỏ qua nếu trình duyệt không hỗ trợ getBBox khi ẩn
      }
    }

    // Fallback nếu không tính được tọa độ
    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
      minX = 0;
      maxX = Math.max(chartCont.scrollWidth || 1600, 1600);
      minY = 0;
      maxY = Math.max(chartCont.scrollHeight || 1000, 1000);
    }

    // 2. Tính tỉ lệ co giãn thẻ: Thẻ gốc 280px, mục tiêu ~240px để chữ to rõ
    const targetCardWidth = 240;
    let cardScale = targetCardWidth / 280; // ~0.857
    const margin = 80;
    const unscaledW = (maxX - minX) + margin * 2;
    const unscaledH = (maxY - minY) + margin * 2;

    // Giới hạn an toàn để chiều rộng canvas khi nhân scale không vượt quá 20000px
    if (unscaledW * cardScale * 4 > 20000) {
      cardScale = 20000 / (unscaledW * 4);
    }
    if (cardScale < 0.4) cardScale = 0.4;

    const sourceW = Math.max(1200, Math.round(unscaledW * cardScale));
    const sourceH = Math.max(800, Math.round(unscaledH * cardScale));

    const tx = Math.round(margin * cardScale - minX * cardScale);
    const ty = Math.round(margin * cardScale - minY * cardScale);

    // 3. Lưu lại các style ban đầu để hoàn tác sau khi chụp
    const origContWidth = chartCont.style.width;
    const origContHeight = chartCont.style.height;
    const origContMaxWidth = chartCont.style.maxWidth;
    const origContMaxHeight = chartCont.style.maxHeight;
    const origContOverflow = chartCont.style.overflow;

    const f3Canvas = chartCont.querySelector('#f3Canvas') as HTMLElement | null;
    const origF3Width = f3Canvas?.style.width || '';
    const origF3Height = f3Canvas?.style.height || '';
    const origF3Overflow = f3Canvas?.style.overflow || '';

    const htmlSvg = chartCont.querySelector('#htmlSvg') as HTMLElement | null;
    const origHtmlSvgWidth = htmlSvg?.style.width || '';
    const origHtmlSvgHeight = htmlSvg?.style.height || '';

    const svgElem = chartCont.querySelector('svg.main_svg') as SVGElement | null;
    const origSvgWidth = svgElem?.style.width || '';
    const origSvgHeight = svgElem?.style.height || '';
    const origSvgAttrW = svgElem?.getAttribute('width');
    const origSvgAttrH = svgElem?.getAttribute('height');

    const svgRect = svgElem?.querySelector('rect');
    const origRectW = svgRect?.getAttribute('width');
    const origRectH = svgRect?.getAttribute('height');

    const svgView = chartCont.querySelector('svg.main_svg .view') as SVGGElement | null;
    const htmlView = chartCont.querySelector('#htmlSvg .cards_view') as HTMLElement | null;
    const origSvgTransform = svgView?.style.transform || '';
    const origSvgAttrTransform = svgView?.getAttribute('transform') || '';
    const origHtmlTransform = htmlView?.style.transform || '';

    // 4. Áp dụng kích thước mở rộng tạm thời cho container và các lớp hiển thị
    chartCont.style.width = `${sourceW}px`;
    chartCont.style.height = `${sourceH}px`;
    chartCont.style.maxWidth = 'none';
    chartCont.style.maxHeight = 'none';
    chartCont.style.overflow = 'visible';

    if (f3Canvas) {
      f3Canvas.style.width = `${sourceW}px`;
      f3Canvas.style.height = `${sourceH}px`;
      f3Canvas.style.overflow = 'visible';
    }

    if (htmlSvg) {
      htmlSvg.style.width = `${sourceW}px`;
      htmlSvg.style.height = `${sourceH}px`;
    }

    if (svgElem) {
      svgElem.style.width = `${sourceW}px`;
      svgElem.style.height = `${sourceH}px`;
      svgElem.style.overflow = 'visible';
      svgElem.setAttribute('width', String(sourceW));
      svgElem.setAttribute('height', String(sourceH));
      svgElem.setAttribute('overflow', 'visible');
      if (svgRect) {
        svgRect.setAttribute('width', String(sourceW));
        svgRect.setAttribute('height', String(sourceH));
      }
    }

    const transformStr = `translate(${tx}px, ${ty}px) scale(${cardScale})`;
    const svgAttrTransform = `translate(${tx}, ${ty}) scale(${cardScale})`;
    if (svgView) {
      svgView.style.transform = ''; // Xóa style.transform trên svgView để không double
      svgView.setAttribute('transform', svgAttrTransform);
    }
    if (htmlView) {
      htmlView.style.transform = transformStr;
    }

    // Hàm restore khôi phục trạng thái giao diện ban đầu
    const restore = () => {
      chartCont.style.width = origContWidth;
      chartCont.style.height = origContHeight;
      chartCont.style.maxWidth = origContMaxWidth;
      chartCont.style.maxHeight = origContMaxHeight;
      chartCont.style.overflow = origContOverflow;

      if (f3Canvas) {
        f3Canvas.style.width = origF3Width;
        f3Canvas.style.height = origF3Height;
        f3Canvas.style.overflow = origF3Overflow;
      }

      if (htmlSvg) {
        htmlSvg.style.width = origHtmlSvgWidth;
        htmlSvg.style.height = origHtmlSvgHeight;
      }

      if (svgElem) {
        svgElem.style.width = origSvgWidth;
        svgElem.style.height = origSvgHeight;
        svgElem.style.overflow = '';
        svgElem.removeAttribute('overflow');
        if (origSvgAttrW) svgElem.setAttribute('width', origSvgAttrW);
        else svgElem.removeAttribute('width');
        if (origSvgAttrH) svgElem.setAttribute('height', origSvgAttrH);
        else svgElem.removeAttribute('height');
        if (svgRect) {
          if (origRectW) svgRect.setAttribute('width', origRectW);
          if (origRectH) svgRect.setAttribute('height', origRectH);
        }
      }

      if (svgView) {
        svgView.style.transform = origSvgTransform;
        if (origSvgAttrTransform) {
          svgView.setAttribute('transform', origSvgAttrTransform);
        } else {
          svgView.removeAttribute('transform');
        }
      }
      if (htmlView) htmlView.style.transform = origHtmlTransform;

      // Fit lại cây hiển thị trên màn hình cho người dùng
      if (chartInstanceRef.current) {
        chartInstanceRef.current.updateTree({ tree_position: 'fit', transition_time: 0 });
      }
    };

    return { sourceW, sourceH, cardScale, transformStr, svgAttrTransform, restore };
  };

  /**
   * Xuất file PDF sắc nét, khổ ngang (Landscape A3 tiêu chuẩn), đọc rõ từng chữ trên Samsung S24 Ultra & Mobile.
   * Tự động chia thành nhiều trang ngang nếu cây phả hệ trải rộng để đảm bảo cỡ chữ luôn lớn và rõ nét.
   */
  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);

    let layoutRestore: (() => void) | null = null;

    try {
      // 1. Tự động chuyển cây về chế độ hiện toàn bộ và xóa các bộ lọc
      setSelectedBranch('all');
      setSelectedGenFilter('all');
      setSearchQuery('');
      setGenderFilter('all');

      // 2. Chờ React re-render và DOM tree cập nhật đầy đủ các thẻ
      await new Promise((resolve) => setTimeout(resolve, 500));

      const chartCont = chartContainerRef.current;
      if (!chartCont) {
        throw new Error('Không tìm thấy vùng hiển thị cây phả hệ.');
      }

      // 3. Thiết lập kích thước thật và tỉ lệ thẻ tối ưu ~200px
      const { sourceW, sourceH, cardScale, transformStr, svgAttrTransform, restore } = setupTreeForExport(chartCont);
      layoutRestore = restore;

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Tính toán scale capture: Ưu tiên scale 3.5 (hoặc 3.0 nếu canvas vượt ngưỡng bộ nhớ an toàn)
      const maxCanvasDim = typeof window !== 'undefined' && window.innerWidth < 768 ? 8192 : 14000;
      let exportScale = 3.5;
      if (sourceW * exportScale > maxCanvasDim || sourceH * exportScale > maxCanvasDim) {
        exportScale = Math.max(3.0, Math.floor((maxCanvasDim / Math.max(sourceW, sourceH)) * 10) / 10);
      }

      // 4. Chụp toàn cảnh cây với modern-screenshot
      const imgData = await domToJpeg(chartCont, {
        width: sourceW,
        height: sourceH,
        scale: exportScale,
        quality: 0.92,
        backgroundColor: '#faf7f2',
        onCloneNode: (cloned) => {
          if (!cloned || !(cloned instanceof Element)) return;

          // Ép font-family rõ ràng chuẩn tiếng Việt
          const standardFont = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif';
          const styleTag = document.createElement('style');
          styleTag.textContent = `
            * {
              font-family: ${standardFont} !important;
            }
          `;
          cloned.prepend(styleTag);

          const clonedSvgView = cloned.querySelector('svg.main_svg .view') as SVGElement | null;
          if (clonedSvgView) {
            clonedSvgView.style.transform = '';
            clonedSvgView.setAttribute('transform', svgAttrTransform);
          }
          const clonedSvgElem = cloned.querySelector('svg.main_svg') as SVGElement | null;
          if (clonedSvgElem) {
            clonedSvgElem.style.overflow = 'visible';
            clonedSvgElem.setAttribute('overflow', 'visible');
          }

          // Ép style đường nối nhánh (SVG links)
          cloned.querySelectorAll(
            'svg .link, svg .links_view path, svg .links_view line, svg path.link'
          ).forEach((el) => {
            const node = el as SVGElement;
            node.setAttribute('stroke', '#92400e');
            node.setAttribute('stroke-width', '4');
            node.setAttribute('fill', 'none');
            node.setAttribute('stroke-linecap', 'round');
            node.setAttribute('stroke-linejoin', 'round');
            (node as unknown as HTMLElement).style.stroke = '#92400e';
            (node as unknown as HTMLElement).style.strokeWidth = '4px';
            (node as unknown as HTMLElement).style.opacity = '1';
            (node as unknown as HTMLElement).style.visibility = 'visible';
            (node as unknown as HTMLElement).style.display = '';
          });

          // Gỡ class truncate và max-width để tên và thông tin không bị cắt
          cloned.querySelectorAll('*').forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.classList && htmlEl.classList.contains('truncate')) {
              htmlEl.classList.remove('truncate');
              htmlEl.style.overflow = 'visible';
              htmlEl.style.textOverflow = 'clip';
              htmlEl.style.whiteSpace = 'normal';
            }
            if (htmlEl.style && htmlEl.style.maxWidth && htmlEl.style.maxWidth !== 'none') {
              htmlEl.style.maxWidth = 'none';
            }
          });
        },
      });

      if (!imgData || typeof imgData !== 'string' || !imgData.startsWith('data:image')) {
        throw new Error('Dữ liệu hình ảnh tạo ra không hợp lệ hoặc bị rỗng.');
      }

      // Tải ảnh vào Image object an toàn để trích xuất và phân trang (xử lý triệt để lỗi [object Event])
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        let settled = false;

        const cleanup = () => {
          img.onload = null;
          img.onerror = null;
        };

        img.onload = () => {
          if (!settled) {
            settled = true;
            cleanup();
            resolve();
          }
        };

        img.onerror = (event: Event | string) => {
          if (!settled) {
            // Kiểm tra nếu ảnh vẫn nạp thành công kích thước
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              settled = true;
              cleanup();
              resolve();
              return;
            }
            settled = true;
            cleanup();
            const eventType = typeof event === 'object' && event !== null && 'type' in event ? (event as Event).type : String(event);
            reject(new Error(`Không thể nạp dữ liệu ảnh sơ đồ (sự kiện: ${eventType}). Vui lòng thử lại.`));
          }
        };

        // Gán src sau khi đã đăng ký event listeners
        img.src = imgData;

        // Nếu ảnh đã hoàn tất ngay trong cache
        if (img.complete && img.naturalWidth > 0) {
          if (!settled) {
            settled = true;
            cleanup();
            resolve();
          }
        }
      });

      // Khổ giấy tiêu chuẩn A3 Landscape (1190.55 x 841.89 pt) làm mốc chuẩn
      const basePageW = 1190.55;
      const basePageH = 841.89;
      const marginPt = 20;
      const headerHeightPt = 54;
      const footerHeightPt = 16;
      const baseAvailW = basePageW - (marginPt * 2);
      const baseAvailH = basePageH - headerHeightPt - footerHeightPt - (marginPt * 2);

      // Tối ưu kích thước trang PDF khổ ngang (Landscape) ưu tiên 1 trang trọn vẹn:
      // Tự động khớp theo tỉ lệ thực của cây để lấp đầy khung trang, hạn chế tối đa viền trống thừa,
      // giúp các thẻ thành viên và chữ đạt kích cỡ lớn, rõ nét nhất khi xem trên điện thoại (Samsung, iPhone) & máy tính bảng.
      let pageW = basePageW;
      let pageH = basePageH;
      const treeAspect = sourceW / sourceH;
      const baseAspect = baseAvailW / baseAvailH;

      if (treeAspect > baseAspect) {
        // Cây trải rộng theo chiều ngang: mở rộng pageW theo tỉ lệ cây để chiều cao cây đạt tối đa vùng hiển thị
        pageW = Math.round(baseAvailH * treeAspect + (marginPt * 2));
      } else {
        // Cây vuông hoặc nhiều tầng theo chiều dọc: mở rộng pageH (vẫn đảm bảo khổ ngang landscape pageW >= pageH)
        pageH = Math.min(pageW, Math.round(baseAvailW / treeAspect + headerHeightPt + footerHeightPt + (marginPt * 2)));
      }

      const availW = pageW - (marginPt * 2);
      const availH = pageH - headerHeightPt - footerHeightPt - (marginPt * 2);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: [pageW, pageH],
        compress: true,
      });

      const clanUpper = clanInfo.clanSurname.toUpperCase();
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      // Helper vẽ Header trên từng trang PDF
      const drawPdfHeader = (pageTitle: string, pageSubtitle: string) => {
        pdf.setFillColor(28, 14, 9); // #1c0e09
        pdf.rect(0, 0, pageW, headerHeightPt + marginPt, 'F');

        pdf.setDrawColor(217, 119, 6); // Amber-600
        pdf.setLineWidth(2.5);
        pdf.line(0, headerHeightPt + marginPt, pageW, headerHeightPt + marginPt);

        pdf.setTextColor(254, 243, 199); // Amber-100
        pdf.setFontSize(17);
        pdf.setFont('helvetica', 'bold');
        pdf.text(pageTitle, marginPt + 8, marginPt + 22);

        pdf.setTextColor(214, 211, 209); // Stone-300
        pdf.setFontSize(9.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(pageSubtitle, marginPt + 8, marginPt + 42);
      };

      // Helper vẽ Footer trên từng trang PDF (đã xóa hoàn toàn dòng ghi chú / footer ở cuối trang theo yêu cầu)
      const drawPdfFooter = (_pageNumber: number, _totalPages: number) => {
        // Đã xóa toàn bộ dòng ghi chú / footer / trial / demo ở cuối trang
      };

      // Ưu tiên tạo PDF 1 trang landscape: Chỉ chia nhiều trang nếu cây quá đồ sộ (> 4000px bề rộng và hơn 80 người)
      const isColossalTree = sourceW > 4000 && members.length > 80;
      const numSegments = isColossalTree ? Math.min(5, Math.max(2, Math.ceil(sourceW / 1400))) : 1;
      const totalPages = isColossalTree ? numSegments + 1 : 1;

      // ================= TRANG 1: TOÀN CẢNH CÂY PHẢ HỆ =================
      drawPdfHeader(
        `GIA PHẢ NỘI TỘC - ${clanUpper} TỘC · ${totalPages > 1 ? 'TỔNG QUAN TOÀN BỘ' : 'TOÀN CẢNH PHẢ HỆ'}`,
        `Ngày xuất bản: ${formattedDate}  |  Quy mô: ${members.length} thành viên · ${maxGen} thế hệ  |  "${clanInfo.subTitle || 'Uống nước nhớ nguồn - Vạn thuở lưu danh'}"`
      );

      // Scale toàn cảnh vừa vặn trong vùng hiển thị (availW x availH)
      const overviewScale = Math.min(availW / sourceW, availH / sourceH);
      const overviewDrawW = sourceW * overviewScale;
      const overviewDrawH = sourceH * overviewScale;
      const overviewX = marginPt + (availW - overviewDrawW) / 2;
      const overviewY = headerHeightPt + marginPt + (availH - overviewDrawH) / 2;

      pdf.addImage(
        imgData,
        'JPEG',
        overviewX,
        overviewY,
        overviewDrawW,
        overviewDrawH,
        undefined,
        'FAST'
      );

      drawPdfFooter(1, totalPages);

      // ================= CÁC TRANG TIẾP THEO: PHÂN ĐOẠN CHI TIẾT NẾU CÂY QUÁ ĐỒ SỘ =================
      if (isColossalTree && numSegments > 1) {
        const overlapPx = 160; // Vùng gối đầu 160px để không bị cắt giữa các thẻ thành viên
        const segW = Math.round((sourceW + (numSegments - 1) * overlapPx) / numSegments);

        for (let i = 0; i < numSegments; i++) {
          pdf.addPage([pageW, pageH], 'landscape');
          const pageIndex = i + 2;

          const startX = Math.max(0, Math.round(i * (segW - overlapPx)));
          const endX = Math.min(sourceW, startX + segW);
          const actualSegW = endX - startX;

          const actualImgW = img.naturalWidth || Math.round(sourceW * exportScale);
          const actualImgH = img.naturalHeight || Math.round(sourceH * exportScale);
          const realScaleX = actualImgW / sourceW;
          const realScaleY = actualImgH / sourceH;

          // Tạo Canvas cắt phân đoạn ảnh độ phân giải cao
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = Math.round(actualSegW * realScaleX);
          sliceCanvas.height = Math.round(sourceH * realScaleY);
          const ctx = sliceCanvas.getContext('2d');

          if (ctx) {
            ctx.fillStyle = '#faf7f2';
            ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            ctx.drawImage(
              img,
              Math.round(startX * realScaleX),
              0,
              Math.round(actualSegW * realScaleX),
              actualImgH,
              0,
              0,
              sliceCanvas.width,
              sliceCanvas.height
            );
          }

          const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92);

          drawPdfHeader(
            `GIA PHẢ NỘI TỘC - ${clanUpper} TỘC · CHI TIẾT PHÂN ĐOẠN ${i + 1}/${numSegments}`,
            `Phóng to chi tiết (Trang ${pageIndex}/${totalPages}) — Kích thước chữ lớn, đọc rõ ràng tên tuổi & thế hệ không cần zoom`
          );

          // Vẽ ảnh phân đoạn phóng đại vào trang PDF
          const segScale = Math.min(availW / actualSegW, availH / sourceH);
          const segDrawW = actualSegW * segScale;
          const segDrawH = sourceH * segScale;
          const segX = marginPt + (availW - segDrawW) / 2;
          const segY = headerHeightPt + marginPt + (availH - segDrawH) / 2;

          pdf.addImage(
            sliceData,
            'JPEG',
            segX,
            segY,
            segDrawW,
            segDrawH,
            undefined,
            'FAST'
          );

          drawPdfFooter(pageIndex, totalPages);
        }
      }

      // Lưu file PDF hoàn chỉnh
      const sanitizedSurname = clanInfo.clanSurname.trim().replace(/\s+/g, '_');
      const dateForFile = `${day}_${month}_${year}`;
      const fileName = `Gia_Pha_${sanitizedSurname}_Landscape_${dateForFile}.pdf`;

      pdf.save(fileName);
    } catch (err: any) {
      console.error('Lỗi khi xuất PDF phả hệ:', err);
      alert('Không thể xuất file PDF: ' + (err.message || 'Vui lòng thử lại.'));
    } finally {
      if (layoutRestore) {
        layoutRestore();
      }
      setIsExportingPdf(false);
    }
  };

  /**
   * Xuất ảnh JPG siêu sắc nét với modern-screenshot
   * - Scale: 4 (tối thiểu 3.5, tối ưu 4.0)
   * - Quality: 0.93
   * - Ép font-family rõ ràng: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif
   * - Giữ nguyên logic setupTreeForExport hiện tại
   */
  const handleExportJpg = async () => {
    if (isExportingJpg) return;
    setIsExportingJpg(true);

    let layoutRestore: (() => void) | null = null;

    try {
      // 1. Tự động chuyển cây về chế độ hiện toàn bộ và xóa các bộ lọc
      setSelectedBranch('all');
      setSelectedGenFilter('all');
      setSearchQuery('');
      setGenderFilter('all');

      // 2. Chờ React re-render và DOM tree cập nhật đầy đủ các thẻ
      await new Promise((resolve) => setTimeout(resolve, 500));

      const chartCont = chartContainerRef.current;
      if (!chartCont) {
        throw new Error('Không tìm thấy vùng hiển thị cây phả hệ.');
      }

      // 3. Thiết lập kích thước thật và zoom thẻ ~200px
      const { sourceW, sourceH, cardScale, transformStr, svgAttrTransform, restore } = setupTreeForExport(chartCont);
      layoutRestore = restore;

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Tăng scale của modern-screenshot lên tối thiểu 3.5 (tốt nhất 4.0) với kiểm tra an toàn giới hạn canvas
      const maxCanvasDim = typeof window !== 'undefined' && window.innerWidth < 768 ? 8192 : 14000;
      let exportScale = 4.0;
      if (sourceW * exportScale > maxCanvasDim) {
        exportScale = Math.max(2.5, Math.floor((maxCanvasDim / sourceW) * 10) / 10);
      } else if (sourceW * 3.5 > maxCanvasDim) {
        exportScale = 3.5;
      }

      // 4. Chụp bằng domToJpeg của modern-screenshot với scale: exportScale, quality: 0.93
      const imgData = await domToJpeg(chartCont, {
        width: sourceW,
        height: sourceH,
        scale: exportScale,
        quality: 0.93,
        backgroundColor: '#faf7f2',
        onCloneNode: (cloned) => {
          if (!cloned || !(cloned instanceof Element)) return;

          // Ép font-family rõ ràng: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif
          const standardFont = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif';
          const styleTag = document.createElement('style');
          styleTag.textContent = `
            * {
              font-family: ${standardFont} !important;
            }
          `;
          cloned.prepend(styleTag);

          const clonedSvgView = cloned.querySelector('svg.main_svg .view') as SVGElement | null;
          if (clonedSvgView) {
            clonedSvgView.style.transform = '';
            clonedSvgView.setAttribute('transform', svgAttrTransform);
          }
          const clonedSvgElem = cloned.querySelector('svg.main_svg') as SVGElement | null;
          if (clonedSvgElem) {
            clonedSvgElem.style.overflow = 'visible';
            clonedSvgElem.setAttribute('overflow', 'visible');
          }

          // Ép style đường nối nhánh (SVG links)
          cloned.querySelectorAll(
            'svg .link, svg .links_view path, svg .links_view line, svg path.link'
          ).forEach((el) => {
            const node = el as SVGElement;
            node.setAttribute('stroke', '#92400e');
            node.setAttribute('stroke-width', '4');
            node.setAttribute('fill', 'none');
            node.setAttribute('stroke-linecap', 'round');
            node.setAttribute('stroke-linejoin', 'round');
            (node as unknown as HTMLElement).style.stroke = '#92400e';
            (node as unknown as HTMLElement).style.strokeWidth = '4px';
            (node as unknown as HTMLElement).style.opacity = '1';
            (node as unknown as HTMLElement).style.visibility = 'visible';
            (node as unknown as HTMLElement).style.display = '';
          });

          // Gỡ class truncate và max-width để tên và thông tin không bị cắt (Lê Thị M..)
          cloned.querySelectorAll('*').forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.classList && htmlEl.classList.contains('truncate')) {
              htmlEl.classList.remove('truncate');
              htmlEl.style.overflow = 'visible';
              htmlEl.style.textOverflow = 'clip';
              htmlEl.style.whiteSpace = 'normal';
            }
            if (htmlEl.style && htmlEl.style.maxWidth && htmlEl.style.maxWidth !== 'none') {
              htmlEl.style.maxWidth = 'none';
            }
          });
        },
      });

      console.log(`[handleExportJpg] modern-screenshot export completed: sourceW=${sourceW}, sourceH=${sourceH}, scale=${exportScale}`);

      // 5. Tải file Gia_Pha_{Ho}.jpg về máy (chất lượng JPEG 0.93 sắc nét)
      const sanitizedSurname = clanInfo.clanSurname.trim().replace(/\s+/g, '_');
      const fileName = `Gia_Pha_${sanitizedSurname}.jpg`;

      const downloadLink = document.createElement('a');
      downloadLink.href = imgData;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh JPG phả hệ:', err);
      alert('Không thể tải ảnh JPG: ' + (err.message || 'Vui lòng thử lại.'));
    } finally {
      if (layoutRestore) {
        layoutRestore();
      }
      setIsExportingJpg(false);
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
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-20">
      
      {/* Top Filter & Action Bar */}
      <div className="bg-[#1c0e09] text-amber-50 border-b border-amber-900/60 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <TreePine className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold font-serif-clan text-amber-100 tracking-wide flex items-center gap-2">
                  <span>Cây Phân Nhánh</span>
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700/50 hidden sm:inline">
                    {treeMembers.length} người
                  </span>
                </h1>
              </div>
            </div>

            {/* Quick Action Buttons: Xuất Bản PDF & Tải Ảnh JPG */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf || isExportingJpg}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-800 to-red-950 hover:from-red-700 hover:to-red-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer transition-all active:scale-95"
                  title="Xuất file PDF khổ A3 ngang sắc nét, đọc rõ từng chữ trên Samsung S24 Ultra & Mobile"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>{isExportingPdf ? 'Đang xuất...' : 'Xuất Bản PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJpg}
                  disabled={isExportingPdf || isExportingJpg}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 border border-amber-900/60 text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer transition-all active:scale-95"
                  title="Tải ảnh JPG độ phân giải cao"
                >
                  {isExportingJpg ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{isExportingJpg ? 'Đang xử lý...' : 'Tải Ảnh JPG'}</span>
                </button>
              </div>

              {/* Mobile Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(prev => !prev)}
                className="md:hidden px-2.5 py-1.5 rounded-xl bg-stone-800 border border-amber-900/50 text-amber-200 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{isMobileFiltersOpen ? 'Ẩn bộ lọc' : 'Lọc & Phóng to'}</span>
              </button>
            </div>
          </div>

          {/* Filter Bar Controls (Collapsed on mobile if toggled) */}
          {isMobileFiltersOpen && (
            <div className="pt-3 mt-2 border-t border-amber-900/40 text-xs space-y-2.5">
              
              {/* Row 1: Search & Branch & Gen Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                
                {/* Search in Tree */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm tên, chức vị, phối ngẫu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-stone-900/90 border border-amber-900/50 text-amber-50 text-xs placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-stone-400 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Branch Select */}
                <div>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-stone-900/90 border border-amber-900/50 text-amber-100 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all">Tất cả các Chi Nhánh</option>
                    {branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Generation Depth Filter */}
                <div>
                  <select
                    value={selectedGenFilter}
                    onChange={(e) => setSelectedGenFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-stone-900/90 border border-amber-900/50 text-amber-100 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all">Tất cả thế hệ (1 - {maxGen})</option>
                    {generationOptions.map(g => (
                      <option key={g} value={g}>
                        Đến Đời {g} {g === 1 ? '(Thủy Tổ)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gender Filter */}
                <div className="flex items-center rounded-xl bg-stone-900/80 p-0.5 border border-amber-900/50">
                  <button
                    type="button"
                    onClick={() => setGenderFilter('all')}
                    className={`flex-1 py-1 rounded-lg text-center font-semibold text-[11px] transition-all ${
                      genderFilter === 'all' ? 'bg-amber-700 text-white shadow-xs' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderFilter('male')}
                    className={`flex-1 py-1 rounded-lg text-center font-semibold text-[11px] transition-all ${
                      genderFilter === 'male' ? 'bg-sky-600 text-white shadow-xs' : 'text-sky-400 hover:text-sky-200'
                    }`}
                  >
                    Nam ♂
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderFilter('female')}
                    className={`flex-1 py-1 rounded-lg text-center font-semibold text-[11px] transition-all ${
                      genderFilter === 'female' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-400 hover:text-rose-200'
                    }`}
                  >
                    Nữ ♀
                  </button>
                </div>

              </div>

              {/* Row 2: Toggles & Navigation View Controls */}
              <div className="flex items-center justify-between gap-3 flex-wrap pt-1 text-[11px] text-stone-300">
                
                {/* Spouse Toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showSpouses}
                    onChange={(e) => setShowSpouses(e.target.checked)}
                    className="rounded border-amber-700 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 bg-stone-900"
                  />
                  <span>Hiện phối ngẫu (Vợ / Chồng)</span>
                </label>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* Main View Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* FAMILY-CHART D3 CANVAS (PINCH-TO-ZOOM, SMOOTH PAN, FOCAL ZOOM, FIT SCREEN) */}
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

          {/* DOM Container for family-chart */}
          <div 
            id="familyTreeChartCont"
            ref={chartContainerRef}
            className="w-full h-full relative z-10 f3"
            style={{ minHeight: '600px', height: '100%' }}
          />
        </div>

      </div>
    </div>
  );
};

export default FamilyTreeViewer;
