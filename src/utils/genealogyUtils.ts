import { Gender, ClanMember } from '../types';

export interface AgeCalculationResult {
  age: number | null;
  lifespan: number | null;
  formattedText: string; // e.g. "24 tuổi • Sinh 2002" or "Hưởng thọ 73 tuổi • 1865 – 1938"
  shortText: string;     // e.g. "24 tuổi (2002)" or "Hưởng thọ 73t"
  birthYearNum: number | null;
  deathYearNum: number | null;
  isAlive: boolean;
}

/**
 * Extracts a 4-digit number from a string or number input.
 */
export function parseYearNumber(val?: string | number | null): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const match = String(val).match(/\b(\d{4})\b/);
  if (match) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? null : num;
  }
  const directNum = parseInt(String(val).trim(), 10);
  return isNaN(directNum) ? null : directNum;
}

/**
 * Automatically calculates accurate age or deceased lifespan (Hưởng thọ)
 * Format requirement:
 * - Living: "24 tuổi • Sinh 2002"
 * - Deceased: "Hưởng thọ 72 tuổi • 1760 – 1832"
 */
export function calculateAgeInfo(
  birthYear?: string | number | null,
  deathYear?: string | number | null,
  isAlive: boolean = true
): AgeCalculationResult {
  const currentYear = new Date().getFullYear() >= 2026 ? new Date().getFullYear() : 2026;
  const bYear = parseYearNumber(birthYear);
  const dYear = parseYearNumber(deathYear);

  if (isAlive) {
    if (bYear !== null) {
      const age = Math.max(0, currentYear - bYear);
      return {
        age,
        lifespan: null,
        formattedText: `${age} tuổi • Sinh ${bYear}`,
        shortText: `${age} tuổi (Sinh ${bYear})`,
        birthYearNum: bYear,
        deathYearNum: null,
        isAlive: true,
      };
    }
    return {
      age: null,
      lifespan: null,
      formattedText: 'Đang sinh sống • Chưa rõ năm sinh',
      shortText: 'Còn sống',
      birthYearNum: null,
      deathYearNum: null,
      isAlive: true,
    };
  }

  // Deceased / Tiền nhân
  if (bYear !== null && dYear !== null) {
    const lifespan = Math.max(0, dYear - bYear);
    return {
      age: null,
      lifespan,
      formattedText: `Hưởng thọ ${lifespan} tuổi • ${bYear} – ${dYear}`,
      shortText: `Hưởng thọ ${lifespan} tuổi (${bYear} – ${dYear})`,
      birthYearNum: bYear,
      deathYearNum: dYear,
      isAlive: false,
    };
  }

  if (bYear !== null && dYear === null) {
    return {
      age: null,
      lifespan: null,
      formattedText: `Tiền nhân • Sinh ${bYear}`,
      shortText: `Tiền nhân (Sinh ${bYear})`,
      birthYearNum: bYear,
      deathYearNum: null,
      isAlive: false,
    };
  }

  if (bYear === null && dYear !== null) {
    return {
      age: null,
      lifespan: null,
      formattedText: `Tiền nhân • Tạ thế năm ${dYear}`,
      shortText: `Mất năm ${dYear}`,
      birthYearNum: null,
      deathYearNum: dYear,
      isAlive: false,
    };
  }

  return {
    age: null,
    lifespan: null,
    formattedText: 'Tiền nhân • Chưa rõ niên đại',
    shortText: 'Tiền nhân',
    birthYearNum: null,
    deathYearNum: null,
    isAlive: false,
  };
}

/**
 * Returns gender visual information, symbols and styling
 */
