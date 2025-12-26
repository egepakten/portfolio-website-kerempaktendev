import { create } from 'zustand';
import { Category, Post, Tag } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface BlogState {
  categories: Category[];
  posts: Post[];
  tags: Tag[];
  searchQuery: string;
  selectedCategory: string | null;
  isLoading: boolean;
  fetchData: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  getPublishedPosts: () => Post[];
  getPostBySlug: (slug: string) => Post | undefined;
  getCategoryBySlug: (slug: string) => Category | undefined;
  getPostsByCategory: (categorySlug: string) => Post[];
  getPostsByTag: (tagSlug: string) => Post[];
  searchPosts: (query: string) => Post[];
}

export const useBlogStore = create<BlogState>((set, get) => ({
  categories: [],
  posts: [],
  tags: [],
  searchQuery: '',
  selectedCategory: null,
  isLoading: true,

  fetchData: async () => {
    set({ isLoading: true });
    
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      // Fetch published posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      // Fetch tags
      const { data: tagsData } = await supabase
        .from('tags')
        .select('*');

      // Fetch post_tags to link posts with their tags
      const { data: postTagsData } = await supabase
        .from('post_tags')
        .select('*');

      const categories: Category[] = (categoriesData || []).map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || undefined,
        icon: c.icon || 'folder',
        color: c.color || 'blue',
        parentId: c.parent_id || undefined,
        postCount: c.post_count || 0,
      }));

      const tags: Tag[] = (tagsData || []).map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        color: t.color || '#6366f1',
      }));

      // Create a map of post_id to tag objects
      const postTagsMap: Record<string, Tag[]> = {};
      (postTagsData || []).forEach(pt => {
        const tag = tags.find(t => t.id === pt.tag_id);
        if (tag) {
          if (!postTagsMap[pt.post_id]) {
            postTagsMap[pt.post_id] = [];
          }
          postTagsMap[pt.post_id].push(tag);
        }
      });

      const posts: Post[] = (postsData || []).map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt || undefined,
        content: p.content || '',
        coverImage: p.cover_image || undefined,
        author: p.author || 'Kerem Pakten',
        categoryId: p.category_id || undefined,
        tags: postTagsMap[p.id] || [],
        publishedAt: p.published_at || undefined,
        readTime: p.read_time || 5,
        status: (p.status as 'draft' | 'published') || 'draft',
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        isSubscriberOnly: p.is_subscriber_only || false,
      }));

      set({ categories, posts, tags, isLoading: false });
    } catch (error) {
      console.error('Error fetching blog data:', error);
      set({ isLoading: false });
    }
  },
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
  
  getPublishedPosts: () => {
    return get().posts.filter(p => p.status === 'published');
  },
  
  getPostBySlug: (slug) => {
    return get().posts.find(p => p.slug === slug);
  },
  
  getCategoryBySlug: (slug) => {
    return get().categories.find(c => c.slug === slug);
  },
  
  getPostsByCategory: (categorySlug) => {
    const { categories, posts } = get();
    const category = categories.find(c => c.slug === categorySlug);
    if (!category) return [];
    
    // Get posts from this category and its children
    const childCategories = categories.filter(c => c.parentId === category.id);
    const categoryIds = [category.id, ...childCategories.map(c => c.id)];
    
    return posts.filter(p => p.status === 'published' && categoryIds.includes(p.categoryId || ''));
  },

  getPostsByTag: (tagSlug) => {
    const { posts, tags } = get();
    const tag = tags.find(t => t.slug === tagSlug);
    if (!tag) return [];
    
    return posts.filter(p => 
      p.status === 'published' && 
      p.tags?.some(t => t.id === tag.id)
    );
  },
  
  searchPosts: (query) => {
    const { posts } = get();
    const lowerQuery = query.toLowerCase();
    
    return posts.filter(p => 
      p.status === 'published' && (
        p.title.toLowerCase().includes(lowerQuery) ||
        p.excerpt?.toLowerCase().includes(lowerQuery) ||
        p.content.toLowerCase().includes(lowerQuery) ||
        p.tags?.some(t => t.name.toLowerCase().includes(lowerQuery))
      )
    );
  },
}));
