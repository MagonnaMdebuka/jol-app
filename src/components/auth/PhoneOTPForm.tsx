import React, { useState, useCallback } from 'react';
import { signInWithPhone, verifyOTP } from '../../services/auth.service';
import { isSupabaseEnabled } from '../../config/env';
import { useToast } from '../ui/Toast';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface IPhoneOTPFormProps {
  onSuccess: () => void;
}

const PhoneOTPForm: React.FC<IPhoneOTPFormProps> = ({ onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const formatPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    return digits.startsWith('27') ? `+${digits}` : `+27${digits.replace(/^0/, '')}`;
  };

  const handleSendOTP = useCallback(async () => {
    if (!phone.trim()) return;
    if (!isSupabaseEnabled()) {
      toast('Demo mode: OTP sent (no Supabase configured)', 'info');
      setStep('otp');
      return;
    }
    setLoading(true);
    const { error } = await signInWithPhone(formatPhone(phone));
    if (error) {
      toast(error, 'error');
    } else {
      setStep('otp');
      toast('OTP sent to your number', 'success');
    }
    setLoading(false);
  }, [phone, toast]);

  const handleVerifyOTP = useCallback(async () => {
    if (!isSupabaseEnabled()) {
      toast('Demo mode: signed in', 'success');
      onSuccess();
      return;
    }
    if (otp.length !== 6) {
      toast('Enter the 6-digit code', 'error');
      return;
    }
    setLoading(true);
    const { error } = await verifyOTP(formatPhone(phone), otp);
    if (error) {
      toast(error, 'error');
    } else {
      onSuccess();
    }
    setLoading(false);
  }, [otp, phone, onSuccess, toast]);

  if (step === 'otp') {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-nz-muted">Enter the 6-digit code sent to your phone.</p>
        <Input
          label="Verification Code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          inputMode="numeric"
          maxLength={6}
        />
        <Button onClick={handleVerifyOTP} loading={loading} size="lg" className="w-full">
          Verify Code
        </Button>
        <button
          onClick={() => setStep('phone')}
          className="text-sm text-nz-muted hover:text-nz-text text-center transition-colors"
          type="button"
        >
          Wrong number? Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label
          className="text-nz-muted block mb-1.5"
          style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', letterSpacing: '0.04em' }}
        >
          MOBILE NUMBER
        </label>
        <div className="flex gap-2">
          <div className="flex items-center bg-nz-elevated border border-nz-border rounded-xl px-3 py-3 text-nz-muted text-sm font-mono shrink-0">
            +27
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="81 234 5678"
            className="flex-1 bg-nz-elevated border border-nz-border rounded-xl px-4 py-3 text-nz-text text-sm placeholder:text-nz-muted/60 outline-none focus:ring-2 focus:ring-nz-accent/50 focus:border-nz-accent/40 transition-all duration-200"
          />
        </div>
      </div>
      <Button onClick={handleSendOTP} loading={loading} size="lg" className="w-full">
        Send OTP
      </Button>
    </div>
  );
};

export default PhoneOTPForm;
