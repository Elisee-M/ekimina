import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'group_admin' | 'member';
  requireGroupAdmin?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  requireGroupAdmin = false 
}: ProtectedRouteProps) {
  const { user, loading, roles, isGroupAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole && !roles.includes(requiredRole) && !isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check group admin requirement
  if (requireGroupAdmin && !isGroupAdmin && !isSuperAdmin) {
    return <Navigate to="/member" replace />;
  }

  return <>{children}</>;
}
