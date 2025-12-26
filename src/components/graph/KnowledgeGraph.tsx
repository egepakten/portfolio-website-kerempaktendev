import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { useBlogStore } from '@/store/blogStore';
import { useAuth } from '@/contexts/AuthContext';
import { CategoryNode } from './CategoryNode';
import { PostNode } from './PostNode';

const nodeTypes: NodeTypes = {
  category: CategoryNode as unknown as NodeTypes['category'],
  post: PostNode as unknown as NodeTypes['post'],
};

// Helper to shorten title for display
const shortenTitle = (title: string, maxLength: number = 30): string => {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
};

interface KnowledgeGraphInnerProps {
  filteredCategoryIds?: string[];
  selectedCategory?: string | null;
  showAllCategories?: boolean;
  onCategoryClick?: (categoryId: string) => void;
  resetTrigger?: number;
}

const KnowledgeGraphInner = ({
  filteredCategoryIds = [],
  selectedCategory = null,
  showAllCategories = true, // Default to showing all
  onCategoryClick,
  resetTrigger = 0,
}: KnowledgeGraphInnerProps) => {
  const navigate = useNavigate();
  const { user, subscription } = useAuth();
  const isSubscribed = user && subscription?.is_active;
  const { fitView, setCenter, getZoom } = useReactFlow();
  const categories = useBlogStore((state) => state.categories);
  const posts = useBlogStore((state) => state.posts);

  // Track which categories are expanded (showing their posts)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Use controlled nodes and edges for smooth animations
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Track if we need to focus on a category
  const prevSelectedCategory = useRef<string | null>(null);

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);
  const defaultViewport = useMemo(() => ({ x: 50, y: 20, zoom: 0.85 }), []);

  // Calculate nodes and edges based on expanded state
  const { calculatedNodes, calculatedEdges, categoryPositions } = useMemo(() => {
    const publishedPosts = posts.filter(p => p.status === 'published');

    // Find categories that have posts (directly or through children)
    const categoriesWithPosts = new Set<string>();

    publishedPosts.forEach(post => {
      if (post.categoryId) {
        categoriesWithPosts.add(post.categoryId);
        // Also add parent category if this is a subcategory
        const category = categories.find(c => c.id === post.categoryId);
        if (category?.parentId) {
          categoriesWithPosts.add(category.parentId);
        }
      }
    });

    // Filter to only categories with posts
    let activeMainCategories = categories.filter(
      c => !c.parentId && categoriesWithPosts.has(c.id)
    );

    // Sort by post count (descending)
    activeMainCategories = activeMainCategories.sort((a, b) => {
      const aCount = publishedPosts.filter(p => {
        const postCat = categories.find(c => c.id === p.categoryId);
        return p.categoryId === a.id || postCat?.parentId === a.id;
      }).length;
      const bCount = publishedPosts.filter(p => {
        const postCat = categories.find(c => c.id === p.categoryId);
        return p.categoryId === b.id || postCat?.parentId === b.id;
      }).length;
      return bCount - aCount;
    });

    // Apply filtering based on search results only
    if (filteredCategoryIds.length > 0) {
      activeMainCategories = activeMainCategories.filter(c => filteredCategoryIds.includes(c.id));
    } else if (!showAllCategories && activeMainCategories.length > 5) {
      // Show top 5 categories by default (unless selected category is outside top 5)
      const top5Ids = new Set(activeMainCategories.slice(0, 5).map(c => c.id));
      if (selectedCategory) {
        // Find if selected is a main category or get its parent
        const selectedCat = categories.find(c => c.id === selectedCategory);
        const mainCatId = selectedCat?.parentId || selectedCategory;
        if (!top5Ids.has(mainCatId)) {
          const mainCat = activeMainCategories.find(c => c.id === mainCatId);
          if (mainCat) {
            activeMainCategories = [
              ...activeMainCategories.slice(0, 5),
              mainCat,
            ];
          }
        }
      }
      if (!selectedCategory) {
        activeMainCategories = activeMainCategories.slice(0, 5);
      }
    }

    const activeSubCategories = categories.filter(
      c => c.parentId && categoriesWithPosts.has(c.id)
    );

    // Layout constants
    const MAIN_SPACING = 300;
    const SUB_SPACING = 200;
    const POST_SPACING = 200;
    const MAIN_Y = 40;
    const SUB_Y = 180;

    // Calculate center offset for main categories
    const mainOffset = ((activeMainCategories.length - 1) * MAIN_SPACING) / 2;

    // Track positions for focus functionality
    const positions: Record<string, { x: number; y: number }> = {};

    // Determine which categories should be highlighted/dimmed
    const getNodeState = (catId: string, parentId?: string) => {
      if (!selectedCategory) {
        return { isSelected: false, isDimmed: false };
      }

      const isSelected = selectedCategory === catId;
      const isParentOfSelected = categories.find(c => c.id === selectedCategory)?.parentId === catId;
      const isChildOfSelected = parentId === selectedCategory;

      return {
        isSelected,
        isDimmed: !isSelected && !isParentOfSelected && !isChildOfSelected,
      };
    };

    // Create main category nodes
    const mainNodes: Node[] = activeMainCategories.map((cat, index) => {
      const x = index * MAIN_SPACING - mainOffset + 400;
      const y = MAIN_Y;
      positions[cat.id] = { x, y };

      const { isSelected, isDimmed } = getNodeState(cat.id);

      return {
        id: cat.id,
        type: 'category',
        position: { x, y },
        data: {
          label: cat.name,
          description: cat.description,
          color: cat.color,
          icon: cat.icon,
          postCount: publishedPosts.filter(p => {
            const postCat = categories.find(c => c.id === p.categoryId);
            return p.categoryId === cat.id || postCat?.parentId === cat.id;
          }).length,
          slug: cat.slug,
          isExpanded: expandedCategories.has(cat.id),
          isSelected,
          isDimmed,
        },
      };
    });

    // Create sub-category nodes with proper positioning (only if parent is expanded)
    const subNodes: Node[] = [];
    const subPositions: Map<string, { x: number; y: number }> = new Map();

    activeMainCategories.forEach((mainCat, mainIndex) => {
      // Only show sub-categories if parent is expanded
      if (!expandedCategories.has(mainCat.id)) return;

      const childCats = activeSubCategories.filter(c => c.parentId === mainCat.id);
      const childOffset = ((childCats.length - 1) * SUB_SPACING) / 2;
      const mainX = mainIndex * MAIN_SPACING - mainOffset + 400;

      childCats.forEach((cat, subIndex) => {
        const x = mainX + subIndex * SUB_SPACING - childOffset;
        const y = SUB_Y;
        subPositions.set(cat.id, { x, y });
        positions[cat.id] = { x, y };

        const { isSelected, isDimmed } = getNodeState(cat.id, cat.parentId);

        subNodes.push({
          id: cat.id,
          type: 'category',
          position: { x, y },
          data: {
            label: cat.name,
            description: cat.description,
            color: cat.color,
            icon: cat.icon,
            postCount: publishedPosts.filter(p => p.categoryId === cat.id).length,
            slug: cat.slug,
            isExpanded: expandedCategories.has(cat.id),
            isSelected,
            isDimmed,
          },
        });
      });
    });

    // Create post nodes under their categories (only if category is expanded)
    const postNodes: Node[] = [];
    const postsGroupedByCategory: Map<string, typeof publishedPosts> = new Map();

    publishedPosts.forEach(post => {
      if (post.categoryId) {
        const existing = postsGroupedByCategory.get(post.categoryId) || [];
        existing.push(post);
        postsGroupedByCategory.set(post.categoryId, existing);
      }
    });

    postsGroupedByCategory.forEach((categoryPosts, categoryId) => {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return;

      // Only show posts if the category is expanded
      if (!expandedCategories.has(categoryId)) return;

      let parentX: number;
      let parentY: number;

      if (category.parentId) {
        // Sub-category - only show if parent is also expanded
        if (!expandedCategories.has(category.parentId)) return;

        const pos = subPositions.get(categoryId);
        if (pos) {
          parentX = pos.x;
          parentY = pos.y;
        } else {
          return;
        }
      } else {
        // Main category (posts directly under it)
        const mainIndex = activeMainCategories.findIndex(c => c.id === categoryId);
        if (mainIndex === -1) return;
        const mainOffset2 = ((activeMainCategories.length - 1) * MAIN_SPACING) / 2;
        parentX = mainIndex * MAIN_SPACING - mainOffset2 + 400;
        parentY = MAIN_Y;
      }

      const postOffset = ((categoryPosts.length - 1) * POST_SPACING) / 2;

      categoryPosts.forEach((post, postIndex) => {
        postNodes.push({
          id: `post-${post.id}`,
          type: 'post',
          position: {
            x: parentX + postIndex * POST_SPACING - postOffset,
            y: parentY + 140,
          },
          data: {
            label: shortenTitle(post.title, 35),
            slug: post.slug,
            color: category.color,
            isSubscriberOnly: post.isSubscriberOnly || false,
          },
        });
      });
    });

    // Create edges
    const edgesData: Edge[] = [];

    // Main to sub-category edges (only if parent is expanded)
    activeSubCategories.forEach(cat => {
      if (cat.parentId && categoriesWithPosts.has(cat.parentId) && expandedCategories.has(cat.parentId)) {
        edgesData.push({
          id: `${cat.parentId}-${cat.id}`,
          source: cat.parentId,
          target: cat.id,
          style: { stroke: 'hsl(var(--border))' },
          animated: false,
        });
      }
    });

    // Category to post edges (only if category is expanded)
    postsGroupedByCategory.forEach((categoryPosts, categoryId) => {
      if (!expandedCategories.has(categoryId)) return;

      const category = categories.find(c => c.id === categoryId);
      if (category?.parentId && !expandedCategories.has(category.parentId)) return;

      categoryPosts.forEach(post => {
        edgesData.push({
          id: `${categoryId}-post-${post.id}`,
          source: categoryId,
          target: `post-${post.id}`,
          style: { stroke: 'hsl(var(--border))', strokeDasharray: '5 5' },
          animated: false,
        });
      });
    });

    return {
      calculatedNodes: [...mainNodes, ...subNodes, ...postNodes],
      calculatedEdges: edgesData,
      categoryPositions: positions,
    };
  }, [categories, posts, expandedCategories, filteredCategoryIds, selectedCategory, showAllCategories]);

  // Update nodes and edges with smooth transition
  useEffect(() => {
    setNodes(calculatedNodes);
    setEdges(calculatedEdges);
  }, [calculatedNodes, calculatedEdges, setNodes, setEdges]);

  // Focus on selected category when it changes
  useEffect(() => {
    if (selectedCategory && selectedCategory !== prevSelectedCategory.current) {
      const position = categoryPositions[selectedCategory];
      if (position) {
        // Expand the category if not already expanded
        setExpandedCategories(prev => {
          const newSet = new Set(prev);
          newSet.add(selectedCategory);
          return newSet;
        });

        // Center on the category with animation
        setTimeout(() => {
          setCenter(position.x + 80, position.y + 50, { zoom: getZoom(), duration: 500 });
        }, 100);
      }
    }
    prevSelectedCategory.current = selectedCategory;
  }, [selectedCategory, categoryPositions, setCenter, getZoom]);

  // Reset view when filteredCategoryIds change (clear search)
  useEffect(() => {
    if (filteredCategoryIds.length === 0 && !selectedCategory) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 500 });
      }, 100);
    }
  }, [filteredCategoryIds, selectedCategory, fitView]);

  // Reset everything when resetTrigger changes (e.g., panel collapse)
  useEffect(() => {
    if (resetTrigger > 0) {
      // Collapse all expanded categories
      setExpandedCategories(new Set());
      // Reset the view to fit all nodes
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 500 });
      }, 150);
    }
  }, [resetTrigger, fitView]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const data = node.data as { slug: string; isSubscriberOnly?: boolean };
      if (node.type === 'post') {
        // Post node - check if subscriber-only and user doesn't have access
        const hasAccess = !data.isSubscriberOnly || isSubscribed;
        if (hasAccess) {
          navigate(`/posts/${data.slug}`);
        } else {
          navigate('/auth?tab=signup');
        }
      } else {
        // Category node - toggle expand/collapse
        setExpandedCategories(prev => {
          const newSet = new Set(prev);
          if (newSet.has(node.id)) {
            newSet.delete(node.id);
          } else {
            newSet.add(node.id);
          }
          return newSet;
        });

        // Don't update selectedCategory from graph clicks - just expand/collapse
        // This prevents the node from being filtered out
      }
    },
    [navigate, isSubscribed]
  );

  return (
    <div className="w-full h-full rounded-xl border border-border bg-card overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        defaultViewport={defaultViewport}
        minZoom={0.5}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag
        zoomOnScroll
        proOptions={proOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Controls className="!bg-card !border-border !shadow-soft" />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
      </ReactFlow>
    </div>
  );
};

interface KnowledgeGraphProps {
  filteredCategoryIds?: string[];
  selectedCategory?: string | null;
  showAllCategories?: boolean;
  onCategoryClick?: (categoryId: string) => void;
  resetTrigger?: number;
}

export const KnowledgeGraph = ({
  filteredCategoryIds = [],
  selectedCategory = null,
  showAllCategories = true,
  onCategoryClick,
  resetTrigger = 0,
}: KnowledgeGraphProps) => {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphInner
        filteredCategoryIds={filteredCategoryIds}
        selectedCategory={selectedCategory}
        showAllCategories={showAllCategories}
        onCategoryClick={onCategoryClick}
        resetTrigger={resetTrigger}
      />
    </ReactFlowProvider>
  );
};
