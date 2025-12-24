import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import type {
  Roadmap,
  RoadmapNode,
  NodeConnection,
  NodePost,
  RoadmapFlowNode,
  RoadmapFlowEdge,
  Post,
  RoadmapNodeType,
  RoadmapNodeColor,
  ConnectionType
} from '@/types';

// Database row types (snake_case)
interface RoadmapRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface RoadmapNodeRow {
  id: string;
  title: string;
  description: string | null;
  node_type: string;
  color: string;
  icon: string | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  parent_id: string | null;
  roadmap_id: string;
  order_index: number;
  is_optional: boolean;
  is_recommended: boolean;
  is_container: boolean;
  created_at: string;
  updated_at: string;
}

interface NodeConnectionRow {
  id: string;
  from_node_id: string;
  to_node_id: string;
  connection_type: string;
  label: string | null;
  created_at: string;
}

interface NodePostRow {
  id: string;
  node_id: string;
  post_id: string;
  order_index: number;
  created_at: string;
}

// Transform functions
const transformRoadmap = (row: RoadmapRow): Roadmap => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  description: row.description || undefined,
  icon: row.icon || undefined,
  isPublished: row.is_published,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const transformNode = (row: RoadmapNodeRow): RoadmapNode => ({
  id: row.id,
  title: row.title,
  description: row.description || undefined,
  nodeType: row.node_type as RoadmapNodeType,
  color: row.color as RoadmapNodeColor,
  icon: row.icon || undefined,
  positionX: row.position_x,
  positionY: row.position_y,
  width: row.width,
  height: row.height,
  parentId: row.parent_id || undefined,
  roadmapId: row.roadmap_id,
  orderIndex: row.order_index,
  isOptional: row.is_optional,
  isRecommended: row.is_recommended,
  isContainer: row.is_container,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const transformConnection = (row: NodeConnectionRow): NodeConnection => ({
  id: row.id,
  fromNodeId: row.from_node_id,
  toNodeId: row.to_node_id,
  connectionType: row.connection_type as ConnectionType,
  label: row.label || undefined,
  createdAt: row.created_at,
});

// Convert to React Flow format
export const nodeToFlowNode = (node: RoadmapNode, postCount: number = 0, isCompleted: boolean = false): RoadmapFlowNode => {
  const flowNode: RoadmapFlowNode = {
    id: node.id,
    type: node.isContainer ? 'containerNode' : 'roadmapNode',
    position: { x: node.positionX, y: node.positionY },
    data: {
      label: node.title,
      description: node.description,
      nodeType: node.nodeType,
      color: node.color,
      icon: node.icon,
      isOptional: node.isOptional,
      isRecommended: node.isRecommended,
      isContainer: node.isContainer,
      isCompleted,
      postCount,
      width: node.width,
      height: node.height,
    },
  };

  // For container nodes, set expandParent and dragHandle
  if (node.isContainer) {
    flowNode.style = {
      width: node.width,
      height: node.height,
    };
    flowNode.dragHandle = '.drag-handle';
  }

  // For child nodes (nodes with a parent), set parentNode and extent
  if (node.parentId) {
    flowNode.parentNode = node.parentId;
    flowNode.extent = 'parent';
    flowNode.expandParent = true;
  }

  return flowNode;
};

export const connectionToFlowEdge = (connection: NodeConnection): RoadmapFlowEdge => ({
  id: connection.id,
  source: connection.fromNodeId,
  target: connection.toNodeId,
  type: connection.connectionType === 'optional' ? 'step' : 'smoothstep',
  animated: connection.connectionType === 'recommended',
  style: {
    stroke: connection.connectionType === 'optional' ? '#9ca3af' :
            connection.connectionType === 'recommended' ? '#8b5cf6' : '#6b7280',
    strokeWidth: 2,
    strokeDasharray: connection.connectionType === 'optional' ? '5,5' : undefined,
  },
  label: connection.label,
  data: {
    connectionType: connection.connectionType,
  },
});

interface RoadmapState {
  roadmaps: Roadmap[];
  currentRoadmap: Roadmap | null;
  nodes: RoadmapNode[];
  connections: NodeConnection[];
  nodePosts: Map<string, Post[]>;
  completedNodes: Set<string>;
  isLoading: boolean;
  error: string | null;

  // Fetch functions
  fetchRoadmaps: () => Promise<void>;
  fetchRoadmapBySlug: (slug: string) => Promise<void>;
  fetchRoadmapById: (id: string) => Promise<void>;

  // Admin CRUD functions
  createRoadmap: (data: Partial<Roadmap>) => Promise<Roadmap | null>;
  updateRoadmap: (id: string, data: Partial<Roadmap>) => Promise<void>;
  deleteRoadmap: (id: string) => Promise<void>;

  createNode: (data: Partial<RoadmapNode>) => Promise<RoadmapNode | null>;
  updateNode: (id: string, data: Partial<RoadmapNode>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;

  createConnection: (data: Partial<NodeConnection>) => Promise<NodeConnection | null>;
  updateConnection: (id: string, data: Partial<NodeConnection>) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;

  linkPostToNode: (nodeId: string, postId: string) => Promise<void>;
  unlinkPostFromNode: (nodeId: string, postId: string) => Promise<void>;

  // Progress tracking
  toggleNodeCompleted: (nodeId: string) => void;
  getProgress: (roadmapId: string) => { completed: number; total: number; percentage: number };
  resetProgress: (roadmapId: string) => void;
  setCurrentUser: (userId: string | null) => void;

  // Helpers
  getFlowNodes: () => RoadmapFlowNode[];
  getFlowEdges: () => RoadmapFlowEdge[];
  getNodePosts: (nodeId: string) => Post[];
}

// Persisted progress state
interface ProgressState {
  completedNodes: Record<string, string[]>; // roadmapId -> nodeIds
}

// Helper to get localStorage key for a user
const getStorageKey = (userId: string | null) => {
  return userId ? `roadmap-progress-${userId}` : 'roadmap-progress-anonymous';
};

// Current user ID (will be set by the component)
let currentUserId: string | null = null;

export const useRoadmapStore = create<RoadmapState>((set, get) => {
  // Load completed nodes from localStorage for the current user
  const loadCompletedNodes = (userId: string | null = currentUserId): Set<string> => {
    try {
      const storageKey = getStorageKey(userId);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const data: ProgressState = JSON.parse(stored);
        const allCompleted = Object.values(data.completedNodes).flat();
        return new Set(allCompleted);
      }
    } catch (e) {
      console.error('Error loading progress:', e);
    }
    return new Set();
  };

  const saveCompletedNodes = (completedNodes: Set<string>, roadmapId?: string) => {
    try {
      const storageKey = getStorageKey(currentUserId);
      const stored = localStorage.getItem(storageKey);
      const data: ProgressState = stored ? JSON.parse(stored) : { completedNodes: {} };

      if (roadmapId) {
        const { nodes } = get();
        const roadmapNodeIds = nodes.filter(n => n.roadmapId === roadmapId).map(n => n.id);
        data.completedNodes[roadmapId] = roadmapNodeIds.filter(id => completedNodes.has(id));
      }

      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  };

  return {
    roadmaps: [],
    currentRoadmap: null,
    nodes: [],
    connections: [],
    nodePosts: new Map(),
    completedNodes: loadCompletedNodes(),
    isLoading: false,
    error: null,

    fetchRoadmaps: async () => {
      set({ isLoading: true, error: null });
      try {
        const { data, error } = await supabase
          .from('roadmaps')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const roadmaps = (data as RoadmapRow[]).map(transformRoadmap);
        set({ roadmaps, isLoading: false });
      } catch (error) {
        console.error('Error fetching roadmaps:', error);
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    fetchRoadmapBySlug: async (slug: string) => {
      set({ isLoading: true, error: null });
      try {
        // Fetch roadmap
        const { data: roadmapData, error: roadmapError } = await supabase
          .from('roadmaps')
          .select('*')
          .eq('slug', slug)
          .single();

        if (roadmapError) throw roadmapError;

        const roadmap = transformRoadmap(roadmapData as RoadmapRow);

        // Fetch nodes
        const { data: nodesData, error: nodesError } = await supabase
          .from('roadmap_nodes')
          .select('*')
          .eq('roadmap_id', roadmap.id)
          .order('order_index');

        if (nodesError) throw nodesError;

        const nodes = (nodesData as RoadmapNodeRow[]).map(transformNode);

        // Fetch connections
        const nodeIds = nodes.map(n => n.id);
        const { data: connectionsData, error: connectionsError } = await supabase
          .from('node_connections')
          .select('*')
          .in('from_node_id', nodeIds);

        if (connectionsError) throw connectionsError;

        const connections = (connectionsData as NodeConnectionRow[]).map(transformConnection);

        // Fetch node posts
        const { data: nodePostsData, error: nodePostsError } = await supabase
          .from('node_posts')
          .select(`
            *,
            posts:post_id (*)
          `)
          .in('node_id', nodeIds)
          .order('order_index');

        if (nodePostsError) throw nodePostsError;

        const nodePosts = new Map<string, Post[]>();
        (nodePostsData as any[]).forEach(np => {
          if (np.posts) {
            const existing = nodePosts.get(np.node_id) || [];
            existing.push({
              id: np.posts.id,
              title: np.posts.title,
              slug: np.posts.slug,
              content: np.posts.content || '',
              excerpt: np.posts.excerpt || undefined,
              coverImage: np.posts.cover_image || undefined,
              categoryId: np.posts.category_id || undefined,
              status: np.posts.status as 'draft' | 'published',
              author: np.posts.author || 'Kerem Pakten',
              readTime: np.posts.read_time || 5,
              publishedAt: np.posts.published_at || undefined,
              createdAt: np.posts.created_at,
              updatedAt: np.posts.updated_at,
            });
            nodePosts.set(np.node_id, existing);
          }
        });

        set({
          currentRoadmap: roadmap,
          nodes,
          connections,
          nodePosts,
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching roadmap:', error);
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    fetchRoadmapById: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const { data: roadmapData, error: roadmapError } = await supabase
          .from('roadmaps')
          .select('*')
          .eq('id', id)
          .single();

        if (roadmapError) throw roadmapError;

        const roadmap = transformRoadmap(roadmapData as RoadmapRow);

        // Fetch nodes
        const { data: nodesData, error: nodesError } = await supabase
          .from('roadmap_nodes')
          .select('*')
          .eq('roadmap_id', id)
          .order('order_index');

        if (nodesError) throw nodesError;

        const nodes = (nodesData as RoadmapNodeRow[]).map(transformNode);

        // Fetch connections
        const nodeIds = nodes.map(n => n.id);
        let connections: NodeConnection[] = [];

        if (nodeIds.length > 0) {
          const { data: connectionsData, error: connectionsError } = await supabase
            .from('node_connections')
            .select('*')
            .in('from_node_id', nodeIds);

          if (connectionsError) throw connectionsError;
          connections = (connectionsData as NodeConnectionRow[]).map(transformConnection);
        }

        // Fetch node posts
        const nodePosts = new Map<string, Post[]>();

        if (nodeIds.length > 0) {
          const { data: nodePostsData, error: nodePostsError } = await supabase
            .from('node_posts')
            .select(`
              *,
              posts:post_id (*)
            `)
            .in('node_id', nodeIds)
            .order('order_index');

          if (nodePostsError) throw nodePostsError;

          (nodePostsData as any[]).forEach(np => {
            if (np.posts) {
              const existing = nodePosts.get(np.node_id) || [];
              existing.push({
                id: np.posts.id,
                title: np.posts.title,
                slug: np.posts.slug,
                content: np.posts.content || '',
                excerpt: np.posts.excerpt || undefined,
                coverImage: np.posts.cover_image || undefined,
                categoryId: np.posts.category_id || undefined,
                status: np.posts.status as 'draft' | 'published',
                author: np.posts.author || 'Kerem Pakten',
                readTime: np.posts.read_time || 5,
                publishedAt: np.posts.published_at || undefined,
                createdAt: np.posts.created_at,
                updatedAt: np.posts.updated_at,
              });
              nodePosts.set(np.node_id, existing);
            }
          });
        }

        set({
          currentRoadmap: roadmap,
          nodes,
          connections,
          nodePosts,
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching roadmap:', error);
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    createRoadmap: async (data) => {
      try {
        const { data: result, error } = await supabase
          .from('roadmaps')
          .insert({
            title: data.title || 'New Roadmap',
            slug: data.slug || `roadmap-${Date.now()}`,
            description: data.description,
            icon: data.icon,
            is_published: data.isPublished || false,
          })
          .select()
          .single();

        if (error) throw error;

        const roadmap = transformRoadmap(result as RoadmapRow);
        set(state => ({ roadmaps: [roadmap, ...state.roadmaps] }));
        return roadmap;
      } catch (error) {
        console.error('Error creating roadmap:', error);
        set({ error: (error as Error).message });
        return null;
      }
    },

    updateRoadmap: async (id, data) => {
      try {
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.slug !== undefined) updateData.slug = data.slug;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.icon !== undefined) updateData.icon = data.icon;
        if (data.isPublished !== undefined) updateData.is_published = data.isPublished;

        const { error } = await supabase
          .from('roadmaps')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;

        set(state => ({
          roadmaps: state.roadmaps.map(r => r.id === id ? { ...r, ...data } : r),
          currentRoadmap: state.currentRoadmap?.id === id
            ? { ...state.currentRoadmap, ...data }
            : state.currentRoadmap,
        }));
      } catch (error) {
        console.error('Error updating roadmap:', error);
        set({ error: (error as Error).message });
      }
    },

    deleteRoadmap: async (id) => {
      try {
        const { error } = await supabase
          .from('roadmaps')
          .delete()
          .eq('id', id);

        if (error) throw error;

        set(state => ({
          roadmaps: state.roadmaps.filter(r => r.id !== id),
          currentRoadmap: state.currentRoadmap?.id === id ? null : state.currentRoadmap,
        }));
      } catch (error) {
        console.error('Error deleting roadmap:', error);
        set({ error: (error as Error).message });
      }
    },

    createNode: async (data) => {
      try {
        const { data: result, error } = await supabase
          .from('roadmap_nodes')
          .insert({
            title: data.title || 'New Node',
            description: data.description,
            node_type: data.nodeType || 'topic',
            color: data.color || 'yellow',
            icon: data.icon,
            position_x: data.positionX || 0,
            position_y: data.positionY || 0,
            width: data.width || 200,
            height: data.height || 50,
            parent_id: data.parentId,
            roadmap_id: data.roadmapId,
            order_index: data.orderIndex || 0,
            is_optional: data.isOptional || false,
            is_recommended: data.isRecommended || false,
            is_container: data.isContainer || false,
          })
          .select()
          .single();

        if (error) throw error;

        const node = transformNode(result as RoadmapNodeRow);
        set(state => ({ nodes: [...state.nodes, node] }));
        return node;
      } catch (error) {
        console.error('Error creating node:', error);
        set({ error: (error as Error).message });
        return null;
      }
    },

    updateNode: async (id, data) => {
      try {
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.nodeType !== undefined) updateData.node_type = data.nodeType;
        if (data.color !== undefined) updateData.color = data.color;
        if (data.icon !== undefined) updateData.icon = data.icon;
        if (data.positionX !== undefined) updateData.position_x = data.positionX;
        if (data.positionY !== undefined) updateData.position_y = data.positionY;
        if (data.width !== undefined) updateData.width = data.width;
        if (data.height !== undefined) updateData.height = data.height;
        if (data.parentId !== undefined) updateData.parent_id = data.parentId;
        if (data.orderIndex !== undefined) updateData.order_index = data.orderIndex;
        if (data.isOptional !== undefined) updateData.is_optional = data.isOptional;
        if (data.isRecommended !== undefined) updateData.is_recommended = data.isRecommended;
        if (data.isContainer !== undefined) updateData.is_container = data.isContainer;

        const { error } = await supabase
          .from('roadmap_nodes')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;

        set(state => ({
          nodes: state.nodes.map(n => n.id === id ? { ...n, ...data } : n),
        }));
      } catch (error) {
        console.error('Error updating node:', error);
        set({ error: (error as Error).message });
      }
    },

    deleteNode: async (id) => {
      try {
        const { error } = await supabase
          .from('roadmap_nodes')
          .delete()
          .eq('id', id);

        if (error) throw error;

        set(state => ({
          nodes: state.nodes.filter(n => n.id !== id),
          connections: state.connections.filter(c => c.fromNodeId !== id && c.toNodeId !== id),
        }));
      } catch (error) {
        console.error('Error deleting node:', error);
        set({ error: (error as Error).message });
      }
    },

    createConnection: async (data) => {
      try {
        const { data: result, error } = await supabase
          .from('node_connections')
          .insert({
            from_node_id: data.fromNodeId,
            to_node_id: data.toNodeId,
            connection_type: data.connectionType || 'default',
            label: data.label,
          })
          .select()
          .single();

        if (error) throw error;

        const connection = transformConnection(result as NodeConnectionRow);
        set(state => ({ connections: [...state.connections, connection] }));
        return connection;
      } catch (error) {
        console.error('Error creating connection:', error);
        set({ error: (error as Error).message });
        return null;
      }
    },

    updateConnection: async (id, data) => {
      try {
        const updateData: any = {};
        if (data.connectionType !== undefined) updateData.connection_type = data.connectionType;
        if (data.label !== undefined) updateData.label = data.label;

        const { error } = await supabase
          .from('node_connections')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;

        set(state => ({
          connections: state.connections.map(c => c.id === id ? { ...c, ...data } : c),
        }));
      } catch (error) {
        console.error('Error updating connection:', error);
        set({ error: (error as Error).message });
      }
    },

    deleteConnection: async (id) => {
      try {
        const { error } = await supabase
          .from('node_connections')
          .delete()
          .eq('id', id);

        if (error) throw error;

        set(state => ({
          connections: state.connections.filter(c => c.id !== id),
        }));
      } catch (error) {
        console.error('Error deleting connection:', error);
        set({ error: (error as Error).message });
      }
    },

    linkPostToNode: async (nodeId, postId) => {
      try {
        const { error } = await supabase
          .from('node_posts')
          .insert({
            node_id: nodeId,
            post_id: postId,
            order_index: 0,
          });

        if (error) throw error;

        // Refetch node posts
        const { currentRoadmap } = get();
        if (currentRoadmap) {
          await get().fetchRoadmapById(currentRoadmap.id);
        }
      } catch (error) {
        console.error('Error linking post:', error);
        set({ error: (error as Error).message });
      }
    },

    unlinkPostFromNode: async (nodeId, postId) => {
      try {
        const { error } = await supabase
          .from('node_posts')
          .delete()
          .eq('node_id', nodeId)
          .eq('post_id', postId);

        if (error) throw error;

        set(state => {
          const nodePosts = new Map(state.nodePosts);
          const existing = nodePosts.get(nodeId) || [];
          nodePosts.set(nodeId, existing.filter(p => p.id !== postId));
          return { nodePosts };
        });
      } catch (error) {
        console.error('Error unlinking post:', error);
        set({ error: (error as Error).message });
      }
    },

    toggleNodeCompleted: (nodeId) => {
      const { completedNodes, currentRoadmap } = get();
      const newCompleted = new Set(completedNodes);

      if (newCompleted.has(nodeId)) {
        newCompleted.delete(nodeId);
      } else {
        newCompleted.add(nodeId);
      }

      set({ completedNodes: newCompleted });
      saveCompletedNodes(newCompleted, currentRoadmap?.id);
    },

    getProgress: (roadmapId) => {
      const { nodes, completedNodes } = get();
      const roadmapNodes = nodes.filter(n => n.roadmapId === roadmapId && !n.isContainer);
      const completed = roadmapNodes.filter(n => completedNodes.has(n.id)).length;
      const total = roadmapNodes.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { completed, total, percentage };
    },

    resetProgress: (roadmapId) => {
      const { nodes, completedNodes } = get();
      const newCompleted = new Set(completedNodes);

      nodes.filter(n => n.roadmapId === roadmapId).forEach(n => {
        newCompleted.delete(n.id);
      });

      set({ completedNodes: newCompleted });

      // Clear from localStorage for current user
      try {
        const storageKey = getStorageKey(currentUserId);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const data: ProgressState = JSON.parse(stored);
          delete data.completedNodes[roadmapId];
          localStorage.setItem(storageKey, JSON.stringify(data));
        }
      } catch (e) {
        console.error('Error resetting progress:', e);
      }
    },

    setCurrentUser: (userId) => {
      // Update the current user ID
      currentUserId = userId;
      // Reload completed nodes for this user
      const completedNodes = loadCompletedNodes(userId);
      set({ completedNodes });
    },

    getFlowNodes: () => {
      const { nodes, nodePosts, completedNodes } = get();

      // Sort nodes so parent containers come before children
      // This is required by React Flow for proper parent-child relationships
      const sortedNodes = [...nodes].sort((a, b) => {
        // Containers without parents come first
        if (a.isContainer && !a.parentId && !b.isContainer) return -1;
        if (b.isContainer && !b.parentId && !a.isContainer) return 1;
        // Then nodes with parents (children) come after their parents
        if (a.parentId && !b.parentId) return 1;
        if (b.parentId && !a.parentId) return -1;
        // If both have parents or both don't, maintain original order
        return a.orderIndex - b.orderIndex;
      });

      return sortedNodes.map(node => {
        const posts = nodePosts.get(node.id) || [];
        const isCompleted = completedNodes.has(node.id);
        return nodeToFlowNode(node, posts.length, isCompleted);
      });
    },

    getFlowEdges: () => {
      const { connections } = get();
      return connections.map(connectionToFlowEdge);
    },

    getNodePosts: (nodeId) => {
      const { nodePosts } = get();
      return nodePosts.get(nodeId) || [];
    },
  };
});
