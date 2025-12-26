import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Map, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useAuth } from '@/contexts/AuthContext';

export default function RoadmapsPage() {
  const { roadmaps, isLoading, fetchRoadmaps } = useRoadmapStore();
  const { user, subscription, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  // Only show published roadmaps
  const publishedRoadmaps = roadmaps.filter(r => r.isPublished);

  // Check if user has access (must be subscribed)
  const hasAccess = user && subscription && subscription.is_active;

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="text-center">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
        </div>
      </Layout>
    );
  }

  // Show access denied message if user is not subscribed
  if (!hasAccess) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <Card className="border-2">
            <CardHeader className="text-center pb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4">
                <Lock className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-3xl font-serif mb-3">Subscriber-Only Content</CardTitle>
              <CardDescription className="text-base">
                Learning roadmaps are exclusive to newsletter subscribers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Map className="w-5 h-5 text-primary" />
                  What You'll Get Access To:
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Interactive visual learning roadmaps for various tech domains</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Track your progress as you learn</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Direct links to related blog posts for each topic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Plus regular updates when new content is published</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={() => navigate('/auth?tab=signup')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Subscribe to Access
                </Button>
                {!user && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => navigate('/auth?tab=login')}
                  >
                    Already Subscribed? Sign In
                  </Button>
                )}
              </div>

              {user && !subscription?.is_active && (
                <p className="text-sm text-center text-muted-foreground pt-2">
                  You're signed in but not subscribed. Subscribe to unlock roadmaps!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Map className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-serif font-bold mb-4">Learning Roadmaps</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Visual learning paths to guide your journey through different technology domains.
            Track your progress and explore related blog posts along the way.
          </p>
        </header>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : publishedRoadmaps.length === 0 ? (
          <div className="text-center py-16">
            <Map className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Roadmaps Available</h2>
            <p className="text-muted-foreground">
              Check back soon for learning roadmaps.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {publishedRoadmaps.map((roadmap) => (
              <Link key={roadmap.id} to={`/roadmaps/${roadmap.slug}`}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-2">
                        <Map className="w-6 h-6 text-primary" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="text-xl">{roadmap.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {roadmap.description || 'Explore this learning roadmap'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        Interactive
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Track Progress
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-serif font-bold mb-4">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-yellow-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Explore the Roadmap</h3>
              <p className="text-sm text-muted-foreground">
                Navigate through topics visually and see how they connect.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">Read Related Posts</h3>
              <p className="text-sm text-muted-foreground">
                Click on any topic to find my blog posts about that subject.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">Track Your Progress</h3>
              <p className="text-sm text-muted-foreground">
                Mark topics as complete and watch your progress grow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
