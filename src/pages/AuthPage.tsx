import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

// List of allowed email domains for signup
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'icloud.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'protonmail.com',
  'proton.me',
  'live.com',
  'me.com',
  'mac.com',
  'aol.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'mail.com',
  'tutanota.com',
  'fastmail.com',
];

// List of inappropriate words to block in usernames
const INAPPROPRIATE_WORDS = [
  // Profanity and vulgar terms
  'fuck', 'fucker', 'fucking', 'motherfuck', 'motherfucker', 'fuk', 'fck',
  'shit', 'shit', 'bullshit', 'horseshit', 'crap',
  'damn', 'damned', 'dammit',
  'hell', 'bastard', 'bitch', 'bitching',
  'ass', 'asshole', 'arse', 'arsehole', 'badass',
  'dick', 'dickhead', 'cock', 'penis',
  'pussy', 'vagina', 'cunt',
  'fag', 'faggot', 'queer',
  'nigger', 'nigga', 'negro',
  'retard', 'retarded', 'idiot', 'moron',
  'whore', 'slut', 'prostitute',
  // Sexual terms
  'sex', 'porn', 'xxx', 'anal', 'oral',
  // Reserved system words
  'admin', 'administrator', 'moderator', 'mod',
  'support', 'official', 'system', 'root',
  'bot', 'test', 'demo', 'null', 'undefined',
];

const validateUsername = (username: string): { valid: boolean; message?: string } => {
  if (!username || username.trim().length === 0) {
    return { valid: false, message: 'Display name is required' };
  }

  // Check length
  if (username.length < 2) {
    return { valid: false, message: 'Display name must be at least 2 characters' };
  }

  if (username.length > 30) {
    return { valid: false, message: 'Display name must be less than 30 characters' };
  }

  // Check for excessive special characters (allow basic punctuation like spaces, hyphens, apostrophes)
  const specialCharPattern = /[^a-zA-Z0-9\s\-'\.]/;
  if (specialCharPattern.test(username)) {
    return {
      valid: false,
      message: 'Display name can only contain letters, numbers, spaces, hyphens, and apostrophes',
    };
  }

  // Check for inappropriate words
  const lowerUsername = username.toLowerCase();
  // Remove spaces and common number substitutions to catch variations like "M0therFucker" or "Mother Fucker"
  const normalizedUsername = lowerUsername
    .replace(/\s+/g, '') // Remove spaces
    .replace(/0/g, 'o')   // 0 -> o
    .replace(/1/g, 'i')   // 1 -> i
    .replace(/3/g, 'e')   // 3 -> e
    .replace(/4/g, 'a')   // 4 -> a
    .replace(/5/g, 's')   // 5 -> s
    .replace(/7/g, 't')   // 7 -> t
    .replace(/8/g, 'b')   // 8 -> b
    .replace(/\$/g, 's')  // $ -> s
    .replace(/@/g, 'a');  // @ -> a

  for (const word of INAPPROPRIATE_WORDS) {
    if (normalizedUsername.includes(word)) {
      return {
        valid: false,
        message: 'Display name contains inappropriate content. Please choose a different name.',
      };
    }
  }

  return { valid: true };
};

const validateEmail = (email: string): { valid: boolean; message?: string } => {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }

  // Extract domain from email
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { valid: false, message: 'Please enter a valid email address' };
  }

  // Check if domain is in allowed list
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return {
      valid: false,
      message: `Please use an email from a recognized provider (e.g., Gmail, iCloud, Outlook, Yahoo)`,
    };
  }

  return { valid: true };
};

