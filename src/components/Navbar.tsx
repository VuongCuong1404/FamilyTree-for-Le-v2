import React, { useState } from 'react';
import { 
  TreePine, 
  Search, 
  Calendar, 
  Menu, 
  X, 
  MessageCircle, 
  UserPlus, 
  Settings, 
  Home,
  ShieldCheck, 
  LogIn, 
  LogOut,
  ShieldAlert,
  Crown,
  User
} from 'lucide-react';
import { ClanInfo, Role, UserProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  clanInfo: ClanInfo;
  currentUserRole: Role;
  currentUserProfile: UserProfile | null;
  onOpenZalo: () => void;
  onOpenAddMember: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  isSupabaseConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  clanInfo,
  currentUserRole,
  currentUserProfile,
  onOpenZalo,
  onOpenAddMember,
  onOpenSettings,
  onOpenAuth,
  onOpenProfile,
  onSignOut,
  isSupabaseConnected = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Trang Chủ', icon: Home },
    { id: 'tree', label: 'Cây Phả Hệ', icon: TreePine },
    { id: 'directory', label: 'Tra Cứu Danh Bạ', icon: Search },
    { id: 'memorial', label: 'Lịch Giỗ & Nghi Lễ', icon: Calendar },
    ...(currentUserRole === 'admin' ? [{ id: 'admin', label: 'Quản Trị Gán Role', icon: ShieldCheck }] : []),
  ];

  const canEdit = currentUserRole === 'admin' || currentUserRole === 'support';

  const roleLabel = currentUserRole === 'admin' 
    ? 'Quản Trị Viên (Admin)' 
    : currentUserRole === 'support' 
    ? 'Ban Hỗ Trợ (Support)' 
    : 'Thành Viên (Member)';

  return (
    <header className="sticky top-0 z-40 bg-[#1c0e09] text-amber-50 border-b border-amber-900/60 shadow-lg">
      {/* Top micro bar with Clan Motto & User Auth Status */}
      <div className="bg-[#120704] text-amber-200/80 text-xs py-1 px-4 border-b border-amber-950/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="font-serif-clan tracking-wider hidden sm:inline text-amber-300">
              Gia Phả {clanInfo.clanSurname.toUpperCase()} TỘC:
            </span>
            <span className="text-amber-200/90 font-medium italic">"{clanInfo.subTitle}"</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* User Auth Status / Login */}
            {currentUserProfile ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-stone-900/90 px-2 sm:px-2.5 py-0.5 rounded-lg border border-amber-900/50">
                <span className={`w-2 h-2 rounded-full ${
                  currentUserRole === 'admin' ? 'bg-red-500' : currentUserRole === 'support' ? 'bg-amber-500' : 'bg-sky-500'
                }`} />
                <span className="font-semibold text-amber-200 truncate max-w-[90px] sm:max-w-[150px]">
                  {currentUserProfile.full_name || currentUserProfile.email}
                </span>
                <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                  currentUserRole === 'admin' ? 'bg-red-950 text-red-300 border border-red-800' :
                  currentUserRole === 'support' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-stone-800 text-stone-300 border border-stone-700'
                }`}>
                  {currentUserRole === 'admin' ? 'Admin' : currentUserRole === 'support' ? 'Hỗ trợ' : 'Thành viên'}
                </span>

                {/* Mục Hồ Sơ Của Tôi cạnh badge role */}
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-1 text-amber-300 hover:text-white bg-amber-950/70 hover:bg-amber-900 px-1.5 py-0.5 rounded border border-amber-800/60 transition-colors ml-0.5 cursor-pointer"
                  title="Hồ Sơ Của Tôi (Chỉnh sửa Họ Tên & Số Điện Thoại)"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-medium hidden sm:inline">Hồ Sơ Của Tôi</span>
                </button>

                <button
                  onClick={onSignOut}
                  className="text-stone-400 hover:text-rose-300 ml-1 transition-colors cursor-pointer"
                  title="Đăng xuất tài khoản"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 text-amber-200 hover:text-white font-semibold transition-all bg-amber-900/70 hover:bg-amber-800 px-2.5 py-0.5 rounded-md border border-amber-700/60 shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Đăng Nhập (Email OTP)</span>
              </button>
            )}

            {currentUserRole === 'admin' && (
              <>
                <span className="text-stone-700 hidden sm:inline">|</span>
                <button 
                  onClick={onOpenSettings}
                  className="hidden sm:flex items-center gap-1 hover:text-amber-300 transition-colors text-stone-300 cursor-pointer"
                  title="Tùy chỉnh thông tin dòng họ"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cài đặt họ</span>
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand & Crest */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-amber-500 via-amber-700 to-red-950 border-2 border-amber-400/90 flex items-center justify-center shadow-md shadow-amber-950/50 group-hover:scale-105 transition-transform shrink-0">
              <span className="font-serif-clan font-bold text-lg sm:text-xl text-amber-100 drop-shadow">
                {clanInfo.clanSurname.charAt(0)}
              </span>
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold tracking-wider text-amber-400 uppercase font-serif-clan">
                Gia Phả Nội Tộc
              </div>
              <div className="text-base sm:text-xl font-bold tracking-tight text-white font-serif-clan group-hover:text-amber-300 transition-colors">
                {clanInfo.clanSurname.toUpperCase()} TỘC
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-700/90 to-red-900/90 text-amber-100 shadow-md border border-amber-500/50'
                      : 'text-stone-300 hover:text-amber-200 hover:bg-stone-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-amber-400/80'}`} />
                  <span className="font-semibold">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            {canEdit && (
              <button
                onClick={onOpenAddMember}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 border border-amber-800/70 transition-all hover:scale-105 shadow-sm cursor-pointer"
                title="Thêm thành viên mới vào gia phả"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Thêm con cháu</span>
              </button>
            )}

            <button
              onClick={onOpenZalo}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30 transition-all hover:scale-105 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Nhóm Zalo Họ</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenZalo}
              className="p-2 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Mở Zalo Họ"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-amber-200 hover:bg-stone-800 focus:outline-none cursor-pointer"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#24140e] border-b border-amber-900/80 px-4 pt-2 pb-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-amber-800/80 text-amber-100 font-bold border border-amber-500/40'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-amber-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-amber-400" />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}

          <div className="pt-3 border-t border-amber-950/80 flex flex-col gap-2">
            {!currentUserProfile ? (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-sm font-bold shadow-sm cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập (Email OTP)</span>
              </button>
            ) : (
              <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Tài khoản:</span>
                  <span className="text-amber-300 font-bold">{currentUserProfile.full_name || currentUserProfile.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Quyền hạn:</span>
                  <span className="font-bold text-amber-200">{roleLabel}</span>
                </div>
                <button
                  onClick={() => {
                    onOpenProfile();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 mt-1 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-xs font-semibold cursor-pointer border border-amber-800/60 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hồ Sơ Của Tôi (Sửa Tên & SĐT)</span>
                </button>
                <button
                  onClick={() => {
                    onSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-rose-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng Xuất</span>
                </button>
              </div>
            )}

            {canEdit && (
              <button
                onClick={() => {
                  onOpenAddMember();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-800 text-amber-200 text-sm font-bold border border-amber-900/50 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>Thêm thành viên vào gia phả</span>
              </button>
            )}

            {currentUserRole === 'admin' && (
              <button
                onClick={() => {
                  onOpenSettings();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-900 text-stone-300 text-sm cursor-pointer"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Cài đặt dòng họ ({clanInfo.clanSurname})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

