import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  MapPin, 
  User, 
  FileText, 
  Sparkles, 
  Flame,
  Info,
  Check
} from 'lucide-react';
import { MemorialEvent, ClanMember, ClanInfo } from '../types';
import { convertLunarToSolar, parseLunarDateString } from '../utils/lunarUtils';

interface AddEditEventModalProps {
  isOpen: boolean;
  eventToEdit: MemorialEvent | null;
  members: ClanMember[];
  clanInfo: ClanInfo;
  onClose: () => void;
  onSave: (event: MemorialEvent) => void;
}

export const AddEditEventModal: React.FC<AddEditEventModalProps> = ({
  isOpen,
  eventToEdit,
  members,
  clanInfo,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [memberId, setMemberId] = useState<string>('');
  const [lunarDay, setLunarDay] = useState<number>(10);
  const [lunarMonth, setLunarMonth] = useState<number>(3);
  const [isLeapMonth, setIsLeapMonth] = useState<boolean>(false);
  const [location, setLocation] = useState('');
  const [hostPerson, setHostPerson] = useState('');
  const [description, setDescription] = useState('');
  const [ritualNotes, setRitualNotes] = useState('');

  // Populate state on open or edit
  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setMemberId(eventToEdit.memberId || '');
      
      // Parse day & month
      let day = eventToEdit.lunarDay;
      let month = eventToEdit.lunarMonth;
      if (!day || !month) {
        const parsed = parseLunarDateString(eventToEdit.lunarDate);
        if (parsed) {
          day = parsed.day;
          month = parsed.month;
        } else {
          day = 10;
          month = 3;
        }
      }
      setLunarDay(day);
      setLunarMonth(month);
      setIsLeapMonth(Boolean(eventToEdit.isLeapMonth));
      setLocation(eventToEdit.location || clanInfo.ancestralHallLocation || 'Từ Đường Gia Tộc');
      setHostPerson(eventToEdit.hostPerson || 'Trưởng Tộc / Trưởng Ban Tế Tự');
      setDescription(eventToEdit.description || '');
      setRitualNotes(eventToEdit.ritualNotes || '');
    } else {
      // Default new event values
      setTitle('');
      setMemberId('');
      setLunarDay(15);
      setLunarMonth(1);
      setIsLeapMonth(false);
      setLocation(clanInfo.ancestralHallLocation || 'Từ Đường Gia Tộc');
      setHostPerson('Trưởng Tộc / Trưởng Ban Tế Tự');
      setDescription('');
      setRitualNotes('');
    }
  }, [eventToEdit, isOpen, clanInfo]);

  // When member is selected, auto fill title & lunar date if available
  const handleMemberChange = (selectedId: string) => {
    setMemberId(selectedId);
    if (!selectedId) return;

    const member = members.find((m) => m.id === selectedId);
    if (member) {
      if (!title || title.startsWith('Lễ Kỵ Nhật') || title === 'Lễ Giỗ' || !eventToEdit) {
        const titlePrefix = member.title ? `${member.title} ` : '';
        setTitle(`Lễ Kỵ Nhật ${titlePrefix}${member.fullName}`);
      }

      if (member.lunarDeathDate) {
        const parsed = parseLunarDateString(member.lunarDeathDate);
        if (parsed) {
          setLunarDay(parsed.day);
          setLunarMonth(parsed.month);
        }
      }

      if (member.branch) {
        if (!description) {
          setDescription(`Kỵ nhật thành viên Đời ${member.generation}, ${member.branch}. Toàn thể con cháu chuẩn bị lễ vật trang trọng.`);
        }
      }
    }
  };

  // Calculate dynamic solar date estimation
  const currentYear = useMemo(() => {
    return new Date().getFullYear() >= 2026 ? new Date().getFullYear() : 2026;
  }, []);

  const solarEstimate = useMemo(() => {
    return convertLunarToSolar(currentYear, lunarMonth, lunarDay, isLeapMonth);
  }, [currentYear, lunarMonth, lunarDay, isLeapMonth]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên ngày giỗ / sự kiện.');
      return;
    }

    const lunarDateStr = `${String(lunarDay).padStart(2, '0')}/${String(lunarMonth).padStart(2, '0')}${isLeapMonth ? ' (Nhuận)' : ''} Âm lịch`;
    const selectedMember = members.find((m) => m.id === memberId);

    const newEvent: MemorialEvent = {
      id: eventToEdit ? eventToEdit.id : `ev_${Date.now()}`,
      memberId: memberId || null,
      title: title.trim(),
      lunarDay,
      lunarMonth,
      isLeapMonth,
      lunarDate: lunarDateStr,
      solarDateEstimated: solarEstimate.formattedSolar,
      targetPersonName: selectedMember ? selectedMember.fullName : title.trim(),
      generation: selectedMember ? selectedMember.generation : (eventToEdit?.generation || 1),
      branch: selectedMember?.branch || eventToEdit?.branch || 'Toàn tộc',
      location: location.trim() || 'Từ Đường Gia Tộc',
      hostPerson: hostPerson.trim() || 'Trưởng Tộc',
      role: eventToEdit?.role || 'Ban Trị Sự',
      description: description.trim(),
      ritualNotes: ritualNotes.trim() || undefined,
    };

    onSave(newEvent);
    onClose();
  };

  // Month name helper
  const getMonthLabel = (m: number) => {
    if (m === 1) return 'Tháng 1 (Tháng Giêng)';
    if (m === 11) return 'Tháng 11 (Tháng Một)';
    if (m === 12) return 'Tháng 12 (Tháng Chạp)';
    return `Tháng ${m}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border-2 border-amber-800/40 shadow-2xl max-w-2xl w-full overflow-hidden relative text-stone-900 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2c1309] via-[#461118] to-[#2c1309] text-amber-50 p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-stone-900/60 hover:bg-stone-900 text-stone-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 text-xs font-bold text-amber-400 uppercase tracking-widest font-serif-clan">
            <Flame className="w-4 h-4 fill-current" />
            <span>Nghi Lễ Tế Tự & Kỵ Nhật</span>
          </div>
          <h3 className="text-xl font-bold font-serif-clan text-white mt-1">
            {eventToEdit ? 'Chỉnh Sửa Ngày Giỗ / Lễ Tế' : 'Thêm Ngày Giỗ Mới Vào Lịch Tộc'}
          </h3>
          <p className="text-xs text-amber-200/80 mt-1">
            Nhập thông tin ngày Âm lịch, địa điểm và ghi chú cúng giỗ để con cháu toàn tộc tiện theo dõi.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          
          {/* 1. Tên sự kiện / Lễ giỗ */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-800 flex items-center gap-1.5">
              <span>Tên Lễ Giỗ / Sự Kiện Kỵ Nhật *</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-semibold focus:outline-none focus:border-amber-700 focus:bg-white text-xs sm:text-sm"
              placeholder="Ví dụ: Lễ Giỗ Cụ Thủy Tổ, Ngày Kỵ Nhật Cụ Lê Khắc Chính..."
            />
          </div>

          {/* 2. Chọn thành viên liên quan */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-800" />
                <span>Gắn với Thành Viên Trong Gia Phả</span>
              </span>
              <span className="text-[11px] font-normal text-stone-500">Tùy chọn</span>
            </label>
            <select
              value={memberId}
              onChange={(e) => handleMemberChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-amber-700 focus:bg-white text-xs"
            >
              <option value="">-- Không gắn cụ thể (Lễ giỗ chung toàn tộc) --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  [Đời {m.generation}] {m.fullName} {m.title ? `(${m.title})` : ''} {m.isAlive ? '' : '— (Đã mất)'}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Ngày & Tháng Âm Lịch + Tháng Nhuận */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
            <div className="font-bold text-amber-950 font-serif-clan flex items-center gap-1.5 text-xs">
              <CalendarIcon className="w-4 h-4 text-amber-800" />
              <span>Thời Gian Theo Âm Lịch & Dự Tính Dương Lịch</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Ngày Âm Lịch (1 - 30):</label>
                <select
                  value={lunarDay}
                  onChange={(e) => setLunarDay(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 font-semibold focus:outline-none focus:border-amber-700 text-xs"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Ngày {d} Âm lịch {d === 1 ? '(Mùng 1)' : d === 15 ? '(Rằm 15)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Tháng Âm Lịch (1 - 12):</label>
                <select
                  value={lunarMonth}
                  onChange={(e) => setLunarMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 font-semibold focus:outline-none focus:border-amber-700 text-xs"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {getMonthLabel(m)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkbox Tháng Nhuận */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isLeapMonthCheck"
                checked={isLeapMonth}
                onChange={(e) => setIsLeapMonth(e.target.checked)}
                className="w-4 h-4 text-amber-700 rounded border-stone-300 focus:ring-amber-600"
              />
              <label htmlFor="isLeapMonthCheck" className="text-stone-800 font-semibold cursor-pointer">
                Đây là tháng nhuận (Âm lịch)
              </label>
            </div>

            {/* Live Solar Calculation Result Badge */}
            <div className="p-3 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-800 shrink-0" />
                <span>
                  Dương lịch năm <strong>{currentYear}</strong>: <strong className="text-amber-900">{solarEstimate.formattedSolar}</strong>
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-800 text-amber-50 font-bold text-[11px]">
                {solarEstimate.daysRemaining >= 0 
                  ? `Còn ${solarEstimate.daysRemaining} ngày` 
                  : `Đã qua ${Math.abs(solarEstimate.daysRemaining)} ngày`}
              </span>
            </div>
          </div>

          {/* 4. Địa điểm & Người chủ trì */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-800" />
                <span>Địa Điểm Tổ Chức</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-amber-700 focus:bg-white text-xs"
                placeholder="Ví dụ: Nhà Thờ Họ - Thôn An Phú, Tư gia Trưởng chi..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-800" />
                <span>Người Chủ Trì / Trưởng Ban</span>
              </label>
              <input
                type="text"
                value={hostPerson}
                onChange={(e) => setHostPerson(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-amber-700 focus:bg-white text-xs"
                placeholder="Ví dụ: Trưởng Tộc, Trưởng Chi 2..."
              />
            </div>
          </div>

          {/* 5. Ghi chú & Mô tả */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-800" />
              <span>Ghi Chú & Mô Tả Sự Kiện</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-amber-700 focus:bg-white text-xs leading-relaxed"
              placeholder="Ghi chú về phần việc con cháu, mâm cỗ cúng, thời gian tập trung..."
            />
          </div>

          {/* 6. Hướng dẫn nghi lễ (Tùy chọn) */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-800" />
                <span>Nghi Thức Lễ Tế Đặc Biệt (Nếu có)</span>
              </span>
              <span className="text-[11px] font-normal text-stone-500">Tùy chọn</span>
            </label>
            <input
              type="text"
              value={ritualNotes}
              onChange={(e) => setRitualNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-amber-700 focus:bg-white text-xs"
              placeholder="Ví dụ: Lễ tam sinh, dâng sớ tại chính điện, phát lộc khuyến học..."
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{eventToEdit ? 'Lưu Thay Đổi' : 'Thêm Vào Lịch Tộc'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
