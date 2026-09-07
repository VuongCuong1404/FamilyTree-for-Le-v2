import { getSupabaseClient } from '../lib/supabase';
import { ClanMember, MemorialEvent, Role, SupabaseMemberRow, SupabaseEventRow, UserProfile, ClanInfo, SpouseInfo, EventRsvp } from '../types';
import { INITIAL_MEMBERS, INITIAL_MEMORIAL_EVENTS, INITIAL_CLAN_INFO } from '../data/initialData';
import { convertLunarToSolar, parseLunarDateString } from '../utils/lunarUtils';

const LOCAL_STORAGE_MEMBERS = 'clan_members_data';
const LOCAL_STORAGE_EVENTS = 'clan_memorial_data';
const LOCAL_STORAGE_PROFILES = 'clan_mock_profiles_data';
const LOCAL_STORAGE_CLAN_INFO = 'clan_info_data';

/**
 * Helper to check if a string is a valid UUID
 */
export function isUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Helper to generate a valid UUID v4
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Maps Supabase DB record (public.members) to application ClanMember
 */
export function mapRowToClanMember(row: SupabaseMemberRow | any): ClanMember {
  const isMale = row.gender === 'Nam' || row.gender === 'male';

  // Parse spouse_list from DB (JSONB, array, or JSON string)
  let spouseList: SpouseInfo[] | undefined = undefined;
  if (row.spouse_list) {
    if (Array.isArray(row.spouse_list)) {
      spouseList = row.spouse_list;
    } else if (typeof row.spouse_list === 'string') {
      try {
        const parsed = JSON.parse(row.spouse_list);
        if (Array.isArray(parsed)) spouseList = parsed;
      } catch {}
    }
  }

  // Parse achievements from DB (text[], array, or JSON/comma string)
  let achievements: string[] | undefined = undefined;
  if (row.achievements) {
    if (Array.isArray(row.achievements)) {
      achievements = row.achievements.map((a: any) => String(a).trim()).filter(Boolean);
    } else if (typeof row.achievements === 'string') {
      try {
        const parsed = JSON.parse(row.achievements);
        if (Array.isArray(parsed)) {
          achievements = parsed.map((a: any) => String(a).trim()).filter(Boolean);
        } else {
          achievements = row.achievements.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      } catch {
        achievements = row.achievements.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
  }

  // Parse spouse_ids from DB (UUID[], array, or JSON string)
  let spouseIds: string[] | undefined = undefined;
  if (row.spouse_ids) {
    if (Array.isArray(row.spouse_ids)) {
      spouseIds = row.spouse_ids.map((id: any) => String(id)).filter(Boolean);
    } else if (typeof row.spouse_ids === 'string') {
      try {
        const parsed = JSON.parse(row.spouse_ids);
        if (Array.isArray(parsed)) spouseIds = parsed.map((id: any) => String(id)).filter(Boolean);
      } catch {
        spouseIds = row.spouse_ids.replace(/[{}]/g, '').split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
  } else if (Array.isArray(row.spouseIds)) {
    spouseIds = row.spouseIds.map((id: any) => String(id)).filter(Boolean);
  }

  return {
    id: String(row.id),
    userId: row.user_id || row.userId || undefined,
    fullName: row.full_name || row.fullName || 'Chưa đặt tên',
    gender: isMale ? 'male' : 'female',
    generation: Number(row.generation) || 1,
    branch: row.branch || 'Chi Trưởng',
    title: row.title || undefined,
    birthYear: row.birth_year || undefined,
    deathYear: row.death_year || undefined,
    isAlive: typeof row.is_alive === 'boolean' ? row.is_alive : !row.death_year,
    lunarDeathDate: row.lunar_death_date || row.lunarDeathDate || undefined,
    parentId: row.father_id || row.parentId || null,
    motherId: row.mother_id || row.motherId || undefined,
    motherName: row.mother_name || row.motherName || undefined,
    orderInFamily: row.order_in_family !== undefined && row.order_in_family !== null 
      ? Number(row.order_in_family) 
      : (row.orderInFamily !== undefined && row.orderInFamily !== null ? Number(row.orderInFamily) : undefined),
    spouse: row.spouse || undefined,
    spouseList: spouseList || (Array.isArray(row.spouseList) ? row.spouseList : undefined),
    spouseIds: spouseIds && spouseIds.length > 0 ? spouseIds : undefined,
    phone: row.phone || undefined,
    email: row.email || undefined,
    address: row.address || undefined,
    occupation: row.occupation || undefined,
    achievements: achievements || (Array.isArray(row.achievements) ? row.achievements : undefined),
    bio: row.bio || undefined,
    restingPlace: row.resting_place || row.restingPlace || undefined,
    avatar: row.avatar_url || row.avatar || undefined,
    role: (row.role as Role) || 'member',
  };
}

/**
 * Maps application ClanMember to Supabase DB record format (public.members)
 */
export function mapClanMemberToRow(member: ClanMember): SupabaseMemberRow {
  const rowId = isUUID(member.id) ? member.id : generateUUID();
  const validSpouseIds = Array.isArray(member.spouseIds)
    ? member.spouseIds.filter(id => isUUID(id))
    : [];

  return {
    id: rowId,
    user_id: member.userId ? member.userId : null,
    full_name: member.fullName,
    generation: member.generation,
    branch: member.branch || null,
    gender: member.gender === 'male' ? 'Nam' : 'Nữ',
    father_id: member.parentId && isUUID(member.parentId) ? member.parentId : null,
    mother_id: member.motherId && isUUID(member.motherId) ? member.motherId : null,
    mother_name: member.motherName || null,
    title: member.title || null,
    order_in_family: member.orderInFamily || null,
    phone: member.phone || null,
    email: member.email || null,
    address: member.address || null,
    occupation: member.occupation || null,
    avatar_url: member.avatar || null,
    birth_year: member.birthYear ? String(member.birthYear) : null,
    death_year: member.deathYear ? String(member.deathYear) : null,
    is_alive: member.isAlive,
    lunar_death_date: member.lunarDeathDate || null,
    resting_place: member.restingPlace || null,
    spouse: member.spouse || null,
    spouse_list: Array.isArray(member.spouseList) ? member.spouseList : [],
    spouse_ids: validSpouseIds,
    achievements: Array.isArray(member.achievements) ? member.achievements : [],
    bio: member.bio || null,
  };
}

/**
 * Fetch all members (From Supabase if connected, otherwise from local storage)
 */
export async function fetchMembersService(): Promise<{ members: ClanMember[]; isFromSupabase: boolean; error?: string }> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('members')
        .select('*')
        .order('generation', { ascending: true })
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = data.map(mapRowToClanMember);
        // Backup to local
        localStorage.setItem(LOCAL_STORAGE_MEMBERS, JSON.stringify(mapped));
        return { members: mapped, isFromSupabase: true };
      } else if (error) {
        console.warn('Supabase fetch error, fallback to local:', error.message);
      }
    } catch (e: any) {
      console.warn('Supabase request failed, using local storage:', e.message);
    }
  }

  // Local fallback
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_MEMBERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { members: parsed, isFromSupabase: false };
      }
    }
  } catch (e) {
    console.error('Failed reading local storage:', e);
  }

  return { members: INITIAL_MEMBERS, isFromSupabase: false };
}

