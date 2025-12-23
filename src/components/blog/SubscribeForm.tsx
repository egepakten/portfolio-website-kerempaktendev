import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface SubscribeFormProps {
  variant?: 'default' | 'compact' | 'hero';
}

export const SubscribeForm = ({ variant = 'default' }: SubscribeFormProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    // Redirect to signup page with pre-filled email and name
    const params = new URLSearchParams();
    params.set('tab', 'signup');
    params.set('email', email.toLowerCase().trim());
    if (name.trim()) {
      params.set('name', name.trim());
    }

    toast.info('Create an account to subscribe and get access to exclusive content!');
    navigate(`/auth?${params.toString()}`);
    setIsLoading(false);
  };

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" disabled={isLoading || isSuccess}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSuccess ? (
            <Check className="h-4 w-4" />
          ) : (
            'Subscribe'
          )}
        </Button>
      </form>
    );
  }

  if (variant === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl border border-border p-8 shadow-soft max-w-md mx-auto"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-serif font-semibold">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">Get notified about new posts</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={255}
          />
          <Button type="submit" className="w-full" disabled={isLoading || isSuccess}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Subscribing...
              </>
            ) : isSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Subscribed!
              </>
            ) : (
              'Subscribe'
            )}
          </Button>
        </form>
        
        <p className="text-xs text-muted-foreground mt-4 text-center">
          No spam, unsubscribe anytime.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="bg-accent/50 rounded-2xl p-8 text-center">
      <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
      <h3 className="font-serif text-2xl font-semibold mb-2">Subscribe to the Newsletter</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Get the latest posts delivered directly to your inbox. No spam, unsubscribe anytime.
      </p>
      
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3">
        <Input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={255}
        />
        <Button type="submit" className="w-full" size="lg" disabled={isLoading || isSuccess}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Subscribing...
            </>
          ) : isSuccess ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Subscribed!
            </>
          ) : (
            'Subscribe'
          )}
        </Button>
      </form>
    </div>
  );
};
