import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { MapPin, Layers, Search, Heart, User, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LINKS = [
  { to: '/', label: 'Map', icon: MapPin, end: true },
  { to: '/feed', label: 'Feed', icon: Layers, end: true },
  { to: '/search', label: 'Search', icon: Search, end: true },
  { to: '/saved', label: 'Saved', icon: Heart, end: true },
];

const BottomNav: React.FC = () => {
  const { isGuest, isOwner } = useAuth();

  return (
    <nav
      className="z-30 md:hidden"
      style={{
        background: 'rgba(31,24,16,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(58,44,27,0.4)',
      }}
    >
      <div className="flex items-stretch">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `
              flex-1 flex flex-col items-center justify-center gap-1
              py-3 px-2 text-[10px] font-medium
              transition-all duration-200 relative
              ${isActive ? 'text-nz-accent' : 'text-nz-muted hover:text-nz-text'}
            `}
          >
            {({ isActive }) => (
              <>
                <span className="transition-all duration-200">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                </span>
                <span className={isActive ? 'font-bold' : ''}>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Auth-aware fifth tab */}
        {isOwner ? (
          <NavLink
            to="/owner/dashboard"
            className={({ isActive }) => `
              flex-1 flex flex-col items-center justify-center gap-1
              py-3 px-2 text-[10px] font-medium
              transition-all duration-200 relative
              ${isActive ? 'text-nz-accent' : 'text-nz-muted hover:text-nz-text'}
            `}
          >
            {({ isActive }) => (
              <>
                <span className="transition-all duration-200">
                  <User size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                </span>
                <span className={isActive ? 'font-bold' : ''}>Dashboard</span>
              </>
            )}
          </NavLink>
        ) : isGuest ? (
          <Link
            to="/sign-in"
            className="flex-1 flex flex-col items-center justify-center gap-1
                       py-3 px-2 text-[10px] font-medium text-nz-muted
                       transition-all duration-200 relative hover:text-nz-text"
          >
            <span className="transition-all duration-200">
              <LogIn size={22} strokeWidth={1.8} />
            </span>
            <span>Sign in</span>
          </Link>
        ) : (
          <div
            className="flex-1 flex flex-col items-center justify-center gap-1
                       py-3 px-2 text-[10px] font-medium text-nz-muted"
          >
            <span className="transition-all duration-200">
              <User size={22} strokeWidth={1.8} />
            </span>
            <span>Account</span>
          </div>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
