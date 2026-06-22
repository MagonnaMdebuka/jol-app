import React, { useState, useCallback, useMemo } from 'react';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithEmailAndRole,
} from '../../services/auth.service';
import { isSupabaseEnabled } from '../../config/env';
import { useToast } from '../ui/Toast';
import Input from '../ui/Input';
import Button from '../ui/Button';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
} from '../../utils/validation';

type AuthMode = 'register' | 'login';

interface IEmailAuthFormProps {
  mode: AuthMode;
  onSuccess: () => void;
  role?: 'user' | 'owner';
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const errors = useMemo(() => {
    const errs: Record<string, string | undefined> = {};
    if (mode === 'register') {
      const nameResult = validateRequired(name, 'Name');
      errs.name = nameResult.valid ? undefined : nameResult.error;
    }
    const emailResult = validateEmail(email);
    errs.email = emailResult.valid ? undefined : emailResult.error;
    const passwordResult = validatePassword(password);
    errs.password = passwordResult.valid ? undefined : passwordResult.error;
    if (mode === 'register') {
      const confirmResult = validatePasswordMatch(password, confirm);
      errs.confirm = confirmResult.valid ? undefined : confirmResult.error;
    }
    return errs;
  }, [mode, name, email, password, confirm]);

  const isValid = useMemo(() => Object.values(errors).every((e) => !e), [errors]);

  const handleSubmit = useCallback(async () => {
    // Mark all fields as touched to show errors
    setTouched({ name: true, email: true, password: true, confirm: true });

    if (!isValid) return;

    if (!isSupabaseEnabled()) {
      toast('Demo mode: signed in (no Supabase configured)', 'info');
      onSuccess();
      return;
    }

    setLoading(true);
    let result: { error: string | null };

    if (mode === 'register') {
      result = await signUpWithEmail(name, email, password, role);
    } else if (requireRole && role === 'owner') {
      result = await signInWithEmailAndRole(email, password, 'owner');
    } else {
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
  }, [isValid, name, email, password, mode, role, requireRole, onSuccess, toast]);

  return (
    <div className="flex flex-col gap-4">
      {mode === 'register' && (
        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => markTouched('name')}
          placeholder="Your name"
          autoComplete="name"
          error={touched.name ? errors.name : undefined}
        />
      )}
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => markTouched('email')}
        placeholder="you@example.com"
        autoComplete="email"
        error={touched.email ? errors.email : undefined}
      />
      <div>
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => markTouched('password')}
          placeholder="••••••••"
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          error={touched.password ? errors.password : undefined}
          hint={mode === 'register' ? 'At least 6 characters' : undefined}
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
          onBlur={() => markTouched('confirm')}
          placeholder="••••••••"
          autoComplete="new-password"
          error={touched.confirm ? errors.confirm : undefined}
        />
      )}
      <Button onClick={handleSubmit} loading={loading} size="lg" className="w-full">
        {mode === 'register' ? 'Create Account' : 'Sign In'}
      </Button>
    </div>
  );
};

export default EmailAuthForm;
