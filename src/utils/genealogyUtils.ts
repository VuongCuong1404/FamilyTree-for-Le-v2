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

