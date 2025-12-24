import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import PortfolioPage from "./pages/PortfolioPage";
import Index from "./pages/Index";
import PostsPage from "./pages/PostsPage";
import PostPage from "./pages/PostPage";
import CategoryPage from "./pages/CategoryPage";
import TagPage from "./pages/TagPage";
import SubscribePage from "./pages/SubscribePage";
import SearchPage from "./pages/SearchPage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import SettingsPage from "./pages/SettingsPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import AdminProjectsPage from "./pages/AdminProjectsPage";
import AdminDailyProgressPage from "./pages/AdminDailyProgressPage";
import AdminRoadmapsPage from "./pages/AdminRoadmapsPage";
import AdminRoadmapEditorPage from "./pages/AdminRoadmapEditorPage";
import RoadmapsPage from "./pages/RoadmapsPage";
import RoadmapPage from "./pages/RoadmapPage";
import NotFound from "./pages/NotFound";
import { useBlogStore } from "./store/blogStore";

const queryClient = new QueryClient();

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AppContent = () => {
  const fetchData = useBlogStore((state) => state.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<PortfolioPage />} />
        <Route path="/blog" element={<Index />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/posts/:slug" element={<PostPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/tag/:slug" element={<TagPage />} />
        <Route path="/subscribe" element={<SubscribePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/projects" element={<AdminProjectsPage />} />
        <Route path="/admin/projects/:id/daily-progress" element={<AdminDailyProgressPage />} />
        <Route path="/admin/roadmaps" element={<AdminRoadmapsPage />} />
        <Route path="/admin/roadmaps/:id/edit" element={<AdminRoadmapEditorPage />} />
        <Route path="/roadmaps" element={<RoadmapsPage />} />
        <Route path="/roadmaps/:slug" element={<RoadmapPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
