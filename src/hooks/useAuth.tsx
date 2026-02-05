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

  // Prevent a stale getSession()/INITIAL_SESSION race from overwriting a fresh SIGNED_IN session.
  // We rely on onAuthStateChange's INITIAL_SESSION event for initialization.
  const hasReceivedAuthEventRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        hasReceivedAuthEventRef.current = true;

        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          // Defer to avoid any potential listener/event-loop deadlocks.
          setTimeout(() => {
            fetchUserData(nextSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setGroupMembership(null);
          setGroupMembershipLoaded(false);
          setRolesLoaded(false);
          setLoading(false);
        }
      }
    );

    // If the library does not emit INITIAL_SESSION for any reason, fall back once.
    // (This is a guard; in normal cases, INITIAL_SESSION will fire.)
    const fallbackTimer = setTimeout(() => {
      if (hasReceivedAuthEventRef.current) return;
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        // Only apply if still no auth event happened.
        if (hasReceivedAuthEventRef.current) return;
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) fetchUserData(s.user.id);
        else setLoading(false);
      });
    }, 1000);

    return () => {
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    // Mark sub-loaders as pending for this user fetch
    setRolesLoaded(false);
    setGroupMembershipLoaded(false);
    setLoading(true);

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      setProfile(profileData ? (profileData as UserProfile) : null);

      // Fetch roles using RPC to bypass RLS recursion
      const { data: rolesData } = await supabase.rpc('get_my_roles');
      setRoles((rolesData || []) as AppRole[]);

      // Fetch group membership using RPC to bypass RLS recursion
      const { data: membershipData } = await supabase.rpc('get_my_group_membership');

      if (membershipData && membershipData.length > 0) {
        const membership = membershipData[0];
        setGroupMembership({
          group_id: membership.group_id,
          group_name: membership.group_name,
          is_admin: membership.is_admin,
        });
      } else {
        setGroupMembership(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fail closed on data, but allow UI to proceed (so user sees screens + toasts instead of infinite loaders)
      setProfile(null);
      setRoles([]);
      setGroupMembership(null);
    } finally {
      setRolesLoaded(true);
      setGroupMembershipLoaded(true);
      setLoading(false);
    }
  };

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Eagerly set state from returned session to avoid any auth-event race,
      // then load the rest of the user context.
      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        await fetchUserData(data.session.user.id);
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return { error: null };
    } catch (error) {
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
    await fetchUserData(user.id);
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
