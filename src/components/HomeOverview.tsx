import React, { useState, useEffect, useMemo } from 'react';
import { 
  TreePine, 
  Search, 
  Calendar, 
  MessageCircle, 
  ShieldCheck, 
  Users, 
  Flame, 
  Clock, 
  MapPin, 
  Share2, 
  Navigation, 
  UserCheck, 
  X, 
  CheckCircle2, 
  Sparkles,
  ChevronRight,
  Database,
  PhoneCall,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { ClanInfo, ClanMember, MemorialEvent, Role } from '../types';
import { calculateAgeInfo, getGenderVisuals, calculateClanStats } from '../utils/genealogyUtils';
import { convertSolarToLunar, getUpcomingAnniversaryDate } from '../utils/lunarUtils';
import { saveRsvpService } from '../services/supabaseService';

interface HomeOverviewProps {
  clanInfo: ClanInfo;
  members: ClanMember[];
  memorialEvents: MemorialEvent[];
  currentUserRole: Role;
  onNavigate: (tab: 'tree' | 'directory' | 'memorial') => void;
  onOpenZalo: () => void;
  onOpenSettings: () => void;
  isSupabaseConnected?: boolean;
  isLoading?: boolean;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  clanInfo,
  members,
  memorialEvents,
  currentUserRole,
  onNavigate,
  onOpenZalo,
  onOpenSettings,
  isSupabaseConnected = false,
  isLoading = false,
}) => {
  const stats = useMemo(() => calculateClanStats(members), [members]);
  const maxGen = useMemo(() => {
    return members.length > 0 ? Math.max(...members.map(m => m.generation)) : 1;
  }, [members]);

  // Current lunar info via lunar-javascript
  const todayLunar = useMemo(() => convertSolarToLunar(new Date()), []);

  // Live countdown state for Giỗ Tổ (10/03 Âm Lịch)
  const gioToInfo = useMemo(() => getUpcomingAnniversaryDate('10/03 Âm lịch'), []);

  const [timeLeft, setTimeLeft] = useState(() => {
    const targetDate = new Date('2026-04-26T07:30:00');
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    if (diff <= 0) return { days: gioToInfo.daysRemaining || 18, hours: 8, minutes: 30, seconds: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days: Math.max(0, days), hours, minutes, seconds };
  });

  useEffect(() => {
    const targetDate = new Date('2026-04-26T07:30:00');
    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 18, hours: 8, minutes: 30, seconds: 0 });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days: Math.max(0, days), hours, minutes, seconds });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // RSVP Modal State
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpPhone, setRsvpPhone] = useState('');
  const [rsvpCount, setRsvpCount] = useState('2');
  const [rsvpBranch, setRsvpBranch] = useState('Chi Trưởng');
  const [rsvpNote, setRsvpNote] = useState('');
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const handleShareInvite = () => {
    const inviteText = `TRÂN TRỌNG KÍNH MỜI CON CHÁU HỌ ${clanInfo.clanSurname.toUpperCase()} TỘC\nTham dự: ĐẠI LỄ GIỖ TỔ HỌ ${clanInfo.clanSurname.toUpperCase()} TỘC - XUÂN BÍNH NGỌ 2026\n• Âm lịch: Ngày 10/03 Âm lịch\n• Dương lịch: Chủ Nhật, 26/04/2026 (07:30 - 13:30)\n• Địa điểm: ${clanInfo.ancestralHallLocation}\nKính mong toàn thể bà con nội ngoại sắp xếp thời gian tề tựu đông đủ để thắp nén tâm hương tưởng nhớ tiên tổ!`;
    navigator.clipboard.writeText(inviteText);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 3000);
  };

  const handleOpenMap = () => {
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clanInfo.ancestralHallLocation)}`;
    window.open(mapUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;

    setIsSubmittingRsvp(true);
    setRsvpError(null);

    const countNum = rsvpCount === '5+' ? 5 : Number(rsvpCount) || 1;

    try {
      const res = await saveRsvpService({
        event_title: `Đại Lễ Giỗ Tổ Họ ${clanInfo.clanSurname.toUpperCase()} Tộc - 10/03 Âm Lịch`,
        full_name: rsvpName.trim(),
        phone: rsvpPhone.trim() || undefined,
        branch: rsvpBranch,
        attendee_count: countNum,
        notes: rsvpNote.trim() || undefined,
      });

      setIsSubmittingRsvp(false);

      if (!res.success) {
        // Return real error from Supabase
        setRsvpError(res.error || 'Có lỗi xảy ra khi lưu thông tin báo danh vào máy chủ Supabase.');
        return;
      }

      setRsvpSuccess(true);
      setTimeout(() => {
        setRsvpSuccess(false);
        setIsRsvpOpen(false);
        setRsvpName('');
        setRsvpPhone('');
        setRsvpNote('');
        setRsvpError(null);
      }, 2500);
    } catch (err: any) {
      setIsSubmittingRsvp(false);
      setRsvpError(err.message || 'Lỗi mạng khi kết nối cơ sở dữ liệu.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/90 pb-16">
      
      {/* Header Banner with Clan Identity & Role Indicator */}
      <div className="bg-gradient-to-b from-[#240e08] via-[#3a140d] to-[#1a0804] text-white pt-8 pb-12 px-4 sm:px-6 rounded-b-[2.5rem] shadow-xl text-center relative overflow-hidden border-b border-amber-900/60">
        
        {/* Decorative Background Ornaments */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-radial from-amber-500/10 to-transparent pointer-events-none"></div>

        {/* Main Title & Slogan */}
        <div className="max-w-3xl mx-auto space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-950/80 border border-amber-600/50 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Hôm nay: {todayLunar.formattedFullLunar} ({todayLunar.solarDateString})</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif-clan tracking-wide text-amber-100 drop-shadow-md">
            GIA PHẢ NỘI TỘC - {clanInfo.clanSurname.toUpperCase()} TỘC
          </h1>
          <p className="text-amber-200/90 text-sm sm:text-base italic font-serif-clan max-w-xl mx-auto">
            "{clanInfo.subTitle}"
          </p>
        </div>
      </div>

      {/* 4 Core Stats Metric Cards (With Skeleton Loading) */}
      <div className="max-w-4xl mx-auto px-4 -mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-20">
        {isLoading ? (
          <>
            <div className="bg-white p-4 rounded-2xl shadow-md text-center border-t-4 border-stone-300 border-x border-b border-stone-200 animate-pulse">
              <div className="h-3 w-20 bg-stone-200 rounded mx-auto mb-2.5"></div>
              <div className="h-8 w-14 bg-stone-300 rounded-lg mx-auto mb-2"></div>
              <div className="h-2.5 w-24 bg-stone-200 rounded mx-auto"></div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-md text-center border-t-4 border-stone-300 border-x border-b border-stone-200 animate-pulse">
              <div className="h-3 w-20 bg-stone-200 rounded mx-auto mb-2.5"></div>
              <div className="h-8 w-16 bg-stone-300 rounded-lg mx-auto mb-2"></div>
              <div className="h-2.5 w-24 bg-stone-200 rounded mx-auto"></div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-md text-center border-t-4 border-stone-300 border-x border-b border-stone-200 animate-pulse">
              <div className="h-3 w-20 bg-stone-200 rounded mx-auto mb-2.5"></div>
              <div className="h-8 w-14 bg-stone-300 rounded-lg mx-auto mb-2"></div>
              <div className="h-2.5 w-24 bg-stone-200 rounded mx-auto"></div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-md text-center border-t-4 border-stone-300 border-x border-b border-stone-200 animate-pulse">
              <div className="h-3 w-20 bg-stone-200 rounded mx-auto mb-2.5"></div>
              <div className="h-8 w-14 bg-stone-300 rounded-lg mx-auto mb-2"></div>
              <div className="h-2.5 w-24 bg-stone-200 rounded mx-auto"></div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-4 rounded-2xl shadow-md text-center border-t-4 border-red-800 border-x border-b border-stone-200">
              <p className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Tổng thành viên</p>
              <p className="text-2xl sm:text-3xl font-bold font-serif-clan text-red-900 mt-0.5">{stats.total}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">Nam: {stats.male} • Nữ: {stats.female}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-md text-center border-t-4 border-amber-600 border-x border-b border-stone-200">
              <p className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Đã lưu trữ</p>
              <p className="text-2xl sm:text-3xl font-bold font-serif-clan text-amber-800 mt-0.5">Đời thứ {maxGen}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">{stats.branches.length} Chi phái lớn</p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-md text-center border-t-4 border-emerald-700 border-x border-b border-stone-200">
              <p className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Đang sinh sống</p>
              <p className="text-2xl sm:text-3xl font-bold font-serif-clan text-emerald-800 mt-0.5">{stats.living}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">{stats.livingPercent}% tổng số</p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-md text-center border-t-4 border-sky-700 border-x border-b border-stone-200">
              <p className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Tiền nhân</p>
              <p className="text-2xl sm:text-3xl font-bold font-serif-clan text-sky-900 mt-0.5">{stats.deceased}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">Phụng tự khói hương</p>
            </div>
          </>
        )}
      </div>

      {/* 3 Core Quick Navigation Menus */}
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-3.5">
        
        {/* Menu 1: Sơ Đồ Phả Hệ & Thành Viên */}
        <button
          onClick={() => onNavigate('tree')}
          className="w-full flex items-center p-4 sm:p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-stone-200 hover:border-amber-400 group text-left cursor-pointer"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-105 group-hover:bg-amber-300 transition-all shrink-0 border border-amber-300">
            🌳
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-serif-clan text-stone-900 group-hover:text-amber-900 transition-colors">
                Sơ Đồ Phả Hệ & Thành Viên
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                {currentUserRole === 'admin' ? 'Toàn quyền Thêm/Sửa/Xóa' : currentUserRole === 'support' ? 'Quyền Thêm/Sửa' : 'Chế độ xem'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Xem quan hệ huyết thống trực quan, sơ đồ cây đa thế hệ, tra phả hệ con cháu
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-amber-800 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Menu 2: Tra Cứu Danh Bạ */}
        <button
          onClick={() => onNavigate('directory')}
          className="w-full flex items-center p-4 sm:p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-stone-200 hover:border-sky-400 group text-left cursor-pointer"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 bg-gradient-to-br from-sky-100 to-sky-200 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-105 group-hover:bg-sky-300 transition-all shrink-0 border border-sky-300">
            🔍
          </div>
          <div className="ml-4 flex-1">
            <h2 className="text-base sm:text-lg font-bold font-serif-clan text-stone-900 group-hover:text-sky-900 transition-colors">
              Tra Cứu Danh Bạ Gia Tộc
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Tìm kiếm họ tên, số điện thoại, chi phái, thế thứ và thông tin liên lạc con cháu
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-sky-800 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Menu 3: Lịch Giỗ Chạp & Sự Kiện */}
        <button
          onClick={() => onNavigate('memorial')}
          className="w-full flex items-center p-4 sm:p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-stone-200 hover:border-red-400 group text-left cursor-pointer"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-105 group-hover:bg-red-300 transition-all shrink-0 border border-red-300">
            📅
          </div>
          <div className="ml-4 flex-1">
            <h2 className="text-base sm:text-lg font-bold font-serif-clan text-stone-900 group-hover:text-red-900 transition-colors">
              Lịch Giỗ Chạp & Nghi Lễ Gia Tộc
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Theo dõi ngày giỗ âm lịch, tự động tính ngày dương lịch và đếm ngược sự kiện
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-red-800 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Nút Kết Nối Zalo Dòng Họ */}
        <button
          onClick={onOpenZalo}
          className="w-full flex items-center p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-white rounded-2xl shadow-md hover:shadow-lg transition-all group text-left cursor-pointer border border-blue-400/50"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold shrink-0">
            💬
          </div>
          <div className="ml-4 flex-1">
            <h2 className="text-base sm:text-lg font-bold font-serif-clan">
              Nhóm Zalo Dòng Họ ({clanInfo.clanSurname} Tộc)
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
              Kênh liên lạc chính thống kết nối bà con nội ngoại khắp mọi miền
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-200 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* KHỐI ĐẾM NGƯỢC ĐẠI LỄ & SỰ KIỆN TRỌNG ĐẠI */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="rounded-3xl bg-gradient-to-b from-[#2a1309] via-[#3d140e] to-[#1e0a05] text-amber-50 border-2 border-amber-500/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          <div className="relative z-10 space-y-5">
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="px-3.5 py-1 rounded-full bg-red-700 text-amber-100 text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                ĐẠI LỄ TRỌNG ĐẠI
              </span>
              <span className="px-3.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/50 text-xs font-semibold">
                Âm lịch: Ngày 10/03 Âm lịch ({gioToInfo.canChiYear})
              </span>
              <span className="px-3.5 py-1 rounded-full bg-stone-900/80 text-stone-300 border border-stone-700 text-xs font-medium">
                Dương lịch: Chủ Nhật, 26/04/2026
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif-clan text-amber-100 tracking-wide leading-tight">
                ĐẠI LỄ GIỖ TỔ HỌ {clanInfo.clanSurname.toUpperCase()} TỘC - XUÂN BÍNH NGỌ 2026
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
                Sự kiện lớn nhất trong năm quy tụ con cháu toàn gia tộc. Địa điểm: {clanInfo.ancestralHallLocation}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-900/50 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-stone-400">Thời gian:</div>
                  <div className="text-sm font-bold text-amber-100">07:30 - 13:30 • Ngày 26/04/2026</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-900/50 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-stone-400">Địa điểm:</div>
                  <div className="text-sm font-bold text-amber-100 truncate">{clanInfo.ancestralHallLocation}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={() => setIsRsvpOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>Báo danh tham dự Giỗ Tổ</span>
              </button>

              <button
                onClick={handleShareInvite}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-200 border border-amber-600/50 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>{copiedInvite ? '✓ Đã chép thư mời!' : 'Chia sẻ vào Zalo'}</span>
              </button>

              <button
                onClick={handleOpenMap}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Navigation className="w-4 h-4 text-sky-400" />
                <span>Chỉ đường</span>
              </button>
            </div>

            {/* Countdown Digital Timer */}
            <div className="mt-4 pt-4 border-t border-amber-900/60 text-center">
              <div className="text-xs font-bold uppercase tracking-widest text-amber-400 font-serif-clan mb-2">
                ĐẾM NGƯỢC ĐẠI LỄ
              </div>

              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl sm:text-5xl font-bold font-serif-clan text-amber-200">
                  {timeLeft.days}
                </span>
                <span className="text-base sm:text-lg font-serif-clan text-amber-300">
                  ngày nữa
                </span>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2 text-center">
                <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/30 min-w-[56px]">
                  <div className="text-base font-bold font-mono text-amber-200">{timeLeft.days}</div>
                  <div className="text-[9px] text-stone-400 uppercase">Ngày</div>
                </div>
                <span className="text-amber-500 font-bold">:</span>
                <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/30 min-w-[56px]">
                  <div className="text-base font-bold font-mono text-amber-200">{String(timeLeft.hours).padStart(2, '0')}</div>
                  <div className="text-[9px] text-stone-400 uppercase">Giờ</div>
                </div>
                <span className="text-amber-500 font-bold">:</span>
                <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/30 min-w-[56px]">
                  <div className="text-base font-bold font-mono text-amber-200">{String(timeLeft.minutes).padStart(2, '0')}</div>
                  <div className="text-[9px] text-stone-400 uppercase">Phút</div>
                </div>
                <span className="text-amber-500 font-bold">:</span>
                <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/30 min-w-[56px]">
                  <div className="text-base font-bold font-mono text-amber-200">{String(timeLeft.seconds).padStart(2, '0')}</div>
                  <div className="text-[9px] text-stone-400 uppercase">Giây</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Thông điệp Trưởng tộc & Ban Quản Lý */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-amber-100/70 p-5 rounded-2xl border border-amber-300 text-center shadow-xs">
          <p className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-800" />
            <span>Thông điệp Ban Quản Lý Gia Tộc</span>
          </p>
          <p className="text-sm text-stone-800 mt-2 italic font-serif-clan leading-relaxed max-w-2xl mx-auto">
            "Kính mong toàn thể con cháu luôn hướng về cội nguồn, đoàn kết và chung tay xây dựng dòng họ ngày càng thịnh vượng, phát huy truyền thống hiếu học và nhân nghĩa của tiền nhân."
          </p>
          <div className="mt-3 text-xs text-amber-900 font-semibold">
            {clanInfo.contactLeaderRole} • {clanInfo.contactLeaderName} ({clanInfo.contactLeaderPhone})
          </div>
        </div>
      </div>

      {/* RSVP Registration Modal */}
      {isRsvpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-stone-300 shadow-2xl p-6 sm:p-8 space-y-4">
            <button
              onClick={() => setIsRsvpOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-300 text-red-800 flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-serif-clan text-stone-900">
                  Báo Danh Tham Dự Giỗ Tổ Họ
                </h3>
                <p className="text-xs text-stone-500">
                  Đại Lễ Giỗ Tổ Họ {clanInfo.clanSurname} Tộc • Chủ Nhật, 26/04/2026 (10/03 Âm lịch)
                </p>
              </div>
            </div>

            {rsvpSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-emerald-900 font-serif-clan">Báo Danh Thành Công!</h4>
                <p className="text-xs text-emerald-700">
                  Ban Trị Sự đã tiếp nhận thông tin của gia đình. Kính chúc bà con vạn sự cát tường, hẹn gặp tại Từ Đường gia tộc!
                </p>
              </div>
            ) : (
              <form onSubmit={handleRsvpSubmit} className="space-y-3.5 text-xs text-stone-700">
                {rsvpError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Báo danh chưa thành công:</p>
                      <p className="text-red-700 mt-0.5">{rsvpError}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Họ và tên người đại diện đăng ký <span className="text-red-600">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSubmittingRsvp}
                    placeholder="Ví dụ: Lê Khắc Hải"
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 focus:border-amber-600 focus:outline-none disabled:opacity-60"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">Số điện thoại liên lạc:</label>
                    <input
                      type="tel"
                      disabled={isSubmittingRsvp}
                      placeholder="0987.654.321"
                      value={rsvpPhone}
                      onChange={(e) => setRsvpPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 focus:border-amber-600 focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">Thuộc Chi nhánh:</label>
                    <select
                      disabled={isSubmittingRsvp}
                      value={rsvpBranch}
                      onChange={(e) => setRsvpBranch(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 focus:border-amber-600 focus:outline-none disabled:opacity-60"
                    >
                      <option value="Chi Trưởng">Chi Trưởng</option>
                      <option value="Chi Hai">Chi Hai</option>
                      <option value="Chi Ba">Chi Ba</option>
                      <option value="Chi Ngoại">Chi Ngoại / Khách Quý</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Số lượng người cùng tham dự:</label>
                  <select
                    disabled={isSubmittingRsvp}
                    value={rsvpCount}
                    onChange={(e) => setRsvpCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 focus:border-amber-600 focus:outline-none disabled:opacity-60"
                  >
                    <option value="1">1 người</option>
                    <option value="2">2 người (Vợ chồng)</option>
                    <option value="3">3 người</option>
                    <option value="4">4 người (Cả gia đình)</option>
                    <option value="5+">5 người trở lên</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Ghi chú hoặc tâm nguyện dâng lễ:</label>
                  <textarea
                    rows={2}
                    disabled={isSubmittingRsvp}
                    placeholder="Ghi chú về việc sắp xếp cúng giỗ hoặc liên hoan thụ lộc..."
                    value={rsvpNote}
                    onChange={(e) => setRsvpNote(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 focus:border-amber-600 focus:outline-none disabled:opacity-60"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={isSubmittingRsvp}
                    onClick={() => setIsRsvpOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRsvp}
                    className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold flex items-center gap-1.5 shadow-md disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmittingRsvp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Xác Nhận Báo Danh</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Clean Footer without Zalo button as requested in previous prompt */}
      <footer className="mt-16 bg-[#180a06] text-amber-100/80 border-t-2 border-amber-900/60 pt-10 pb-8 text-xs">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
          <h4 className="font-serif-clan font-bold text-base text-amber-200">
            {clanInfo.name}
          </h4>
          <p className="text-stone-400 font-serif-clan italic">
            "{clanInfo.subTitle}" — {clanInfo.ancestralHallLocation}
          </p>
          <div className="pt-3 border-t border-amber-950/80 text-[11px] text-stone-500">
            © 2026 {clanInfo.clanSurname} Tộc • Hệ Thống Phả Hệ Điện Tử & Quản Trị Tộc Ước
          </div>
        </div>
      </footer>

    </div>
  );
};
