import React, { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Compass, Heart, MapPin, Search, Sparkles, User } from 'lucide-react';
import EmailAuthForm from '../components/auth/EmailAuthForm';

type Role = 'user' | 'owner';
type Tab = 'sign-in' | 'register';

interface IAuthHeroProps {
  compact?: boolean;
}

interface IRoleSelectorProps {
  role: Role;
  onSelect: (role: Role) => void;
}

interface IAuthTabsProps {
  tab: Tab;
  onChange: (tab: Tab) => void;
}

interface IAuthCardProps {
  tab: Tab;
  role: Role;
  onTabChange: (tab: Tab) => void;
  onRoleSelect: (role: Role) => void;
  onSuccess: () => void;
}

const VALUE_POINTS = [
  { icon: Search, label: 'Find events near you' },
  { icon: Heart, label: 'Save favourite spots' },
  { icon: Building2, label: 'List your venue' },
];

const ROLES = [
  {
    value: 'user' as const,
    icon: User,
    label: 'Explorer',
    sub: 'Browse events, venues, and hidden spots',
  },
  {
    value: 'owner' as const,
    icon: Building2,
    label: 'Venue Owner',
    sub: 'Manage venues and publish listings',
  },
];

const AuthHero: React.FC<IAuthHeroProps> = ({ compact = false }) => (
  <section
    className={`
      relative overflow-hidden border border-nz-border/60 bg-nz-surface
      ${compact ? 'h-[168px] rounded-b-[28px] border-x-0 border-t-0' : 'h-full min-h-0 rounded-[32px]'}
    `}
    aria-label="Jol nightlife discovery"
  >
    <img
      src="https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=1200&q=85"
      alt="Joburg nightlife crowd"
      className="absolute inset-0 h-full w-full object-cover"
      style={{ filter: 'saturate(0.92) brightness(0.64) contrast(1.08)' }}
    />
    <div className="absolute inset-0 bg-gradient-to-br from-[#0f0a06]/35 via-[#0f0a06]/64 to-[#0f0a06]" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a06] via-[#0f0a06]/30 to-black/20" />

    <div
      className={`
        relative z-10 flex h-full flex-col justify-end
        ${compact ? 'px-5 pb-5' : 'px-8 pb-8 lg:px-10 lg:pb-10'}
      `}
    >
      <div className={compact ? 'max-w-[320px]' : 'max-w-xl'}>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md">
          <Sparkles size={14} aria-hidden="true" />
          Joburg after dark
        </div>
        <h1
          className={`
            font-display font-black leading-[0.96] text-white
            ${compact ? 'text-[31px]' : 'text-[56px] lg:text-[64px]'}
          `}
        >
          Discover Joburg tonight.
        </h1>
        <p
          className={`
            mt-3 max-w-md leading-relaxed text-white/78
            ${compact ? 'text-sm' : 'text-base'}
          `}
        >
          Find events, venues, and hidden spots near you.
        </p>
      </div>

      {!compact && (
        <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">
          {VALUE_POINTS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/12 bg-black/24 p-3 backdrop-blur-md"
            >
              <Icon size={18} className="text-nz-accent" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold leading-snug text-white/86">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
);

const RoleSelector: React.FC<IRoleSelectorProps> = ({ role, onSelect }) => (
  <div className="md:shrink-0">
    <p className="mb-2.5 text-center font-mono text-[10px] uppercase tracking-wider text-nz-muted">
      Continue as
    </p>
    <div className="grid grid-cols-2 gap-2.5">
      {ROLES.map(({ value, icon: Icon, label, sub }) => {
        const selected = role === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            aria-pressed={selected}
            className={`
              group min-h-[108px] rounded-2xl border p-3.5 text-left md:min-h-[98px] md:p-3
              transition-all duration-200 hover:-translate-y-0.5
              focus:outline-none focus:ring-2 focus:ring-nz-accent/55 focus:ring-offset-2 focus:ring-offset-nz-bg
              active:scale-[0.98]
              ${
                selected
                  ? 'border-nz-accent/70 bg-nz-accent-soft shadow-[0_10px_34px_rgba(255,122,61,0.14)]'
                  : 'border-nz-border bg-nz-surface hover:border-nz-muted/55 hover:bg-nz-elevated'
              }
            `}
          >
            <span
              className={`
                flex h-10 w-10 items-center justify-center rounded-xl border md:h-9 md:w-9
                ${
                  selected
                    ? 'border-nz-accent/35 bg-nz-accent/18 text-nz-accent'
                    : 'border-nz-border bg-nz-elevated text-nz-muted group-hover:text-nz-text'
                }
              `}
            >
              <Icon size={18} aria-hidden="true" />
            </span>
            <span
              className={`mt-3 block text-sm font-bold md:mt-2 ${selected ? 'text-nz-text' : 'text-nz-muted group-hover:text-nz-text'}`}
            >
              {label}
            </span>
            <span className="mt-1 block text-xs leading-snug text-nz-muted">{sub}</span>
          </button>
        );
      })}
    </div>
  </div>
);

const AuthTabs: React.FC<IAuthTabsProps> = ({ tab, onChange }) => (
  <div
    className="grid grid-cols-2 gap-1 rounded-2xl border border-nz-border bg-nz-elevated/90 p-1 md:shrink-0"
    role="tablist"
    aria-label="Authentication mode"
  >
    {(['sign-in', 'register'] as const).map((item) => {
      const active = tab === item;
      return (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(item)}
          className={`
            rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 md:py-2.5
            focus:outline-none focus:ring-2 focus:ring-nz-accent/55 focus:ring-offset-2 focus:ring-offset-nz-bg
            ${
              active
                ? 'bg-nz-surface text-nz-text shadow-[0_8px_22px_rgba(0,0,0,0.26)]'
                : 'text-nz-muted hover:text-nz-text'
            }
          `}
        >
          {item === 'sign-in' ? 'Sign in' : 'Register'}
        </button>
      );
    })}
  </div>
);

const AuthCard: React.FC<IAuthCardProps> = ({
  tab,
  role,
  onTabChange,
  onRoleSelect,
  onSuccess,
}) => {
  const isSignIn = tab === 'sign-in';
  const isOwner = role === 'owner';

  return (
    <section
      className="
        rounded-[28px] border border-nz-border/75 bg-nz-surface/82
        p-5 shadow-[0_22px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl
        sm:p-6 md:flex md:h-full md:min-h-0 md:flex-col md:overflow-hidden lg:p-6
      "
      aria-label={isSignIn ? 'Sign in to Jol' : 'Register for Jol'}
    >
      <div className="mb-5 text-center md:mb-4 md:shrink-0">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-nz-accent/25 bg-nz-accent-soft text-nz-accent md:h-10 md:w-10">
          <Compass size={20} aria-hidden="true" />
        </div>
        <h2 className="font-display text-[30px] font-black leading-tight text-nz-text md:text-[28px]">
          {isOwner
            ? isSignIn
              ? 'Owner sign in'
              : 'Register your venue'
            : isSignIn
              ? 'Welcome back'
              : 'Create your account'}
        </h2>
        <p className="mx-auto mt-1.5 max-w-[300px] text-sm leading-relaxed text-nz-muted">
          {isOwner
            ? isSignIn
              ? 'Manage your listings, events, and venue presence on Jol.'
              : 'Create an owner account and start getting your spot on the map.'
            : isSignIn
              ? 'Sign in to keep your saved spots, events, and plans close.'
              : 'Join Jol to discover more of Joburg and save what catches your eye.'}
        </p>
      </div>

      <div className="space-y-4 md:flex md:min-h-0 md:flex-1 md:flex-col md:gap-3 md:space-y-0">
        <RoleSelector role={role} onSelect={onRoleSelect} />
        <AuthTabs tab={tab} onChange={onTabChange} />

        <div className="rounded-[22px] border border-nz-border/70 bg-nz-bg/26 p-4 sm:p-5 md:p-4">
          <EmailAuthForm
            mode={tab === 'sign-in' ? 'login' : 'register'}
            role={role}
            requireRole={role === 'owner' && tab === 'sign-in'}
            onSuccess={onSuccess}
          />
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-nz-muted md:mt-4 md:shrink-0">
        Just browsing?{' '}
        <Link
          to="/"
          className="inline-flex items-center gap-1 font-semibold text-nz-accent transition-colors hover:text-nz-accent-text focus:outline-none focus:ring-2 focus:ring-nz-accent/55 focus:ring-offset-2 focus:ring-offset-nz-bg"
        >
          Explore the map
          <MapPin size={14} aria-hidden="true" />
        </Link>
      </p>
    </section>
  );
};

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<Role>('user');
  const [tab, setTab] = useState<Tab>('sign-in');

  const handleSuccess = useCallback(() => {
    if (role === 'owner') {
      navigate(tab === 'register' ? '/owner/venue/setup' : '/owner/dashboard');
      return;
    }
    const from = (location.state as { from?: string })?.from ?? '/feed';
    navigate(from);
  }, [navigate, location.state, role, tab]);

  const handleRoleSelect = useCallback((selected: Role) => {
    setRole(selected);
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-nz-bg">
      <div
        className="min-h-full"
        style={{
          background:
            'radial-gradient(ellipse at 18% 0%, rgba(255,122,61,0.16) 0%, transparent 32%), radial-gradient(ellipse at 82% 18%, rgba(244,196,119,0.10) 0%, transparent 34%), #0f0a06',
        }}
      >
        <div className="md:hidden">
          <AuthHero compact />
        </div>

        <div className="mx-auto flex min-h-full w-full max-w-6xl items-center px-5 pb-24 pt-5 sm:px-6 md:px-8 md:py-8 lg:py-10">
          <div className="grid w-full gap-7 md:min-h-[680px] md:grid-cols-[minmax(0,1.05fr)_minmax(360px,440px)] md:items-stretch lg:gap-10">
            <div className="hidden md:block md:min-h-0">
              <AuthHero />
            </div>

            <AuthCard
              tab={tab}
              role={role}
              onTabChange={setTab}
              onRoleSelect={handleRoleSelect}
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
