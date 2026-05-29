import React, { useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { sendPasswordReset } from '../../services/auth.service';
import { isSupabaseEnabled } from '../../config/env';
import { useToast } from '../ui/Toast';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface IForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm: React.FC<IForgotPasswordFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = useCallback(async () => {
    if (!email.trim()) {
      toast('Enter your email address', 'error');
      return;
    }

    if (!isSupabaseEnabled()) {
      toast('Demo mode: password reset email sent', 'info');
      setSent(true);
      return;
    }

    setLoading(true);
    const { error } = await sendPasswordReset(email);

    if (error) {
      toast(error, 'error');
    } else {
      toast('Check your email for a reset link', 'success');
      setSent(true);
    }
    setLoading(false);
  }, [email, toast]);

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-nz-accent/20 flex items-center justify-center">
          <span className="text-nz-accent text-xl">✓</span>
        </div>
        <h3 className="text-nz-text text-lg font-semibold">Check your email</h3>
        <p className="text-nz-muted text-sm">
          We sent a password reset link to <span className="text-nz-text">{email}</span>
        </p>
        <button
          type="button"
          onClick={onBack}
          className="text-nz-accent text-sm hover:underline mt-2"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-nz-muted text-sm hover:text-nz-text self-start"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div>
        <h3 className="text-nz-text text-lg font-semibold">Reset password</h3>
        <p className="text-nz-muted text-sm mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />

      <Button onClick={handleSubmit} loading={loading} size="lg" className="w-full">
        Send reset link
      </Button>
    </div>
  );
};

export default ForgotPasswordForm;
