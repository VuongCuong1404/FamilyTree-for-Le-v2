import { Solar, Lunar } from 'lunar-javascript';

export interface LunarDateInfo {
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  lunarMonthName: string;
  lunarYearName: string; // e.g. "Bính Ngọ"
  formattedLunar: string; // e.g. "10/03 Âm lịch"
  formattedFullLunar: string; // e.g. "ngày 29 tháng 7 năm Bính Ngọ"
  isLeapMonth: boolean;
  solarDateString: string; // e.g. "10/09/2026"
  solarDay: number;
  solarMonth: number;
  solarYear: number;
}

// Bảng ánh xạ 10 Thiên can sang tiếng Việt
export const CAN_VIET_MAP: Record<string, string> = {
  '甲': 'Giáp',
  '乙': 'Ất',
  '丙': 'Bính',
  '丁': 'Đinh',
  '戊': 'Mậu',
  '己': 'Kỷ',
  '庚': 'Canh',
  '辛': 'Tân',
  '壬': 'Nhâm',
  '癸': 'Quý',
};

// Bảng ánh xạ 12 Địa chi sang tiếng Việt
export const CHI_VIET_MAP: Record<string, string> = {
  '子': 'Tý',
  '丑': 'Sửu',
  '寅': 'Dần',
  '卯': 'Mão',
  '辰': 'Thìn',
  '巳': 'Tỵ',
  '午': 'Ngọ',
  '未': 'Mùi',
  '申': 'Thân',
  '酉': 'Dậu',
  '戌': 'Tuất',
  '亥': 'Hợi',
};

// Mảng 10 Can và 12 Chi tiếng Việt chuẩn để tính toán theo năm
export const CAN_LIST = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
export const CHI_LIST = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'] as const;

/**
 * Chuyển Can Chi năm Âm lịch sang tiếng Việt thuần túy (ví dụ: "Bính Ngọ"),
 * loại bỏ hoàn toàn các ký tự chữ Hán (午年, 丙午, 马...).
 */
export function getVietnameseYearCanChi(lunarYear: number, rawGan?: string, rawZhi?: string): string {
  if (rawGan && rawZhi && CAN_VIET_MAP[rawGan] && CHI_VIET_MAP[rawZhi]) {
    return `${CAN_VIET_MAP[rawGan]} ${CHI_VIET_MAP[rawZhi]}`;
  }
  // Tính theo chu kỳ Can Chi năm âm lịch
  const canIndex = ((lunarYear + 6) % 10 + 10) % 10;
  const chiIndex = ((lunarYear + 8) % 12 + 12) % 12;
  return `${CAN_LIST[canIndex]} ${CHI_LIST[chiIndex]}`;
}

/**
 * Converts a Gregorian (Solar) Date to Lunar details using lunar-javascript
 */
export function convertSolarToLunar(solarDate: Date = new Date()): LunarDateInfo {
  try {
    const solar = Solar.fromDate(solarDate);
    const lunar = solar.getLunar();

    const lunarDay = lunar.getDay();
    const lunarMonth = Math.abs(lunar.getMonth());
    const lunarYear = lunar.getYear();
    const isLeapMonth = lunar.getMonth() < 0;

    // Tên năm Can Chi tiếng Việt thuần, không dùng chữ Hán
    const lunarYearName = getVietnameseYearCanChi(lunarYear, lunar.getYearGan(), lunar.getYearZhi());
    const formattedLunar = `${String(lunarDay).padStart(2, '0')}/${String(lunarMonth).padStart(2, '0')} Âm lịch`;
    const formattedFullLunar = `ngày ${lunarDay} tháng ${lunarMonth}${isLeapMonth ? ' (nhuận)' : ''} năm ${lunarYearName}`;

    const solarDay = solar.getDay();
    const solarMonth = solar.getMonth();
    const solarYear = solar.getYear();
    const solarDateString = `${String(solarDay).padStart(2, '0')}/${String(solarMonth).padStart(2, '0')}/${solarYear}`;

    return {
      lunarDay,
      lunarMonth,
      lunarYear,
      lunarMonthName: `Tháng ${lunarMonth}${isLeapMonth ? ' (nhuận)' : ''}`,
      lunarYearName,
      formattedLunar,
      formattedFullLunar,
      isLeapMonth,
      solarDateString,
      solarDay,
      solarMonth,
      solarYear,
    };
  } catch (err) {
    console.error('Error converting solar to lunar:', err);
    // Safe fallback thuần Việt
    return {
      lunarDay: 10,
      lunarMonth: 3,
      lunarYear: 2026,
      lunarMonthName: 'Tháng 3',
      lunarYearName: 'Bính Ngọ',
      formattedLunar: '10/03 Âm lịch',
      formattedFullLunar: 'ngày 10 tháng 3 năm Bính Ngọ',
      isLeapMonth: false,
      solarDateString: '26/04/2026',
      solarDay: 26,
      solarMonth: 4,
      solarYear: 2026,
    };
  }
}