export function getGenderVisuals(gender: Gender, generation?: number) {
  const isMale = gender === 'male';

  if (isMale) {
    return {
      symbol: '♂',
      label: 'Nam ♂',
      fullLabel: 'Nam Đinh ♂',
      title: 'Ông',
      badgeClass: 'bg-sky-50 text-sky-800 border border-sky-300/80 shadow-xs',
      darkBadgeClass: 'bg-sky-900/60 text-sky-200 border border-sky-700/60',
      avatarBg: generation === 1 
        ? 'bg-gradient-to-tr from-amber-600 via-yellow-600 to-red-800 text-amber-100 border border-amber-300' 
        : 'bg-gradient-to-tr from-sky-900 via-blue-900 to-amber-900 text-amber-100 border border-amber-500/40',
      cardHoverBorder: 'hover:border-sky-500',
      textAccent: 'text-sky-800',
    };
  }

  return {
    symbol: '♀',
    label: 'Nữ ♀',
    fullLabel: 'Nữ Giới ♀',
    title: 'Bà',
    badgeClass: 'bg-rose-50 text-rose-800 border border-rose-300/80 shadow-xs',
    darkBadgeClass: 'bg-rose-900/60 text-rose-200 border border-rose-700/60',
    avatarBg: 'bg-gradient-to-tr from-rose-800 via-pink-800 to-amber-900 text-rose-100 border border-rose-400/40',
    cardHoverBorder: 'hover:border-rose-400',
    textAccent: 'text-rose-800',
  };
}

/**
 * Calculate comprehensive clan statistics
 */
export function calculateClanStats(members: ClanMember[]) {
  const total = members.length;
  const living = members.filter(m => m.isAlive).length;
  const deceased = total - living;
  const male = members.filter(m => m.gender === 'male').length;
  const female = members.filter(m => m.gender === 'female').length;
  const generations = Array.from(new Set(members.map(m => m.generation))).sort((a, b) => Number(a) - Number(b));
  const branches = Array.from(new Set(members.map(m => m.branch).filter(Boolean)));

  const malePercent = total > 0 ? Math.round((male / total) * 100) : 0;
  const femalePercent = total > 0 ? Math.round((female / total) * 100) : 0;
  const livingPercent = total > 0 ? Math.round((living / total) * 100) : 0;

  return {
    total,
    living,
    deceased,
    male,
    female,
    malePercent,
    femalePercent,
    livingPercent,
    generations,
    branches,
  };
}

/**
 * Helper to extract numeric order_in_family
 */
export function getMemberOrder(m?: ClanMember | null): number {
  if (!m) return 999999;
  const ord = m.orderInFamily ?? (m as any).order_in_family;
  if (ord !== undefined && ord !== null && !isNaN(Number(ord))) {
    return Number(ord);
  }
  return 999999;
}

/**
 * Chuyển số thứ tự thế hệ thành tiêu đề chữ số La Mã / chữ Hán Việt truyền thống
 */
export function getGenerationRomanTitle(genNum: number): string {
  const romanMap: Record<number, string> = {
    1: 'Nhất (I)',
    2: 'Nhị (II)',
    3: 'Tam (III)',
    4: 'Tứ (IV)',
    5: 'Ngũ (V)',
    6: 'Lục (VI)',
    7: 'Thất (VII)',
    8: 'Bát (VIII)',
    9: 'Cửu (IX)',
    10: 'Thập (X)',
    11: 'Mười Một (XI)',
    12: 'Mười Hai (XII)',
    13: 'Mười Ba (XIII)',
    14: 'Mười Bốn (XIV)',
    15: 'Mười Lăm (XV)',
  };
  return romanMap[genNum] || `${genNum}`;
}

/**
 * Bảng thứ tự ưu tiên sắp xếp Chi phái theo truyền thống gia phả họ tộc:
 * - Thủy Tổ / Toàn Tộc (Đời 1 / Gốc họ): rank 0
 * - Chi Trưởng (Chi 1): rank 1
 * - Chi Hai (Chi 2): rank 2
 * - Chi Ba (Chi 3): rank 3
 * - Chi Bốn (Chi 4): rank 4
 * - Chi Năm (5) -> Chi Mười (10)
 * - Chi Ngoại: rank 900 (theo truyền thống phân nhánh ngoại tộc / con gái xuất giá)
 */
export const BRANCH_SORT_ORDER: Record<string, number> = {
  'Thủy Tổ': 0,
  'Toàn Tộc': 0,
  'Chi Trưởng': 1,
  'Chi Hai': 2,
  'Chi Ba': 3,
  'Chi Bốn': 4,
  'Chi Năm': 5,
  'Chi Sáu': 6,
  'Chi Bảy': 7,
  'Chi Tám': 8,
  'Chi Chín': 9,
  'Chi Mười': 10,
  'Chi Ngoại': 900,
};

