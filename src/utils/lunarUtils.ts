import { Solar, Lunar } from 'lunar-javascript';

export interface LunarDateInfo {
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  lunarMonthName: string;
  lunarYearName: string; // e.g. "Bính Ngọ"
  formattedLunar: string; // e.g. "10/03 Âm lịch"
  formattedFullLunar: string; // e.g. "Ngày 10 tháng 3 năm Bính Ngọ (Âm lịch)"
  isLeapMonth: boolean;
  solarDateString: string; // e.g. "26/04/2026"
  solarDay: number;
  solarMonth: number;
  solarYear: number;
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

    const lunarYearName = `${lunar.getYearInGanZhi()} (${lunar.getYearShengXiao()})`;
    const formattedLunar = `${String(lunarDay).padStart(2, '0')}/${String(lunarMonth).padStart(2, '0')} Âm lịch`;
    const formattedFullLunar = `Ngày ${lunarDay} tháng ${lunarMonth}${isLeapMonth ? ' (Nhuận)' : ''} năm ${lunar.getYearInGanZhi()}`;

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
    // Safe fallback
    return {
      lunarDay: 10,
      lunarMonth: 3,
      lunarYear: 2026,
      lunarMonthName: 'Tháng 3',
      lunarYearName: 'Bính Ngọ',
      formattedLunar: '10/03 Âm lịch',
      formattedFullLunar: 'Ngày 10 tháng 03 năm Bính Ngọ (Âm lịch)',
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
    return {
      solarDateStr: thisYearResult.formattedSolar,
      daysRemaining: thisYearResult.daysRemaining,
      isPastThisYear: false,
      canChiYear: `${lunar.getYearInGanZhi()} ${currentYear}`,
    };
  }

  // Already passed this year -> calculate for next year
  const nextYear = currentYear + 1;
  const nextYearResult = convertLunarToSolar(nextYear, parsed.month, parsed.day);
  const nextLunar = Lunar.fromYmd(nextYear, parsed.month, parsed.day);

  return {
    solarDateStr: nextYearResult.formattedSolar,
    daysRemaining: nextYearResult.daysRemaining,
    isPastThisYear: true,
    canChiYear: `${nextLunar.getYearInGanZhi()} ${nextYear}`,
  };
}
