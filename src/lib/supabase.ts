import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase config (read from env or saved in localStorage)
const STORAGE_KEY_URL = 'supabase_url_config';
const STORAGE_KEY_KEY = 'supabase_anon_key_config';

export function getStoredSupabaseConfig() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem(STORAGE_KEY_URL) || envUrl;
  const localKey = localStorage.getItem(STORAGE_KEY_KEY) || envKey;

  return {
    url: localUrl.trim(),
    anonKey: localKey.trim(),
    isConfigured: Boolean(localUrl.trim() && localKey.trim() && !localUrl.includes('your-project')),
  };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  reinitSupabaseClient();
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey, isConfigured } = getStoredSupabaseConfig();
  if (!isConfigured || !url || !anonKey) {
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function reinitSupabaseClient(): SupabaseClient | null {
  supabaseInstance = null;
  return getSupabaseClient();
}

/**
 * Test connectivity with Supabase public.members table
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; count?: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Chưa cấu hình Supabase URL hoặc Anon Key. Đang hoạt động ở chế độ Local Offline-First.',
    };
  }

  try {
    const { data, error, count } = await client
      .from('members')
      .select('id', { count: 'exact', head: true });

    if (error) {
      // Check if table does not exist
      if (error.code === '42P01' || error.message.includes('relation "public.members" does not exist')) {
        return {
          success: false,
          message: 'Kết nối Supabase thành công, nhưng bảng "public.members" chưa được tạo. Vui lòng chạy đoạn mã SQL khởi tạo bảng.',
        };
      }
      return {
        success: false,
        message: `Lỗi Supabase: ${error.message}`,
      };
    }

    return {
      success: true,
      message: `Kết nối Supabase thành công! Hiện có ${count ?? 0} bản ghi trong bảng members.`,
      count: count ?? 0,
    };
  } catch (e: any) {
    return {
      success: false,
      message: `Không thể kết nối đến Supabase: ${e.message || 'Lỗi mạng'}`,
    };
  }
}

/**
 * SQL Schema migration script ready to copy & run in Supabase SQL Editor
 * MATCHES EXACTLY THE PRODUCTION-READY SCHEMA
 */
export const SUPABASE_SQL_SCHEMA = `-- ============================================================
-- GIA PHẢ DÒNG HỌ LÊ — SUPABASE SCHEMA (PRODUCTION-READY)
-- Chạy toàn bộ file này 1 lần trong Supabase Dashboard > SQL Editor > Run
-- ============================================================

-- ------------------------------------------------------------
-- 1. BẢNG PROFILES: gắn role với user đã đăng nhập thật
--    (Supabase Auth quản lý bảng auth.users, ta mở rộng bằng bảng này)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  role text not null default 'member' check (role in ('admin', 'support', 'member')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Nâng cấp bảng profiles nếu đã tồn tại từ trước:
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

comment on table public.profiles is 'Hồ sơ + phân quyền của người dùng đã đăng nhập. role mặc định là member.';

-- Tự động tạo 1 dòng profile khi có người đăng ký/đăng nhập lần đầu
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Hàm đọc role hiện tại — security definer để tránh lỗi đệ quy khi dùng trong RLS policy
create or replace function public.get_my_role()
returns text
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- 2. BẢNG MEMBERS: thành viên dòng họ & quan hệ phả hệ
-- ------------------------------------------------------------
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  generation int not null,
  branch text,
  gender text check (gender in ('Nam', 'Nữ')),
  father_id uuid references public.members(id) on delete set null,
  mother_id uuid references public.members(id) on delete set null,
  mother_name text,
  title text,
  order_in_family int,
  phone text,
  email text,
  address text,
  occupation text,
  avatar_url text,
  birth_year text,
  death_year text,
  is_alive boolean default true,
  lunar_death_date text,
  resting_place text,
  spouse text,
  spouse_list jsonb default '[]'::jsonb,
  achievements text[] default '{}'::text[],
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Đảm bảo cột user_id và order_in_family tồn tại nếu bảng đã được tạo từ trước
alter table public.members add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.members add column if not exists order_in_family int;

create index if not exists idx_members_father on public.members(father_id);
create index if not exists idx_members_mother on public.members(mother_id);
create index if not exists idx_members_generation on public.members(generation);
create index if not exists idx_members_user_id on public.members(user_id);

-- ------------------------------------------------------------
-- 3. BẢNG EVENTS: lịch giỗ chạp (lưu Âm lịch thuần, KHÔNG lưu cứng ngày Dương)
-- ------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete set null,
  title text not null,
  lunar_day int not null check (lunar_day between 1 and 30),
  lunar_month int not null check (lunar_month between 1 and 12),
  is_leap_month boolean default false,
  location text,
  description text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 4. BẢNG CLAN_SETTINGS: thông tin chung họ tộc (1 dòng duy nhất id = 1)
-- ------------------------------------------------------------
create table if not exists public.clan_settings (
  id int primary key default 1,
  name text,
  clan_surname text,
  sub_title text,
  ancestor_name text,
  ancestral_hall_location text,
  zalo_group_url text,
  zalo_qr_code_url text,
  contact_leader_name text,
  contact_leader_phone text,
  contact_leader_role text,
  welcome_letter jsonb,
  total_generations int,
  total_members_count int,
  total_living_count int,
  total_branches_count int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 5. BẢNG EVENT_RSVPS: danh sách con cháu báo danh tham dự lễ giỗ
-- ------------------------------------------------------------
create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  event_title text,
  full_name text not null,
  phone text,
  branch text,
  attendee_count int default 1,
  notes text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 6. BẬT ROW LEVEL SECURITY TRÊN TẤT CẢ BẢNG
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.events enable row level security;
alter table public.clan_settings enable row level security;
alter table public.event_rsvps enable row level security;

-- ------------------------------------------------------------
-- 7. RLS POLICIES — PROFILES
-- ------------------------------------------------------------
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists "profiles_admin_manage_roles" on public.profiles;
create policy "profiles_admin_manage_roles"
  on public.profiles for update
  using (public.get_my_role() = 'admin');

-- ------------------------------------------------------------
-- 8. RLS POLICIES — MEMBERS
-- ------------------------------------------------------------
drop policy if exists "members_select_all" on public.members;
create policy "members_select_all"
  on public.members for select
  using (true);

drop policy if exists "members_insert_admin_support" on public.members;
create policy "members_insert_admin_support"
  on public.members for insert
  with check (public.get_my_role() in ('admin', 'support'));

drop policy if exists "members_update_admin_support" on public.members;
create policy "members_update_admin_support"
  on public.members for update
  using (public.get_my_role() in ('admin', 'support'));

drop policy if exists "members_delete_admin_only" on public.members;
create policy "members_delete_admin_only"
  on public.members for delete
  using (public.get_my_role() = 'admin');

-- ------------------------------------------------------------
-- 9. RLS POLICIES — EVENTS
-- ------------------------------------------------------------
drop policy if exists "events_select_all" on public.events;
create policy "events_select_all"
  on public.events for select
  using (true);

drop policy if exists "events_insert_admin_support" on public.events;
create policy "events_insert_admin_support"
  on public.events for insert
  with check (public.get_my_role() in ('admin', 'support'));

drop policy if exists "events_update_admin_support" on public.events;
create policy "events_update_admin_support"
  on public.events for update
  using (public.get_my_role() in ('admin', 'support'));

drop policy if exists "events_delete_admin_only" on public.events;
create policy "events_delete_admin_only"
  on public.events for delete
  using (public.get_my_role() = 'admin');

-- ------------------------------------------------------------
-- 10. RLS POLICIES — CLAN_SETTINGS
-- ------------------------------------------------------------
drop policy if exists "clan_settings_select_all" on public.clan_settings;
create policy "clan_settings_select_all"
  on public.clan_settings for select
  using (true);

drop policy if exists "clan_settings_update_admin" on public.clan_settings;
create policy "clan_settings_update_admin"
  on public.clan_settings for all
  using (public.get_my_role() = 'admin');

-- ------------------------------------------------------------
-- 11. RLS POLICIES — EVENT_RSVPS
-- ------------------------------------------------------------
drop policy if exists "event_rsvps_select_all" on public.event_rsvps;
create policy "event_rsvps_select_all"
  on public.event_rsvps for select
  using (true);

drop policy if exists "event_rsvps_insert_all" on public.event_rsvps;
create policy "event_rsvps_insert_all"
  on public.event_rsvps for insert
  with check (true);

drop policy if exists "event_rsvps_delete_admin" on public.event_rsvps;
create policy "event_rsvps_delete_admin"
  on public.event_rsvps for delete
  using (public.get_my_role() = 'admin');

-- ------------------------------------------------------------
-- 12. RPC FUNCTION: CẬP NHẬT ẢNH ĐẠI DIỆN CHÍNH CHỦ
--     Cho phép thành viên tự đổi ảnh đại diện cá nhân khi đã được Admin liên kết user_id
--     Bảo mật cao: Người dùng KHÔNG THỂ sửa bất kỳ trường nào khác trong members
-- ------------------------------------------------------------
create or replace function public.update_my_avatar(new_avatar_url text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_updated_count int;
begin
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'error', 'Chưa đăng nhập.');
  end if;

  update public.members
  set avatar_url = new_avatar_url,
      updated_at = now()
  where user_id = auth.uid();

  get diagnostics v_updated_count = row_count;

  if v_updated_count = 0 then
    return jsonb_build_object('success', false, 'error', 'Tài khoản của bạn chưa được liên kết với hồ sơ nào trong cây phả hệ.');
  end if;

  return jsonb_build_object('success', true, 'avatar_url', new_avatar_url);
end;
$$;

`;