/**
 * Save / Update a member (with symmetrical spouse links)
 */
export async function saveMemberService(
  member: ClanMember, 
  currentRole: Role,
  allMembers?: ClanMember[]
): Promise<{ success: boolean; member: ClanMember; updatedSpouses?: ClanMember[]; error?: string }> {
  // Permission verification: Only 'admin' or 'support' can add/edit
  if (currentRole === 'member') {
    return {
      success: false,
      member,
      error: 'Tài khoản Thành viên (Member) chỉ có quyền xem. Vui lòng chuyển sang quyền Admin hoặc Hỗ trợ (Support) để chỉnh sửa.',
    };
  }

  const client = getSupabaseClient();
  const row = mapClanMemberToRow(member);
  const targetMemberId = row.id;
  // Ensure the member has the matching target ID if newly generated
  const memberToSave: ClanMember = {
    ...member,
    id: targetMemberId,
  };

  const currentMemberPool = allMembers || [];
  const prevMember = currentMemberPool.find(m => m.id === member.id || m.id === targetMemberId);
  const prevSpouseIds = prevMember?.spouseIds || [];
  const newSpouseIds = member.spouseIds || [];

  // Determine spouses to link and unlink
  const updatedSpouses: ClanMember[] = [];

  // Spouses to link or unlink
  currentMemberPool.forEach(m => {
    if (m.id === targetMemberId) return;

    if (newSpouseIds.includes(m.id)) {
      // Must have targetMemberId in their spouseIds
      const existingIds = m.spouseIds || [];
      if (!existingIds.includes(targetMemberId)) {
        updatedSpouses.push({
          ...m,
          spouseIds: [...existingIds, targetMemberId],
        });
      }
    } else if (prevSpouseIds.includes(m.id) || (m.spouseIds && m.spouseIds.includes(targetMemberId))) {
      // Must be unlinked
      const existingIds = m.spouseIds || [];
      if (existingIds.includes(targetMemberId)) {
        updatedSpouses.push({
          ...m,
          spouseIds: existingIds.filter(id => id !== targetMemberId),
        });
      }
    }
  });

  if (!client) {
    // Local storage fallback save when Supabase is not connected
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_MEMBERS);
      let list: ClanMember[] = saved ? JSON.parse(saved) : (allMembers || INITIAL_MEMBERS);
      const idx = list.findIndex(m => m.id === targetMemberId || m.id === member.id);
      if (idx >= 0) {
        list[idx] = memberToSave;
      } else {
        list.push(memberToSave);
      }

      // Update symmetric spouses in local list
      updatedSpouses.forEach(sp => {
        const sIdx = list.findIndex(m => m.id === sp.id);
        if (sIdx >= 0) {
          list[sIdx] = sp;
        }
      });

      localStorage.setItem(LOCAL_STORAGE_MEMBERS, JSON.stringify(list));
      return { success: true, member: memberToSave, updatedSpouses };
    } catch (e: any) {
      return {
        success: false,
        member: memberToSave,
        error: e.message || 'Lỗi lưu dữ liệu cục bộ.',
      };
    }
  }

  try {
    const { data, error } = await client
      .from('members')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error.message);
      return {
        success: false,
        member: memberToSave,
        error: error.message || 'Lỗi lưu dữ liệu lên Supabase. Vui lòng kiểm tra quyền RLS hoặc kết nối.',
      };
    }

    // Map returned DB record
    const savedMember = data ? mapRowToClanMember(data) : memberToSave;

    // Symmetrically update spouses in Supabase
    for (const sp of updatedSpouses) {
      try {
        const validIds = (sp.spouseIds || []).filter(isUUID);
        await client
          .from('members')
          .update({ spouse_ids: validIds })
          .eq('id', sp.id);
      } catch (spErr) {
        console.warn('Could not update spouse relation in Supabase for', sp.id, spErr);
      }
    }

    // Update local storage backup with real saved record
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_MEMBERS);
      let list: ClanMember[] = saved ? JSON.parse(saved) : INITIAL_MEMBERS;
      const idx = list.findIndex(m => m.id === savedMember.id || m.id === member.id);
      if (idx >= 0) {
        list[idx] = savedMember;
      } else {
        list.push(savedMember);
      }

      updatedSpouses.forEach(sp => {
        const sIdx = list.findIndex(m => m.id === sp.id);
        if (sIdx >= 0) {
          list[sIdx] = sp;
        }
      });

      localStorage.setItem(LOCAL_STORAGE_MEMBERS, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }

    return { success: true, member: savedMember, updatedSpouses };
  } catch (e: any) {
    console.error('Supabase save error:', e.message);
    return {
      success: false,
      member: memberToSave,
      error: e.message || 'Lỗi kết nối Supabase.',
    };
  }
}

