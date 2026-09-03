export type Role = 'admin' | 'support' | 'member';
export type Gender = 'male' | 'female' | 'Nam' | 'Nữ';

/**
 * User Profile matching Supabase public.profiles table
 */
export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: Role;
  created_at?: string;
}

/**
 * Direct Schema representation matching Supabase public.members
 */
export interface SupabaseMemberRow {
  id: string;
  user_id?: string | null;
  full_name: string;
  generation: number;
  branch?: string | null;
  gender: 'Nam' | 'Nữ';
  father_id?: string | null;
  mother_id?: string | null;
  mother_name?: string | null;
  title?: string | null;
  order_in_family?: number | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  occupation?: string | null;
  avatar_url?: string | null;
  birth_year?: string | null;
  death_year?: string | null;
  is_alive?: boolean;
  lunar_death_date?: string | null;
  resting_place?: string | null;
  spouse?: string | null;
  spouse_list?: any | null;
  spouse_ids?: string[] | null;
  achievements?: string[] | any | null;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Direct Schema representation matching Supabase public.events
 */
export interface SupabaseEventRow {
  id: string;
  member_id?: string | null;
  title: string;
  lunar_day: number;
  lunar_month: number;
  is_leap_month?: boolean;
  location?: string | null;
  description?: string | null;
  created_at?: string;
}

/**
 * Standard Member interface requested in Part 2 & 3
 */
export interface Member {
  id: string;
  user_id?: string | null;
  full_name: string;
  generation: number;
  branch?: string;
  gender: 'Nam' | 'Nữ';
  father_id?: string | null;
  mother_id?: string | null;
  spouse?: string;
  phone?: string;
  birth_year?: string;
  death_year?: string;
  avatar_url?: string;
  role: Role;
  created_at?: string;
}

/**
 * Standard FamilyEvent interface matching Supabase public.events
 */
export interface FamilyEvent {
  id: string;
  title: string;
  lunar_date: string; // e.g. "10/03 Âm lịch"
  solar_date?: string; // e.g. "26/04/2026"
  location?: string;
  description?: string;
  created_at?: string;
}

/**
 * Full ClanMember interface used across the UI components
 */
export interface SpouseInfo {
  name: string;
  birthYear?: string | number;
  deathYear?: string | number;
  isAlive?: boolean;
  lunarDeathDate?: string;
  restingPlace?: string;
  hometown?: string;
  note?: string; // e.g. "Chính thất", "Kế thất", "Bà hai", etc.
}

export interface ClanMember {
  id: string;
  userId?: string | null;
  fullName: string;
  gender: 'male' | 'female';
  generation: number; // 1 = Thủy tổ, 2 = Đời 2, ...
  branch: string; // "Chi Trưởng", "Chi Hai", "Chi Ba", ...
  title?: string; // "Thủy Tổ", "Cụ Tổ", "Trưởng Tộc", "Trưởng Chi", ...
  birthYear?: string | number;
  deathYear?: string | number | null;
  isAlive: boolean;
  lunarDeathDate?: string; // e.g. "10/03 Âm lịch"
  parentId: string | null; // Id of father
  motherId?: string | null; // Id of mother
  motherName?: string;
  spouse?: string; // Quick name
  spouseList?: SpouseInfo[];
  spouseIds?: string[];
  phone?: string;
  email?: string;
  address?: string;
  occupation?: string;
  bio?: string;
  restingPlace?: string;
  achievements?: string[];
  avatar?: string;
  role?: Role;
  orderInFamily?: number;
}

export interface ClanInfo {
  name: string;
  clanSurname: string;
  subTitle: string;
  ancestorName: string;
  ancestralHallLocation: string;
  zaloGroupUrl: string;
  zaloQrCodeUrl?: string;
  contactLeaderName: string;
  contactLeaderPhone: string;
  contactLeaderRole: string;
  welcomeLetter: {
    title: string;
    author: string;
    role: string;
    paragraphs: string[];
    dateText: string;
  };
  totalGenerations: number;
  totalMembersCount: number;
  totalLivingCount: number;
  totalBranchesCount: number;
}

export interface MemorialEvent {
  id: string;
  memberId?: string | null;
  title: string;
  lunarDay?: number;
  lunarMonth?: number;
  isLeapMonth?: boolean;
  lunarDate: string;
  solarDateEstimated: string;
  targetPersonName: string;
  generation: number;
  branch: string;
  location: string;
  hostPerson: string;
  role: string;
  description: string;
  ritualNotes?: string;
  isMajorAnniversary?: boolean;
}

export interface ClanNewsEvent {
  id: string;
  title: string;
  date: string;
  category: 'le_hoi' | 'khuyen_hoc' | 'tu_bo' | 'hop_ho' | 'chuc_tho';
  summary: string;
  content: string;
  location?: string;
  isPinned?: boolean;
  image?: string;
}

export interface ClanFundRecord {
  id: string;
  contributorName?: string;
  contributorOrRecipient?: string;
  type?: 'income' | 'expense';
  category: string;
  title?: string;
  purpose?: string;
  amount: number;
  date: string;
  branch?: string;
  generation?: number;
  note?: string;
  receiptNumber?: string;
}

export interface ClanScholarship {
  id: string;
  studentName: string;
  generation: number;
  branch: string;
  parentName: string;
  schoolOrUniversity?: string;
  schoolName?: string;
  achievement?: string;
  achievementLevel?: string;
  academicYear?: string;
  awardYear?: number;
  rewardAmount: number;
  rewardDate?: string;
  notes?: string;
}

export interface EventRsvp {
  id: string;
  event_id?: string | null;
  event_title?: string | null;
  full_name: string;
  phone?: string | null;
  branch?: string | null;
  attendee_count: number;
  notes?: string | null;
  created_at?: string;
}