/**
 * Quy ước xếp hạng Chi phái:
 * - Khớp trong BRANCH_SORT_ORDER: lấy thứ tự tương ứng (Chi Trưởng = 1, Chi Hai = 2, ...)
 * - Nếu tên chi chứa chữ "ngoại" (ví dụ "Ngoại tộc", "Chi Ngoại"): rank 900
 * - Chi nội khác (chưa chuẩn hóa hoặc không khớp): rank 500 (sau các chi nội đã biết 1-10, trước Chi Ngoại)
 * - Không có thông tin / rỗng: rank 950 (cuối danh sách)
 */
export function getBranchRank(branch?: string | null): number {
  if (!branch || !branch.trim()) return 950;
  const trimmed = branch.trim();
  if (BRANCH_SORT_ORDER[trimmed] !== undefined) {
    return BRANCH_SORT_ORDER[trimmed];
  }
  if (trimmed.toLowerCase().includes('ngoại')) {
    return 900;
  }
  // Chi nội khác không nằm trong danh sách chuẩn: xếp sau chi nội đã biết (1-10), trước chi ngoại (900)
  return 500;
}

/**
 * So sánh và sắp xếp danh sách thành viên chuẩn theo phả hệ họ tộc:
 * 1. Đời (generation) tăng dần (ASC)
 * 2. Chi phái (branch rank): Thủy Tổ -> Chi Trưởng -> Chi Hai -> Chi Ba -> Chi Bốn -> Chi nội khác -> Chi Ngoại
 * 3. Thứ bậc trong gia đình (orderInFamily) tăng dần (ASC), nếu thiếu/chưa rõ coi như 999999
 * 4. Họ và tên sắp xếp theo thứ tự từ điển tiếng Việt (localeCompare 'vi')
 * 5. ID duy nhất để đảm bảo kết quả ổn định tuyệt đối (deterministic)
 */
export function compareMembersForList(
  a: Pick<ClanMember, 'generation' | 'branch' | 'fullName' | 'id'> & { orderInFamily?: number | null; order_in_family?: number | null },
  b: Pick<ClanMember, 'generation' | 'branch' | 'fullName' | 'id'> & { orderInFamily?: number | null; order_in_family?: number | null }
): number {
  // 1. Generation ASC
  const genA = Number(a.generation) || 0;
  const genB = Number(b.generation) || 0;
  if (genA !== genB) {
    return genA - genB;
  }

  // 2. Branch rank
  const rankA = getBranchRank(a.branch);
  const rankB = getBranchRank(b.branch);
  if (rankA !== rankB) {
    return rankA - rankB;
  }
  // Nếu cùng rank chi phái nhưng khác tên chi, gom nhóm theo tên chi bằng tiếng Việt
  if (a.branch && b.branch && a.branch !== b.branch) {
    const branchComp = a.branch.localeCompare(b.branch, 'vi');
    if (branchComp !== 0) return branchComp;
  }

  // 3. Order in family ASC (thiếu / chưa nhập = 999999)
  const aOrder = getMemberOrder(a as ClanMember);
  const bOrder = getMemberOrder(b as ClanMember);
  if (aOrder !== bOrder) {
    return aOrder - bOrder;
  }

  // 4. Full name ASC theo tiếng Việt
  const nameA = a.fullName ? a.fullName.trim() : '';
  const nameB = b.fullName ? b.fullName.trim() : '';
  const nameComp = nameA.localeCompare(nameB, 'vi');
  if (nameComp !== 0) {
    return nameComp;
  }

  // 5. Tie-breaker theo id
  return (a.id || '').localeCompare(b.id || '');
}

/**
 * Compress an image File into a lightweight Base64 JPEG data URL using HTML5 Canvas
 */
export function compressImageFile(
  file: File,
  maxWidth = 360,
  maxHeight = 360,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Không thể phân tích tệp ảnh đã chọn'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp từ thiết bị'));
    reader.readAsDataURL(file);
  });
}

/**
 * Loại bỏ dấu tiếng Việt để phục vụ tìm kiếm không dấu / có dấu chuẩn xác.
 * Ví dụ: "Nguyễn Văn Hùng" -> "Nguyen Van Hung"
 */
export function removeVietnameseAccents(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

