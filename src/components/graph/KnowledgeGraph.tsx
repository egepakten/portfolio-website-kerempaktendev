import { useCallback, useMemo, useState, useEffect } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { useBlogStore } from '@/store/blogStore';
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

const KnowledgeGraphInner = () => {
  const navigate = useNavigate();
  const categories = useBlogStore((state) => state.categories);
  const posts = useBlogStore((state) => state.posts);
  
  // Track which categories are expanded (showing their posts)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Use controlled nodes and edges for smooth animations
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);
  const defaultViewport = useMemo(() => ({ x: 50, y: 20, zoom: 0.85 }), []);

  // Calculate nodes and edges based on expanded state
  const { calculatedNodes, calculatedEdges } = useMemo(() => {
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
    const activeMainCategories = categories.filter(
      c => !c.parentId && categoriesWithPosts.has(c.id)
    );
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

    // Create main category nodes
    const mainNodes: Node[] = activeMainCategories.map((cat, index) => ({
      id: cat.id,
      type: 'category',
      position: { 
        x: index * MAIN_SPACING - mainOffset + 400, 
        y: MAIN_Y 
      },
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
      },
    }));

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
      calculatedEdges: edgesData 
    };
  }, [categories, posts, expandedCategories]);

  // Update nodes and edges with smooth transition
  useEffect(() => {
    setNodes(calculatedNodes);
    setEdges(calculatedEdges);
  }, [calculatedNodes, calculatedEdges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const data = node.data as { slug: string };
      if (node.type === 'post') {
        // Post node - navigate to the post
        navigate(`/posts/${data.slug}`);
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
      }
    },
    [navigate]
  );

  return (
    <div className="w-full h-[500px] md:h-[600px] rounded-xl border border-border bg-card overflow-hidden">
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

export const KnowledgeGraph = () => {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphInner />
    </ReactFlowProvider>
  );
};
