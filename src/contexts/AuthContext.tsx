import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
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
  // Track recent sign-ups to prevent duplicate welcome emails
  const recentSignUpsRef = useRef<Set<string>>(new Set());

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
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check if this is a new user signing in for the first time (after email confirmation)
          // Only send welcome email if we haven't already sent it for this user (via signUp)
          if (event === 'SIGNED_IN') {
            const userId = session.user.id;
            
            // Only send if we haven't already handled this sign-up recently
            if (!recentSignUpsRef.current.has(userId)) {
              const userCreatedAt = new Date(session.user.created_at);
              const now = new Date();
              const minutesSinceCreation = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60);
              
              // Only send if user was created within last 5 minutes (likely new sign-up)
              if (minutesSinceCreation < 5) {
                // Mark this user so we don't send duplicate email
                recentSignUpsRef.current.add(userId);
                
                // Fetch profile to get username
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('username')
                  .eq('user_id', userId)
                  .maybeSingle();
                
                if (profileData) {
                  // Send welcome email
                  sendWelcomeEmail(session.user.email!, profileData.username);
                }
                
                // Clean up after 10 minutes
                setTimeout(() => {
                  recentSignUpsRef.current.delete(userId);
                }, 10 * 60 * 1000);
              }
            }
          }
          
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

  const sendWelcomeEmail = async (email: string, username?: string, verificationUrl?: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase configuration for welcome email');
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email,
          name: username,
          verificationUrl: verificationUrl || `${window.location.origin}/auth?tab=login`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error sending welcome email:', errorData);
      } else {
        console.log('Welcome email sent successfully to:', email);
      }
    } catch (error) {
      console.error('Error calling send-welcome-email Edge Function:', error);
      // Don't throw error - welcome email failure shouldn't block sign-up
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string, isGuest = false) => {
    // Use the current origin (localhost:8080) for email redirect
    const redirectUrl = `${window.location.origin}/auth`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { username, is_guest: isGuest }
      }
    });
    
    // If sign-up succeeds and user is immediately signed in (no email confirmation required)
    // send welcome email immediately and mark user to prevent duplicate in onAuthStateChange
    if (!error && data.user && data.session) {
      const userId = data.user.id;
      // Mark this user so onAuthStateChange doesn't send duplicate email
      recentSignUpsRef.current.add(userId);
      
      // Send welcome email after a short delay to ensure profile is created
      setTimeout(() => {
        sendWelcomeEmail(email, username);
      }, 1500);
      
      // Clean up after 10 minutes
      setTimeout(() => {
        recentSignUpsRef.current.delete(userId);
      }, 10 * 60 * 1000);
    }
    // If email confirmation is required, the welcome email will be sent via onAuthStateChange
    // when the user confirms their email and signs in
    
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    // Welcome email will be sent via onAuthStateChange when user signs in
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
    
    const userId = user.id;
    
    // Store the deletion record first
    const { error: insertError } = await supabase
      .from('deleted_accounts')
      .insert({
        user_id: userId,
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
      .eq('user_id', userId);
    
    if (profileError) return { error: profileError };
    
    // Delete subscription
    await supabase
      .from('subscribers')
      .delete()
      .eq('user_id', userId);
    
    // Delete comments
    await supabase
      .from('post_comments')
      .delete()
      .eq('user_id', userId);
    
    // Delete likes
    await supabase
      .from('post_likes')
      .delete()
      .eq('user_id', userId);
    
    // Delete user from Supabase Auth using Edge Function
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!accessToken || !supabaseUrl) {
        console.error('Missing required credentials for user deletion');
      } else {
        const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseAnonKey || '',
          },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error deleting user from Auth:', errorData);
          // Continue with sign out even if Edge Function fails
        }
      }
    } catch (error) {
      console.error('Error calling delete-user Edge Function:', error);
      // Continue with sign out even if Edge Function fails
    }
    
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