/**
 * Converts a Lunar Date (e.g. 10/03) in a specific Solar Year to Gregorian Date
 */
export function convertLunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeap: boolean = false
): { solarDate: Date; formattedSolar: string; daysRemaining: number } {
  try {
    const lunar = Lunar.fromYmd(lunarYear, isLeap ? -lunarMonth : lunarMonth, lunarDay);
    const solar = lunar.getSolar();
    const solarDate = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
    
    const formattedSolar = `${String(solar.getDay()).padStart(2, '0')}/${String(solar.getMonth()).padStart(2, '0')}/${solar.getYear()}`;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(solarDate);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      solarDate,
      formattedSolar,
      daysRemaining,
    };
  } catch (e) {
    console.error('Error converting lunar to solar:', e);
    return {
      solarDate: new Date(),
      formattedSolar: '26/04/2026',
      daysRemaining: 18,
    };
  }
}

/**
 * Parses a lunar date string like "10/03 Âm lịch", "10/03", "15/05 AL"
 */
export function parseLunarDateString(str: string): { day: number; month: number } | null {
  if (!str) return null;
  const match = str.match(/(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    if (day >= 1 && day <= 30 && month >= 1 && month <= 12) {
      return { day, month };
    }
  }
  return null;
}

/**
 * Calculates upcoming anniversary in current or next year
 */
export function getUpcomingAnniversaryDate(lunarDateStr: string): {
  solarDateStr: string;
  daysRemaining: number;
  isPastThisYear: boolean;
  canChiYear: string;
} {
  const parsed = parseLunarDateString(lunarDateStr);
  if (!parsed) {
    return {
      solarDateStr: '26/04/2026',
      daysRemaining: 18,
      isPastThisYear: false,
      canChiYear: 'Bính Ngọ 2026',
    };
  }

  const currentYear = new Date().getFullYear() >= 2026 ? new Date().getFullYear() : 2026;
  const thisYearResult = convertLunarToSolar(currentYear, parsed.month, parsed.day);

  if (thisYearResult.daysRemaining >= 0) {
    const lunar = Lunar.fromYmd(currentYear, parsed.month, parsed.day);
    const canChi = getVietnameseYearCanChi(currentYear, lunar.getYearGan(), lunar.getYearZhi());
    return {
      solarDateStr: thisYearResult.formattedSolar,
      daysRemaining: thisYearResult.daysRemaining,
      isPastThisYear: false,
      canChiYear: `${canChi} ${currentYear}`,
    };
  }

  // Already passed this year -> calculate for next year
  const nextYear = currentYear + 1;
  const nextYearResult = convertLunarToSolar(nextYear, parsed.month, parsed.day);
  const nextLunar = Lunar.fromYmd(nextYear, parsed.month, parsed.day);
  const nextCanChi = getVietnameseYearCanChi(nextYear, nextLunar.getYearGan(), nextLunar.getYearZhi());

  return {
    solarDateStr: nextYearResult.formattedSolar,
    daysRemaining: nextYearResult.daysRemaining,
    isPastThisYear: true,
    canChiYear: `${nextCanChi} ${nextYear}`,
  };
}
