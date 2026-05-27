import React, { useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, PlusCircle, LogOut } from 'lucide-react';
import { signOut } from '../../services/auth.service';

const LINKS = [
  { to: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/owner/venue/setup', label: 'Add Venue', icon: Building2 },
  { to: '/owner/listings/new', label: 'New Listing', icon: PlusCircle },
];

const OwnerNav: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/owner/login');
  }, [navigate]);

  return (
    <header
      className="sticky top-0 z-40 bg-nz-bg/95 backdrop-blur-md"
      style={{
        borderBottom: '1px solid rgba(58,44,27,0.8)',
        boxShadow: '0 1px 12px rgba(0,0,0,0.4)',
      }}
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            style={{ fontFamily: '"Bricolage Grotesque", system-ui', fontWeight: 900, fontSize: '18px', letterSpacing: '-0.03em' }}
          >
            <span style={{ color: '#f5ecd9' }}>J</span>
            <span style={{ color: '#ff7a3d' }}>ol</span>
          </span>
          <span
            style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.08em', color: '#ff7a3d' }}
          >
            OWNER
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-nz-accent/10 text-nz-accent border border-nz-accent/30'
                  : 'text-nz-muted hover:text-nz-text hover:bg-nz-elevated rounded-xl'
                }`
              }
            >
              <Icon size={14} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium text-nz-muted hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
          type="button"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default OwnerNav;
