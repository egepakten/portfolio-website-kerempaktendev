import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Shield, Settings } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { UserMenu } from './UserMenu';
import { useAuth } from '@/contexts/AuthContext';
export const Header = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAdminPage = location.pathname.startsWith('/admin');
  const {
    subscription,
    isAdmin
  } = useAuth();
  const isSubscribed = subscription?.is_active;
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const navLinks = [{
    href: '/',
    label: 'Portfolio'
  }, {
    href: '/blog',
    label: 'Blog'
  }, {
    href: '/posts',
    label: 'Posts'
  }, {
    href: '/projects',
    label: 'Projects'
  },
  // Never show Subscribe link on admin pages, and hide it for subscribers
  ...(isSubscribed || isAdminPage ? [] : [{
    href: '/subscribe',
    label: 'Subscribe'
  }]),
  // Show Admin link only for admin users
  ...(isAdmin ? [{
    href: '/admin',
    label: 'Admin',
    icon: Settings
  }] : [])];
  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };
  return <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">KP</span>
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight group-hover:text-primary transition-colors">KeremPaktenDev</span>
          {isAdminPage && <Badge variant="secondary" className="ml-2 gap-1">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navLinks.map(link => 'external' in link && link.external ? <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary">
                {link.label}
              </a> : <Link key={link.href} to={link.href} onClick={scrollToTop} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${isActive(link.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                {'icon' in link && link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>)}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <UserMenu />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <UserMenu />
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && <motion.div initial={{
        opacity: 0,
        height: 0
      }} animate={{
        opacity: 1,
        height: 'auto'
      }} exit={{
        opacity: 0,
        height: 0
      }} className="md:hidden border-t border-border bg-background">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map(link => 'external' in link && link.external ? <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary">
                    {link.label}
                  </a> : <Link key={link.href} to={link.href} onClick={() => {
                setIsMenuOpen(false);
                scrollToTop();
              }} className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${isActive(link.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                    {'icon' in link && link.icon && <link.icon className="w-4 h-4" />}
                    {link.label}
                  </Link>)}
            </nav>
          </motion.div>}
      </AnimatePresence>
    </header>;
};