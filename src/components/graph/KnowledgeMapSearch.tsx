import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search, X, FolderOpen, FileText, RotateCcw, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Category, Post, Tag } from '@/types';
import {
  Monitor,
  Server,
  Settings,
  Cloud,
  Brain,
  Atom,
  FileType,
  Hexagon,
  Database,
  LucideIcon,
} from 'lucide-react';

interface KnowledgeMapSearchProps {
  categories: Category[];
  posts: Post[];
  tags: Tag[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onSearchResults: (categoryIds: string[]) => void;
  onResetView: () => void;
  showAllCategories: boolean;
  onToggleShowAll: () => void;
}

interface SearchResult {
  type: 'category' | 'post';
  id: string;
  title: string;
  categoryId?: string;
  categoryName?: string;
  color?: string;
  icon?: string;
  postCount?: number;
  matchedIn?: string;
}

const iconMap: Record<string, LucideIcon> = {
  Monitor,
  Server,
  Settings,
  Cloud,
  Brain,
  Atom,
  FileType,
  Hexagon,
  Database,
};

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
  sage: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
};

export const KnowledgeMapSearch = ({
  categories,
  posts,
  tags,
  selectedCategory,
  onSelectCategory,
  onSearchResults,
  onResetView,
  showAllCategories,
  onToggleShowAll,
}: KnowledgeMapSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get published posts only
  const publishedPosts = useMemo(() =>
    posts.filter(p => p.status === 'published'),
    [posts]
  );

  // Categories with their post counts
  const categoriesWithCounts = useMemo(() => {
    return categories.map(cat => {
      const postCount = publishedPosts.filter(p => {
        if (p.categoryId === cat.id) return true;
        // Check if post is in a subcategory of this category
        const postCat = categories.find(c => c.id === p.categoryId);
        return postCat?.parentId === cat.id;
      }).length;
      return { ...cat, postCount };
    }).filter(cat => cat.postCount > 0);
  }, [categories, publishedPosts]);

  // Main categories (no parent)
  const mainCategories = useMemo(() =>
    categoriesWithCounts.filter(c => !c.parentId).sort((a, b) => (b.postCount || 0) - (a.postCount || 0)),
    [categoriesWithCounts]
  );

  // Search results
  const searchResults = useMemo((): SearchResult[] => {
    if (!debouncedQuery.trim()) return [];

    const query = debouncedQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Search categories
    categoriesWithCounts.forEach(cat => {
      if (cat.name.toLowerCase().includes(query)) {
        results.push({
          type: 'category',
          id: cat.id,
          title: cat.name,
          color: cat.color,
          icon: cat.icon,
          postCount: cat.postCount,
          matchedIn: 'name',
        });
      }
    });

    // Search posts
    publishedPosts.forEach(post => {
      const category = categories.find(c => c.id === post.categoryId);
      let matchedIn: string | undefined;

      if (post.title.toLowerCase().includes(query)) {
        matchedIn = 'title';
      } else if (post.excerpt?.toLowerCase().includes(query)) {
        matchedIn = 'excerpt';
      } else if (post.tags?.some(t => t.name.toLowerCase().includes(query))) {
        matchedIn = 'tags';
      }

      if (matchedIn) {
        results.push({
          type: 'post',
          id: post.id,
          title: post.title,
          categoryId: post.categoryId,
          categoryName: category?.name,
          color: category?.color,
          matchedIn,
        });
      }
    });

    return results.slice(0, 20); // Limit results
  }, [debouncedQuery, categoriesWithCounts, publishedPosts, categories]);

  // Update graph filter based on search
  useEffect(() => {
    if (debouncedQuery.trim()) {
      const categoryIds = new Set<string>();
      searchResults.forEach(result => {
        if (result.type === 'category') {
          categoryIds.add(result.id);
        } else if (result.categoryId) {
          categoryIds.add(result.categoryId);
        }
      });
      onSearchResults(Array.from(categoryIds));
    } else {
      onSearchResults([]);
    }
  }, [searchResults, debouncedQuery, onSearchResults]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const maxIndex = searchResults.length > 0 ? searchResults.length - 1 : mainCategories.length - 1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => Math.min(prev + 1, maxIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      if (searchResults.length > 0) {
        const result = searchResults[focusedIndex];
        if (result.type === 'category') {
          onSelectCategory(result.id);
        } else if (result.categoryId) {
          onSelectCategory(result.categoryId);
        }
      } else if (mainCategories[focusedIndex]) {
        onSelectCategory(mainCategories[focusedIndex].id);
      }
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      setFocusedIndex(-1);
      inputRef.current?.blur();
    }
  }, [focusedIndex, searchResults, mainCategories, onSelectCategory]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setFocusedIndex(-1);
    onSearchResults([]);
  };

  const handleCategoryClick = (categoryId: string) => {
    // Toggle selection - selecting same category deselects it
    onSelectCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">{part}</mark>
        : part
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search categories, posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onResetView}
          className="flex-1 text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleShowAll}
          className="flex-1 text-xs"
        >
          {showAllCategories ? (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Top 5
            </>
          ) : (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Show All
            </>
          )}
        </Button>
      </div>

      {/* Results / Category List */}
      <ScrollArea className="flex-1 -mr-4 pr-4">
        <div ref={resultsRef}>
          <AnimatePresence mode="wait">
            {searchQuery.trim() ? (
              /* Search Results */
              <motion.div
                key="search-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {searchResults.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No results found for "{debouncedQuery}"</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground mb-2">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    </p>
                    {searchResults.map((result, index) => {
                      const colors = colorClasses[result.color || 'sage'];
                      const IconComponent = result.icon ? iconMap[result.icon] : null;
                      const isCategory = result.type === 'category';

                      return (
                        <motion.button
                          key={`${result.type}-${result.id}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => {
                            if (isCategory) {
                              handleCategoryClick(result.id);
                            } else if (result.categoryId) {
                              handleCategoryClick(result.categoryId);
                            }
                          }}
                          className={`
                            w-full p-3 rounded-lg border text-left transition-all
                            ${focusedIndex === index ? 'ring-2 ring-primary' : ''}
                            ${colors.border} ${colors.bg}
                            hover:shadow-md hover:-translate-y-0.5
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded ${colors.bg} ${colors.text}`}>
                              {isCategory && IconComponent ? (
                                <IconComponent className="h-4 w-4" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">
                                {highlightMatch(result.title, debouncedQuery)}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {isCategory ? (
                                  <Badge variant="secondary" className="text-xs">
                                    {result.postCount} post{result.postCount !== 1 ? 's' : ''}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    in {result.categoryName}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  • matched in {result.matchedIn}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              /* Category List */
              <motion.div
                key="category-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-xs text-muted-foreground mb-2">
                  Categories ({mainCategories.length})
                </p>
                <div className="space-y-1">
                  {mainCategories.map((category, index) => {
                    const colors = colorClasses[category.color || 'sage'];
                    const IconComponent = category.icon ? iconMap[category.icon] : FolderOpen;
                    const isSelected = selectedCategory === category.id;
                    const subCategories = categoriesWithCounts.filter(c => c.parentId === category.id);

                    return (
                      <div key={category.id}>
                        <motion.button
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleCategoryClick(category.id)}
                          className={`
                            w-full p-3 rounded-lg border text-left transition-all
                            ${focusedIndex === index ? 'ring-2 ring-primary' : ''}
                            ${isSelected ? 'ring-2 ring-primary shadow-md' : ''}
                            ${colors.border} ${colors.bg}
                            hover:shadow-md hover:-translate-y-0.5
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${colors.bg} ${colors.text}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">
                                {category.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {category.postCount}
                              </Badge>
                              {subCategories.length > 0 && (
                                <ChevronDown className={`h-4 w-4 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                              )}
                            </div>
                          </div>
                        </motion.button>

                        {/* Subcategories */}
                        <AnimatePresence>
                          {isSelected && subCategories.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="pl-4 mt-1 space-y-1">
                                {subCategories.map(subCat => {
                                  const subColors = colorClasses[subCat.color || 'sage'];
                                  return (
                                    <button
                                      key={subCat.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectCategory(subCat.id);
                                      }}
                                      className={`
                                        w-full p-2 rounded-md border text-left transition-all text-sm
                                        ${selectedCategory === subCat.id ? 'ring-2 ring-primary' : ''}
                                        ${subColors.border} ${subColors.bg}
                                        hover:shadow-sm
                                      `}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-foreground">{subCat.name}</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {subCat.postCount}
                                        </Badge>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
};