/**
 * Delete a member
 */
export async function deleteMemberService(
  memberId: string, 
  currentRole: Role
): Promise<{ success: boolean; error?: string }> {
  // Permission verification: Only 'admin' can delete members
  if (currentRole !== 'admin') {
    return {
      success: false,
      error: 'Chỉ Quản Trị Viên (Admin) mới có quyền xóa thành viên khỏi gia phả.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Chưa kết nối được Supabase. Vui lòng kiểm tra cấu hình kết nối database.',
    };
  }

  try {
    const { error } = await client
      .from('members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Supabase delete error:', error.message);
      return {
        success: false,
        error: error.message || 'Lỗi xóa thành viên khỏi Supabase. Vui lòng kiểm tra quyền RLS.',
      };
    }

    // Update local storage
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_MEMBERS);
      let list: ClanMember[] = saved ? JSON.parse(saved) : INITIAL_MEMBERS;
      list = list.filter(m => m.id !== memberId);
      localStorage.setItem(LOCAL_STORAGE_MEMBERS, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }

    return { success: true };
  } catch (e: any) {
    console.error('Supabase delete exception:', e.message);
    return {
      success: false,
      error: e.message || 'Lỗi kết nối khi xóa thành viên.',
    };
  }
}

/**
 * Maps Supabase DB record (public.events) to application MemorialEvent
 */
export function mapRowToMemorialEvent(ev: any): MemorialEvent {
  const lDay = Number(ev.lunar_day) || 10;
  const lMonth = Number(ev.lunar_month) || 3;
  const isLeap = Boolean(ev.is_leap_month);
  const lunarDate = `${String(lDay).padStart(2, '0')}/${String(lMonth).padStart(2, '0')} Âm lịch`;
  const currentYear = new Date().getFullYear() >= 2026 ? new Date().getFullYear() : 2026;
  const solar = convertLunarToSolar(currentYear, lMonth, lDay, isLeap);

  return {
    id: String(ev.id),
    memberId: ev.member_id || null,
    title: ev.title || 'Lễ Giỗ',
    lunarDay: lDay,
    lunarMonth: lMonth,
    isLeapMonth: isLeap,
    lunarDate,
    solarDateEstimated: solar.formattedSolar,
    targetPersonName: ev.title || 'Tiên Nhân Liệt Vị',
    generation: 1,
    branch: 'Toàn tộc',
    location: ev.location || 'Từ Đường Gia Tộc',
    hostPerson: 'Trưởng Tộc / Trưởng Ban Tế Tự',
    role: 'Ban Trị Sự',
    description: ev.description || '',
  };
}

/**
 * Maps application MemorialEvent to Supabase DB record format (public.events)
 */
export function mapMemorialEventToRow(ev: MemorialEvent): any {
  let day = ev.lunarDay;
  let month = ev.lunarMonth;
  if (!day || !month) {
    const parsed = parseLunarDateString(ev.lunarDate);
    if (parsed) {
      day = parsed.day;
      month = parsed.month;
    } else {
      day = 10;
      month = 3;
    }
  }

  const rowId = isUUID(ev.id) ? ev.id : generateUUID();

  return {
    id: rowId,
    title: ev.title.trim(),
    lunar_day: Number(day),
    lunar_month: Number(month),
    is_leap_month: Boolean(ev.isLeapMonth),
    location: ev.location ? ev.location.trim() : null,
    description: ev.description ? ev.description.trim() : null,
    member_id: ev.memberId && isUUID(ev.memberId) ? ev.memberId : null,
  };
}

/**
 * Fetch events (From Supabase public.events table if connected, otherwise from local storage)
 */
export async function fetchEventsService(): Promise<{ events: MemorialEvent[]; isFromSupabase: boolean; error?: string }> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('events')
        .select('*')
        .order('lunar_month', { ascending: true })
        .order('lunar_day', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = data.map(mapRowToMemorialEvent);
        // Backup to localStorage
        try {
          localStorage.setItem(LOCAL_STORAGE_EVENTS, JSON.stringify(mapped));
        } catch {}
        return { events: mapped, isFromSupabase: true };
      } else if (error) {
        console.warn('Supabase events fetch error:', error.message);
      }
    } catch (e: any) {
      console.warn('Supabase events request failed:', e.message);
    }
  }

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_EVENTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { events: parsed, isFromSupabase: false };
      }
    }
  } catch (e) {}

  return { events: INITIAL_MEMORIAL_EVENTS, isFromSupabase: false };
}

