import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBlogStore } from '@/store/blogStore';
import { KnowledgeGraph } from './KnowledgeGraph';
import { KnowledgeMapSearch } from './KnowledgeMapSearch';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const KnowledgeMapContainer = () => {
  const categories = useBlogStore((state) => state.categories);
  const posts = useBlogStore((state) => state.posts);
  const tags = useBlogStore((state) => state.tags);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredCategoryIds, setFilteredCategoryIds] = useState<string[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(true); // Show all by default
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0); // Increment to trigger graph reset

  const handleSelectCategory = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
  }, []);

  const handleSearchResults = useCallback((categoryIds: string[]) => {
    setFilteredCategoryIds(categoryIds);
    // Clear selected category when search changes
    if (categoryIds.length > 0) {
      setSelectedCategory(null);
    }
  }, []);

  const handleResetView = useCallback(() => {
    setSelectedCategory(null);
    setFilteredCategoryIds([]);
    setResetTrigger(prev => prev + 1); // Trigger graph reset
  }, []);

  const handleToggleShowAll = useCallback(() => {
    setShowAllCategories(prev => !prev);
  }, []);

  const handleCategoryClickFromGraph = useCallback((categoryId: string) => {
    // Sync the selected category when clicked from graph
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  }, []);

  const handleCollapsePanel = useCallback(() => {
    setIsPanelCollapsed(true);
    // Reset the graph view when collapsing
    setSelectedCategory(null);
    setFilteredCategoryIds([]);
    setResetTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="w-full">
      {/* Desktop Layout */}
      <div className="hidden md:flex gap-4 h-[600px]">
        {/* Left Panel - Search & Categories */}
        <div
          className="relative flex-shrink-0 transition-all duration-300 ease-in-out"
          style={{ width: isPanelCollapsed ? 48 : 320 }}
        >
          {isPanelCollapsed ? (
            /* Collapsed State */
            <div className="h-full w-12 flex flex-col items-center py-4 bg-card border border-border rounded-xl">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPanelCollapsed(false)}
                className="mb-4 h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="flex-1 flex items-center justify-center">
                <span
                  className="text-xs text-muted-foreground whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  Categories
                </span>
              </div>
            </div>
          ) : (
            /* Expanded State */
            <div className="h-full w-80 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
              {/* Header with collapse button */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-sm">Explore Categories</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCollapsePanel}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              {/* Search Component */}
              <div className="flex-1 overflow-hidden p-4">
                <KnowledgeMapSearch
                  categories={categories}
                  posts={posts}
                  tags={tags}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                  onSearchResults={handleSearchResults}
                  onResetView={handleResetView}
                  showAllCategories={showAllCategories}
                  onToggleShowAll={handleToggleShowAll}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Knowledge Graph */}
        <div className="flex-1 min-w-0 h-full">
          <KnowledgeGraph
            filteredCategoryIds={filteredCategoryIds}
            selectedCategory={selectedCategory}
            showAllCategories={showAllCategories}
            onCategoryClick={handleCategoryClickFromGraph}
            resetTrigger={resetTrigger}
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col gap-4">
        {/* Search Panel - Collapsible on mobile */}
        <MobileSearchPanel
          categories={categories}
          posts={posts}
          tags={tags}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onSearchResults={handleSearchResults}
          onResetView={handleResetView}
          showAllCategories={showAllCategories}
          onToggleShowAll={handleToggleShowAll}
        />

        {/* Graph */}
        <div className="h-[400px]">
          <KnowledgeGraph
            filteredCategoryIds={filteredCategoryIds}
            selectedCategory={selectedCategory}
            showAllCategories={showAllCategories}
            onCategoryClick={handleCategoryClickFromGraph}
            resetTrigger={resetTrigger}
          />
        </div>
      </div>
    </div>
  );
};

// Mobile Search Panel Component
interface MobileSearchPanelProps {
  categories: ReturnType<typeof useBlogStore.getState>['categories'];
  posts: ReturnType<typeof useBlogStore.getState>['posts'];
  tags: ReturnType<typeof useBlogStore.getState>['tags'];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onSearchResults: (categoryIds: string[]) => void;
  onResetView: () => void;
  showAllCategories: boolean;
  onToggleShowAll: () => void;
}

const MobileSearchPanel = ({
  categories,
  posts,
  tags,
  selectedCategory,
  onSelectCategory,
  onSearchResults,
  onResetView,
  showAllCategories,
  onToggleShowAll,
}: MobileSearchPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
      >
        <span className="font-semibold text-sm">Search & Filter</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      {/* Expandable Content */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="p-4 border-t border-border max-h-[300px] overflow-y-auto">
          <KnowledgeMapSearch
            categories={categories}
            posts={posts}
            tags={tags}
            selectedCategory={selectedCategory}
            onSelectCategory={(id) => {
              onSelectCategory(id);
              // Collapse on mobile after selection
              setIsExpanded(false);
            }}
            onSearchResults={onSearchResults}
            onResetView={onResetView}
            showAllCategories={showAllCategories}
            onToggleShowAll={onToggleShowAll}
          />
        </div>
      </motion.div>
    </div>
  );
};
