import React, { useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PhoneOTPForm from '../components/auth/PhoneOTPForm';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSuccess = useCallback(() => {
    const from = (location.state as { from?: string })?.from ?? '/feed';
    navigate(from);
  }, [navigate, location.state]);

  return (
    <div
      className="h-full overflow-y-auto bg-nz-bg"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1f1208 0%, #16110c 60%)' }}
    >
      {/* Hero image */}
      <div className="relative h-[240px] shrink-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=800&q=80"
          alt="Joburg nightlife"
          className="w-full h-full object-cover"
          style={{ filter: 'saturate(0.8) brightness(0.5)' }}
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
            Discover Joburg tonight.
          </h1>
        </div>
      </div>

      {/* Auth card */}
      <div className="px-5 pt-6 pb-10">
        <div className="w-full max-w-sm mx-auto">
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

          <p className="text-center text-nz-muted text-sm mt-6">
            Just browsing?{' '}
            <Link
              to="/"
              className="text-nz-accent font-semibold hover:text-nz-accent-text transition-colors"
            >
              Explore the map &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
