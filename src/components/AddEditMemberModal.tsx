import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  UserPlus, 
  Save, 
  User, 
  Heart, 
  MapPin, 
  Phone, 
  Calendar, 
  Briefcase, 
  Award,
  Layers,
  Sparkles
} from 'lucide-react';
import { ClanMember, Gender } from '../types';
import { calculateAgeInfo, getGenderVisuals } from '../utils/genealogyUtils';

interface AddEditMemberModalProps {
  isOpen: boolean;
  memberToEdit?: ClanMember | null;
  parentToAssign?: ClanMember | null;
  allMembers: ClanMember[];
  onClose: () => void;
  onSave: (member: ClanMember) => void;
}

export const AddEditMemberModal: React.FC<AddEditMemberModalProps> = ({
  isOpen,
  memberToEdit,
  parentToAssign,
  allMembers,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [generation, setGeneration] = useState<number>(5);
  const [branch, setBranch] = useState('Chi Trưởng');
  const [orderInFamily, setOrderInFamily] = useState<string>('');
  const [title, setTitle] = useState('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [deathYear, setDeathYear] = useState<string>('');
  const [isAlive, setIsAlive] = useState(true);
  const [lunarDeathDate, setLunarDeathDate] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [motherName, setMotherName] = useState('');
  const [spouse, setSpouse] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [restingPlace, setRestingPlace] = useState('');
  const [achievements, setAchievements] = useState('');

  useEffect(() => {
    if (memberToEdit) {
      setFullName(memberToEdit.fullName || '');
      setGender(memberToEdit.gender || 'male');
      setGeneration(memberToEdit.generation || 5);
      setBranch(memberToEdit.branch || 'Chi Trưởng');
      setOrderInFamily(
        memberToEdit.orderInFamily !== undefined && memberToEdit.orderInFamily !== null
          ? String(memberToEdit.orderInFamily)
          : ''
      );
      setTitle(memberToEdit.title || '');
      setBirthYear(memberToEdit.birthYear ? String(memberToEdit.birthYear) : '');
      setDeathYear(memberToEdit.deathYear ? String(memberToEdit.deathYear) : '');
      setIsAlive(memberToEdit.isAlive !== false);
      setLunarDeathDate(memberToEdit.lunarDeathDate || '');
      setParentId(memberToEdit.parentId || null);
      setMotherName(memberToEdit.motherName || '');
      setSpouse(memberToEdit.spouse || '');
      setPhone(memberToEdit.phone || '');
      setAddress(memberToEdit.address || '');
      setOccupation(memberToEdit.occupation || '');
      setBio(memberToEdit.bio || '');
      setRestingPlace(memberToEdit.restingPlace || '');
      setAchievements(memberToEdit.achievements ? memberToEdit.achievements.join(', ') : '');
    } else if (parentToAssign) {
      const existingChildren = allMembers.filter(m => m.parentId === parentToAssign.id);
      setFullName('');
      setGender('male');
      setGeneration(parentToAssign.generation + 1);
      setBranch(parentToAssign.branch || 'Chi Trưởng');
      setOrderInFamily(String(existingChildren.length + 1));
      setTitle('');
      setBirthYear(new Date().getFullYear().toString());
      setDeathYear('');
      setIsAlive(true);
      setLunarDeathDate('');
      setParentId(parentToAssign.id);
      setMotherName(parentToAssign.spouse || '');
      setSpouse('');
      setPhone('');
      setAddress(parentToAssign.address || '');
      setOccupation('');
      setBio('');
      setRestingPlace('');
      setAchievements('');
    } else {
      setFullName('');
      setGender('male');
      setGeneration(5);
      setBranch('Chi Trưởng');
      setOrderInFamily('');
      setTitle('');
      setBirthYear('');
      setDeathYear('');
      setIsAlive(true);
      setLunarDeathDate('');
      setParentId(null);
      setMotherName('');
      setSpouse('');
      setPhone('');
      setAddress('');
      setOccupation('');
      setBio('');
      setRestingPlace('');
      setAchievements('');
    }
  }, [memberToEdit, parentToAssign, isOpen, allMembers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const achievementsList = achievements.split(',').map(s => s.trim()).filter(Boolean);
    const parsedOrder = orderInFamily.trim() !== '' ? Number(orderInFamily) : undefined;

    const newMember: ClanMember = {
      id: memberToEdit ? memberToEdit.id : `mem_${Date.now()}`,
      fullName: fullName.trim(),
      gender,
      generation: Number(generation),
      branch,
      orderInFamily: parsedOrder !== undefined && !isNaN(parsedOrder) ? parsedOrder : undefined,
      title: title.trim() || undefined,
      birthYear: birthYear ? Number(birthYear) || birthYear : undefined,
      deathYear: !isAlive && deathYear ? Number(deathYear) || deathYear : null,
      isAlive,
      lunarDeathDate: !isAlive && lunarDeathDate.trim() ? lunarDeathDate.trim() : undefined,
      parentId: parentId || null,
      motherName: motherName.trim() || undefined,
      spouse: spouse.trim() || undefined,
      spouseList: memberToEdit?.spouseList,
      phone: phone.trim() || undefined,
      email: memberToEdit?.email,
      address: address.trim() || undefined,
      occupation: occupation.trim() || undefined,
      bio: bio.trim() || undefined,
      restingPlace: !isAlive && restingPlace.trim() ? restingPlace.trim() : undefined,
      achievements: achievementsList.length > 0 ? achievementsList : undefined,
      avatar: memberToEdit?.avatar,
      role: memberToEdit?.role,
    };

    onSave(newMember);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border-2 border-amber-800/40 shadow-2xl max-w-2xl w-full overflow-hidden relative text-stone-900 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#24140e] text-amber-50 p-6 flex items-center justify-between border-b border-amber-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-700 text-amber-100 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-serif-clan text-white">
                {memberToEdit ? 'Chỉnh Sửa Thông Tin Thành Viên' : 'Thêm Con Cháu Vào Gia Phả'}
              </h2>
              <p className="text-xs text-amber-200/70">
                {parentToAssign ? `Thêm con của ông/bà ${parentToAssign.fullName}` : 'Cập nhật cây phả hệ gia tộc'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Row 1: Full name and Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-stone-700 font-bold mb-1">
                Họ và Tên thành viên: <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Lê Khắc Hoàng Phúc"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-amber-600 font-semibold text-sm"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Giới tính:</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none font-semibold"
              >
                <option value="male">Nam ♂ (Nam Đinh / Rể)</option>
                <option value="female">Nữ ♀ (Nữ Giới / Dâu)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Generation, Branch, OrderInFamily, Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Thế hệ (Đời thứ):</label>
              <select
                value={generation}
                onChange={(e) => setGeneration(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-amber-600 font-medium"
              >
                <option value={1}>Đời 1 (Thủy Tổ)</option>
                <option value={2}>Đời 2</option>
                <option value={3}>Đời 3</option>
                <option value={4}>Đời 4</option>
                <option value={5}>Đời 5</option>
                <option value={6}>Đời 6</option>
                <option value={7}>Đời 7</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Chi nhánh / Chi phái:</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-amber-600 font-medium"
              >
                <option value="Chi Trưởng">Chi Trưởng</option>
                <option value="Chi Hai">Chi Hai</option>
                <option value="Chi Ba">Chi Ba</option>
                <option value="Chi Bốn">Chi Bốn</option>
                <option value="Chi Ngoại">Chi Ngoại</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1" title="Xác định thứ tự hiển thị giữa các anh chị em cùng cha/mẹ (1 = con cả, 2 = con thứ 2...)">
                Thứ tự sinh trong gia đình:
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={orderInFamily}
                onChange={(e) => setOrderInFamily(e.target.value)}
                placeholder="1 = Con cả, 2 = Thứ 2..."
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-amber-600 font-semibold"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Danh xưng / Chức vị:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Trưởng tộc, Cháu đích tôn..."
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          {/* Row 3: Parent Selection */}
          <div>
            <label className="block text-stone-700 font-bold mb-1">Thân phụ (Bố đẻ trong họ):</label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value || null)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none"
            >
              <option value="">Không có / Là Cụ Thủy Tổ khởi nghiệp</option>
              {allMembers.filter(m => m.gender === 'male').map(m => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.branch} - Đời {m.generation})
                </option>
              ))}
            </select>
          </div>

          {/* Row 4: Mother and Spouse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Thân mẫu (Mẹ):</label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="Ví dụ: Bà Hoàng Thị Minh Châu"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">Phối ngẫu (Vợ / Chồng):</label>
              <input
                type="text"
                value={spouse}
                onChange={(e) => setSpouse(e.target.value)}
                placeholder="Ví dụ: Bà Trần Thị Mai"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 5: Living Status, Birth Year, Death Year */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                <input
                  type="radio"
                  name="livingStatus"
                  checked={isAlive}
                  onChange={() => setIsAlive(true)}
                  className="text-amber-700 focus:ring-0"
                />
                <span>Còn sống</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                <input
                  type="radio"
                  name="livingStatus"
                  checked={!isAlive}
                  onChange={() => setIsAlive(false)}
                  className="text-amber-700 focus:ring-0"
                />
                <span>Đã khuất (Tiền nhân)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-600 font-medium mb-1">Năm sinh:</label>
                <input
                  type="text"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="Ví dụ: 1985"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none"
                />
              </div>

              {!isAlive ? (
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Năm mất:</label>
                  <input
                    type="text"
                    value={deathYear}
                    onChange={(e) => setDeathYear(e.target.value)}
                    placeholder="Ví dụ: 2018"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none"
                  />
                </div>
              ) : null}
            </div>

            {/* Real-time Age / Lifespan Computation Preview */}
            {birthYear && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-stone-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Hiển thị tự động trên cây gia phả:
                </span>
                <span className="font-bold px-2 py-0.5 rounded bg-white border border-amber-300 text-amber-900">
                  {calculateAgeInfo(birthYear, !isAlive ? deathYear : null, isAlive).formattedText}
                </span>
              </div>
            )}

            {!isAlive && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-200">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Ngày giỗ (Âm lịch):</label>
                  <input
                    type="text"
                    value={lunarDeathDate}
                    onChange={(e) => setLunarDeathDate(e.target.value)}
                    placeholder="Ví dụ: 15/07 Âm lịch"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Nơi an nghỉ (Lăng mộ):</label>
                  <input
                    type="text"
                    value={restingPlace}
                    onChange={(e) => setRestingPlace(e.target.value)}
                    placeholder="Ví dụ: Nghĩa trang quê nhà"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Row 6: Contact & Address for living */}
          {isAlive && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Số điện thoại liên lạc:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0912 345 678"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-stone-700 font-bold mb-1">Nơi ở / Cư trú hiện tại:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ví dụ: Cầu Giấy, Hà Nội"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Row 7: Occupation & Achievements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Nghề nghiệp / Đơn vị công tác:</label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="Ví dụ: Kỹ sư CNTT, Giảng viên..."
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-bold mb-1">Thành tích / Khen thưởng (ngăn cách bằng dấu phẩy):</label>
              <input
                type="text"
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder="Ví dụ: Thủ khoa ĐH, Giải Nhất Quốc Gia..."
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 8: Bio */}
          <div>
            <label className="block text-stone-700 font-bold mb-1">Tiểu sử phả ký vắn tắt:</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ghi chú về cuộc đời, sự nghiệp và công đức đối với gia tộc..."
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-bold flex items-center gap-2 shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{memberToEdit ? 'Cập Nhật Thay Đổi' : 'Lưu Thành Viên'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
