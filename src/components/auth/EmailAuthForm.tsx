import React, { useState, useCallback } from 'react';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithEmailAndRole,
} from '../../services/auth.service';
import { isSupabaseEnabled } from '../../config/env';
import { useToast } from '../ui/Toast';
import Input from '../ui/Input';
import Button from '../ui/Button';

type AuthMode = 'register' | 'login';

interface IEmailAuthFormProps {
  mode: AuthMode;
  onSuccess: () => void;
  role?: 'user' | 'owner';
  /** If true, verify the user has the correct role on login */
  requireRole?: boolean;
  onForgotPassword?: () => void;
}

const EmailAuthForm: React.FC<IEmailAuthFormProps> = ({
  mode,
  onSuccess,
  role = 'user',
  requireRole = false,
  onForgotPassword,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = useCallback(async () => {
    if (!isSupabaseEnabled()) {
      toast('Demo mode: signed in (no Supabase configured)', 'info');
      onSuccess();
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        toast('Enter your name', 'error');
        return;
      }
      if (password !== confirm) {
        toast('Passwords do not match', 'error');
        return;
      }
      if (password.length < 6) {
        toast('Password must be at least 6 characters', 'error');
        return;
      }
    }

    setLoading(true);

    let result: { error: string | null };

    if (mode === 'register') {
      result = await signUpWithEmail(name, email, password, role);
    } else if (requireRole && role === 'owner') {
      // Owner login - verify role
      result = await signInWithEmailAndRole(email, password, 'owner');
    } else {
      // Regular login
      result = await signInWithEmail(email, password);
    }

    if (result.error) {
      toast(result.error, 'error');
    } else {
      toast(
        mode === 'register' ? 'Account created! Check your email.' : 'Welcome back!',
        'success',
      );
      onSuccess();
    }
    setLoading(false);
  }, [name, email, password, confirm, mode, role, requireRole, onSuccess, toast]);

  return (
    <div className="flex flex-col gap-4">
      {mode === 'register' && (
        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
        />
      )}
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <div>
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        />
        {mode === 'login' && onForgotPassword && (
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-nz-accent text-sm mt-1.5 hover:underline"
          >
            Forgot password?
          </button>
        )}
      </div>
      {mode === 'register' && (
        <Input
          label="Confirm Password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />
      )}
      <Button onClick={handleSubmit} loading={loading} size="lg" className="w-full">
        {mode === 'register' ? 'Create Account' : 'Sign In'}
      </Button>
    </div>
  );
};

export default EmailAuthForm;