const checkPasswordStrength = (password: string): { score: number; message: string; color: string } => {
  if (!password) {
    return { score: 0, message: '', color: '' };
  }

  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  // Calculate score
  if (checks.length) score++;
  if (checks.lowercase) score++;
  if (checks.uppercase) score++;
  if (checks.number) score++;
  if (checks.special) score++;

  // Determine strength level
  if (score <= 2) {
    return {
      score,
      message: 'Weak password. Add uppercase, numbers, and special characters.',
      color: 'bg-red-500'
    };
  } else if (score === 3) {
    return {
      score,
      message: 'Fair password. Consider adding more variety.',
      color: 'bg-orange-500'
    };
  } else if (score === 4) {
    return {
      score,
      message: 'Good password. Well protected!',
      color: 'bg-yellow-500'
    };
  } else {
    return {
      score,
      message: 'Strong password. Excellent!',
      color: 'bg-emerald-500'
    };
  }
};

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Get pre-filled values from URL params (from subscribe form)
  const prefilledEmail = searchParams.get('email') || '';
  const prefilledName = searchParams.get('name') || '';
  const defaultTab = searchParams.get('tab') || 'login';

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form - initialize with URL params if coming from subscribe
  const [signupEmail, setSignupEmail] = useState(prefilledEmail);
  const [signupPassword, setSignupPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState(prefilledName);
  const [isGuest, setIsGuest] = useState(false);

  // Password visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Email validation state for signup
  const [emailValidationMessage, setEmailValidationMessage] = useState<string>('');

  // Username validation state
  const [usernameValidationMessage, setUsernameValidationMessage] = useState<string>('');

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    message: string;
    color: string;
  }>({ score: 0, message: '', color: '' });

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Update signup fields when URL params change
  useEffect(() => {
    if (prefilledEmail) {
      setSignupEmail(prefilledEmail);
    }
    if (prefilledName) {
      setSignupUsername(prefilledName);
    }
  }, [prefilledEmail, prefilledName]);

  // Validate username when user changes it
  const handleUsernameChange = (username: string) => {
    setSignupUsername(username);
    if (username) {
      const validation = validateUsername(username);
      if (!validation.valid) {
        setUsernameValidationMessage(validation.message || '');
      } else {
        setUsernameValidationMessage('');
      }
    } else {
      setUsernameValidationMessage('');
    }
  };

  // Validate email when user changes it
  const handleEmailChange = (email: string) => {
    setSignupEmail(email);
    if (email) {
      const validation = validateEmail(email);
      if (!validation.valid) {
        setEmailValidationMessage(validation.message || '');
      } else {
        setEmailValidationMessage('');
      }
    } else {
      setEmailValidationMessage('');
    }
  };

  // Check password strength when user changes it
  const handlePasswordChange = (password: string) => {
    setSignupPassword(password);
    const strength = checkPasswordStrength(password);
    setPasswordStrength(strength);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome back!');
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !signupUsername) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate username
    const usernameValidation = validateUsername(signupUsername);
    if (!usernameValidation.valid) {
      toast.error(usernameValidation.message || 'Invalid display name');
      return;
    }

    // Validate email domain
    const emailValidation = validateEmail(signupEmail);
    if (!emailValidation.valid) {
      toast.error(emailValidation.message || 'Invalid email');
      return;
    }

    if (signupPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupUsername, isGuest);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Account created successfully!');
      navigate('/');
    }
  };


  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-serif text-2xl">Welcome</CardTitle>
              <CardDescription>Sign in to like posts and leave comments</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={defaultTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-username">Display Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-username"
                          type="text"
                          placeholder="Your name"
                          value={signupUsername}
                          onChange={(e) => handleUsernameChange(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {usernameValidationMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-600 dark:text-red-400"
                        >
                          <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <p className="text-sm font-medium leading-relaxed">
                            {usernameValidationMessage}
                          </p>
                        </motion.div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={signupEmail}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {emailValidationMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                        >
                          <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <p className="text-sm font-medium leading-relaxed">
                            {emailValidationMessage}
                          </p>
                        </motion.div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                          className="pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showSignupPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {passwordStrength.message && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                  level <= passwordStrength.score
                                    ? passwordStrength.color
                                    : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                              />
                            ))}
                          </div>
                          <p className={`text-sm font-medium ${
                            passwordStrength.score <= 2 ? 'text-red-600 dark:text-red-400' :
                            passwordStrength.score === 3 ? 'text-orange-600 dark:text-orange-400' :
                            passwordStrength.score === 4 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {passwordStrength.message}
                          </p>
                        </motion.div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is-guest"
                        checked={isGuest}
                        onChange={(e) => setIsGuest(e.target.checked)}
                        className="rounded border-border"
                      />
                      <Label htmlFor="is-guest" className="text-sm text-muted-foreground cursor-pointer">
                        Continue as guest (limited features)
                      </Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AuthPage;
