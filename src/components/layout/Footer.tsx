import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, Rss, Globe } from 'lucide-react';
import { useSiteSettingsStore } from '@/store/siteSettingsStore';

// Custom DevTo icon since Lucide doesn't have one
const DevToIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6v4.36h.58c.37 0 .65-.08.84-.23.21-.16.31-.46.31-.88v-2.14c0-.42-.1-.72-.31-.88zm8.57-5.55H8.01c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h7.98c1.1 0 2-.9 2-2v-11c0-1.1-.9-2-2-2zM9.42 14.1c-.42.37-.94.55-1.57.55H6V9.35h1.85c.63 0 1.15.18 1.57.55.42.36.63.92.63 1.68v.84c0 .76-.21 1.32-.63 1.68zm4.73-1.92H11.6v1.47h1.73v.76H11.6v1.24h2.55v.76H10.8V9.35h3.35v.76zm2.85 2.46c-.13.28-.32.5-.59.64-.27.15-.6.22-1 .22-.28 0-.53-.04-.76-.12-.23-.08-.41-.2-.55-.35l.39-.65c.21.2.47.3.77.3.35 0 .52-.17.52-.5v-2.53h.76v2.47c0 .27-.04.5-.13.69z" />
  </svg>
);

export const Footer = () => {
  const { settings, fetchSettings } = useSiteSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">KP</span>
              </div>
              <span className="font-serif text-xl font-semibold">Kerem Pakten Dev</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md">
              {settings.site_description}
            </p>
          </div>

          {/* Connect */}
          <div className="md:text-right">
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex gap-3 md:justify-end">
              <a
                href="https://github.com/egepakten"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/kerem-pakten"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://dev.to/egepakten"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <DevToIcon className="h-4 w-4" />
              </a>
              <a
                href="https://kerempakten.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="mailto:egepakten@icloud.com"
                className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="/rss.xml"
                className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Rss className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Kerem Pakten Dev. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};
