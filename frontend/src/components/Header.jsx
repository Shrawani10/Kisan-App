import { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '../i18n/translations';
import { useAuth } from '../contexts/AuthContext';

// Language globe icon
function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

// Chevron down icon
function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

// Plus / new chat icon
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

// Logout icon
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

export default function Header({ language, onLanguageChange, onNewChat, t }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const { user, signOut } = useAuth();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUserMenuOpen(false);
    window.location.href = '/';
  };

  const currentLang = LANGUAGES.find(l => l.code === language);

  return (
    <header className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white shrink-0">
      {/* Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
            <img src="/logo.png" alt="Kisan" className="w-full h-full object-cover" />
          </div>
          {/* Online dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"/>
        </div>

        <div>
          <h1 className="text-lg font-bold text-primary-700 leading-tight">किसान</h1>
          <p className="text-xs text-green-500 font-medium leading-tight">{t.online}</p>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2">
        {/* Language Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
            aria-label="Select language"
            aria-expanded={dropdownOpen}
          >
            <GlobeIcon />
            <span className="max-w-[120px] truncate hidden sm:block">
              {currentLang?.nativeName || 'हिंदी (Hindi)'}
            </span>
            <ChevronDown />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
              <div className="max-h-72 overflow-y-auto py-1">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { onLanguageChange(lang.code); setDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      lang.code === language
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {lang.nativeName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <PlusIcon />
          <span className="hidden sm:block">{t.newChat}</span>
        </button>

        {/* User Menu */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
              title={user.email}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span className="hidden sm:block truncate max-w-[120px]">{user.email?.split('@')[0]}</span>
              <ChevronDown />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs text-gray-500">Signed in as</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <LogoutIcon />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
