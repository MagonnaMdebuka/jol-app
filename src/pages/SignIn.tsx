import React, { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Building2 } from 'lucide-react';
import PhoneOTPForm from '../components/auth/PhoneOTPForm';

type Role = 'user' | 'owner';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<Role>('user');

  const handleSuccess = useCallback(() => {
    const from = (location.state as { from?: string })?.from ?? '/feed';
    navigate(from);
  }, [navigate, location.state]);

  const handleRoleSelect = useCallback((selected: Role) => {
    if (selected === 'owner') {
      navigate('/owner/login');
      return;
    }
    setRole(selected);
  }, [navigate]);

  return (
    <div
      className="h-full overflow-y-auto bg-nz-bg"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1f1208 0%, #16110c 60%)' }}
    >
      {/* Hero */}
      <div className="relative h-[220px] shrink-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=800&q=80"
          alt="Joburg nightlife"
          className="w-full h-full object-cover"
          style={{ filter: 'saturate(0.8) brightness(0.5)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(22,17,12,0.3) 0%, rgba(22,17,12,0.95) 100%)' }}
        />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <h1
            className="text-nz-text leading-[0.92] tracking-[-0.04em]"
            style={{ fontFamily: '"Bricolage Grotesque", system-ui', fontWeight: 900, fontSize: '30px' }}
          >
            Discover Joburg tonight.
          </h1>
        </div>
      </div>

      <div className="px-5 pt-6 pb-10">
        <div className="w-full max-w-sm mx-auto flex flex-col gap-5">

          {/* Role selector */}
          <div>
            <p
              className="text-nz-muted mb-3 text-center"
              style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.08em' }}
            >
              WHO ARE YOU?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'user' as const, icon: <User size={18} />, label: 'Explorer', sub: 'Browse & save spots' },
                { value: 'owner' as const, icon: <Building2 size={18} />, label: 'Venue Owner', sub: 'Manage your listings' },
              ]).map(({ value, icon, label, sub }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleRoleSelect(value)}
                  className={`
                    flex flex-col items-start gap-2 p-4 rounded-2xl border text-left
                    transition-all duration-200 active:scale-[0.98]
                    ${role === value && value === 'user'
                      ? 'bg-nz-accent/10 border-nz-accent/50'
                      : 'bg-nz-surface border-nz-border hover:border-nz-muted/40'
                    }
                  `}
                >
                  <span className={role === value && value === 'user' ? 'text-nz-accent' : 'text-nz-muted'}>
                    {icon}
                  </span>
                  <div>
                    <p className={`font-bold text-sm ${role === value && value === 'user' ? 'text-nz-text' : 'text-nz-muted'}`}>
                      {label}
                    </p>
                    <p className="text-nz-muted text-xs mt-0.5">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Auth card — only shown for regular users */}
          <div
            className="rounded-3xl p-6 shadow-[0_8px_48px_rgba(0,0,0,0.5)]"
            style={{
              background: 'rgba(31,24,16,0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(58,44,27,0.6)',
            }}
          >
            <PhoneOTPForm onSuccess={handleSuccess} />
          </div>

          <p className="text-center text-nz-muted text-sm">
            Just browsing?{' '}
            <Link to="/" className="text-nz-accent font-semibold hover:text-nz-accent-text transition-colors">
              Explore the map &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
