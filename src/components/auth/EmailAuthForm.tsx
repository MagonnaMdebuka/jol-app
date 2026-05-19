import React, { useState, useCallback } from 'react';
import { signUpWithEmail, signInWithEmail } from '../../services/auth.service';
import { isSupabaseEnabled } from '../../config/env';
import { useToast } from '../ui/Toast';
import Input from '../ui/Input';
import Button from '../ui/Button';

type AuthMode = 'register' | 'login';

interface IEmailAuthFormProps {
  mode: AuthMode;
  onSuccess: () => void;
}

const EmailAuthForm: React.FC<IEmailAuthFormProps> = ({ mode, onSuccess }) => {
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
      if (!name.trim()) { toast('Enter your name', 'error'); return; }
      if (password !== confirm) { toast('Passwords do not match', 'error'); return; }
      if (password.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    }

    setLoading(true);
    const { error } =
      mode === 'register'
        ? await signUpWithEmail(name, email, password)
        : await signInWithEmail(email, password);

    if (error) {
      toast(error, 'error');
    } else {
      toast(mode === 'register' ? 'Account created! Check your email.' : 'Welcome back!', 'success');
      onSuccess();
    }
    setLoading(false);
  }, [name, email, password, confirm, mode, onSuccess, toast]);

  return (
    <div className="flex flex-col gap-4">
      {mode === 'register' && (
        <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      )}
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      {mode === 'register' && (
        <Input label="Confirm Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
      )}
      <Button onClick={handleSubmit} loading={loading} size="lg" className="w-full">
        {mode === 'register' ? 'Create Account' : 'Sign In'}
      </Button>
    </div>
  );
};

export default EmailAuthForm;
