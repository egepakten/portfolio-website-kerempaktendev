import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Map } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { RoadmapViewer } from '@/components/roadmap/RoadmapViewer';

export default function RoadmapPage() {
  const { slug } = useParams<{ slug: string }>();

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
