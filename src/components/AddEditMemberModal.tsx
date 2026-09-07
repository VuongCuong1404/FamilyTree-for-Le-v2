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
  Sparkles,
  Plus,
  Trash2,
  Search,
  Camera,
  Upload,
  Globe,
  RefreshCw
} from 'lucide-react';
import { ClanMember, Gender, SpouseInfo } from '../types';
import { calculateAgeInfo, getGenderVisuals, compressImageFile } from '../utils/genealogyUtils';
import { generateUUID } from '../services/supabaseService';

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
  const [motherId, setMotherId] = useState<string | null>(null);
  const [motherName, setMotherName] = useState('');
  const [selectedSpouseIds, setSelectedSpouseIds] = useState<string[]>([]);
  const [spouseSearchTerm, setSpouseSearchTerm] = useState('');
  const [isSpouseDropdownOpen, setIsSpouseDropdownOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [restingPlace, setRestingPlace] = useState('');
  const [achievements, setAchievements] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [avatarInputMode, setAvatarInputMode] = useState<'upload' | 'url'>('upload');
  const [isCompressingAvatar, setIsCompressingAvatar] = useState<boolean>(false);

  // Find father and his spouses to determine if "Chọn Thân mẫu" should appear
  const currentFatherId = parentId || (parentToAssign?.gender === 'male' ? parentToAssign.id : null);
  const currentFather = useMemo(() => {
    return currentFatherId ? allMembers.find(m => m.id === currentFatherId) : null;
  }, [currentFatherId, allMembers]);

  const fatherSpouseIds = useMemo(() => {
    let ids: string[] = [];
    if (currentFather) {
      const direct = currentFather.spouseIds || [];
      const reverse = allMembers.filter(m => m.id !== currentFather.id && m.spouseIds?.includes(currentFather.id)).map(m => m.id);
      ids = Array.from(new Set([...direct, ...reverse]));
    } else if (parentToAssign?.gender === 'female') {
      const direct = parentToAssign.spouseIds || [];
      const reverse = allMembers.filter(m => m.id !== parentToAssign.id && m.spouseIds?.includes(parentToAssign.id)).map(m => m.id);
      ids = Array.from(new Set([...direct, ...reverse]));
    }
    // Chỉ giữ ID tồn tại trong allMembers, loại bỏ hoàn toàn các ID mồ côi đã bị xóa
    return ids.filter(id => allMembers.some(m => m.id === id));
  }, [currentFather, allMembers, parentToAssign]);

  // If father has spouses, automatically ensure motherId is set to valid spouse
  useEffect(() => {
    if (fatherSpouseIds.length >= 1) {
      if (!motherId || !fatherSpouseIds.includes(motherId)) {
        setMotherId(fatherSpouseIds[0]);
        const mMem = allMembers.find(m => m.id === fatherSpouseIds[0]);
        if (mMem) setMotherName(mMem.fullName);
      }
    }
  }, [fatherSpouseIds, motherId, allMembers]);

  // Candidates for spouse link autocomplete
  const candidateSpouseMembers = useMemo(() => {
    const curId = memberToEdit?.id;
    const q = spouseSearchTerm.trim().toLowerCase();

    return allMembers.filter(m => {
      if (curId && m.id === curId) return false;
      if (selectedSpouseIds.includes(m.id)) return false;

      if (!q) {
        return true;
      }

      return (
        m.fullName.toLowerCase().includes(q) ||
        (m.branch && m.branch.toLowerCase().includes(q)) ||
        String(m.generation).includes(q) ||
        (m.birthYear && String(m.birthYear).includes(q))
      );
    });
  }, [allMembers, memberToEdit, selectedSpouseIds, spouseSearchTerm]);

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
      setMotherId(memberToEdit.motherId || null);
      setMotherName(memberToEdit.motherName || '');
      
      // Load linked spouseIds (chỉ giữ thành viên còn tồn tại)
      const direct = memberToEdit.spouseIds || [];
      const reverse = allMembers.filter(m => m.id !== memberToEdit.id && m.spouseIds?.includes(memberToEdit.id)).map(m => m.id);
      setSelectedSpouseIds(Array.from(new Set([...direct, ...reverse])).filter(id => allMembers.some(m => m.id === id)));

      setPhone(memberToEdit.phone || '');
      setAddress(memberToEdit.address || '');
      setOccupation(memberToEdit.occupation || '');
      setBio(memberToEdit.bio || '');
      setRestingPlace(memberToEdit.restingPlace || '');
      setAchievements(memberToEdit.achievements ? memberToEdit.achievements.join(', ') : '');
      setAvatarUrl(memberToEdit.avatar || '');
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

      // Tự động gán mẹ nếu cha đã có phối ngẫu hợp lệ trong hệ thống
      const pSpouseIds = (parentToAssign.spouseIds || []).filter(id => allMembers.some(m => m.id === id));
      if (pSpouseIds.length > 0) {
        const firstMId = pSpouseIds[0];
        setMotherId(firstMId);
        const motherMem = allMembers.find(m => m.id === firstMId);
        setMotherName(motherMem?.fullName || parentToAssign.spouse || '');
      } else {
        setMotherId(null);
        setMotherName(parentToAssign.spouse || (parentToAssign.spouseList?.[0]?.name) || '');
      }

      setSelectedSpouseIds([]);
      setPhone('');
      setAddress(parentToAssign.address || '');
      setOccupation('');
      setBio('');
      setRestingPlace('');
      setAchievements('');
      setAvatarUrl('');
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
      setMotherId(null);
      setMotherName('');
      setSelectedSpouseIds([]);
      setPhone('');
      setAddress('');
      setOccupation('');
      setBio('');
      setRestingPlace('');
      setAchievements('');
      setAvatarUrl('');
    }
    setSpouseSearchTerm('');
    setIsSpouseDropdownOpen(false);
    setAvatarInputMode('upload');
  }, [memberToEdit, parentToAssign, isOpen, allMembers]);

  const handleAddSpouseId = (id: string) => {
    setSelectedSpouseIds(prev => Array.from(new Set([...prev, id])));
    setSpouseSearchTerm('');
    setIsSpouseDropdownOpen(false);
  };

  const handleRemoveSpouseId = (id: string) => {
    setSelectedSpouseIds(prev => prev.filter(x => x !== id));
  };

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WebP).');
      return;
    }

    setIsCompressingAvatar(true);
    try {
      const compressed = await compressImageFile(file, 360, 360, 0.82);
      setAvatarUrl(compressed);
    } catch (err: any) {
      alert(err.message || 'Lỗi nén ảnh đại diện.');
    } finally {
      setIsCompressingAvatar(false);
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const achievementsList = achievements.split(',').map(s => s.trim()).filter(Boolean);
    const parsedOrder = orderInFamily.trim() !== '' ? Number(orderInFamily) : undefined;

    // Build primary spouse string and legacy spouseList from selected spouse IDs
    const linkedSpouses = selectedSpouseIds
      .map(id => allMembers.find(m => m.id === id))
      .filter((m): m is ClanMember => Boolean(m));

    const primarySpouseString = linkedSpouses.length > 0
      ? linkedSpouses.map(s => s.fullName).join(', ')
      : undefined;

    const generatedSpouseList: SpouseInfo[] = linkedSpouses.map((s, idx) => ({
      name: s.fullName,
      birthYear: s.birthYear,
      deathYear: s.deathYear,
      isAlive: s.isAlive,
      note: idx === 0 ? 'Chính thất' : `Phối ngẫu ${idx + 1}`,
    }));

    // Đảm bảo không lưu raw UUID làm motherName text
    let resolvedMotherName = motherName.trim();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedMotherName)) {
      resolvedMotherName = allMembers.find(m => m.id === resolvedMotherName)?.fullName || '';
    }
    const finalMotherName = resolvedMotherName || (motherId ? (allMembers.find(m => m.id === motherId)?.fullName || '') : '');
    const finalAvatar = avatarUrl.trim() ? avatarUrl.trim() : null;

    const newMember: ClanMember = {
      id: memberToEdit ? memberToEdit.id : generateUUID(),
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
      motherId: motherId || null,
      motherName: finalMotherName || undefined,
      spouse: primarySpouseString,
      spouseList: generatedSpouseList.length > 0 ? generatedSpouseList : undefined,
      spouseIds: selectedSpouseIds.filter(id => allMembers.some(m => m.id === id)),
      phone: phone.trim() || undefined,
      email: memberToEdit?.email,
      address: address.trim() || undefined,
      occupation: occupation.trim() || undefined,
      bio: bio.trim() || undefined,
      restingPlace: !isAlive && restingPlace.trim() ? restingPlace.trim() : undefined,
      achievements: achievementsList.length > 0 ? achievementsList : undefined,
      avatar: finalAvatar,
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

          {/* Block: Quản lý Ảnh đại diện trên CÂY PHẢ HỆ (Admin / Support) */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-800" />
                <span className="font-bold text-stone-900 text-sm">Ảnh đại diện trên Cây Phả Hệ</span>
              </div>
              <span className="text-[11px] font-medium text-amber-900 bg-amber-100/90 border border-amber-300/60 px-2 py-0.5 rounded-md">
                Hiện trên sơ đồ cây &amp; danh bạ
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Avatar Preview Box */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-amber-800/30 shadow-inner flex items-center justify-center relative">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Ảnh đại diện" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-stone-400 p-2 text-center">
                      <User className="w-8 h-8 text-stone-300 mb-0.5" />
                      <span className="text-[10px] text-stone-400">Chưa có ảnh</span>
                    </div>
                  )}

                  {isCompressingAvatar && (
                    <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex-1 w-full space-y-2.5">
                <div className="flex items-center flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAvatarInputMode('upload')}
                    className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors flex items-center gap-1.5 ${
                      avatarInputMode === 'upload'
                        ? 'bg-amber-800 text-white shadow-xs'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Tải ảnh từ máy
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarInputMode('url')}
                    className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors flex items-center gap-1.5 ${
                      avatarInputMode === 'url'
                        ? 'bg-amber-800 text-white shadow-xs'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Dán link ảnh (URL)
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="ml-auto px-2.5 py-1.5 rounded-lg text-xs text-rose-700 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 font-semibold transition-colors"
                      title="Gỡ ảnh khỏi thành viên này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa ảnh
                    </button>
                  )}
                </div>

                {avatarInputMode === 'upload' ? (
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-stone-300 rounded-xl hover:bg-stone-50 text-stone-800 font-medium text-xs shadow-xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-amber-700" />
                      <span>{avatarUrl ? 'Thay ảnh khác...' : 'Chọn tệp ảnh...'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileUpload}
                        disabled={isCompressingAvatar}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-stone-500 italic">
                      (Tự động nén &amp; tối ưu hiển thị nhanh)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="Dán đường dẫn ảnh: https://... hoặc data:image/..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-900 text-xs focus:outline-none focus:border-amber-600"
                    />
                  </div>
                )}
              </div>
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
              onChange={(e) => {
                const newFId = e.target.value || null;
                setParentId(newFId);
                if (!newFId) {
                  setMotherId(null);
                  setMotherName('');
                  return;
                }
                const fatherMem = allMembers.find(m => m.id === newFId);
                if (!fatherMem) return;
                const direct = fatherMem.spouseIds || [];
                const reverse = allMembers.filter(m => m.id !== fatherMem.id && m.spouseIds?.includes(fatherMem.id)).map(m => m.id);
                // Lọc bỏ các ID mồ côi không còn trong allMembers
                const fSpouseList = Array.from(new Set([...direct, ...reverse])).filter(id => allMembers.some(m => m.id === id));

                if (fSpouseList.length === 1) {
                  setMotherId(fSpouseList[0]);
                  const mMem = allMembers.find(m => m.id === fSpouseList[0]);
                  setMotherName(mMem?.fullName || '');
                } else if (fSpouseList.length >= 2) {
                  if (!motherId || !fSpouseList.includes(motherId)) {
                    setMotherId(fSpouseList[0]);
                    const mMem = allMembers.find(m => m.id === fSpouseList[0]);
                    setMotherName(mMem?.fullName || '');
                  }
                } else {
                  setMotherId(null);
                  setMotherName(fatherMem.spouse || '');
                }
              }}
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

          {/* If Father has >= 1 linked spouses: Mother Selection Dropdown */}
          {fatherSpouseIds.length >= 1 ? (
            <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-300 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-stone-900 font-bold flex items-center gap-1.5 text-xs">
                  <Heart className="w-4 h-4 text-rose-600 fill-rose-500/20" />
                  <span>
                    Chọn Thân mẫu ({fatherSpouseIds.length === 1 ? '1 phối ngẫu đã liên kết' : `${fatherSpouseIds.length} phối ngẫu đã liên kết`}):
                  </span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-950 border border-rose-300">
                  {fatherSpouseIds.length >= 2 ? 'Bắt buộc chọn' : 'Đã liên kết'}
                </span>
              </div>

              <select
                value={motherId || (fatherSpouseIds.length === 1 ? fatherSpouseIds[0] : '')}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    setMotherId(val);
                    const found = allMembers.find(m => m.id === val);
                    if (found) setMotherName(found.fullName);
                  } else {
                    setMotherId(null);
                    setMotherName('');
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-rose-300 text-stone-900 font-semibold focus:outline-none focus:border-rose-600 shadow-xs cursor-pointer"
              >
                {fatherSpouseIds.length >= 2 && (
                  <option value="">-- Vui lòng chọn Thân mẫu --</option>
                )}
                {fatherSpouseIds.map((sId, sIdx) => {
                  const sMem = allMembers.find(m => m.id === sId);
                  // Không bao giờ hiện raw UUID làm nhãn; nếu thiếu hồ sơ thì bỏ qua
                  if (!sMem) return null;
                  return (
                    <option key={sId} value={sId}>
                      {`${sMem.fullName} (${sIdx === 0 ? 'Chính thất' : `Phối ngẫu ${sIdx + 1}`}, Đời ${sMem.generation} - ${sMem.branch}${sMem.birthYear ? `, Sinh ${sMem.birthYear}` : ''})`}
                    </option>
                  );
                })}
              </select>

              {(motherId || fatherSpouseIds[0]) ? (
                <div className="text-[11px] text-rose-800 font-semibold flex items-center gap-1">
                  <span>Đã chọn Thân mẫu:</span>
                  <strong className="text-rose-950 underline underline-offset-2">
                    {allMembers.find(m => m.id === (motherId || fatherSpouseIds[0]))?.fullName || 
                      (motherName && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(motherName.trim()) ? motherName : '(Chưa rõ)')}
                  </strong>
                </div>
              ) : (
                <div className="text-[10.5px] text-stone-500 italic">
                  * Hãy chọn đúng người mẹ để cây gia phả nối nhánh con chính xác theo từng cặp cha - mẹ.
                </div>
              )}
            </div>
          ) : (
            /* If Father has 0 linked spouses: Manual text input */
            <div>
              <label className="block text-stone-700 font-bold mb-1">
                Thân mẫu (Mẹ đẻ - nhập chữ nếu chưa tạo hồ sơ trong hệ thống):
              </label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="Ví dụ: Bà Hoàng Thị Minh Châu"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-amber-600 font-medium"
              />
            </div>
          )}

          {/* Row 5: Relational Spouses Search & Select */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-stone-900 font-bold flex items-center gap-1.5 text-xs">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                <span>Phối ngẫu (Vợ / Chồng liên kết trong gia phả):</span>
                {selectedSpouseIds.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950 text-[10px] font-bold">
                    {selectedSpouseIds.length}
                  </span>
                )}
              </label>
            </div>

            {/* Display selected spouses */}
            {selectedSpouseIds.length === 0 ? (
              <div className="text-center py-2.5 text-stone-500 text-xs border border-dashed border-amber-300/80 rounded-xl bg-white/70">
                Chưa liên kết phối ngẫu. Hãy tìm và chọn thành viên từ ô tìm kiếm bên dưới.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedSpouseIds.map((spId, idx) => {
                  const spMem = allMembers.find(m => m.id === spId);
                  if (!spMem) return null;
                  return (
                    <div 
                      key={spId}
                      className="p-2.5 rounded-xl bg-white border border-amber-200 shadow-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${spMem.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                          {spMem.gender === 'male' ? '♂' : '♀'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-stone-900 text-xs truncate">{spMem.fullName}</span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              {idx === 0 ? 'Chính thất' : `Phối ngẫu ${idx + 1}`}
                            </span>
                          </div>
                          <div className="text-[10.5px] text-stone-500 truncate mt-0.5">
                            Đời {spMem.generation} • {spMem.branch} {spMem.birthYear ? `• Sinh ${spMem.birthYear}` : ''}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSpouseId(spId)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                        title="Hủy liên kết phối ngẫu này"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Autocomplete Search input */}
            <div className="relative">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={spouseSearchTerm}
                  onChange={(e) => {
                    setSpouseSearchTerm(e.target.value);
                    setIsSpouseDropdownOpen(true);
                  }}
                  onFocus={() => setIsSpouseDropdownOpen(true)}
                  placeholder="Tìm và liên kết vợ/chồng từ danh sách thành viên..."
                  className="w-full pl-8 pr-8 py-2 text-xs rounded-xl bg-white border border-amber-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-700 shadow-xs"
                />
                {spouseSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setSpouseSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Dropdown Menu */}
              {isSpouseDropdownOpen && (
                <div className="absolute z-20 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl bg-white border border-amber-400 shadow-xl p-1 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-stone-500 uppercase tracking-wider flex justify-between items-center border-b border-stone-100 bg-stone-50 rounded-t-lg">
                    <span>Gợi ý ({candidateSpouseMembers.length} thành viên)</span>
                    <button 
                      type="button" 
                      onClick={() => setIsSpouseDropdownOpen(false)}
                      className="text-stone-400 hover:text-stone-700 text-xs cursor-pointer font-bold"
                    >
                      Đóng ✕
                    </button>
                  </div>

                  {candidateSpouseMembers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-stone-500">
                      Không tìm thấy thành viên phù hợp
                    </div>
                  ) : (
                    candidateSpouseMembers.slice(0, 10).map(cand => (
                      <button
                        key={cand.id}
                        type="button"
                        onClick={() => handleAddSpouseId(cand.id)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-50 flex items-center justify-between gap-2 group transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${cand.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                            {cand.gender === 'male' ? '♂' : '♀'}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-stone-900 group-hover:text-amber-900 truncate">
                              {cand.fullName}
                            </div>
                            <div className="text-[10px] text-stone-500 truncate">
                              Đời {cand.generation} • {cand.branch} {cand.birthYear ? `• Sinh ${cand.birthYear}` : ''}
                            </div>
                          </div>
                        </div>

                        <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-100 group-hover:bg-amber-800 group-hover:text-white text-amber-900 text-[10px] font-bold transition-colors">
                          + Liên kết
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
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
