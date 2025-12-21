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