/**
 * Save / Update a memorial event in Supabase public.events
 */
export async function saveEventService(
  event: MemorialEvent,
  currentRole: Role
): Promise<{ success: boolean; event: MemorialEvent; error?: string }> {
  // Permission verification: Only 'admin' or 'support' can add/edit events
  if (currentRole === 'member') {
    return {
      success: false,
      event,
      error: 'Tài khoản Thành viên (Member) chỉ có quyền xem. Vui lòng chuyển sang quyền Admin hoặc Hỗ trợ (Support) để chỉnh sửa Lịch Giỗ.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      event,
      error: 'Chưa kết nối được Supabase. Vui lòng kiểm tra cấu hình kết nối database.',
    };
  }

  const row = mapMemorialEventToRow(event);

  try {
    const { data, error } = await client
      .from('events')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase saveEvent error:', error.message);
      return {
        success: false,
        event,
        error: error.message || 'Lỗi lưu ngày giỗ lên Supabase. Vui lòng kiểm tra quyền RLS.',
      };
    }

    const savedEvent = data ? mapRowToMemorialEvent(data) : event;

    // Update local storage backup with real saved record
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_EVENTS);
      let list: MemorialEvent[] = saved ? JSON.parse(saved) : INITIAL_MEMORIAL_EVENTS;
      const idx = list.findIndex(e => e.id === savedEvent.id || e.id === event.id);
      if (idx >= 0) {
        list[idx] = savedEvent;
      } else {
        list.push(savedEvent);
      }
      localStorage.setItem(LOCAL_STORAGE_EVENTS, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }

    return { success: true, event: savedEvent };
  } catch (e: any) {
    console.error('Supabase saveEvent exception:', e.message);
    return {
      success: false,
      event,
      error: e.message || 'Lỗi kết nối Supabase.',
    };
  }
}

/**
 * Delete a memorial event from Supabase public.events
 */
export async function deleteEventService(
  eventId: string,
  currentRole: Role
): Promise<{ success: boolean; error?: string }> {
  // Permission verification: Only 'admin' can delete events
  if (currentRole !== 'admin') {
    return {
      success: false,
      error: 'Chỉ Quản Trị Viên (Admin) mới có quyền xóa ngày giỗ khỏi lịch tộc.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Chưa kết nối được Supabase. Vui lòng kiểm tra cấu hình kết nối database.',
    };
  }

  try {
    const { error } = await client
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Supabase deleteEvent error:', error.message);
      return {
        success: false,
        error: error.message || 'Lỗi xóa ngày giỗ khỏi Supabase. Vui lòng kiểm tra quyền RLS.',
      };
    }

    // Update local storage
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_EVENTS);
      let list: MemorialEvent[] = saved ? JSON.parse(saved) : INITIAL_MEMORIAL_EVENTS;
      list = list.filter(e => e.id !== eventId);
      localStorage.setItem(LOCAL_STORAGE_EVENTS, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }

    return { success: true };
  } catch (e: any) {
    console.error('Supabase deleteEvent exception:', e.message);
    return {
      success: false,
      error: e.message || 'Lỗi kết nối khi xóa ngày giỗ.',
    };
  }
}

/**
 * Disabled seeding demo data to Supabase to prevent non-UUID conflicts with PostgreSQL uuid column.
 * INITIAL_MEMBERS is reserved exclusively for local demo preview when Supabase is not yet connected.
 */
export async function seedInitialDataToSupabase(): Promise<{ success: boolean; message: string }> {
  return {
    success: false,
    message: 'Đã vô hiệu hóa tính năng seed tự động để bảo toàn cấu trúc UUID của Supabase. Vui lòng thêm thành viên trực tiếp qua giao diện hoặc nhập qua SQL Editor.',
  };
}

// ==========================================
// CLAN SETTINGS (CLAN INFO) SERVICE
// ==========================================

/**
 * Maps Supabase DB record (public.clan_settings) to application ClanInfo
 */
export function mapRowToClanInfo(row: any, fallback: ClanInfo): ClanInfo {
  if (!row) return fallback;

  let welcomeLetter = fallback.welcomeLetter;
  if (row.welcome_letter) {
    if (typeof row.welcome_letter === 'object' && row.welcome_letter !== null) {
      welcomeLetter = {
        title: row.welcome_letter.title || fallback.welcomeLetter.title,
        author: row.welcome_letter.author || fallback.welcomeLetter.author,
        role: row.welcome_letter.role || fallback.welcomeLetter.role,
        paragraphs: Array.isArray(row.welcome_letter.paragraphs) 
          ? row.welcome_letter.paragraphs 
          : fallback.welcomeLetter.paragraphs,
        dateText: row.welcome_letter.dateText || fallback.welcomeLetter.dateText,
      };
    } else if (typeof row.welcome_letter === 'string') {
      try {
        const parsed = JSON.parse(row.welcome_letter);
        if (parsed && typeof parsed === 'object') {
          welcomeLetter = {
            title: parsed.title || fallback.welcomeLetter.title,
            author: parsed.author || fallback.welcomeLetter.author,
            role: parsed.role || fallback.welcomeLetter.role,
            paragraphs: Array.isArray(parsed.paragraphs) ? parsed.paragraphs : fallback.welcomeLetter.paragraphs,
            dateText: parsed.dateText || fallback.welcomeLetter.dateText,
          };
        }
      } catch {}
    }
  }

  return {
    name: row.name || fallback.name,
    clanSurname: row.clan_surname || row.clanSurname || fallback.clanSurname,
    subTitle: row.sub_title || row.subTitle || fallback.subTitle,
    ancestorName: row.ancestor_name || row.ancestorName || fallback.ancestorName,
    ancestralHallLocation: row.ancestral_hall_location || row.ancestralHallLocation || fallback.ancestralHallLocation,
    zaloGroupUrl: row.zalo_group_url || row.zaloGroupUrl || fallback.zaloGroupUrl,
    zaloQrCodeUrl: row.zalo_qr_code_url || row.zaloQrCodeUrl || fallback.zaloQrCodeUrl,
    contactLeaderName: row.contact_leader_name || row.contactLeaderName || fallback.contactLeaderName,
    contactLeaderPhone: row.contact_leader_phone || row.contactLeaderPhone || fallback.contactLeaderPhone,
    contactLeaderRole: row.contact_leader_role || row.contactLeaderRole || fallback.contactLeaderRole,
    welcomeLetter,
    totalGenerations: Number(row.total_generations) || fallback.totalGenerations,
    totalMembersCount: Number(row.total_members_count) || fallback.totalMembersCount,
    totalLivingCount: Number(row.total_living_count) || fallback.totalLivingCount,
    totalBranchesCount: Number(row.total_branches_count) || fallback.totalBranchesCount,
  };
}

