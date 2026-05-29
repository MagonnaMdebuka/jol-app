import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from '../services/auth.service';
import { isSupabaseEnabled } from '../config/env';
import { useToast } from '../components/ui/Toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase handles the token automatically via the URL hash
    // The user session is restored when they land on this page
  }, []);

  const handleSubmit = useCallback(async () => {
    if (password.length < 6) {
      toast('Password must be at least 6 characters', 'error');
      return;
    }
    if (password !== confirm) {
      toast('Passwords do not match', 'error');
      return;
    }

    if (!isSupabaseEnabled()) {
      toast('Demo mode: password updated', 'info');
      setSuccess(true);
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);

    if (error) {
      toast(error, 'error');
    } else {
      toast('Password updated successfully', 'success');
      setSuccess(true);
    }
    setLoading(false);
  }, [password, confirm, toast]);

  const handleGoToLogin = useCallback(() => {
    navigate('/owner/login');
  }, [navigate]);

  if (success) {
    return (
      <div className="min-h-screen bg-nz-bg flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-nz-surface border border-nz-border rounded-3xl p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-nz-accent/20 flex items-center justify-center mb-4">
            <span className="text-nz-accent text-xl">✓</span>
          </div>
          <h1 className="text-nz-text text-xl font-semibold mb-2">Password updated</h1>
          <p className="text-nz-muted text-sm mb-6">
            Your password has been reset. You can now sign in with your new password.
          </p>
          <Button onClick={handleGoToLogin} size="lg" className="w-full">
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nz-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-nz-surface border border-nz-border rounded-3xl p-8">
        <h1
          className="text-nz-text tracking-[-0.04em] mb-2"
          style={{
            fontFamily: '"Bricolage Grotesque", system-ui',
            fontWeight: 900,
            fontSize: '28px',
          }}
        >
          Set new password
        </h1>
        <p className="text-nz-muted text-sm mb-6">Enter your new password below</p>

        <div className="flex flex-col gap-4">
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
          <Button onClick={handleSubmit} loading={loading} size="lg" className="w-full">
            Update password
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
