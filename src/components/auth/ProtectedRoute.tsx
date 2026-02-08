import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'group_admin' | 'member';
  requireGroupAdmin?: boolean;
  /**
   * Allows access even if the signed-in user has no group membership yet.
   * Use this ONLY for the onboarding flow.
   */
  allowNoGroup?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  requireGroupAdmin = false,
  allowNoGroup = false,
}: ProtectedRouteProps) {
  const { user, loading, roles, isGroupAdmin, isSuperAdmin, groupMembership, groupMembershipLoaded, rolesLoaded } = useAuth();
  const location = useLocation();

  // Wait for base auth state
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

  // Not signed in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Signed in but roles still loading - wait to determine if super admin
  if (!rolesLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Signed in but group membership still loading (skip for super admins)
  if (!isSuperAdmin && !groupMembershipLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your group...</p>
        </div>
      </div>
    );
  }

  // Enforce group membership unless explicitly allowed (onboarding)
  if (!isSuperAdmin && !allowNoGroup && !groupMembership) {
    return <Navigate to="/onboarding" replace />;
  }

  // Check if user's group is disabled (redirect to group-disabled page)
  if (!isSuperAdmin && groupMembership && groupMembership.group_status === 'disabled') {
    return <Navigate to="/group-disabled" replace />;
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
