import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { MapPin, Layers, Search, Heart, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const USER_LINKS = [
  { to: '/', label: 'Map', icon: MapPin, end: true },
  { to: '/feed', label: 'Feed', icon: Layers, end: true },
  { to: '/search', label: 'Search', icon: Search, end: true },
  { to: '/saved', label: 'Saved', icon: Heart, end: true },
];

const TopNav: React.FC = () => {
  const { isGuest, isOwner, user, authUser, signOut } = useAuth();

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
                   ${isActive
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
              <button
                onClick={() => void signOut()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium text-nz-muted hover:text-nz-text hover:bg-nz-elevated transition-all duration-200"
                type="button"
              >
                {user?.display_name ?? authUser?.phone ?? 'Account'}
              </button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default TopNav;