/**
 * Maps application ClanInfo to Supabase DB record format (public.clan_settings)
 */
export function mapClanInfoToRow(info: ClanInfo): any {
  return {
    id: 1,
    name: info.name,
    clan_surname: info.clanSurname,
    sub_title: info.subTitle,
    ancestor_name: info.ancestorName,
    ancestral_hall_location: info.ancestralHallLocation,
    zalo_group_url: info.zaloGroupUrl,
    zalo_qr_code_url: info.zaloQrCodeUrl || null,
    contact_leader_name: info.contactLeaderName,
    contact_leader_phone: info.contactLeaderPhone,
    contact_leader_role: info.contactLeaderRole,
    welcome_letter: info.welcomeLetter,
    total_generations: info.totalGenerations,
    total_members_count: info.totalMembersCount,
    total_living_count: info.totalLivingCount,
    total_branches_count: info.totalBranchesCount,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch clan information from Supabase public.clan_settings (id = 1)
 */
export async function fetchClanInfoService(): Promise<{ clanInfo: ClanInfo; isFromSupabase: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('clan_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        const mapped = mapRowToClanInfo(data, INITIAL_CLAN_INFO);
        // Backup to local storage
        try {
          localStorage.setItem(LOCAL_STORAGE_CLAN_INFO, JSON.stringify(mapped));
        } catch {}
        return { clanInfo: mapped, isFromSupabase: true };
      } else if (error) {
        console.warn('Supabase clan_settings fetch error:', error.message);
      }
    } catch (e: any) {
      console.warn('Supabase clan_settings request failed:', e.message);
    }
  }

  // Local storage fallback
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CLAN_INFO);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.name) {
        return { clanInfo: parsed, isFromSupabase: false };
      }
    }
  } catch (e) {
    console.error('Failed reading local storage clan info:', e);
  }

  return { clanInfo: INITIAL_CLAN_INFO, isFromSupabase: false };
}

/**
 * Update clan information in Supabase public.clan_settings (Protected by Admin role)
 */
export async function updateClanInfoService(
  info: ClanInfo, 
  currentRole: Role
): Promise<{ success: boolean; clanInfo: ClanInfo; error?: string }> {
  // Permission verification: Only 'admin' can update clan settings
  if (currentRole !== 'admin') {
    return {
      success: false,
      clanInfo: info,
      error: 'Chỉ Quản Trị Viên (Admin) mới có quyền thay đổi thông tin dòng họ.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      clanInfo: info,
      error: 'Chưa kết nối được Supabase. Vui lòng kiểm tra cấu hình kết nối database.',
    };
  }

  const row = mapClanInfoToRow(info);

  try {
    const { data, error } = await client
      .from('clan_settings')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase clan_settings update error:', error.message);
      return {
        success: false,
        clanInfo: info,
        error: error.message || 'Lỗi lưu thông tin dòng họ lên Supabase. Vui lòng kiểm tra quyền Admin.',
      };
    }

    const savedInfo = data ? mapRowToClanInfo(data, info) : info;
    try {
      localStorage.setItem(LOCAL_STORAGE_CLAN_INFO, JSON.stringify(savedInfo));
    } catch {}
    return { success: true, clanInfo: savedInfo };
  } catch (e: any) {
    console.error('Supabase clan_settings exception:', e.message);
    return {
      success: false,
      clanInfo: info,
      error: e.message || 'Lỗi kết nối khi cập nhật thông tin dòng họ.',
    };
  }
}

// ==========================================
// SUPABASE AUTH & PROFILES MANAGEMENT SERVICE
// ==========================================
// 8. Authentication (Auth & Profiles)
// ==========================================

/**
 * Sign in using Google OAuth via Supabase Auth
 */
export async function signInWithGoogleService(): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Chưa cấu hình Supabase URL & Anon Key.' };
  }

  try {
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Google sign in error:', err);
    return { success: false, error: err.message || 'Không thể kết nối đến tài khoản Google.' };
  }
}

/**
 * Send Magic Link / OTP via Email using Supabase Auth
 */
