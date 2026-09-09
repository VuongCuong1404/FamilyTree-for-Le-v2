import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  allMembers?: ClanMember[];
  onClose: () => void;
  onSave: (member: ClanMember) => void;
}

export const AddEditMemberModal: React.FC<AddEditMemberModalProps> = ({
  isOpen,
  memberToEdit,
  parentToAssign,
  allMembers = [],
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

  // Tính toán số thế hệ tối đa động theo dữ liệu dòng họ (tối thiểu là 7 và mở rộng theo dữ liệu)
  const maxGen = useMemo(() => {
    const gens = allMembers.map(m => m.generation).filter((g): g is number => typeof g === 'number' && !isNaN(g));
    const parentNextGen = parentToAssign ? (parentToAssign.generation || 0) + 1 : 0;
    const memberGen = memberToEdit?.generation || 0;
    return Math.max(7, ...gens, parentNextGen, memberGen);
  }, [allMembers, parentToAssign, memberToEdit]);

  // Danh sách options đời từ 1 đến maxGen + 1 để cho phép thêm đời mới hơn hiện có
  const generationOptions = useMemo(() => {
    const list: number[] = [];
    for (let i = 1; i <= maxGen + 1; i++) {
      list.push(i);
    }
    return list;
  }, [maxGen]);

  // State cho bộ lọc & tìm kiếm Người nối nhánh trên cây (parentId)
  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const [parentBranchFilter, setParentBranchFilter] = useState('all');
  const [parentGenFilter, setParentGenFilter] = useState<'all' | number>('all');
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);
  const parentSearchContainerRef = useRef<HTMLDivElement>(null);

  // Đóng panel gợi ý người nối nhánh khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (parentSearchContainerRef.current && !parentSearchContainerRef.current.contains(e.target as Node)) {
        setIsParentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // State cho Thân mẫu / người còn lại (khi người nối nhánh chưa có spouse_ids)
  const [isMotherNotInSystem, setIsMotherNotInSystem] = useState(false);
  const [motherSearchTerm, setMotherSearchTerm] = useState('');
  const [isMotherDropdownOpen, setIsMotherDropdownOpen] = useState(false);

  // Người nối nhánh hiện tại (parentId)
  const currentParentId = parentId || (parentToAssign ? parentToAssign.id : null);
  const currentParent = useMemo(() => {
    return currentParentId ? allMembers.find(m => m.id === currentParentId) : null;
  }, [currentParentId, allMembers]);

  // Phối ngẫu đã liên kết của người nối nhánh (đã loại bỏ ID mồ côi)
  const parentSpouseIds = useMemo(() => {
    let ids: string[] = [];
    if (currentParent) {
      const direct = currentParent.spouseIds || [];
      const reverse = allMembers.filter(m => m.id !== currentParent.id && m.spouseIds?.includes(currentParent.id)).map(m => m.id);
      ids = Array.from(new Set([...direct, ...reverse]));
    }
    // Chỉ giữ ID tồn tại trong allMembers, loại bỏ hoàn toàn các ID mồ côi đã bị xóa
    return ids.filter(id => allMembers.some(m => m.id === id));
  }, [currentParent, allMembers]);

  // Tự động gán phối ngẫu đầu tiên nếu người nối nhánh có phối ngẫu và chưa chọn
  useEffect(() => {
    if (parentSpouseIds.length >= 1) {
      if (!motherId || !parentSpouseIds.includes(motherId)) {
        setMotherId(parentSpouseIds[0]);
        const mMem = allMembers.find(m => m.id === parentSpouseIds[0]);
        if (mMem) setMotherName(mMem.fullName);
      }
    }
  }, [parentSpouseIds, motherId, allMembers]);

  // Danh sách ứng viên người nối nhánh (Cả Nam và Nữ, trừ chính người đang sửa)
  const candidateParents = useMemo(() => {
    const curId = memberToEdit?.id;
    return allMembers.filter(m => {
      if (curId && m.id === curId) return false;
      if (parentBranchFilter !== 'all' && m.branch !== parentBranchFilter) return false;
      if (parentGenFilter !== 'all' && m.generation !== Number(parentGenFilter)) return false;
      if (parentSearchTerm.trim()) {
        const q = parentSearchTerm.trim().toLowerCase();
        const matchName = m.fullName.toLowerCase().includes(q);
        const matchBranch = (m.branch || '').toLowerCase().includes(q);
        const matchGen = String(m.generation).includes(q);
        const matchYear = m.birthYear ? String(m.birthYear).includes(q) : false;
        if (!matchName && !matchBranch && !matchGen && !matchYear) return false;
      }
      return true;
    });
  }, [allMembers, memberToEdit, parentBranchFilter, parentGenFilter, parentSearchTerm]);

  const sortedCandidateParents = useMemo(() => {
    return [...candidateParents].sort((a, b) => {
      if (a.generation !== b.generation) return a.generation - b.generation;
      return a.fullName.localeCompare(b.fullName, 'vi');
    });
  }, [candidateParents]);

  const selectedParentMem = useMemo(() => {
    return parentId ? allMembers.find(m => m.id === parentId) : null;
  }, [parentId, allMembers]);

  // Danh sách ứng viên Thân mẫu / người còn lại (khi người nối nhánh không có spouse_ids)
  const candidateMotherMembers = useMemo(() => {
    const curId = memberToEdit?.id;
    const q = motherSearchTerm.trim().toLowerCase();

    return allMembers.filter(m => {
      if (curId && m.id === curId) return false;
      if (parentId && m.id === parentId) return false;
      if (motherId && m.id === motherId) return false;

      if (!q) return true;

      return (
        m.fullName.toLowerCase().includes(q) ||
        (m.branch && m.branch.toLowerCase().includes(q)) ||
        String(m.generation).includes(q) ||
        (m.birthYear && String(m.birthYear).includes(q))
      );
    });
  }, [allMembers, memberToEdit, parentId, motherId, motherSearchTerm]);

  const selectedMotherMem = useMemo(() => {
    return motherId ? allMembers.find(m => m.id === motherId) : null;
  }, [motherId, allMembers]);

  // Hàm chọn người nối nhánh trên cây
  const handleSelectParent = (newPId: string | null) => {
    setParentId(newPId);
    if (!newPId) {
      setMotherId(null);
      setMotherName('');
      setIsMotherNotInSystem(false);
      return;
    }
    const parentMem = allMembers.find(m => m.id === newPId);
    if (!parentMem) return;

    const direct = parentMem.spouseIds || [];
    const reverse = allMembers.filter(m => m.id !== parentMem.id && m.spouseIds?.includes(parentMem.id)).map(m => m.id);
    const pSpouseList = Array.from(new Set([...direct, ...reverse])).filter(id => allMembers.some(m => m.id === id));

    if (pSpouseList.length >= 1) {
      setMotherId(pSpouseList[0]);
      const mMem = allMembers.find(m => m.id === pSpouseList[0]);
      setMotherName(mMem?.fullName || '');
      setIsMotherNotInSystem(false);
    } else {
      setMotherId(null);
      setMotherName(parentMem.spouse || '');
      setIsMotherNotInSystem(Boolean(parentMem.spouse && parentMem.spouse.trim()));
    }

    // Gợi ý đời và nhánh nếu đang thêm mới
    if (!memberToEdit) {
      setGeneration(parentMem.generation + 1);
      if (parentMem.gender === 'female') {
        setBranch('Chi Ngoại');
      } else if (parentMem.branch) {
        setBranch(parentMem.branch);
      }
    }
  };

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
      setIsMotherNotInSystem(!memberToEdit.motherId && Boolean(memberToEdit.motherName && memberToEdit.motherName.trim()));
      
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
      // D) Khi parentToAssign là nữ: prefill parentId = mẹ, generation +1, gợi ý branch Chi Ngoại nếu đúng quy ước app
      setBranch(parentToAssign.gender === 'female' ? 'Chi Ngoại' : (parentToAssign.branch || 'Chi Trưởng'));
      setOrderInFamily(String(existingChildren.length + 1));
      setTitle('');
      setBirthYear(new Date().getFullYear().toString());
      setDeathYear('');
      setIsAlive(true);
      setLunarDeathDate('');
      setParentId(parentToAssign.id);

      // Tự động gán mẹ / phối ngẫu nếu có
      const pSpouseIds = (parentToAssign.spouseIds || []).filter(id => allMembers.some(m => m.id === id));
      if (pSpouseIds.length > 0) {
        const firstMId = pSpouseIds[0];
        setMotherId(firstMId);
        const motherMem = allMembers.find(m => m.id === firstMId);
        setMotherName(motherMem?.fullName || parentToAssign.spouse || '');
        setIsMotherNotInSystem(false);
      } else {
        setMotherId(null);
        setMotherName(parentToAssign.spouse || (parentToAssign.spouseList?.[0]?.name) || '');
        setIsMotherNotInSystem(Boolean(parentToAssign.spouse || parentToAssign.spouseList?.[0]?.name));
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
      setIsMotherNotInSystem(false);
      setSelectedSpouseIds([]);
      setPhone('');
      setAddress('');
      setOccupation('');
      setBio('');
      setRestingPlace('');
      setAchievements('');
      setAvatarUrl('');
    }
    setParentSearchTerm('');
    setParentBranchFilter('all');
    setParentGenFilter('all');
    setIsParentDropdownOpen(false);
    setMotherSearchTerm('');
    setIsMotherDropdownOpen(false);
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
                {generationOptions.map((g) => (
                  <option key={g} value={g}>
                    Đời {g} {g === 1 ? '(Thủy Tổ)' : ''}
                  </option>
                ))}
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

          {/* Row 3: Parent Selection (Người nối nhánh trên cây parentId) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/80 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="block text-stone-900 font-bold text-xs sm:text-sm">
                Người nối nhánh trên cây (parentId):
              </label>
              <span className="text-[10.5px] text-amber-800 font-semibold bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/60">
                Nam và Nữ dòng họ
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-normal">
              * Con sẽ hiện dưới người này trên cây phả hệ; có thể là bố họ Lê hoặc mẹ Chi Ngoại.
            </p>

            {/* Compact search and filters for parent */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
              <div ref={parentSearchContainerRef} className="relative sm:col-span-1">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={parentSearchTerm}
                  onChange={(e) => {
                    setParentSearchTerm(e.target.value);
                    setIsParentDropdownOpen(true);
                  }}
                  onFocus={() => setIsParentDropdownOpen(true)}
                  placeholder="Tìm tên người nối nhánh..."
                  className="w-full pl-7 pr-6 py-1.5 text-xs rounded-lg bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-600 shadow-2xs font-medium"
                />
                {parentSearchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setParentSearchTerm('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}

                {/* Panel gợi ý ngay dưới ô tìm */}
                {isParentDropdownOpen && (
                  <div className="absolute z-30 left-0 w-full sm:w-[360px] md:w-[400px] mt-1 max-h-48 overflow-y-auto rounded-xl bg-white border border-amber-300 shadow-xl p-1 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold text-stone-500 uppercase tracking-wider flex justify-between items-center border-b border-stone-100 bg-stone-50 rounded-t-lg sticky top-0 z-10">
                      <span>Gợi ý ({sortedCandidateParents.length} người)</span>
                      <button 
                        type="button" 
                        onClick={() => setIsParentDropdownOpen(false)}
                        className="text-stone-400 hover:text-stone-700 text-xs cursor-pointer font-bold px-1"
                      >
                        Đóng ✕
                      </button>
                    </div>

                    {sortedCandidateParents.length === 0 ? (
                      <div className="p-3 text-center text-xs text-stone-500">
                        Không tìm thấy thành viên phù hợp
                      </div>
                    ) : (
                      sortedCandidateParents.slice(0, 20).map(cand => (
                        <button
                          key={cand.id}
                          type="button"
                          onClick={() => {
                            handleSelectParent(cand.id);
                            setIsParentDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-50 flex items-center justify-between gap-2 group transition-colors cursor-pointer ${
                            parentId === cand.id ? 'bg-amber-100/70 font-semibold' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${cand.gender === 'male' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'}`}>
                              {cand.gender === 'male' ? '♂' : '♀'}
                            </span>
                            <span className="font-semibold text-stone-900 text-xs truncate group-hover:text-amber-900">
                              {cand.fullName}
                            </span>
                            <span className="text-[11px] text-stone-500 truncate">
                              · Đời {cand.generation} · {cand.branch} · {cand.gender === 'male' ? 'Nam' : 'Nữ'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {parentId === cand.id ? 'Đang chọn' : 'Chọn'}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <select
                  value={parentBranchFilter}
                  onChange={(e) => setParentBranchFilter(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg bg-white border border-stone-300 text-stone-800 focus:outline-none focus:border-amber-600 shadow-2xs font-medium cursor-pointer"
                >
                  <option value="all">Tất cả Chi phái</option>
                  <option value="Chi Trưởng">Chi Trưởng</option>
                  <option value="Chi Hai">Chi Hai</option>
                  <option value="Chi Ba">Chi Ba</option>
                  <option value="Chi Bốn">Chi Bốn</option>
                  <option value="Chi Ngoại">Chi Ngoại</option>
                </select>
              </div>

              <div>
                <select
                  value={parentGenFilter}
                  onChange={(e) => setParentGenFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs rounded-lg bg-white border border-stone-300 text-stone-800 focus:outline-none focus:border-amber-600 shadow-2xs font-medium cursor-pointer"
                >
                  <option value="all">Tất cả thế hệ (Đời)</option>
                  {generationOptions.map(g => (
                    <option key={g} value={g}>Đời {g} {g === 1 ? '(Thủy Tổ)' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Select Dropdown */}
            <select
              value={parentId || ''}
              onChange={(e) => handleSelectParent(e.target.value || null)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none focus:border-amber-600 font-semibold shadow-2xs cursor-pointer"
            >
              <option value="">-- Không có / Thủy Tổ khởi nghiệp --</option>
              {selectedParentMem && !sortedCandidateParents.some(m => m.id === selectedParentMem.id) && (
                <option key={selectedParentMem.id} value={selectedParentMem.id}>
                  {selectedParentMem.fullName} · Đời {selectedParentMem.generation} · {selectedParentMem.branch} · {selectedParentMem.gender === 'male' ? 'Nam ♂' : 'Nữ ♀'}
                </option>
              )}
              {sortedCandidateParents.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} · Đời {m.generation} · {m.branch} · {m.gender === 'male' ? 'Nam ♂' : 'Nữ ♀'}
                </option>
              ))}
            </select>

            {/* Selection info & Quick Reset */}
            {selectedParentMem ? (
              <div className="p-2 rounded-xl bg-white border border-amber-300/80 shadow-2xs flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 font-bold text-[11px] ${selectedParentMem.gender === 'male' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'}`}>
                    {selectedParentMem.gender === 'male' ? '♂' : '♀'}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-stone-900 truncate block">
                      Đang nối nhánh dưới: {selectedParentMem.fullName}
                    </span>
                    <span className="text-[10.5px] text-stone-500 truncate block">
                      Đời {selectedParentMem.generation} · {selectedParentMem.branch} · {selectedParentMem.gender === 'male' ? 'Nam (Bố họ Lê)' : 'Nữ (Mẹ Chi Ngoại)'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectParent(null)}
                  className="px-2 py-1 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-50 text-[11px] font-semibold transition-colors shrink-0 cursor-pointer"
                  title="Bỏ chọn người nối nhánh (trở thành Thủy Tổ)"
                >
                  ✕ Bỏ chọn
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-stone-500 italic">
                * Chưa chọn người nối nhánh: Thành viên này sẽ là Thủy Tổ khởi lập nhánh độc lập trên cây.
              </div>
            )}
          </div>

          {/* Row 4: Thân mẫu / Người phối ngẫu còn lại */}
          {parentSpouseIds.length >= 1 ? (
            <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-300 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-stone-900 font-bold flex items-center gap-1.5 text-xs">
                  <Heart className="w-4 h-4 text-rose-600 fill-rose-500/20" />
                  <span>
                    {currentParent?.gender === 'female' ? 'Chọn Phối ngẫu / Thân phụ' : 'Chọn Thân mẫu'} ({parentSpouseIds.length === 1 ? '1 phối ngẫu đã liên kết' : `${parentSpouseIds.length} phối ngẫu đã liên kết`}):
                  </span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-950 border border-rose-300">
                  {parentSpouseIds.length >= 2 ? 'Bắt buộc chọn' : 'Đã liên kết'}
                </span>
              </div>

              <select
                value={motherId || (parentSpouseIds.length === 1 ? parentSpouseIds[0] : '')}
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
                {parentSpouseIds.length >= 2 && (
                  <option value="">-- Vui lòng chọn phối ngẫu / thân mẫu --</option>
                )}
                {parentSpouseIds.map((sId, sIdx) => {
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

              {(motherId || parentSpouseIds[0]) ? (
                <div className="text-[11px] text-rose-800 font-semibold flex items-center gap-1">
                  <span>Đã chọn:</span>
                  <strong className="text-rose-950 underline underline-offset-2">
                    {allMembers.find(m => m.id === (motherId || parentSpouseIds[0]))?.fullName || 
                      (motherName && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(motherName.trim()) ? motherName : '(Chưa rõ)')}
                  </strong>
                </div>
              ) : (
                <div className="text-[10.5px] text-stone-500 italic">
                  * Hãy chọn đúng người để cây gia phả nối nhánh con chính xác theo từng cặp bố - mẹ.
                </div>
              )}
            </div>
          ) : (
            /* If parent has 0 linked spouses: Prioritize searchable member from system, or manual text if ticked */
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/90 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-stone-900 font-bold flex items-center gap-1.5 text-xs">
                  <Heart className="w-4 h-4 text-rose-600 fill-rose-500/20" />
                  <span>
                    {currentParent?.gender === 'female' ? 'Thân phụ / Người phối ngẫu còn lại:' : 'Thân mẫu / Người phối ngẫu còn lại:'}
                  </span>
                </label>

                <label className="flex items-center gap-1.5 text-[11px] text-stone-700 cursor-pointer select-none bg-white/80 px-2 py-0.5 rounded-md border border-rose-200">
                  <input
                    type="checkbox"
                    checked={isMotherNotInSystem}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsMotherNotInSystem(checked);
                      if (checked) {
                        setMotherId(null);
                        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(motherName.trim())) {
                          setMotherName('');
                        }
                      } else {
                        setMotherId(null);
                        setMotherName('');
                      }
                    }}
                    className="rounded text-amber-700 focus:ring-amber-600 border-stone-300 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="font-semibold text-rose-900">Chưa có hồ sơ trong hệ thống</span>
                </label>
              </div>

              {isMotherNotInSystem ? (
                <div>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder={currentParent?.gender === 'female' ? "Ví dụ: Ông Nguyễn Văn B (chồng bà Lê Thị C)..." : "Ví dụ: Bà Hoàng Thị Minh Châu..."}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-rose-300 text-stone-900 focus:outline-none focus:border-rose-600 font-semibold shadow-2xs"
                  />
                  <p className="text-[10.5px] text-stone-500 italic mt-1">
                    * Nhập họ tên dạng chữ đối với thân mẫu / phối ngẫu chưa tạo hồ sơ trong cây phả hệ.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedMotherMem ? (
                    <div className="p-2.5 rounded-xl bg-white border border-rose-300 shadow-2xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${selectedMotherMem.gender === 'male' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'}`}>
                          {selectedMotherMem.gender === 'male' ? '♂' : '♀'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-stone-900 text-xs truncate block">{selectedMotherMem.fullName}</span>
                          <span className="text-[10.5px] text-stone-500 truncate block">
                            Đời {selectedMotherMem.generation} · {selectedMotherMem.branch} {selectedMotherMem.birthYear ? `· Sinh ${selectedMotherMem.birthYear}` : ''}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMotherId(null);
                          setMotherName('');
                        }}
                        className="px-2 py-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold cursor-pointer shrink-0"
                        title="Đổi hoặc bỏ chọn"
                      >
                        ✕ Bỏ chọn
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={motherSearchTerm}
                          onChange={(e) => {
                            setMotherSearchTerm(e.target.value);
                            setIsMotherDropdownOpen(true);
                          }}
                          onFocus={() => setIsMotherDropdownOpen(true)}
                          placeholder="Tìm và chọn thành viên trong hệ thống làm thân mẫu / người còn lại..."
                          className="w-full pl-8 pr-8 py-2 text-xs rounded-xl bg-white border border-rose-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-rose-600 shadow-2xs font-medium"
                        />
                        {motherSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setMotherSearchTerm('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {isMotherDropdownOpen && (
                        <div className="absolute z-20 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl bg-white border border-rose-300 shadow-xl p-1 space-y-1">
                          <div className="px-2 py-1 text-[10px] font-bold text-stone-500 uppercase tracking-wider flex justify-between items-center border-b border-stone-100 bg-stone-50 rounded-t-lg">
                            <span>Gợi ý ({candidateMotherMembers.length} thành viên)</span>
                            <button 
                              type="button" 
                              onClick={() => setIsMotherDropdownOpen(false)}
                              className="text-stone-400 hover:text-stone-700 text-xs cursor-pointer font-bold"
                            >
                              Đóng ✕
                            </button>
                          </div>

                          {candidateMotherMembers.length === 0 ? (
                            <div className="p-3 text-center text-xs text-stone-500">
                              Không tìm thấy thành viên phù hợp
                            </div>
                          ) : (
                            candidateMotherMembers.slice(0, 10).map(cand => (
                              <button
                                key={cand.id}
                                type="button"
                                onClick={() => {
                                  setMotherId(cand.id);
                                  setMotherName(cand.fullName);
                                  setMotherSearchTerm('');
                                  setIsMotherDropdownOpen(false);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 flex items-center justify-between gap-2 group transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${cand.gender === 'male' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'}`}>
                                    {cand.gender === 'male' ? '♂' : '♀'}
                                  </span>
                                  <span className="font-semibold text-stone-900 text-xs truncate group-hover:text-rose-900">
                                    {cand.fullName}
                                  </span>
                                  <span className="text-[11px] text-stone-500">
                                    (Đời {cand.generation} · {cand.branch})
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  Chọn
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
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

          {/* Row 6: Contact & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isAlive && (
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
            )}
            <div className={!isAlive ? "sm:col-span-2" : ""}>
              <label className="block text-stone-700 font-bold mb-1">
                {isAlive ? "Nơi ở / Cư trú hiện tại:" : "Nguyên quán / Quê quán (địa chỉ ghi trên danh bạ):"}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={isAlive ? "Ví dụ: Cầu Giấy, Hà Nội" : "Ví dụ: Làng Thượng, Quỳnh Đôi, Quỳnh Lưu, Nghệ An"}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none"
              />
            </div>
          </div>

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
