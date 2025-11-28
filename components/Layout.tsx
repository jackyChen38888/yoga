import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { UserRole } from '../types';
import { LogOut, User, LogIn, ChevronDown, CalendarDays } from 'lucide-react';
import { LoginModal } from './LoginModal';
import { StudentProfileModal } from './StudentProfileModal';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, isLoginModalOpen, setLoginModalOpen } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // New state for profile modal
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const handleLoginClick = () => {
    setLoginModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleProfileClick = () => {
    setIsProfileOpen(true);
    setIsMenuOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f6]">
      {/* Login Modal (Global) */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
      
      {/* Student Profile Modal (Global) */}
      {isProfileOpen && <StudentProfileModal onClose={() => setIsProfileOpen(false)} />}

      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-zen-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md shadow-zen-200">Z</div>
              <span className="text-xl font-bold tracking-tight text-gray-800">ZenFlow</span>
            </div>
            
            {/* Right Side: Profile / Login */}
            <div className="flex items-center gap-4">
               
               {/* Profile Dropdown */}
               <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                  >
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-gray-800 leading-tight">{currentUser.name}</div>
                        <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                            {currentUser.role === UserRole.GUEST ? '訪客' : (currentUser.role === UserRole.ADMIN ? '管理員' : '學生')}
                        </div>
                    </div>
                    <div className="relative">
                        <img 
                            src={currentUser.avatarUrl} 
                            className={`w-9 h-9 rounded-full border-2 ${currentUser.role === UserRole.ADMIN ? 'border-zen-600' : 'border-white'} shadow-sm`} 
                            alt="avatar" 
                        />
                        <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                             <ChevronDown size={10} className="text-gray-500" />
                        </div>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                        <div className="px-4 py-3 border-b border-gray-50 sm:hidden">
                            <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
                            <p className="text-xs text-gray-500">{currentUser.role}</p>
                        </div>
                        
                        {currentUser.role === UserRole.GUEST ? (
                            <button 
                                onClick={handleLoginClick}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-zen-600 flex items-center gap-2 font-medium"
                            >
                                <LogIn size={16} />
                                登入帳號
                            </button>
                        ) : (
                            <>
                                <div className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                    帳號管理
                                </div>
                                
                                {currentUser.role === UserRole.STUDENT && (
                                    <button 
                                        onClick={handleProfileClick}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-zen-600 flex items-center gap-2 font-medium border-b border-gray-50"
                                    >
                                        <CalendarDays size={16} />
                                        我的課表 / 狀態
                                    </button>
                                )}

                                <button 
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                                >
                                    <LogOut size={16} />
                                    登出
                                </button>
                            </>
                        )}
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};