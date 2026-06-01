import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Smartphone, Mail, ArrowLeft } from 'lucide-react';
import EmailAuthForm from '../../components/auth/EmailAuthForm';
import PhoneOTPForm from '../../components/auth/PhoneOTPForm';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';

const OwnerLogin: React.FC = () => {
  const [usePhone, setUsePhone] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleSuccess = useCallback(() => {
    navigate('/owner/dashboard');
  }, [navigate]);

  const toggleMethod = useCallback(() => setUsePhone((prev) => !prev), []);
  const handleForgotPassword = useCallback(() => setShowForgotPassword(true), []);
  const handleBackFromForgot = useCallback(() => setShowForgotPassword(false), []);

  return (
    <div
      className="min-h-screen flex flex-col bg-nz-bg"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1f1208 0%, #16110c 60%)' }}
    >
      {/* Hero photo */}
      <div className="relative h-[260px] shrink-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1571266752870-2c2a73435bb8?w=800&q=80"
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
        <div className="absolute top-0 left-0 right-0 px-4 pt-4">
          <Link
            to="/sign-in"
            className="inline-flex items-center gap-1.5 text-nz-text/80 hover:text-nz-text text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
        </div>
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
            <div className="flex-1 py-2.5 text-center text-sm font-bold text-nz-text bg-nz-surface rounded-xl">
              Sign in
            </div>
            <Link
              to="/owner/register"
              className="flex-1 py-2.5 text-center text-sm font-semibold text-nz-muted hover:text-nz-text transition-colors"
            >
              Register
            </Link>
          </div>

          {/* Auth form card */}
          <div
            className="rounded-3xl p-6 shadow-[0_8px_48px_rgba(0,0,0,0.5)]"
            style={{
              background: 'rgba(31,24,16,0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(58,44,27,0.6)',
            }}
          >
            {showForgotPassword ? (
              <ForgotPasswordForm onBack={handleBackFromForgot} />
            ) : usePhone ? (
              <PhoneOTPForm onSuccess={handleSuccess} />
            ) : (
              <EmailAuthForm
                mode="login"
                onSuccess={handleSuccess}
                onForgotPassword={handleForgotPassword}
                role="owner"
                requireRole
              />
            )}

            {/* Method toggle — hide when showing forgot password */}
            {!showForgotPassword && (
              <button
                onClick={toggleMethod}
                className="w-full mt-5 py-3 flex items-center justify-center gap-2 border border-nz-border rounded-2xl text-sm text-nz-muted font-medium hover:text-nz-text hover:border-nz-muted/40 transition-all duration-200"
                type="button"
              >
                {usePhone ? (
                  <>
                    <Mail size={15} />
                    Sign in with email instead
                  </>
                ) : (
                  <>
                    <Smartphone size={15} />
                    Sign in with phone OTP instead
                  </>
                )}
              </button>
            )}
          </div>

          <p className="text-center text-nz-muted text-sm mt-6">
            New to Jol?{' '}
            <Link
              to="/owner/register"
              className="text-nz-accent font-semibold hover:text-nz-accent-text transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerLogin;
