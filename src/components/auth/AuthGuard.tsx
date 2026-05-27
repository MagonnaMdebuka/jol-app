import React, { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../ui/Spinner';
import { isSupabaseEnabled } from '../../config/env';

interface IAuthGuardProps {
  children: ReactNode;
}

const AuthGuard: React.FC<IAuthGuardProps> = ({ children }) => {
  const { authUser, isOwner, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-nz-bg">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isSupabaseEnabled()) {
    return <>{children}</>;
  }

  if (!authUser) {
    return <Navigate to="/owner/login" replace />;
  }

  if (!isOwner) {
    return <Navigate to="/owner/login" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
