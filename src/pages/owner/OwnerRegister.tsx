import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneOTPForm from '../../components/auth/PhoneOTPForm';
import EmailAuthForm from '../../components/auth/EmailAuthForm';

const OwnerRegister: React.FC = () => {
  const [tab, setTab] = useState<'phone' | 'email'>('phone');
  const navigate = useNavigate();

  const handleSuccess = useCallback(() => {
    navigate('/owner/venue/setup');
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col bg-nz-bg"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1f1208 0%, #16110c 60%)' }}
    >
      {/* Hero photo */}
      <div className="relative h-[260px] shrink-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80"
          alt="Nightlife"
          className="w-full h-full object-cover"
          style={{ filter: 'saturate(0.8) brightness(0.6)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(22,17,12,0.3) 0%, rgba(22,17,12,0.95) 100%)',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <h1
            className="text-nz-text leading-[0.92] tracking-[-0.04em]"
            style={{
              fontFamily: '"Bricolage Grotesque", system-ui',
              fontWeight: 900,
              fontSize: '32px',
            }}
          >
            Get your spot on the map.
          </h1>
        </div>
      </div>

      <div className="flex-1 px-5 pt-6 pb-10">
        <div className="w-full max-w-sm mx-auto">
          {/* Tab row: login / register */}
          <div className="flex bg-nz-elevated border border-nz-border rounded-2xl p-1 mb-6 gap-1">
            <Link
              to="/owner/login"
              className="flex-1 py-2.5 text-center text-sm font-semibold text-nz-muted hover:text-nz-text transition-colors"
            >
              Sign in
            </Link>
            <div className="flex-1 py-2.5 text-center text-sm font-bold text-nz-text bg-nz-surface rounded-xl">
              Register
            </div>
          </div>

          {/* Card */}
          <div
            className="rounded-3xl p-6 shadow-[0_8px_48px_rgba(0,0,0,0.5)]"
            style={{
              background: 'rgba(31,24,16,0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(58,44,27,0.6)',
            }}
          >
            {/* Auth method tabs */}
            <div className="flex bg-nz-bg/80 rounded-2xl p-1 mb-6 gap-1">
              {(['phone', 'email'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`
                    flex-1 py-2.5 text-sm font-semibold rounded-xl
                    transition-all duration-200
                    ${tab === t
                      ? 'bg-nz-accent text-white shadow-[0_2px_0_rgba(0,0,0,0.15)]'
                      : 'text-nz-muted hover:text-nz-text'
                    }
                  `}
                >
                  {t === 'phone' ? 'Phone OTP' : 'Email'}
                </button>
              ))}
            </div>

            {tab === 'phone' ? (
              <PhoneOTPForm onSuccess={handleSuccess} />
            ) : (
              <EmailAuthForm mode="register" onSuccess={handleSuccess} />
            )}
          </div>

          <p className="text-center text-nz-muted text-sm mt-6">
            Already have an account?{' '}
            <Link to="/owner/login" className="text-nz-accent font-semibold hover:text-nz-accent-text transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerRegister;
