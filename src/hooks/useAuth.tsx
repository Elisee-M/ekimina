import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'super_admin' | 'group_admin' | 'member';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

interface GroupMembership {
  group_id: string;
  group_name: string;
  is_admin: boolean;
  group_status: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  roles: AppRole[];
  groupMembership: GroupMembership | null;
  groupMembershipLoaded: boolean;
  rolesLoaded: boolean;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => Promise<{ error: Error | null; didSignIn: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  isSuperAdmin: boolean;
  isGroupAdmin: boolean;
  isMember: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [groupMembership, setGroupMembership] = useState<GroupMembership | null>(null);
  const [groupMembershipLoaded, setGroupMembershipLoaded] = useState(false);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Track if we're in the middle of a manual sign-in to prevent duplicate fetches
  const isManualAuthRef = useRef(false);
  const isMountedRef = useRef(true);

  // Fetch user data helper - does NOT control loading state externally
  const fetchUserDataInternal = async (userId: string): Promise<{
    profile: UserProfile | null;
    roles: AppRole[];
    groupMembership: GroupMembership | null;
  }> => {
    try {
      // Fetch all data in parallel
      const [profileResult, rolesResult, membershipResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.rpc('get_my_roles'),
        supabase.rpc('get_my_group_membership'),
      ]);

      const profileData = profileResult.data ? (profileResult.data as UserProfile) : null;
      const rolesData = (rolesResult.data || []) as AppRole[];

      let groupMembershipData: GroupMembership | null = null;
      if (membershipResult.data && membershipResult.data.length > 0) {
        const membership = membershipResult.data[0];
        groupMembershipData = {
          group_id: membership.group_id,
          group_name: membership.group_name,
          is_admin: membership.is_admin,
          group_status: membership.group_status || 'active',
        };
      }

      return { profile: profileData, roles: rolesData, groupMembership: groupMembershipData };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { profile: null, roles: [], groupMembership: null };
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // INITIAL LOAD - controls loading state
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!isMountedRef.current) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          // Fetch all user data BEFORE setting loading to false
          const userData = await fetchUserDataInternal(initialSession.user.id);
          
          if (!isMountedRef.current) return;
          
          setProfile(userData.profile);
          setRoles(userData.roles);
          setGroupMembership(userData.groupMembership);
          setRolesLoaded(true);
          setGroupMembershipLoaded(true);
        } else {
          setRolesLoaded(true);
          setGroupMembershipLoaded(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMountedRef.current) {
          setRolesLoaded(true);
          setGroupMembershipLoaded(true);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    // ONGOING AUTH CHANGES - does NOT control loading state (except on logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!isMountedRef.current) return;

        // Skip if this is triggered by our own manual auth
        if (isManualAuthRef.current) {
          return;
        }

        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          // Fire and forget - don't await, don't set loading
          // This handles cases like token refresh
          fetchUserDataInternal(nextSession.user.id).then((userData) => {
            if (!isMountedRef.current) return;
            setProfile(userData.profile);
            setRoles(userData.roles);
            setGroupMembership(userData.groupMembership);
            setRolesLoaded(true);
            setGroupMembershipLoaded(true);
          });
        } else {
          // User logged out
          setProfile(null);
          setRoles([]);
          setGroupMembership(null);
          setGroupMembershipLoaded(true);
          setRolesLoaded(true);
          setLoading(false);
        }
      }
    );

    initializeAuth();

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone: phone || null,
          },
        },
      });

      if (error) throw error;

      const didSignIn = Boolean(data.session);

      if (didSignIn && data.session?.user) {
        // Mark as manual auth to prevent duplicate fetches
        isManualAuthRef.current = true;
        
        setSession(data.session);
        setUser(data.session.user);
        
        // Fetch user data
        const userData = await fetchUserDataInternal(data.session.user.id);
        setProfile(userData.profile);
        setRoles(userData.roles);
        setGroupMembership(userData.groupMembership);
        setRolesLoaded(true);
        setGroupMembershipLoaded(true);
        
        // Reset manual auth flag after a short delay
        setTimeout(() => {
          isManualAuthRef.current = false;
        }, 100);
      }

      toast({
        title: "Account created!",
        description: didSignIn
          ? "Welcome to eKimina. Finishing setup…"
          : "Please check your email to confirm your account, then sign in.",
      });

      return { error: null, didSignIn };
    } catch (error) {
      const err = error as Error;
      toast({
        title: "Sign up failed",
        description: err.message,
        variant: "destructive",
      });
      return { error: err, didSignIn: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Mark as manual auth to prevent duplicate fetches from onAuthStateChange
      isManualAuthRef.current = true;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        isManualAuthRef.current = false;
        throw error;
      }

      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        
        // Fetch all user data before navigation
        const userData = await fetchUserDataInternal(data.session.user.id);
        
        setProfile(userData.profile);
        setRoles(userData.roles);
        setGroupMembership(userData.groupMembership);
        setRolesLoaded(true);
        setGroupMembershipLoaded(true);
      }

      // Reset manual auth flag after a short delay to allow state to settle
      setTimeout(() => {
        isManualAuthRef.current = false;
      }, 100);

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return { error: null };
    } catch (error) {
      isManualAuthRef.current = false;
      const err = error as Error;
      toast({
        title: "Sign in failed",
        description: err.message,
        variant: "destructive",
      });
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setGroupMembership(null);
    setGroupMembershipLoaded(false);
    setRolesLoaded(false);
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const refreshUserData = async () => {
    if (!user) return;
    const userData = await fetchUserDataInternal(user.id);
    setProfile(userData.profile);
    setRoles(userData.roles);
    setGroupMembership(userData.groupMembership);
    setRolesLoaded(true);
    setGroupMembershipLoaded(true);
  };

  const isSuperAdmin = roles.includes('super_admin');
  const isGroupAdmin = groupMembership?.is_admin ?? false;
  const isMember = roles.includes('member');

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      roles,
      groupMembership,
      groupMembershipLoaded,
      rolesLoaded,
      loading,
      signUp,
      signIn,
      signOut,
      refreshUserData,
      isSuperAdmin,
      isGroupAdmin,
      isMember
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
