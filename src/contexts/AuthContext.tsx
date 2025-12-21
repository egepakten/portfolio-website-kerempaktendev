import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_guest: boolean;
}

interface Subscription {
  id: string;
  email: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, username: string, isGuest?: boolean) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  updateSubscription: (isActive: boolean) => Promise<{ error: Error | null }>;
  deleteAccount: (reason: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data);
  };

  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchSubscription(session.user.email!);
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setSubscription(null);
          setIsAdmin(false);
        }
      }
    );

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([
          fetchProfile(session.user.id),
          fetchSubscription(session.user.email!),
          checkAdminRole(session.user.id)
        ]);
      }
      setLoading(false);
    };
    
    initializeAuth();

    return () => authSubscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) setProfile(data);
  };

  const fetchSubscription = async (email: string) => {
    const { data } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (data) setSubscription(data);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string, isGuest = false) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { username, is_guest: isGuest }
      }
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', user.id);
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...data } : null);
    }
    return { error };
  };

  const updateSubscription = async (isActive: boolean) => {
    if (!user?.email) return { error: new Error('Not authenticated') };
    
    if (subscription) {
      const { error } = await supabase
        .from('subscribers')
        .update({ is_active: isActive })
        .eq('email', user.email);
      if (!error) {
        setSubscription(prev => prev ? { ...prev, is_active: isActive } : null);
      }
      return { error };
    } else if (isActive) {
      const { error } = await supabase
        .from('subscribers')
        .insert({ email: user.email, name: profile?.username, user_id: user.id, is_active: true });
      if (!error) {
        fetchSubscription(user.email);
      }
      return { error };
    }
    return { error: null };
  };

  const deleteAccount = async (reason: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    // Store the deletion record first
    const { error: insertError } = await supabase
      .from('deleted_accounts')
      .insert({
        user_id: user.id,
        email: user.email || '',
        username: profile?.username || null,
        reason,
      });
    
    if (insertError) {
      console.error('Error storing deletion record:', insertError);
      // Continue with deletion even if record fails
    }
    
    // Delete user data in order: comments, likes, profile, subscription
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', user.id);
    
    if (profileError) return { error: profileError };
    
    // Delete subscription
    await supabase
      .from('subscribers')
      .delete()
      .eq('user_id', user.id);
    
    // Delete comments
    await supabase
      .from('post_comments')
      .delete()
      .eq('user_id', user.id);
    
    // Delete likes
    await supabase
      .from('post_likes')
      .delete()
      .eq('user_id', user.id);
    
    // Sign out and clear state
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);
    setIsAdmin(false);
    
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      subscription,
      loading,
      isAdmin,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      updateProfile,
      updateSubscription,
      deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};
