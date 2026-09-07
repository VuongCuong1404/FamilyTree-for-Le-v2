import React, { useState, useEffect } from 'react';
import { 
  ClanInfo, 
  ClanMember, 
  MemorialEvent, 
  Role,
  UserProfile
} from './types';
import { 
  INITIAL_CLAN_INFO, 
  INITIAL_MEMBERS, 
  INITIAL_MEMORIAL_EVENTS 
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { HomeOverview } from './components/HomeOverview';
import { FamilyTreeViewer } from './components/FamilyTreeViewer';
import { DirectorySearch } from './components/DirectorySearch';
import { MemorialCalendar } from './components/MemorialCalendar';
import { MemberDetailModal } from './components/MemberDetailModal';
import { ZaloConnectModal } from './components/ZaloConnectModal';
import { AddEditMemberModal } from './components/AddEditMemberModal';
import { ClanSettingsModal } from './components/ClanSettingsModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminRoleManager } from './components/AdminRoleManager';
import { 
  fetchMembersService, 
  saveMemberService, 
  deleteMemberService, 
  fetchEventsService, 
  saveEventService,
  deleteEventService,
  fetchClanInfoService,
  updateClanInfoService,
  getCurrentUserProfile,
  signOutUser
} from './services/supabaseService';
import { testSupabaseConnection, getSupabaseClient } from './lib/supabase';

export default function App() {
  // Navigation tab state ('home' | 'tree' | 'directory' | 'memorial' | 'admin')
  const [activeTab, setActiveTab] = useState<string>('home');

  // User Profile State (Role is derived directly from profile, default 'member')
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const currentUserRole: Role = currentUserProfile?.role ?? 'member';

  // Clan Data states
  const [clanInfo, setClanInfo] = useState<ClanInfo>(INITIAL_CLAN_INFO);

  const [members, setMembers] = useState<ClanMember[]>([]);
  const [memorialEvents, setMemorialEvents] = useState<MemorialEvent[]>(INITIAL_MEMORIAL_EVENTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  // Modals state
  const [selectedMember, setSelectedMember] = useState<ClanMember | null>(null);
  const [isZaloOpen, setIsZaloOpen] = useState(false);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<ClanMember | null>(null);
  const [parentToAssign, setParentToAssign] = useState<ClanMember | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load Initial Data from Supabase / Local Storage & Check Session
  const loadData = async () => {
    try {
      setIsLoading(true);
      const conn = await testSupabaseConnection();
      setIsSupabaseConnected(conn.success);

      // Check current auth profile
      const profile = await getCurrentUserProfile();
      if (profile) {
        setCurrentUserProfile(profile);
      }

      const [membersRes, eventsRes, clanInfoRes] = await Promise.all([
        fetchMembersService(),
        fetchEventsService(),
        fetchClanInfoService(),
      ]);

      if (membersRes.members) {
        setMembers(membersRes.members);
      }
      if (eventsRes.events && eventsRes.events.length > 0) {
        setMemorialEvents(eventsRes.events);
      }
      if (clanInfoRes.clanInfo) {
        setClanInfo(clanInfoRes.clanInfo);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to Supabase Auth State changes
    const client = getSupabaseClient();
    if (client) {
      const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const profile = await getCurrentUserProfile();
          if (profile) {
            setCurrentUserProfile(profile);
          }
        } else {
          setCurrentUserProfile(null);
        }
      });

      return () => {
        authListener?.subscription.unsubscribe();
      };
    }
  }, []);

  // Synchronize browser tab title dynamically with clanInfo.name
  useEffect(() => {
    if (clanInfo?.name && clanInfo.name.trim()) {
      document.title = clanInfo.name.trim();
    } else if (clanInfo?.clanSurname && clanInfo.clanSurname.trim()) {
      document.title = `Gia Phả Dòng Họ ${clanInfo.clanSurname.trim()}`;
    } else {
      document.title = 'Gia Phả Dòng Họ Lê';
    }
  }, [clanInfo?.name, clanInfo?.clanSurname]);

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUserProfile(null);
    showToast('Đã đăng xuất tài khoản.');
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    setCurrentUserProfile(profile);
    showToast(`Xin chào, ${profile.full_name || profile.email}! Vai trò: ${profile.role.toUpperCase()}`);
    loadData();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handler to add or edit member
  const handleSaveMember = async (member: ClanMember) => {
    const res = await saveMemberService(member, currentUserRole, members);
    if (!res.success) {
      alert(res.error || 'Lỗi lưu dữ liệu lên Supabase. Vui lòng kiểm tra quyền hạn.');
      return;
    }

    const savedMember = res.member;
    const updatedSpouses = res.updatedSpouses || [];

    setMembers(prev => {
      let list = [...prev];
      const existsIndex = list.findIndex(m => m.id === savedMember.id || m.id === member.id);
      if (existsIndex >= 0) {
        list[existsIndex] = savedMember;
        showToast(`Đã cập nhật thông tin thành viên "${savedMember.fullName}" thành công!`);
      } else {
        list.push(savedMember);
        showToast(`Đã thêm thành viên "${savedMember.fullName}" vào gia phả!`);
      }

      // Symmetrically update spouses in state
      updatedSpouses.forEach(sp => {
        const spIdx = list.findIndex(m => m.id === sp.id);
        if (spIdx >= 0) {
          list[spIdx] = sp;
        }
      });

      return list;
    });

    if (selectedMember && (selectedMember.id === member.id || selectedMember.id === savedMember.id)) {
      setSelectedMember(savedMember);
    }
    setIsAddEditOpen(false);
  };

  // Handler to link spouse symmetrically (existing or newly created member)
  const handleAddSpouseLink = async (targetMember: ClanMember, spouseMember: ClanMember, isNew: boolean = false) => {
    if (currentUserRole === 'member') {
      alert('Tài khoản Thành viên (Member) chỉ có quyền xem. Vui lòng đăng nhập với tài khoản Quản Trị Viên (Admin) hoặc Ban Hỗ Trợ (Support) để thực hiện.');
      return;
    }

    const targetSpouseIds = Array.from(new Set([...(targetMember.spouseIds || []), spouseMember.id]));
    const updatedTarget: ClanMember = {
      ...targetMember,
      spouseIds: targetSpouseIds,
      spouse: targetMember.spouse ? `${targetMember.spouse}, ${spouseMember.fullName}` : spouseMember.fullName,
    };

    const spouseSpouseIds = Array.from(new Set([...(spouseMember.spouseIds || []), targetMember.id]));
    const updatedSpouse: ClanMember = {
      ...spouseMember,
      spouseIds: spouseSpouseIds,
      spouse: spouseMember.spouse || targetMember.fullName,
    };

    let savedNewSpouse: ClanMember | null = null;
    if (isNew) {
      const resNew = await saveMemberService(updatedSpouse, currentUserRole, members);
      if (!resNew.success) {
        alert(resNew.error || 'Lỗi khi tạo hồ sơ phối ngẫu mới.');
        return;
      }
      savedNewSpouse = resNew.member;
    }

    const memberPoolForTarget = isNew && savedNewSpouse ? [...members, savedNewSpouse] : members;
    const resTarget = await saveMemberService(updatedTarget, currentUserRole, memberPoolForTarget);
    if (!resTarget.success) {
      alert(resTarget.error || 'Lỗi khi liên kết phối ngẫu.');
      return;
    }

    const savedTarget = resTarget.member;
    const additionalSpouses = resTarget.updatedSpouses || [];

    setMembers(prev => {
      let list = [...prev];
      if (isNew && savedNewSpouse) {
        const idx = list.findIndex(m => m.id === savedNewSpouse!.id);
        if (idx >= 0) list[idx] = savedNewSpouse;
        else list.push(savedNewSpouse);
      } else {
        const sIdx = list.findIndex(m => m.id === updatedSpouse.id);
        if (sIdx >= 0) list[sIdx] = updatedSpouse;
      }

      const tIdx = list.findIndex(m => m.id === savedTarget.id);
      if (tIdx >= 0) {
        list[tIdx] = savedTarget;
      } else {
        list.push(savedTarget);
      }

      additionalSpouses.forEach(sp => {
        const idx = list.findIndex(m => m.id === sp.id);
        if (idx >= 0) list[idx] = sp;
      });

      return list;
    });

    setSelectedMember(savedTarget);
    showToast(`Đã liên kết phối ngẫu "${spouseMember.fullName}" cho "${targetMember.fullName}" thành công!`);
  };

  // Handler to delete member
  const handleDeleteMember = async (memberId: string) => {
    const memberObj = members.find(m => m.id === memberId);
    const res = await deleteMemberService(memberId, currentUserRole);
    if (!res.success) {
      alert(res.error || 'Không thể xóa thành viên.');
      return;
    }

    setMembers(prev => prev.filter(m => m.id !== memberId));
    setSelectedMember(null);
    showToast(`Đã xóa thành viên "${memberObj?.fullName || 'thành viên'}" khỏi gia phả!`);
  };

  // Open add child modal
  const handleOpenAddChild = (parentMember: ClanMember) => {
    if (currentUserRole === 'member') {
      alert('Tài khoản Thành viên (Member) chỉ có quyền xem. Vui lòng đăng nhập với tài khoản Quản Trị Viên (Admin) hoặc Ban Hỗ Trợ (Support) để thêm con cháu.');
      return;
    }
    setMemberToEdit(null);
    setParentToAssign(parentMember);
    setIsAddEditOpen(true);
  };

  // Open edit member modal
  const handleOpenEditMember = (member: ClanMember) => {
    if (currentUserRole === 'member') {
      alert('Tài khoản Thành viên (Member) chỉ có quyền xem. Vui lòng đăng nhập với tài khoản Quản Trị Viên (Admin) hoặc Ban Hỗ Trợ (Support) để chỉnh sửa.');
      return;
    }
    setMemberToEdit(member);
    setParentToAssign(null);
    setIsAddEditOpen(true);
  };

  // Open add member modal (top level)
  const handleOpenAddTopMember = () => {
    if (currentUserRole === 'member') {
      alert('Tài khoản Thành viên (Member) chỉ có quyền xem. Vui lòng đăng nhập với tài khoản Quản Trị Viên (Admin) hoặc Ban Hỗ Trợ (Support) để thêm thành viên.');
      return;
    }
    setMemberToEdit(null);
    setParentToAssign(null);
    setIsAddEditOpen(true);
  };

  // Handler to update clan info in Supabase
  const handleSaveClanInfo = async (newInfo: ClanInfo) => {
    if (currentUserRole !== 'admin') {
      alert('Chỉ Quản Trị Viên (Admin) mới có quyền lưu và cập nhật thông tin dòng họ lên Supabase.');
      return;
    }

    const res = await updateClanInfoService(newInfo, currentUserRole);
    if (!res.success) {
      alert(res.error || 'Lỗi cập nhật thông tin dòng họ.');
      return;
    }

    setClanInfo(res.clanInfo);
    setIsSettingsOpen(false);
    showToast('Đã lưu và đồng bộ thông tin dòng họ lên Supabase thành công!');
  };

  // Handler to save / update a memorial event
  const handleSaveMemorialEvent = async (event: MemorialEvent) => {
    const res = await saveEventService(event, currentUserRole);
    if (!res.success) {
      alert(res.error || 'Lỗi lưu ngày giỗ lên Supabase. Vui lòng kiểm tra quyền hạn.');
      return;
    }

    const savedEvent = res.event;

    setMemorialEvents(prev => {
      const idx = prev.findIndex(e => e.id === savedEvent.id || e.id === event.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedEvent;
        showToast(`Đã cập nhật ngày giỗ "${savedEvent.title}" thành công!`);
        return updated;
      } else {
        showToast(`Đã thêm ngày giỗ "${savedEvent.title}" vào lịch tộc!`);
        return [...prev, savedEvent];
      }
    });
  };

  // Handler to delete a memorial event
  const handleDeleteMemorialEvent = async (eventId: string) => {
    const res = await deleteEventService(eventId, currentUserRole);
    if (!res.success) {
      alert(res.error || 'Lỗi xóa ngày giỗ khỏi Supabase. Vui lòng kiểm tra quyền Quản Trị Viên (Admin).');
      return;
    }

    setMemorialEvents(prev => prev.filter(e => e.id !== eventId));
    showToast('Đã xóa ngày giỗ khỏi lịch tộc thành công!');
  };

  // Reset data to defaults
  const handleResetData = () => {
    if (currentUserRole !== 'admin') {
      alert('Chỉ Quản Trị Viên (Admin) mới có quyền khôi phục dữ liệu gốc.');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn khôi phục dữ liệu gốc của dòng họ ${clanInfo.clanSurname} Tộc?`)) {
      setClanInfo(INITIAL_CLAN_INFO);
      setMembers(INITIAL_MEMBERS);
      setMemorialEvents(INITIAL_MEMORIAL_EVENTS);
      localStorage.removeItem('clan_info_data');
      localStorage.removeItem('clan_members_data');
      localStorage.removeItem('clan_memorial_data');
      showToast("Đã khôi phục dữ liệu gốc thành công!");
      setIsSettingsOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans antialiased text-stone-900">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-amber-200 px-5 py-3 rounded-2xl shadow-2xl border border-amber-600/60 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        clanInfo={clanInfo}
        currentUserRole={currentUserRole}
        currentUserProfile={currentUserProfile}
        onOpenZalo={() => setIsZaloOpen(true)}
        onOpenAddMember={handleOpenAddTopMember}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onSignOut={handleSignOut}
        isSupabaseConnected={isSupabaseConnected}
      />

      {/* Main Tab Views */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomeOverview
            clanInfo={clanInfo}
            members={members}
            memorialEvents={memorialEvents}
            currentUserRole={currentUserRole}
            onNavigate={(tabId) => {
              setActiveTab(tabId);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenZalo={() => setIsZaloOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isSupabaseConnected={isSupabaseConnected}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'tree' && (
          <FamilyTreeViewer
            members={members}
            clanInfo={clanInfo}
            onSelectMember={(m) => setSelectedMember(m)}
            onAddChild={(parent) => handleOpenAddChild(parent)}
            currentUserProfile={currentUserProfile}
            currentUserRole={currentUserRole}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activeTab === 'directory' && (
          <DirectorySearch
            members={members}
            clanInfo={clanInfo}
            onSelectMember={(m) => setSelectedMember(m)}
            onOpenZalo={() => setIsZaloOpen(true)}
            currentUserProfile={currentUserProfile}
            currentUserRole={currentUserRole}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activeTab === 'memorial' && (
          <MemorialCalendar
            memorialEvents={memorialEvents}
            clanInfo={clanInfo}
            members={members}
            currentUserRole={currentUserRole}
            onSelectMember={(m) => setSelectedMember(m)}
            onSaveEvent={handleSaveMemorialEvent}
            onDeleteEvent={handleDeleteMemorialEvent}
          />
        )}

        {activeTab === 'admin' && currentUserRole === 'admin' && (
          <AdminRoleManager
            currentUserRole={currentUserRole}
            clanInfo={clanInfo}
            currentUserProfile={currentUserProfile}
            members={members}
            onOpenAuth={() => setIsAuthOpen(true)}
            onRoleUpdated={loadData}
            onMemberLinked={loadData}
          />
        )}
      </main>

      {/* MODAL 1: Member Detail Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          allMembers={members}
          clanInfo={clanInfo}
          currentUserRole={currentUserRole}
          onClose={() => setSelectedMember(null)}
          onSelectMember={(m) => setSelectedMember(m)}
          onAddChild={(parent) => {
            setSelectedMember(null);
            handleOpenAddChild(parent);
          }}
          onEditMember={(m) => {
            setSelectedMember(null);
            handleOpenEditMember(m);
          }}
          onDeleteMember={handleDeleteMember}
          onAddSpouseLink={handleAddSpouseLink}
        />
      )}

      {/* MODAL 2: Zalo Connect Modal */}
      {isZaloOpen && (
        <ZaloConnectModal
          clanInfo={clanInfo}
          onClose={() => setIsZaloOpen(false)}
        />
      )}

      {/* MODAL 3: Add / Edit Member Modal */}
      {isAddEditOpen && (
        <AddEditMemberModal
          isOpen={isAddEditOpen}
          memberToEdit={memberToEdit}
          parentToAssign={parentToAssign}
          allMembers={members}
          onClose={() => {
            setIsAddEditOpen(false);
            setMemberToEdit(null);
            setParentToAssign(null);
          }}
          onSave={handleSaveMember}
        />
      )}

      {/* MODAL 4: Clan Settings Modal */}
      {isSettingsOpen && (
        <ClanSettingsModal
          clanInfo={clanInfo}
          currentUserRole={currentUserRole}
          onClose={() => setIsSettingsOpen(false)}
          onSaveClanInfo={handleSaveClanInfo}
          onResetData={handleResetData}
        />
      )}

      {/* MODAL 5: Supabase Auth & OTP Login Modal */}
      {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* MODAL 6: User Profile Modal (Hồ Sơ Của Tôi) */}
      {isProfileOpen && currentUserProfile && (
        <UserProfileModal
          isOpen={isProfileOpen}
          currentUserProfile={currentUserProfile}
          members={members}
          onClose={() => setIsProfileOpen(false)}
          onProfileUpdated={(updatedProfile) => {
            setCurrentUserProfile(updatedProfile);
            showToast('Đã cập nhật thông tin hồ sơ cá nhân thành công!');
          }}
          onAvatarUpdated={(memberId, newAvatarUrl) => {
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, avatar: newAvatarUrl } : m));
            showToast('Đã cập nhật ảnh đại diện trong cây phả hệ thành công!');
          }}
        />
      )}

    </div>
  );
}