export async function sendEmailMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Chưa cấu hình Supabase URL & Anon Key.' };
  }

  try {
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Không thể gửi link đăng nhập qua email.' };
  }
}

// Keep sendEmailOtp as alias for backwards compatibility
export const sendEmailOtp = sendEmailMagicLink;

/**
 * Verify OTP token from Email (optional helper)
 */
export async function verifyEmailOtp(email: string, token: string): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Chưa cấu hình Supabase URL & Anon Key.' };
  }

  try {
    const { data, error } = await client.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    });

    if (error) throw error;

    if (data.user) {
      const profile = await getCurrentUserProfile();
      return { success: true, profile: profile || undefined };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.' };
  }
}


/**
 * Sign out current user
 */
export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
  }
  return { success: true };
}

/**
 * Get current logged in user profile from public.profiles
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return null;

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      const userProf: UserProfile = {
        id: data.id,
        email: data.email || user.email || null,
        full_name: data.full_name || user.user_metadata?.full_name || 'Thành viên',
        phone: data.phone || null,
        role: (data.role as Role) || 'member',
        avatar_url: data.avatar_url || user.user_metadata?.avatar_url || null,
        created_at: data.created_at,
      };
      return userProf;
    }

    // If trigger hasn't fired yet or table empty, return fallback from auth.user
    const fallbackProf: UserProfile = {
      id: user.id,
      email: user.email || null,
      full_name: user.user_metadata?.full_name || 'Thành viên',
      phone: null,
      role: 'member',
      avatar_url: user.user_metadata?.avatar_url || null,
    };
    return fallbackProf;
  } catch (e) {
    console.warn('Failed getting user profile:', e);
    return null;
  }
}

/**
 * Fetch all user profiles from public.profiles (Admin only)
 */
export async function fetchAllProfiles(): Promise<{ profiles: UserProfile[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    // Return sample local profiles for testing
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROFILES);
      if (saved) {
        return { profiles: JSON.parse(saved) };
      }
    } catch {}

    const sampleProfiles: UserProfile[] = [
      {
        id: 'mock-admin-1',
        email: 'admin.le@giaphaletoc.vn',
        full_name: 'Lê Văn Cường (Trưởng Ban Quản Trị)',
        phone: '0912345678',
        role: 'admin',
        avatar_url: null,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'mock-support-1',
        email: 'support.le@giaphaletoc.vn',
        full_name: 'Lê Quang Vinh (Thư Ký Ban Trị Sự)',
        phone: '0987654321',
        role: 'support',
        avatar_url: null,
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
      {
        id: 'mock-member-1',
        email: 'vuongcuong144@gmail.com',
        full_name: 'Lê Thành Long',
        phone: '0903123456',
        role: 'member',
        avatar_url: null,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ];
    return { profiles: sampleProfiles };
  }

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const list: UserProfile[] = (data || []).map((p: any) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      phone: p.phone,
      role: (p.role as Role) || 'member',
      avatar_url: p.avatar_url || null,
      created_at: p.created_at,
    }));

    return { profiles: list };
  } catch (err: any) {
    return { profiles: [], error: err.message || 'Không thể tải danh sách tài khoản profiles.' };
  }
}

/**
 * Update a user's role in public.profiles (Protected by RLS `profiles_admin_manage_roles`)
 */
export async function updateProfileRole(userId: string, newRole: Role): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Chưa kết nối được Supabase. Vui lòng kiểm tra cấu hình kết nối database.',
    };
  }

  try {
    const { error } = await client
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi cập nhật quyền (Chỉ tài khoản có quyền Admin trong Supabase mới được đổi role).' };
  }
}

/**
 * Update any user's profile info (full_name, phone, avatar_url) by Admin in public.profiles table
 * Allowed by RLS policy `profiles_admin_manage_roles`
 */
export async function updateProfileByAdminService(
  userId: string,
  fullName: string,
  phone: string,
  avatarUrl?: string | null
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  const client = getSupabaseClient();
  const trimmedName = fullName.trim();
  const trimmedPhone = phone.trim() || null;
  const trimmedAvatar = avatarUrl !== undefined ? (avatarUrl?.trim() || null) : undefined;

  if (!client) {
    return {
      success: false,
      error: 'Chưa kết nối được Supabase. Vui lòng kiểm tra cấu hình kết nối database.',
    };
  }

  try {
    const updatePayload: any = {
      full_name: trimmedName,
      phone: trimmedPhone,
    };
    if (trimmedAvatar !== undefined) {
      updatePayload.avatar_url = trimmedAvatar;
    }

    const { data, error } = await client
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update profile by admin error:', error.message);
      return {
        success: false,
        error: error.message || 'Lỗi cập nhật hồ sơ người dùng trên Supabase.',
      };
    }

    const updatedProfile: UserProfile = {
      id: data.id,
      email: data.email || null,
      full_name: data.full_name || trimmedName,
      phone: data.phone || trimmedPhone,
      role: (data.role as Role) || 'member',
      avatar_url: data.avatar_url || null,
      created_at: data.created_at,
    };

    return { success: true, profile: updatedProfile };
  } catch (err: any) {
    console.error('Supabase admin update profile exception:', err);
    return {
      success: false,
      error: err.message || 'Không thể kết nối đến máy chủ Supabase.',
    };
  }
}

/**
 * Update current user's profile (full_name, phone, avatar_url) in public.profiles table
 * Allowed by RLS policy `profiles_update_own`
 */
