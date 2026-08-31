import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Flame, 
  BookOpen, 
  Copy, 
  Check, 
  Sparkles, 
  Layers, 
  ShieldCheck,
  Building2,
  ChevronRight,
  Info,
  Plus,
  Edit3,
  Trash2,
  UserCheck,
  Users,
  Phone,
  MessageSquare,
  RefreshCw,
  Search,
  Printer,
  AlertCircle
} from 'lucide-react';
import { MemorialEvent, ClanInfo, ClanMember, Role, EventRsvp } from '../types';
import { AddEditEventModal } from './AddEditEventModal';
import { fetchRsvpsService, deleteRsvpService } from '../services/supabaseService';

interface MemorialCalendarProps {
  memorialEvents: MemorialEvent[];
  clanInfo: ClanInfo;
  members: ClanMember[];
  currentUserRole?: Role;
  onSelectMember: (member: ClanMember) => void;
  onSaveEvent?: (event: MemorialEvent) => void | Promise<void>;
  onDeleteEvent?: (eventId: string) => void | Promise<void>;
}

export const MemorialCalendar: React.FC<MemorialCalendarProps> = ({
  memorialEvents,
  clanInfo,
  members,
  currentUserRole = 'admin',
  onSelectMember,
  onSaveEvent,
  onDeleteEvent,
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'prayers' | 'rituals' | 'rsvps'>('calendar');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEventToEdit, setSelectedEventToEdit] = useState<MemorialEvent | null>(null);

  // RSVPs State for Admin/Support
  const [rsvps, setRsvps] = useState<EventRsvp[]>([]);
  const [totalAttendees, setTotalAttendees] = useState<number>(0);
  const [isLoadingRsvps, setIsLoadingRsvps] = useState<boolean>(false);
  const [rsvpSearch, setRsvpSearch] = useState<string>('');
  const [rsvpBranchFilter, setRsvpBranchFilter] = useState<string>('all');
  const [copiedRsvpPhone, setCopiedRsvpPhone] = useState<string | null>(null);

  // Permissions
  const canEdit = currentUserRole === 'admin' || currentUserRole === 'support';
  const canDelete = currentUserRole === 'admin';

  // Load RSVPs for Admin / Support
  const loadRsvps = async () => {
    if (!canEdit) return;
    setIsLoadingRsvps(true);
    const res = await fetchRsvpsService();
    setIsLoadingRsvps(false);
    if (res.success) {
      setRsvps(res.rsvps);
      setTotalAttendees(res.totalAttendees);
    }
  };

  useEffect(() => {
    if (canEdit) {
      loadRsvps();
    }
  }, [canEdit]);

  const handleDeleteRsvp = async (id: string, name: string) => {
    if (!canDelete) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa bản ghi báo danh của "${name}"?`)) {
      const res = await deleteRsvpService(id);
      if (res.success) {
        loadRsvps();
      } else {
        alert(res.error || 'Không thể xóa bản ghi báo danh.');
      }
    }
  };

  // Custom prayer form state
  const [giverName, setGiverName] = useState('Con cháu dòng họ');
  const [residence, setResidence] = useState('Việt Nam');

  const upcomingEvent = memorialEvents[0];

  const handleOpenAddEvent = () => {
    setSelectedEventToEdit(null);
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (event: MemorialEvent) => {
    setSelectedEventToEdit(event);
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = (event: MemorialEvent) => {
    if (!onDeleteEvent) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa ngày giỗ "${event.title}" khỏi lịch tộc?`)) {
      onDeleteEvent(event.id);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedRsvpPhone(id);
    setTimeout(() => setCopiedRsvpPhone(null), 2000);
  };

  // Filtered RSVPs
  const filteredRsvps = useMemo(() => {
    return rsvps.filter((r) => {
      if (rsvpBranchFilter !== 'all' && r.branch !== rsvpBranchFilter) return false;
      if (rsvpSearch.trim()) {
        const query = rsvpSearch.toLowerCase().trim();
        const matchName = r.full_name.toLowerCase().includes(query);
        const matchPhone = r.phone?.toLowerCase().includes(query) || false;
        const matchNotes = r.notes?.toLowerCase().includes(query) || false;
        return matchName || matchPhone || matchNotes;
      }
      return true;
    });
  }, [rsvps, rsvpBranchFilter, rsvpSearch]);

  const filteredAttendeesTotal = useMemo(() => {
    return filteredRsvps.reduce((acc, curr) => acc + (curr.attendee_count || 1), 0);
  }, [filteredRsvps]);

  const samplePrayers = [
    {
      id: 'prayer_ancestor',
      title: 'Văn Khấn Cúng Giỗ Cụ Thủy Tổ & Tiên Nhân Liệt Vị (Tại Từ Đường Dòng Họ)',
      desc: 'Dành cho ngày Giỗ Tổ toàn tộc hoặc các ngày tế tự lớn tại Nhà thờ họ',
      content: `Nam mô A Di Đà Phật! (3 lần, 3 lạy)

Con lạy chín phương Trời, mười phương Chư Phật, Chư Phật mười phương.
Con kính lạy Hoàng thiên Hậu Thổ chư vị Tôn thần.
Con kính lạy ngài Bản cảnh Thành Hoàng, ngài Bản xứ Thổ địa, ngài Bản gia Táo quân cùng chư vị Tôn thần.

Con kính lạy Tiên linh Cao Tằng Tổ Khảo, Cao Tằng Tổ Tỷ, Bá Thúc Huynh Đệ, Cô Di Tỷ Muội họ ${clanInfo.clanSurname}.
Hôm nay là ngày ... tháng ... Âm lịch (Nhân tiết Kỵ nhật).
Tín chủ con là: ${giverName}
Cùng toàn thể con cháu nội ngoại dòng họ ${clanInfo.clanSurname} Tộc, ngụ tại: ${residence}.

Nhớ ơn tiên tổ khởi nghiệp gian lao, đức dày muôn trượng, chở che con cháu muôn đời hưng thịnh.
Nay nhân tiết kỵ nhật, chúng con thành tâm sắm sửa hương hoa trà quả, kim ngân lễ vật, dâng lên trước án.
Cúi xin chư vị Tiên linh giáng lâm thụ hưởng, chứng giám lòng thành, phù hộ độ trì cho toàn thể gia tộc bình an, gia đạo thuận hòa, con cháu thảo hiền, học hành đỗ đạt, công việc hanh thông, dòng họ hưng thịnh muôn đời.

Chúng con lễ bạc tâm thành, trước án kính lễ, cúi xin chứng giám!
Nam mô A Di Đà Phật! (3 lần, 3 lạy)`
    },
    {
      id: 'prayer_family',
      title: 'Văn Khấn Cúng Giỗ Cha Mẹ, Ông Bà Tại Gia Đình',
      desc: 'Dành cho các ngày cúng giỗ thường niên tại tư gia con cháu',
      content: `Nam mô A Di Đà Phật! (3 lần, 3 lạy)

Con lạy chín phương Trời, mười phương Chư Phật.
Con kính lạy Thần linh, Thổ địa cai quản trong xứ này.
Con kính lạy Tiên linh Ông Bà, Cha Mẹ, chư vị Hương linh nội ngoại.

Hôm nay là ngày ... tháng ... năm ...
Tín chủ con là: ${giverName}, ngụ tại: ${residence}.
Hôm nay nhân ngày Kỵ nhật của (Đọc tên người được cúng giỗ)...

Chúng con nhớ ơn sinh thành dưỡng dục, công đức cù lao khôn xiết. Nay sắm lễ mọn, lòng thành dâng cúng.
Cúi xin Hương linh rủ lòng thương xót, giáng phó linh sàng, chứng giám lòng thành, thụ hưởng lễ vật.
Độ trì cho toàn gia an khang thịnh vượng, vạn sự hanh thông.

Cẩn cáo!
Nam mô A Di Đà Phật! (3 lần, 3 lạy)`
    }
  ];

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-16">
      
      {/* Top Banner */}
      <div className="bg-[#24140e] text-amber-50 border-b border-amber-900/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 font-serif-clan">
              <span>Nghi Lễ Tế Tự & Kỵ Nhật Gia Tiên</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-clan text-white mt-1">
              Lịch Giỗ Chạp & Văn Khấn Truyền Thống
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-1">
              Tra cứu các ngày giỗ trong năm của dòng họ {clanInfo.clanSurname} và nghi thức cúng lễ chuẩn mực cổ truyền.
            </p>
          </div>

          {/* Navigation Sub-tabs */}
          <div className="bg-stone-900/90 rounded-2xl p-1 border border-amber-900/50 flex flex-wrap items-center text-xs gap-1">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                activeTab === 'calendar' ? 'bg-amber-700 text-white shadow-sm' : 'text-stone-300 hover:text-white'
              }`}
            >
              Lịch Giỗ Trong Năm
            </button>
            <button
              onClick={() => setActiveTab('prayers')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                activeTab === 'prayers' ? 'bg-amber-700 text-white shadow-sm' : 'text-stone-300 hover:text-white'
              }`}
            >
              Văn Khấn Mẫu
            </button>
            <button
              onClick={() => setActiveTab('rituals')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                activeTab === 'rituals' ? 'bg-amber-700 text-white shadow-sm' : 'text-stone-300 hover:text-white'
              }`}
            >
              Nghi Thức & Mâm Lễ
            </button>
            {canEdit && (
              <button
                onClick={() => setActiveTab('rsvps')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'rsvps' ? 'bg-amber-700 text-white shadow-sm' : 'text-amber-300 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Báo Danh ({totalAttendees} người)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Admin/Support RSVP Quick Alert Banner in Calendar View */}
        {canEdit && totalAttendees > 0 && activeTab === 'calendar' && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-800 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-sm font-serif-clan">
                  Ban Tổ Chức: Đã có {rsvps.length} gia đình báo danh tham dự
                </h4>
                <p className="text-xs text-amber-800">
                  Tổng cộng <strong>{totalAttendees} người</strong> dự kiến • Dự tính khoảng <strong>{Math.ceil(totalAttendees / 6)} mâm cỗ</strong> cho ngày Giỗ Tổ.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('rsvps')}
              className="px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
            >
              <span>Xem Danh Sách Chi Tiết</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        
        {/* Closest Upcoming Memorial Banner Card */}
        {upcomingEvent && (
          <div className="bg-gradient-to-r from-[#3b120c] via-[#60141e] to-[#2e0e09] text-amber-50 rounded-3xl p-6 sm:p-8 border-2 border-amber-500/50 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-stone-950 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    Sự Kiện Kỵ Nhật Trọng Đại Nhất
                  </span>
                  <span className="text-xs text-amber-200 font-semibold">{upcomingEvent.branch}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold font-serif-clan text-white leading-tight">
                  {upcomingEvent.title}
                </h2>

                <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-serif-clan max-w-2xl">
                  {upcomingEvent.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-amber-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">{upcomingEvent.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Chủ tế: {upcomingEvent.hostPerson}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 bg-stone-950/60 rounded-2xl p-5 border border-amber-500/30 text-center space-y-2">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Ngày Âm Lịch
                </div>
                <div className="text-3xl font-bold font-serif-clan text-amber-200">
                  {upcomingEvent.lunarDate}
                </div>
                <div className="text-xs text-stone-300">
                  Dự kiến Dương lịch: <strong>{upcomingEvent.solarDateEstimated}</strong>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('prayers')}
                    className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-md transition-colors"
                  >
                    Xem Bài Văn Khấn
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: CALENDAR OF MEMORIAL DAYS */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold font-serif-clan text-stone-900">
                  Danh Sách Ngày Giỗ Chạp Các Đời Trong Năm
                </h3>
                <span className="text-xs text-stone-500">
                  Tổng cộng {memorialEvents.length} kỳ lễ tế
                </span>
              </div>

              {canEdit && (
                <button
                  onClick={handleOpenAddEvent}
                  className="px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm ngày giỗ</span>
                </button>
              )}
            </div>

            {memorialEvents.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-2xl font-bold">
                  🏮
                </div>
                <h4 className="text-lg font-bold font-serif-clan text-stone-900">
                  Chưa có sự kiện giỗ nào trong lịch tộc
                </h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Hãy thêm các ngày kỵ nhật gia tiên, ngày giỗ cụ Thủy Tổ và các bậc tiền nhân để con cháu tiện tra cứu và dâng hương tưởng niệm.
                </p>
                {canEdit && (
                  <button
                    onClick={handleOpenAddEvent}
                    className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm ngày giỗ đầu tiên</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {memorialEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2.5 py-1 rounded-full font-bold font-serif-clan bg-amber-100 text-amber-900">
                          {event.lunarDate}
                        </span>
                        <span className="text-stone-500 font-medium">
                          Dương lịch: {event.solarDateEstimated}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-lg font-bold font-serif-clan text-stone-900 leading-snug">
                          {event.title}
                        </h4>

                        {/* Action Buttons for Edit/Delete */}
                        {(canEdit || canDelete) && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {canEdit && (
                              <button
                                onClick={() => handleOpenEditEvent(event)}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-800 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                title="Chỉnh sửa ngày giỗ"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Sửa</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteEvent(event)}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-700 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                title="Xóa ngày giỗ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Xóa</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="pt-2 space-y-1.5 text-xs text-stone-600 border-t border-stone-100">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Chủ trì / Trưởng ban: {event.hostPerson}</span>
                        </div>
                      </div>
                    </div>

                    {event.ritualNotes && (
                      <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-amber-900 bg-amber-50/70 p-2.5 rounded-xl flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <span>{event.ritualNotes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRAYERS / VĂN KHẤN MẪU */}
        {activeTab === 'prayers' && (
          <div className="space-y-8">
            {/* Customizer Box */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
              <h3 className="text-base font-bold font-serif-clan text-stone-900 mb-2">
                Cá Nhân Hóa Bài Văn Khấn
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Nhập tên người dâng lễ và địa chỉ gia đình để tự động điền vào các mẫu văn khấn bên dưới
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Tên Tín Chủ / Con Cháu:</label>
                  <input
                    type="text"
                    value={giverName}
                    onChange={(e) => setGiverName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-amber-600"
                    placeholder="Ví dụ: Lê Khắc Tuấn cùng toàn thể gia quyến"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Địa Chỉ Tư Gia / Cư Trú:</label>
                  <input
                    type="text"
                    value={residence}
                    onChange={(e) => setResidence(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-amber-600"
                    placeholder="Ví dụ: Số 12 phố An Phú, Cầu Giấy, Hà Nội"
                  />
                </div>
              </div>
            </div>

            {/* Prayers List */}
            <div className="space-y-6">
              {samplePrayers.map((prayer) => (
                <div
                  key={prayer.id}
                  className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-md"
                >
                  <div className="bg-amber-950/10 p-5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base sm:text-lg font-bold font-serif-clan text-stone-900">
                        {prayer.title}
                      </h4>
                      <p className="text-xs text-stone-600 mt-0.5">{prayer.desc}</p>
                    </div>

                    <button
                      onClick={() => handleCopy(prayer.content, prayer.id)}
                      className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      {copiedId === prayer.id ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Sao chép bài khấn</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-6 bg-parchment">
                    <pre className="whitespace-pre-wrap font-serif-clan text-xs sm:text-sm text-stone-800 leading-relaxed font-normal">
                      {prayer.content}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RITUALS & OFFERING GUIDE */}
        {activeTab === 'rituals' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  🏮
                </div>
                <div>
                  <h4 className="font-bold text-base font-serif-clan text-stone-900">
                    Sắm Sửa Mâm Lễ Cúng Giỗ Chuẩn Cổ Truyền
                  </h4>
                  <p className="text-xs text-stone-500">Quy cách bài trí mâm lễ dâng tiên tổ</p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-stone-700 leading-relaxed">
                <li className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <strong>1. Hương hoa trà quả:</strong> Hương trầm thơm, hoa cúc vàng hoặc lay ơn tươi, quả ngọt ngũ sắc (cam, chuối, bưởi, táo, thanh long), nước trong và trầu cau têm cánh phượng.
                </li>
                <li className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <strong>2. Mâm cỗ mặn truyền thống:</strong> Gà trống thiến luộc ngậm hoa hồng, đĩa xôi gấc hoặc xôi đỗ, đĩa giò lụa, nem rán, bát canh măng miến mộc, đĩa xào thập cẩm.
                </li>
                <li className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <strong>3. Vàng mã & Tiền bạc:</strong> Bộ quần áo giấy vàng mã dâng tiên linh, trấp tiền âm phủ, thanh y hài mũ theo đúng phong tục địa phương.
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-bold">
                  🕯️
                </div>
                <div>
                  <h4 className="font-bold text-base font-serif-clan text-stone-900">
                    Trình Tự Tiến Hành Nghi Lễ Cúng Giỗ
                  </h4>
                  <p className="text-xs text-stone-500">Các bước tế tự trang nghiêm tại gia đình</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-stone-700 leading-relaxed">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="font-bold text-amber-900 mb-1">Bước 1: Lau dọn bàn thờ & Tịnh sái</div>
                  <p className="text-stone-600">Dùng nước ấm đun gừng hoặc quế lau sạch bụi trên bàn thờ, thắp đèn nến sáng sủa.</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="font-bold text-amber-900 mb-1">Bước 2: Bày mâm lễ & Dâng hương</div>
                  <p className="text-stone-600">Trưởng nam hoặc người chủ tế dòng họ thắp 3 nén hương, châm trà rót rượu.</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="font-bold text-amber-900 mb-1">Bước 3: Đọc bài văn khấn</div>
                  <p className="text-stone-600">Đứng nghiêm trang trước hương án, đọc văn khấn với giọng cung kính, chậm rãi.</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="font-bold text-amber-900 mb-1">Bước 4: Tạ lễ & Thụ lộc gia tộc</div>
                  <p className="text-stone-600">Đợi tàn tuần hương, vái 3 vái xin hóa vàng mã rồi hạ lễ thụ lộc cùng con cháu sum vầy.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ADMIN / SUPPORT RSVP MANAGEMENT ROSTER */}
        {activeTab === 'rsvps' && canEdit && (
          <div className="space-y-6">
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Hộ Báo Danh</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-bold font-serif-clan text-stone-900 mt-2">
                  {rsvps.length} <span className="text-xs font-normal text-stone-500 font-sans">lượt</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">Gia đình đã gửi đăng ký</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Tổng Người Dự</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-bold font-serif-clan text-emerald-800 mt-2">
                  {totalAttendees} <span className="text-xs font-normal text-stone-500 font-sans">người</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">Con cháu nội ngoại tề tựu</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Dự Tính Mâm Cỗ</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-bold font-serif-clan text-rose-900 mt-2">
                  {Math.ceil(totalAttendees / 6)} <span className="text-xs font-normal text-stone-500 font-sans">mâm</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">Tính chuẩn 6 người / mâm</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Cơ Sở Dữ Liệu</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-900 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-sm font-bold font-serif-clan text-sky-900 mt-2 truncate">
                  event_rsvps
                </div>
                <p className="text-[11px] text-stone-500 mt-1">Lưu trữ trên Supabase</p>
              </div>
            </div>

            {/* Filter and Action Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo họ tên, số điện thoại, ghi chú..."
                    value={rsvpSearch}
                    onChange={(e) => setRsvpSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>

                {/* Branch Filter */}
                <div className="w-44">
                  <select
                    value={rsvpBranchFilter}
                    onChange={(e) => setRsvpBranchFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:border-amber-600 focus:outline-none"
                  >
                    <option value="all">Tất cả chi nhánh</option>
                    <option value="Chi Trưởng">Chi Trưởng</option>
                    <option value="Chi Hai">Chi Hai</option>
                    <option value="Chi Ba">Chi Ba</option>
                    <option value="Chi Ngoại">Chi Ngoại / Khách Quý</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadRsvps}
                  disabled={isLoadingRsvps}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Tải lại danh sách từ Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRsvps ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  title="In danh sách chuẩn bị cỗ"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Bảng Dự Tính</span>
                </button>
              </div>
            </div>

            {/* RSVPs Table */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold font-serif-clan text-stone-900">
                    Danh Sách Người Báo Danh ({filteredRsvps.length} hộ / {filteredAttendeesTotal} người)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Dữ liệu đăng ký tham dự Đại lễ Giỗ Tổ Họ {clanInfo.clanSurname} Tộc
                  </p>
                </div>
              </div>

              {filteredRsvps.length === 0 ? (
                <div className="p-12 text-center text-stone-500 space-y-2">
                  <Users className="w-10 h-10 mx-auto text-stone-300" />
                  <p className="text-sm font-semibold">Chưa có bản ghi báo danh nào</p>
                  <p className="text-xs text-stone-400">
                    {rsvpSearch || rsvpBranchFilter !== 'all' ? 'Không tìm thấy kết quả phù hợp với bộ lọc' : 'Bà con có thể báo danh tại nút "Báo Danh Tham Dự" ở Trang Chủ.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider border-b border-stone-200">
                      <tr>
                        <th className="px-4 py-3.5 text-center w-12">STT</th>
                        <th className="px-4 py-3.5">Họ và Tên Người Báo Danh</th>
                        <th className="px-4 py-3.5">Chi Nhánh</th>
                        <th className="px-4 py-3.5">Số Điện Thoại</th>
                        <th className="px-4 py-3.5 text-center">Số Người</th>
                        <th className="px-4 py-3.5">Ghi Chú / Lễ Vật</th>
                        <th className="px-4 py-3.5">Thời Gian Đăng Ký</th>
                        {canDelete && <th className="px-4 py-3.5 text-center w-16">Xóa</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800">
                      {filteredRsvps.map((r, idx) => (
                        <tr key={r.id} className="hover:bg-amber-50/50 transition-colors">
                          <td className="px-4 py-3.5 text-center text-stone-400 font-medium">{idx + 1}</td>
                          <td className="px-4 py-3.5 font-bold font-serif-clan text-stone-900 text-sm">
                            {r.full_name}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-semibold text-[11px]">
                              {r.branch || 'Chung'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {r.phone ? (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`tel:${r.phone}`}
                                  className="font-medium text-amber-900 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3 text-amber-700" />
                                  <span>{r.phone}</span>
                                </a>
                                <button
                                  onClick={() => handleCopyPhone(r.phone!, r.id)}
                                  className="p-1 text-stone-400 hover:text-stone-700 rounded"
                                  title="Sao chép SĐT"
                                >
                                  {copiedRsvpPhone === r.id ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-stone-400 italic">Chưa cập nhật</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs">
                              {r.attendee_count} người
                            </span>
                          </td>
                          <td className="px-4 py-3.5 max-w-xs truncate text-stone-600" title={r.notes || ''}>
                            {r.notes ? (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="truncate">{r.notes}</span>
                              </div>
                            ) : (
                              <span className="text-stone-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-stone-400 text-[11px]">
                            {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Vừa xong'}
                          </td>
                          {canDelete && (
                            <td className="px-4 py-3.5 text-center">
                              <button
                                onClick={() => handleDeleteRsvp(r.id, r.full_name)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                                title="Xóa bản ghi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Add / Edit Memorial Event Modal */}
      {isEventModalOpen && (
        <AddEditEventModal
          isOpen={isEventModalOpen}
          eventToEdit={selectedEventToEdit}
          members={members}
          clanInfo={clanInfo}
          onClose={() => {
            setIsEventModalOpen(false);
            setSelectedEventToEdit(null);
          }}
          onSave={(event) => {
            if (onSaveEvent) {
              onSaveEvent(event);
            }
          }}
        />
      )}
    </div>
  );
};
