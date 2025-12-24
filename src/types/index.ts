export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  postCount?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  categoryId?: string;
  category?: Category;
  tags?: Tag[];
  status: 'draft' | 'published';
  author?: string;
  readTime?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  isActive: boolean;
  subscribedAt: string;
}

export interface GraphNode {
  id: string;
  type: 'category' | 'subcategory';
  data: {
    label: string;
    description?: string;
    color: string;
    icon?: string;
    postCount: number;
    slug: string;
  };
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

// Roadmap Types
export type RoadmapNodeType = 'main' | 'topic' | 'subtopic' | 'resource';
export type RoadmapNodeColor = 'yellow' | 'purple' | 'gray' | 'green' | 'blue' | 'orange';
export type ConnectionType = 'default' | 'optional' | 'recommended';

export interface Roadmap {
  id: string;
  title: string;
  slug: string;
  description?: string;
  icon?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  nodes?: RoadmapNode[];
  connections?: NodeConnection[];
}

export interface RoadmapNode {
  id: string;
  title: string;
  description?: string;
  nodeType: RoadmapNodeType;
  color: RoadmapNodeColor;
  icon?: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  parentId?: string;
  roadmapId: string;
  orderIndex: number;
  isOptional: boolean;
  isRecommended: boolean;
  isContainer: boolean;
  createdAt: string;
  updatedAt: string;
  posts?: Post[];
}

export interface NodeConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  connectionType: ConnectionType;
  label?: string;
  sourceHandle?: string;
  targetHandle?: string;
  createdAt: string;
}

export interface NodePost {
  id: string;
  nodeId: string;
  postId: string;
  orderIndex: number;
  createdAt: string;
  post?: Post;
}

// React Flow compatible types
export interface RoadmapFlowNode {
  id: string;
  type: 'roadmapNode' | 'containerNode';
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    nodeType: RoadmapNodeType;
    color: RoadmapNodeColor;
    icon?: string;
    isOptional: boolean;
    isRecommended: boolean;
    isContainer: boolean;
    isCompleted?: boolean;
    postCount?: number;
    width?: number;
    height?: number;
  };
  parentId?: string;
  parentNode?: string; // React Flow uses parentNode for parent-child grouping
  extent?: 'parent';
  expandParent?: boolean;
  dragHandle?: string;
  style?: React.CSSProperties;
}

export interface RoadmapFlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: React.CSSProperties;
  label?: string;
  data?: {
    connectionType: ConnectionType;
  };
}
