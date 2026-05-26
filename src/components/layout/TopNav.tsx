import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { MapPin, Layers, Search, Heart, User } from 'lucide-react';

const USER_LINKS = [
  { to: '/', label: 'Map', icon: MapPin, end: true },
  { to: '/feed', label: 'Feed', icon: Layers, end: true },
  { to: '/search', label: 'Search', icon: Search, end: true },
  { to: '/saved', label: 'Saved', icon: Heart, end: true },
];

const TopNav: React.FC = () => (
  <header
    className="sticky top-0 z-[1000] w-full bg-white"
    style={{
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 12px rgba(0,0,0,0.08)',
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
          <span style={{ color: '#111827' }}>J</span>
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
                 ? 'bg-orange-50 text-nz-accent'
                 : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
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

      {/* Owner portal */}
      <Link
        to="/owner/dashboard"
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium shrink-0
                   text-gray-500 hover:text-gray-900 border border-gray-200
                   hover:border-gray-400 transition-all duration-200"
      >
        <User size={15} />
        <span>Owner portal</span>
      </Link>
    </div>
  </header>
);

export default TopNav;
