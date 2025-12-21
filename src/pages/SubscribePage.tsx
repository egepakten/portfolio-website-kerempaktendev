import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { SubscribeForm } from '@/components/blog/SubscribeForm';
import { Bell, Mail, Zap, Shield, Check, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const SubscribePage = () => {
  const { user, subscription } = useAuth();
  const isSubscribed = subscription?.is_active;

  const benefits = [
    {
      icon: Bell,
      title: 'New Post Alerts',
      description: 'Get notified when new articles are published',
    },
    {
      icon: Zap,
      title: 'Early Access',
      description: 'Be the first to read new content and tutorials',
    },
    {
      icon: Mail,
      title: 'Curated Content',
      description: 'Receive hand-picked resources and recommendations',
    },
    {
      icon: Shield,
      title: 'No Spam',
      description: 'Unsubscribe anytime, your inbox is safe with us',
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              {isSubscribed ? "You're Subscribed!" : 'Stay in the Loop'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {isSubscribed 
                ? "Thank you for subscribing! You'll receive updates on new posts, tutorials, and insights."
                : 'Join the newsletter and receive updates on new posts, tutorials, and insights about software development and cloud architecture.'}
            </p>
          </motion.div>

          {/* Subscribed State */}
          {isSubscribed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-6">
                <Check className="h-10 w-10 text-primary" />
              </div>
              <p className="text-muted-foreground mb-6">
                Manage your subscription preferences in Settings.
              </p>
              <Link to="/settings">
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Go to Settings
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Benefits - Show for everyone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12"
          >
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 rounded-xl bg-card border border-border"
              >
                <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Subscribe Form - Only show if not subscribed */}
          {!isSubscribed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SubscribeForm variant="hero" />
            </motion.div>
          )}

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16 text-center"
          >
            <h2 className="font-serif text-2xl font-semibold mb-6">Frequently Asked</h2>
            <div className="max-w-2xl mx-auto space-y-6 text-left">
              <div className="p-6 rounded-xl bg-secondary/50">
                <h3 className="font-medium mb-2">How often will I receive emails?</h3>
                <p className="text-sm text-muted-foreground">
                  You'll receive an email whenever a new post is published, typically 1-2 times per week. 
                  No spam, ever.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-secondary/50">
                <h3 className="font-medium mb-2">Can I unsubscribe at any time?</h3>
                <p className="text-sm text-muted-foreground">
                  Absolutely! {user ? 'Go to Settings to manage your subscription, or click' : 'Every email includes'} an unsubscribe link. One click and you're done.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-secondary/50">
                <h3 className="font-medium mb-2">What kind of content will I receive?</h3>
                <p className="text-sm text-muted-foreground">
                  Technical articles about software development, cloud architecture, DevOps, 
                  and modern web technologies.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscribePage;