export async function updateOwnProfileService(
  userId: string,
  fullName: string,
  phone: string,
  avatarUrl?: string | null
): Promise<{ success: boolean; profile?: UserProfile; warning?: string; error?: string }> {
  const client = getSupabaseClient();
  const trimmedName = fullName.trim();
  const trimmedPhone = phone.trim() || null;
  const trimmedAvatar = avatarUrl !== undefined ? (avatarUrl?.trim() || null) : undefined;

  if (!client) {
    // Local storage fallback
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROFILES);
      let list: UserProfile[] = saved ? JSON.parse(saved) : [];
      let updatedProfile: UserProfile = {
        id: userId,
        email: null,
        full_name: trimmedName,
        phone: trimmedPhone,
        role: 'member',
        avatar_url: trimmedAvatar !== undefined ? trimmedAvatar : null,
      };
      const idx = list.findIndex(p => p.id === userId);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          full_name: trimmedName,
          phone: trimmedPhone,
          avatar_url: trimmedAvatar !== undefined ? trimmedAvatar : list[idx].avatar_url,
        };
        updatedProfile = list[idx];
      } else {
        list.push(updatedProfile);
      }
      localStorage.setItem(LOCAL_STORAGE_PROFILES, JSON.stringify(list));
      return { success: true, profile: updatedProfile };
    } catch (e: any) {
      return { success: false, error: e.message || 'Lỗi lưu hồ sơ cục bộ.' };
    }
  }

  try {
    const updatePayload: any = {
      full_name: trimmedName,
      phone: trimmedPhone,
    };
    if (trimmedAvatar !== undefined) {
      updatePayload.avatar_url = trimmedAvatar;
    }

    const { data, error } = await client
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.warn('Supabase profile update warning:', error.message);
      // If error is caused by missing avatar_url column in DB
      if (error.code === '42703' || error.message?.includes('avatar_url')) {
        const retryRes = await client
          .from('profiles')
          .update({
            full_name: trimmedName,
            phone: trimmedPhone,
          })
          .eq('id', userId)
          .select()
          .single();

        if (!retryRes.error && retryRes.data) {
          const fallbackProfile: UserProfile = {
            id: retryRes.data.id,
            email: retryRes.data.email || null,
            full_name: retryRes.data.full_name || trimmedName,
            phone: retryRes.data.phone || trimmedPhone,
            role: (retryRes.data.role as Role) || 'member',
            avatar_url: trimmedAvatar !== undefined ? trimmedAvatar : null,
            created_at: retryRes.data.created_at,
          };
          return {
            success: true,
            profile: fallbackProfile,
            warning: 'Đã lưu họ tên và số điện thoại. Để lưu ảnh đại diện tài khoản lên Supabase, vui lòng chạy lệnh SQL: ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;',
          };
        }
      }

      return {
        success: false,
        error: error.message || 'Lỗi cập nhật hồ sơ cá nhân trên Supabase.',
      };
    }

    const updatedProfile: UserProfile = {
      id: data.id,
      email: data.email || null,
      full_name: data.full_name || trimmedName,
      phone: data.phone || trimmedPhone,
      role: (data.role as Role) || 'member',
      avatar_url: data.avatar_url !== undefined ? data.avatar_url : (trimmedAvatar !== undefined ? trimmedAvatar : null),
      created_at: data.created_at,
    };

    return { success: true, profile: updatedProfile };
  } catch (err: any) {
    console.error('Supabase profile update exception:', err);
    return {
      success: false,
      error: err.message || 'Không thể kết nối đến máy chủ Supabase.',
    };
  }
}

const LOCAL_STORAGE_RSVPS = 'clan_event_rsvps_data';

/**
 * Save RSVP record to Supabase public.event_rsvps table
 */
export async function saveRsvpService(rsvp: {
  event_id?: string | null;
  event_title?: string | null;
  full_name: string;
  phone?: string | null;
  branch?: string | null;
  attendee_count: number;
  notes?: string | null;
}): Promise<{ success: boolean; rsvp?: EventRsvp; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Chưa cấu hình kết nối Supabase. Vui lòng kết nối database trong Cài đặt dòng họ.',
    };
  }

  const payload = {
    event_id: rsvp.event_id || null,
    event_title: rsvp.event_title?.trim() || null,
    full_name: rsvp.full_name.trim(),
    phone: rsvp.phone?.trim() || null,
    branch: rsvp.branch?.trim() || null,
    attendee_count: Number(rsvp.attendee_count) || 1,
    notes: rsvp.notes?.trim() || null,
  };

  try {
    const { data, error } = await client
      .from('event_rsvps')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert event_rsvps error:', error.message);
      // Return real error to the user
      return {
        success: false,
        error: error.message || 'Lỗi lưu thông tin báo danh lên Supabase.',
      };
    }

    const newRsvp: EventRsvp = {
      id: data.id,
      event_id: data.event_id,
      event_title: data.event_title,
      full_name: data.full_name,
      phone: data.phone,
      branch: data.branch,
      attendee_count: data.attendee_count,
      notes: data.notes,
      created_at: data.created_at,
    };

    // Also update local storage cache
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RSVPS) || '[]');
      localStorage.setItem(LOCAL_STORAGE_RSVPS, JSON.stringify([newRsvp, ...local]));
    } catch {}

    return {
      success: true,
      rsvp: newRsvp,
    };
  } catch (err: any) {
    console.error('Supabase saveRsvpService exception:', err);
    return {
      success: false,
      error: err.message || 'Không thể kết nối đến máy chủ Supabase.',
    };
  }
}

