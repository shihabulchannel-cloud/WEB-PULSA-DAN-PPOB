import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function ProtectedResellerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isReseller, isAdmin } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/reseller/login" replace />;
  // Admin can also access reseller pages for testing
  if (!isReseller && !isAdmin) return <Navigate to="/reseller/login" replace />;
  return <>{children}</>;
}
