import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { MapPin, Layers, Search, Heart, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const USER_LINKS = [
  { to: '/', label: 'Map', icon: MapPin, end: true },
  { to: '/feed', label: 'Feed', icon: Layers, end: true },
  { to: '/search', label: 'Search', icon: Search, end: true },
  { to: '/saved', label: 'Saved', icon: Heart, end: true },
];

const TopNav: React.FC = () => {
  const { isGuest, isOwner, user, authUser, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const displayName = user?.display_name || authUser?.email?.split('@')[0] || 'Account';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <div className="hidden md:block">
      <header
        className="sticky top-0 z-[1000] w-full bg-nz-bg/95 backdrop-blur-md"
        style={{
          borderBottom: '1px solid rgba(78,58,38,0.5)',
          boxShadow: '0 1px 20px rgba(0,0,0,0.4)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black"
              style={{
                background: '#ff7a3d',
                fontFamily: '"Bricolage Grotesque", system-ui',
                fontSize: '15px',
              }}
            >
              J
            </div>
            <span
              style={{
                fontFamily: '"Bricolage Grotesque", system-ui',
                fontWeight: 900,
                fontSize: '18px',
                letterSpacing: '-0.03em',
              }}
            >
              <span style={{ color: '#f5ecd9' }}>J</span>
              <span style={{ color: '#ff7a3d' }}>ol</span>
            </span>
          </Link>

          {/* Centre nav links */}
          <nav className="flex items-center gap-1">
            {USER_LINKS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium
                   transition-all duration-200
                   ${
                     isActive
                       ? 'bg-nz-accent/10 text-nz-accent'
                       : 'text-nz-muted hover:text-nz-text hover:bg-nz-elevated'
                   }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Auth-aware right side */}
          <div className="flex items-center gap-2 shrink-0">
            {isOwner && (
              <Link
                to="/owner/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium
                           text-nz-muted hover:text-nz-text border border-nz-border
                           hover:border-nz-muted/60 transition-all duration-200"
              >
                <User size={15} />
                <span>Owner portal</span>
              </Link>
            )}
            {isGuest ? (
              <Link
                to="/sign-in"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-nz-accent text-white hover:bg-nz-accent/90 transition-all duration-200"
              >
                Sign in
              </Link>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium text-nz-text bg-nz-elevated border border-nz-border hover:border-nz-muted/60 transition-all duration-200"
                  type="button"
                >
                  <div className="w-6 h-6 rounded-full bg-nz-accent/20 flex items-center justify-center">
                    <User size={14} className="text-nz-accent" />
                  </div>
                  <span className="max-w-[120px] truncate">{displayName}</span>
                  <ChevronDown
                    size={14}
                    className={`text-nz-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
                    style={{
                      background: 'rgba(31,24,16,0.98)',
                      border: '1px solid rgba(58,44,27,0.6)',
                      backdropFilter: 'blur(20px)',
                    }}
                  >
                    <div className="px-4 py-3 border-b border-nz-border/40">
                      <p className="text-nz-text text-sm font-semibold truncate">{displayName}</p>
                      <p className="text-nz-muted text-xs truncate">
                        {authUser?.email || authUser?.phone}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-nz-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        type="button"
                      >
                        <LogOut size={16} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default TopNav;