/**
 * Fetch list of RSVPs for Admin/Support view from Supabase public.event_rsvps
 */
export async function fetchRsvpsService(): Promise<{
  success: boolean;
  rsvps: EventRsvp[];
  totalAttendees: number;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RSVPS) || '[]');
      const total = local.reduce((sum: number, r: EventRsvp) => sum + (Number(r.attendee_count) || 1), 0);
      return { success: true, rsvps: local, totalAttendees: total };
    } catch {
      return { success: true, rsvps: [], totalAttendees: 0 };
    }
  }

  try {
    const { data, error } = await client
      .from('event_rsvps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch event_rsvps error:', error.message);
      return {
        success: false,
        rsvps: [],
        totalAttendees: 0,
        error: error.message || 'Không thể tải danh sách báo danh từ Supabase.',
      };
    }

    const rsvps: EventRsvp[] = (data || []).map((row: any) => ({
      id: row.id,
      event_id: row.event_id,
      event_title: row.event_title,
      full_name: row.full_name,
      phone: row.phone,
      branch: row.branch,
      attendee_count: Number(row.attendee_count) || 1,
      notes: row.notes,
      created_at: row.created_at,
    }));

    const totalAttendees = rsvps.reduce((acc, curr) => acc + (curr.attendee_count || 1), 0);

    // Sync to local cache
    try {
      localStorage.setItem(LOCAL_STORAGE_RSVPS, JSON.stringify(rsvps));
    } catch {}

    return {
      success: true,
      rsvps,
      totalAttendees,
    };
  } catch (err: any) {
    console.error('Supabase fetchRsvpsService exception:', err);
    return {
      success: false,
      rsvps: [],
      totalAttendees: 0,
      error: err.message || 'Lỗi mạng khi tải danh sách báo danh.',
    };
  }
}

/**
 * Delete RSVP by Admin
 */
export async function deleteRsvpService(id: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Chưa kết nối được Supabase.',
    };
  }

  try {
    const { error } = await client
      .from('event_rsvps')
      .delete()
      .eq('id', id);

    if (error) {
      return {
        success: false,
        error: error.message || 'Lỗi khi xóa bản ghi báo danh trên Supabase.',
      };
    }

    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RSVPS) || '[]');
      const filtered = local.filter((r: EventRsvp) => r.id !== id);
      localStorage.setItem(LOCAL_STORAGE_RSVPS, JSON.stringify(filtered));
    } catch {}

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Lỗi mạng khi xóa bản ghi báo danh.',
    };
  }
}

/**
 * Link a login account (userId) to exactly one family tree member (members.user_id)
 * Executed by Admin
 */
export async function linkUserToMemberService(
  userId: string,
  targetMemberId: string | null
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();

  if (client) {
    try {
      // 1. Clear any existing member linked to this userId
      await client
        .from('members')
        .update({ user_id: null })
        .eq('user_id', userId);

      // 2. If a new targetMemberId is specified, set its user_id = userId
      if (targetMemberId) {
        const { error } = await client
          .from('members')
          .update({ user_id: userId })
          .eq('id', targetMemberId);

        if (error) {
          console.error('Supabase linkUserToMember error:', error);
          return {
            success: false,
            error: error.message || 'Lỗi liên kết tài khoản với thành viên trên Supabase.',
          };
        }
      }
    } catch (err: any) {
      console.warn('Supabase link error, applying to local storage:', err);
    }
  }

  // Update local storage backup
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_MEMBERS);
    if (saved) {
      let list: ClanMember[] = JSON.parse(saved);
      list = list.map(m => {
        if (m.userId === userId) {
          return { ...m, userId: undefined };
        }
        if (targetMemberId && m.id === targetMemberId) {
          return { ...m, userId };
        }
        return m;
      });
      localStorage.setItem(LOCAL_STORAGE_MEMBERS, JSON.stringify(list));
    }
  } catch (e) {
    console.error(e);
  }

  return { success: true };
}

/**
 * Updates current user's avatar in family tree using Supabase RPC 'update_my_avatar'
 * Secures other fields from being tampered with by regular members
 */
export async function updateMyAvatarService(
  newAvatarUrl: string
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client.rpc('update_my_avatar', {
        new_avatar_url: newAvatarUrl || null,
      });

      if (error) {
        console.error('Supabase update_my_avatar RPC error:', error);
        return {
          success: false,
          error: error.message || 'Không thể cập nhật ảnh đại diện qua hệ thống bảo mật Supabase.',
        };
      }

      if (data && data.success === false) {
        return {
          success: false,
          error: data.error || 'Tài khoản chưa được liên kết với hồ sơ trong cây phả hệ.',
        };
      }
    } catch (err: any) {
      console.warn('Supabase RPC call failed:', err);
      return {
        success: false,
        error: err.message || 'Lỗi mạng khi cập nhật ảnh đại diện.',
      };
    }
  }

  // Sync to local storage
  try {
    const profile = await getCurrentUserProfile();
    if (profile?.id) {
      const saved = localStorage.getItem(LOCAL_STORAGE_MEMBERS);
      if (saved) {
        const list: ClanMember[] = JSON.parse(saved);
        const updated = list.map(m => m.userId === profile.id ? { ...m, avatar: newAvatarUrl || undefined } : m);
        localStorage.setItem(LOCAL_STORAGE_MEMBERS, JSON.stringify(updated));
      }
    }
  } catch (e) {
    console.error(e);
  }

  return { success: true, avatarUrl: newAvatarUrl };
}


