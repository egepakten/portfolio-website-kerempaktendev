import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Map, Lock, Mail } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RoadmapViewer } from '@/components/roadmap/RoadmapViewer';
import { useAuth } from '@/contexts/AuthContext';

export default function RoadmapPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, subscription, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Check if user has access (must be subscribed)
  const hasAccess = user && subscription && subscription.is_active;

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-96 w-full rounded-xl" />
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
                This roadmap is exclusive to newsletter subscribers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
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

              <div className="text-center pt-4">
                <Link to="/roadmaps">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Roadmaps
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!slug) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <Map className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Roadmap Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The roadmap you're looking for doesn't exist.
          </p>
          <Link to="/roadmaps">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Roadmaps
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <Link to="/roadmaps">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Roadmaps
            </Button>
          </Link>
        </div>

        <RoadmapViewer
          slug={slug}
          showProgress={true}
          showLegend={true}
          className="rounded-xl shadow-lg"
        />

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Click on any node to see related blog posts and mark topics as completed.
          </p>
          <p className="mt-1">
            Your progress is saved locally in your browser.
          </p>
        </div>
      </div>
    </Layout>
  );
}
