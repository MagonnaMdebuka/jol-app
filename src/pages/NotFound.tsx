import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = useCallback(() => navigate('/'), [navigate]);

  return (
    <div
      className="flex flex-col items-center justify-center h-full px-8 gap-8"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(255,122,61,0.08) 0%, #16110c 65%)',
      }}
    >
      {/* 404 display */}
      <div className="relative flex flex-col items-center">
        <span
          className="text-[120px] font-black leading-none tracking-tighter select-none"
          style={{
            fontFamily: '"Bricolage Grotesque", system-ui',
            color: 'rgba(255,122,61,0.15)',
          }}
        >
          404
        </span>
        <div
          className="-mt-4 p-4 rounded-3xl"
          style={{
            background: 'rgba(42,32,20,1)',
            border: '1px solid rgba(58,44,27,1)',
            boxShadow: '0 0 40px rgba(255,122,61,0.15)',
          }}
        >
          <span className="text-nz-accent text-3xl">✦</span>
        </div>
      </div>

      <div className="text-center">
        <h1
          className="text-nz-text mb-2"
          style={{
            fontFamily: '"Bricolage Grotesque", system-ui',
            fontWeight: 900,
            fontSize: '24px',
          }}
        >
          Page not found
        </h1>
        <p className="text-nz-muted text-sm leading-relaxed max-w-xs">
          This spot doesn't exist. Head back to discover what's happening near you.
        </p>
      </div>

      <Button onClick={handleBack} size="lg" icon={<ArrowLeft size={16} />} className="w-full max-w-xs">
        Back to Map
      </Button>
    </div>
  );
};

export default NotFound;
