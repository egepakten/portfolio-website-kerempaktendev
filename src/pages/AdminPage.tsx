import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettingsStore } from '@/store/siteSettingsStore';
import { AdminProjectsSection } from '@/components/admin/AdminProjectsSection';
import { 
  FileText, 
  Plus, 
  Settings, 
  Users, 
  BarChart3,
  Lock,
  Send,
  Mail,
  Save,
  Eye,
  Edit,
  Trash2,
  ImageIcon,
  Loader2,
  FolderPlus,
  Folder,
  Hash,
  Monitor,
  Server,
  Cloud,
  Brain,
  Atom,
  Database,
  Hexagon,
  FileType,
  LucideIcon,
  Sparkles,
  X,
  History,
  GitBranch
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  color: string | null;
  icon: string | null;
}

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Blue', hex: '#3b82f6' },
  { value: 'purple', label: 'Purple', hex: '#8b5cf6' },
  { value: 'amber', label: 'Amber', hex: '#f59e0b' },
  { value: 'rose', label: 'Rose', hex: '#f43f5e' },
  { value: 'cyan', label: 'Cyan', hex: '#06b6d4' },
  { value: 'sage', label: 'Sage', hex: '#10b981' },
];

const ICON_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'Cloud', label: 'Cloud', icon: Cloud },
  { value: 'Server', label: 'Server', icon: Server },
  { value: 'Monitor', label: 'Monitor', icon: Monitor },
  { value: 'Brain', label: 'Brain', icon: Brain },
  { value: 'Atom', label: 'Atom', icon: Atom },
  { value: 'Database', label: 'Database', icon: Database },
  { value: 'Hexagon', label: 'Hexagon', icon: Hexagon },
  { value: 'FileType', label: 'FileType', icon: FileType },
  { value: 'Settings', label: 'Settings', icon: Settings },
];

interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category_id: string | null;
  cover_image: string | null;
  status: string | null;
  published_at: string | null;
  created_at: string;
  last_notified_at: string | null;
  notified_subscriber_count: number | null;
}

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  subscribed_at: string;
}

interface DeletedAccount {
  id: string;
  user_id: string;
  email: string;
  username: string | null;
  reason: string;
  deleted_at: string;
}

interface NotificationHistory {
  id: string;
  post_id: string;
  sent_at: string;
  recipient_count: number;
  success_count: number;
  failed_count: number;
  is_test: boolean;
  test_email: string | null;
}

const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [deletedAccounts, setDeletedAccounts] = useState<DeletedAccount[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isNotifying, setIsNotifying] = useState<string | null>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingCategory, setIsGeneratingCategory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [coverImage, setCoverImage] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [selectedPostTags, setSelectedPostTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const [historyPostTitle, setHistoryPostTitle] = useState('');
  
  const [newPost, setNewPost] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category_id: '',
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    color: 'blue',
    icon: 'Cloud',
  });

  const [newTag, setNewTag] = useState({
    name: '',
    slug: '',
  });

  // Auto-generate slug from title
  useEffect(() => {
    if (newPost.title && !editingPost) {
      const slug = newPost.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setNewPost(prev => ({ ...prev, slug }));
    }
  }, [newPost.title, editingPost]);

  // Auto-generate slug for category
  useEffect(() => {
    if (newCategory.name && !editingCategory) {
      const slug = newCategory.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setNewCategory(prev => ({ ...prev, slug }));
    }
  }, [newCategory.name, editingCategory]);

  // Auto-generate slug for tag
  useEffect(() => {
    if (newTag.name && !editingTag) {
      const slug = newTag.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setNewTag(prev => ({ ...prev, slug }));
    }
  }, [newTag.name, editingTag]);

  // Determine admin access (required for saving hashtags into post_tags)
  useEffect(() => {
    let cancelled = false;

    const checkAdmin = async () => {
      if (!user) {
        setIsAuthenticated(false);
        return;
      }
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });
      if (cancelled) return;
      if (error) {
        console.error('Error checking admin role:', error);
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(Boolean(data));
    };

    checkAdmin();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
      fetchPosts();
      fetchSubscribers();
      fetchTags();
      fetchDeletedAccounts();
    }
  }, [isAuthenticated]);

  // Realtime subscription for subscribers
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('subscribers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscribers',
        },
        () => {
          fetchSubscribers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }
    setCategories(data || []);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }
    setPosts(data || []);
  };

  const fetchSubscribers = async () => {
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching subscribers:', error);
    }
    
    if (data) {
      setSubscribers(data);
      setSubscriberCount(data.filter(s => s.is_active).length);
    }
  };

  const fetchTags = async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching tags:', error);
      return;
    }
    setTags(data || []);
  };

  const fetchDeletedAccounts = async () => {
    const { data, error } = await supabase
      .from('deleted_accounts')
      .select('*')
      .order('deleted_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching deleted accounts:', error);
      return;
    }
    setDeletedAccounts(data || []);
  };

  const resetTagForm = () => {
    setNewTag({ name: '', slug: '' });
    setEditingTag(null);
  };

  const handleSaveTag = async () => {
    if (!newTag.name || !newTag.slug) {
      toast.error('Name and slug are required');
      return;
    }

    setIsLoading(true);
    try {
      if (editingTag) {
        const { error } = await supabase
          .from('tags')
          .update({
            name: newTag.name,
            slug: newTag.slug,
          })
          .eq('id', editingTag.id);

        if (error) throw error;
        toast.success('Tag updated');
      } else {
        const { error } = await supabase
          .from('tags')
          .insert({
            name: newTag.name,
            slug: newTag.slug,
          });

        if (error) throw error;
        toast.success('Tag created');
      }

      resetTagForm();
      fetchTags();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save tag';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setNewTag({
      name: tag.name,
      slug: tag.slug,
    });
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;
      toast.success('Tag deleted');
      fetchTags();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete tag';
      toast.error(message);
    }
  };

  const handleNotifySubscribers = async (post: Post) => {
    if (!post.slug || !post.title) {
      toast.error('Post must have a title and slug');
      return;
    }

    setIsNotifying(post.id);

    try {
      // Get category name if exists
      const category = categories.find(c => c.id === post.category_id);
      
      const { data, error } = await supabase.functions.invoke('notify-subscribers', {
        body: {
          postId: post.id,
          postTitle: post.title,
          postExcerpt: post.excerpt || '',
          postSlug: post.slug,
          postCoverImage: post.cover_image || '',
          postCategory: category?.name || '',
        },
      });

      if (error) throw error;

      toast.success(`Notifications sent! ${data.sent} emails delivered.`);
      fetchPosts(); // Refresh posts to show updated notification info
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send notifications';
      toast.error(message);
    } finally {
      setIsNotifying(null);
    }
  };

  const handleSendTestEmail = async (post: Post) => {
    if (!post.slug || !post.title) {
      toast.error('Post must have a title and slug');
      return;
    }

    if (!user?.email) {
      toast.error('You must be logged in to send a test email');
      return;
    }

    setIsSendingTestEmail(post.id);

    try {
      const category = categories.find(c => c.id === post.category_id);
      
      const { data, error } = await supabase.functions.invoke('notify-subscribers', {
        body: {
          postId: post.id,
          postTitle: post.title,
          postExcerpt: post.excerpt || '',
          postSlug: post.slug,
          postCoverImage: post.cover_image || '',
          postCategory: category?.name || '',
          testEmail: user.email,
        },
      });

      if (error) throw error;

      toast.success(`Test email sent to ${user.email}!`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send test email';
      toast.error(message);
    } finally {
      setIsSendingTestEmail(null);
    }
  };

  const fetchNotificationHistory = async (postId: string, postTitle: string) => {
    setHistoryPostTitle(postTitle);
    setShowHistoryModal(true);

    const { data, error } = await supabase
      .from('post_notification_history')
      .select('*')
      .eq('post_id', postId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Error fetching notification history:', error);
      setNotificationHistory([]);
      return;
    }

    setNotificationHistory(data || []);
  };

  const savePostTags = async (postId: string) => {
    // First, remove existing post_tags for this post
    await supabase.from('post_tags').delete().eq('post_id', postId);

    // For each selected tag, ensure it exists and link to post
    for (const tagName of selectedPostTags) {
      const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Check if tag exists
      let { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('slug', tagSlug)
        .maybeSingle();

      let tagId: string;
      
      if (existingTag) {
        tagId = existingTag.id;
      } else {
        // Create new tag
        const { data: newTagData, error: tagError } = await supabase
          .from('tags')
          .insert({ name: tagName, slug: tagSlug })
          .select('id')
          .single();
        
        if (tagError) {
          console.error('Failed to create tag:', tagError);
          continue;
        }
        tagId = newTagData.id;
      }

      // Link post to tag
      await supabase.from('post_tags').insert({ post_id: postId, tag_id: tagId });
    }
  };

  const handleSaveDraft = async () => {
    if (!newPost.title) {
      toast.error('Title is required');
      return;
    }

    setIsLoading(true);
    
    try {
      let postId: string;
      
      if (editingPost) {
        // Update existing post
        const { error } = await supabase
          .from('posts')
          .update({
            title: newPost.title,
            slug: newPost.slug,
            excerpt: newPost.excerpt || null,
            content: newPost.content || null,
            category_id: newPost.category_id || null,
            cover_image: coverImage || null,
            status: 'draft',
          })
          .eq('id', editingPost.id);

        if (error) throw error;
        postId = editingPost.id;
        toast.success('Post updated as draft');
      } else {
        // Create new post
        const { data: newPostData, error } = await supabase
          .from('posts')
          .insert({
            title: newPost.title,
            slug: newPost.slug,
            excerpt: newPost.excerpt || null,
            content: newPost.content || null,
            category_id: newPost.category_id || null,
            cover_image: coverImage || null,
            status: 'draft',
          })
          .select('id')
          .single();

        if (error) throw error;
        postId = newPostData.id;
        toast.success('Post saved as draft');
      }

      // Save tags
      if (selectedPostTags.length > 0) {
        await savePostTags(postId);
      }

      resetForm();
      fetchPosts();
      fetchTags();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save post';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!newPost.title) {
      toast.error('Title is required');
      return;
    }

    if (!newPost.category_id) {
      toast.error('Please select a category');
      return;
    }

    setIsLoading(true);

    try {
      let postId: string;
      
      if (editingPost) {
        // Update and publish existing post
        const { error } = await supabase
          .from('posts')
          .update({
            title: newPost.title,
            slug: newPost.slug,
            excerpt: newPost.excerpt || null,
            content: newPost.content || null,
            category_id: newPost.category_id,
            cover_image: coverImage || null,
            status: 'published',
            published_at: new Date().toISOString(),
          })
          .eq('id', editingPost.id);

        if (error) throw error;
        postId = editingPost.id;
        toast.success('Post published successfully!');
      } else {
        // Create and publish new post
        const { data: newPostData, error } = await supabase
          .from('posts')
          .insert({
            title: newPost.title,
            slug: newPost.slug,
            excerpt: newPost.excerpt || null,
            content: newPost.content || null,
            category_id: newPost.category_id,
            cover_image: coverImage || null,
            status: 'published',
            published_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) throw error;
        postId = newPostData.id;
        toast.success('Post published successfully!');
      }

      // Save tags
      if (selectedPostTags.length > 0) {
        await savePostTags(postId);
      }

      // Auto-notify subscribers for newly published posts
      try {
        const category = categories.find(c => c.id === newPost.category_id);

        const { error: notifyError } = await supabase.functions.invoke('notify-subscribers', {
          body: {
            postId,
            postTitle: newPost.title,
            postExcerpt: newPost.excerpt || '',
            postSlug: newPost.slug,
            postCoverImage: coverImage || '',
            postCategory: category?.name || '',
          },
        });

        if (notifyError) {
          console.error('Failed to notify subscribers:', notifyError);
          toast.warning('Post published, but sending notification emails failed.');
        }
      } catch (notifyError) {
        console.error('Failed to notify subscribers:', notifyError);
        toast.warning('Post published, but sending notification emails failed.');
      }

      resetForm();
      fetchPosts();
      fetchTags();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to publish post';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPost = async (post: Post) => {
    setEditingPost(post);
    setNewPost({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
      category_id: post.category_id || '',
    });
    setCoverImage(post.cover_image || '');

    // Load existing tags for this post
    const { data: postTags } = await supabase
      .from('post_tags')
      .select('tag_id, tags(name)')
      .eq('post_id', post.id);

    if (postTags) {
      const tagNames = postTags.map((pt: { tags: { name: string } | null }) => pt.tags?.name).filter(Boolean) as string[];
      setSelectedPostTags(tagNames);
    } else {
      setSelectedPostTags([]);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      toast.success('Post deleted');
      fetchPosts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete post';
      toast.error(message);
    }
  };

  const resetForm = () => {
    setNewPost({ title: '', slug: '', excerpt: '', content: '', category_id: '' });
    setEditingPost(null);
    setShowPreview(false);
    setCoverImage('');
    setSelectedPostTags([]);
    setTagInput('');
  };

  const resetCategoryForm = () => {
    setNewCategory({ name: '', slug: '', description: '', parent_id: '', color: 'blue', icon: 'Cloud' });
    setEditingCategory(null);
  };

  const handleSaveCategory = async () => {
    if (!newCategory.name || !newCategory.slug) {
      toast.error('Name and slug are required');
      return;
    }

    setIsLoading(true);
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: newCategory.name,
            slug: newCategory.slug,
            description: newCategory.description || null,
            parent_id: newCategory.parent_id || null,
            color: newCategory.color,
            icon: newCategory.icon,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({
            name: newCategory.name,
            slug: newCategory.slug,
            description: newCategory.description || null,
            parent_id: newCategory.parent_id || null,
            color: newCategory.color,
            icon: newCategory.icon,
          });

        if (error) throw error;
        toast.success('Category created');
      }

      resetCategoryForm();
      fetchCategories();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save category';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setNewCategory({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      parent_id: cat.parent_id || '',
      color: cat.color || 'blue',
      icon: cat.icon || 'Cloud',
    });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      toast.success('Category deleted');
      fetchCategories();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete category';
      toast.error(message);
    }
  };

  const handleGenerateCoverImage = async () => {
    if (!newPost.title) {
      toast.error('Please enter a title first');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-cover-image', {
        body: { prompt: newPost.title }
      });

      if (error) throw error;
      
      if (data.imageUrl) {
        setCoverImage(data.imageUrl);
        toast.success('Cover image generated!');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to generate image';
      toast.error(message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateCategory = async () => {
    if (!newPost.content || newPost.content.trim().length === 0) {
      setErrorModalMessage('Please write some content first before generating a category suggestion.');
      setShowErrorModal(true);
      return;
    }

    if (categories.length === 0) {
      setErrorModalMessage('No categories available. Please create categories first.');
      setShowErrorModal(true);
      return;
    }

    setIsGeneratingCategory(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-category', {
        body: { 
          content: newPost.content,
          categories: categories.map(c => ({ id: c.id, name: c.name }))
        }
      });

      if (error) throw error;
      
      if (data.categoryId) {
        setNewPost(prev => ({ ...prev, category_id: data.categoryId }));
        const category = categories.find(c => c.id === data.categoryId);
        toast.success(`Category suggested: ${category?.name}`);
      } else {
        toast.info('Could not determine a matching category');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to suggest category';
      toast.error(message);
    } finally {
      setIsGeneratingCategory(false);
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Check if "/" was typed to create a new tag
    if (value.endsWith('/')) {
      const tagName = value.slice(0, -1).trim();
      if (tagName && !selectedPostTags.includes(tagName)) {
        setSelectedPostTags(prev => [...prev, tagName]);
      }
      setTagInput('');
    } else {
      setTagInput(value);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!selectedPostTags.includes(tagInput.trim())) {
        setSelectedPostTags(prev => [...prev, tagInput.trim()]);
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && selectedPostTags.length > 0) {
      setSelectedPostTags(prev => prev.slice(0, -1));
    }
  };

  const removePostTag = (tagToRemove: string) => {
    setSelectedPostTags(prev => prev.filter(t => t !== tagToRemove));
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="font-serif">Loading…</CardTitle>
                <CardDescription>Checking your access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-2 w-full bg-secondary rounded" />
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Lock className="h-6 w-6" />
                </div>
                <CardTitle className="font-serif">Admin Access</CardTitle>
                <CardDescription>Sign in to access the admin panel</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/auth">Sign in</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <Lock className="h-6 w-6" />
                </div>
                <CardTitle className="font-serif">Not authorized</CardTitle>
                <CardDescription>
                  Your account doesn’t have admin permissions, so hashtags can’t be saved.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Signed in as <span className="font-medium text-foreground">{user.email}</span>
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/">Go to site</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  const publishedPosts = posts.filter(p => p.status === 'published');
  const draftPosts = posts.filter(p => p.status === 'draft');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your blog content and settings</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{publishedPosts.length}</p>
                  <p className="text-sm text-muted-foreground">Published Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Edit className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{draftPosts.length}</p>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-accent">
                  <Users className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{subscriberCount}</p>
                  <p className="text-sm text-muted-foreground">Subscribers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-secondary">
                  <BarChart3 className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{categories.length}</p>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="create" className="space-y-4">
          <TabsList>
            <TabsTrigger value="create">
              <Plus className="h-4 w-4 mr-2" />
              {editingPost ? 'Edit Post' : 'Create Post'}
            </TabsTrigger>
            <TabsTrigger value="posts">All Posts</TabsTrigger>
            <TabsTrigger value="categories">
              <Folder className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="tags">
              <Hash className="h-4 w-4 mr-2" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            <TabsTrigger value="deleted-accounts">
              <Trash2 className="h-4 w-4 mr-2" />
              Deleted Accounts
            </TabsTrigger>
            <TabsTrigger value="projects">
              <GitBranch className="h-4 w-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</CardTitle>
                  <CardDescription>
                    {editingPost ? 'Update your post content' : 'Write and publish new content'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      placeholder="Post title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md min-h-[42px] bg-background">
                      {selectedPostTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {tag}
                          <button
                            type="button"
                            onClick={() => removePostTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <Input
                        value={tagInput}
                        onChange={handleTagInputChange}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder={selectedPostTags.length === 0 ? "Type tag and press / or Enter..." : "Add more..."}
                        className="flex-1 min-w-[150px] border-0 shadow-none focus-visible:ring-0 p-0 h-7"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Type a tag name and press "/" or Enter to add</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={newPost.category_id} 
                        onValueChange={(value) => setNewPost({ ...newPost, category_id: value })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.parent_id ? '↳ ' : ''}{cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGenerateCategory}
                        disabled={isGeneratingCategory}
                        title="AI suggest category from content"
                        className="flex-shrink-0"
                      >
                        {isGeneratingCategory ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Cover Image</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleGenerateCoverImage}
                        disabled={isGeneratingImage || !newPost.title}
                        className="flex-shrink-0"
                      >
                        {isGeneratingImage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Generate with AI
                          </>
                        )}
                      </Button>
                      <Input
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        placeholder="Or paste image URL"
                        className="flex-1"
                      />
                    </div>
                    {coverImage && (
                      <div className="mt-2 relative aspect-video rounded-lg overflow-hidden border">
                        <img 
                          src={coverImage} 
                          alt="Cover preview" 
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setCoverImage('')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={newPost.excerpt}
                      onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                      placeholder="Brief description of the post"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content (Markdown)</Label>
                    <Textarea
                      id="content"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      placeholder="Write your post content in Markdown..."
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handlePublish} disabled={isLoading}>
                      <Send className="mr-2 h-4 w-4" />
                      {isLoading ? 'Publishing...' : 'Publish'}
                    </Button>
                    <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Draft
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {showPreview ? 'Hide Preview' : 'Preview'}
                    </Button>
                    {editingPost && (
                      <Button variant="ghost" onClick={resetForm}>
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              {showPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <article className="prose prose-sm dark:prose-invert max-w-none">
                      <h1>{newPost.title || 'Untitled'}</h1>
                      {newPost.excerpt && (
                        <p className="lead text-muted-foreground">{newPost.excerpt}</p>
                      )}
                      <ReactMarkdown>{newPost.content || '*No content yet*'}</ReactMarkdown>
                    </article>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>All Posts</CardTitle>
                <CardDescription>Manage your published and draft posts</CardDescription>
              </CardHeader>
              <CardContent>
                {posts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No posts yet</p>
                    <p className="text-sm">Create your first post to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div 
                        key={post.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium">{post.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                              {post.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                            {post.last_notified_at && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                Sent to {post.notified_subscriber_count || 0} on {new Date(post.last_notified_at).toLocaleDateString()} at {new Date(post.last_notified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {post.status === 'published' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleSendTestEmail(post)}
                                disabled={isSendingTestEmail === post.id}
                                title="Send test email to yourself"
                              >
                                {isSendingTestEmail === post.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleNotifySubscribers(post)}
                                disabled={isNotifying === post.id}
                                title="Notify all subscribers about this post"
                              >
                                {isNotifying === post.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4" />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => fetchNotificationHistory(post.id, post.title)}
                                title="View notification history"
                              >
                                <History className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditPost(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderPlus className="h-5 w-5" />
                    {editingCategory ? 'Edit Category' : 'Create Category'}
                  </CardTitle>
                  <CardDescription>
                    {editingCategory ? 'Update category details' : 'Add a new category for your posts'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cat-name">Name *</Label>
                    <Input
                      id="cat-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Category name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cat-slug">Slug *</Label>
                    <Input
                      id="cat-slug"
                      value={newCategory.slug}
                      onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                      placeholder="category-slug"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cat-description">Description</Label>
                    <Textarea
                      id="cat-description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Brief description"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Parent Category</Label>
                    <Select 
                      value={newCategory.parent_id} 
                      onValueChange={(value) => setNewCategory({ ...newCategory, parent_id: value === 'none' ? '' : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None (top-level category)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (top-level)</SelectItem>
                        {categories.filter(c => !c.parent_id && c.id !== editingCategory?.id).map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Select 
                      value={newCategory.color} 
                      onValueChange={(value) => setNewCategory({ ...newCategory, color: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_OPTIONS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: color.hex }}
                              />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select 
                      value={newCategory.icon} 
                      onValueChange={(value) => setNewCategory({ ...newCategory, icon: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((iconOpt) => {
                          const IconComp = iconOpt.icon;
                          return (
                            <SelectItem key={iconOpt.value} value={iconOpt.value}>
                              <div className="flex items-center gap-2">
                                <IconComp className="h-4 w-4" />
                                {iconOpt.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveCategory} disabled={isLoading}>
                      <Save className="mr-2 h-4 w-4" />
                      {editingCategory ? 'Update' : 'Create'} Category
                    </Button>
                    {editingCategory && (
                      <Button variant="ghost" onClick={resetCategoryForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Category List */}
              <Card>
                <CardHeader>
                  <CardTitle>All Categories</CardTitle>
                  <CardDescription>Manage your blog categories</CardDescription>
                </CardHeader>
                <CardContent>
                  {categories.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No categories yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categories.filter(c => !c.parent_id).map((cat) => (
                        <div key={cat.id}>
                          <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLOR_OPTIONS.find(c => c.value === cat.color)?.hex || '#6366f1' }}
                              />
                              <span className="font-medium">{cat.name}</span>
                              <Badge variant="outline" className="text-xs">{cat.slug}</Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditCategory(cat)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteCategory(cat.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {/* Show child categories */}
                          {categories.filter(c => c.parent_id === cat.id).map((child) => (
                            <div key={child.id} className="ml-6 mt-1">
                              <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/50 hover:bg-accent/50">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: COLOR_OPTIONS.find(c => c.value === child.color)?.hex || '#6366f1' }}
                                  />
                                  <span className="text-sm">↳ {child.name}</span>
                                  <Badge variant="outline" className="text-xs">{child.slug}</Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditCategory(child)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeleteCategory(child.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tags">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tag Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    {editingTag ? 'Edit Tag' : 'Create Tag'}
                  </CardTitle>
                  <CardDescription>
                    {editingTag ? 'Update tag details' : 'Add hashtags for your posts'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tag-name">Name *</Label>
                    <Input
                      id="tag-name"
                      value={newTag.name}
                      onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                      placeholder="Tag name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tag-slug">Slug *</Label>
                    <Input
                      id="tag-slug"
                      value={newTag.slug}
                      onChange={(e) => setNewTag({ ...newTag, slug: e.target.value })}
                      placeholder="tag-slug"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveTag} disabled={isLoading}>
                      <Save className="mr-2 h-4 w-4" />
                      {editingTag ? 'Update' : 'Create'} Tag
                    </Button>
                    {editingTag && (
                      <Button variant="ghost" onClick={resetTagForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tag List */}
              <Card>
                <CardHeader>
                  <CardTitle>All Tags</CardTitle>
                  <CardDescription>Manage your hashtags</CardDescription>
                </CardHeader>
                <CardContent>
                  {tags.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No tags yet</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <div 
                          key={tag.id} 
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-muted/50 hover:bg-accent/50"
                        >
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{tag.name}</span>
                          <div className="flex gap-1 ml-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => handleEditTag(tag)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => handleDeleteTag(tag.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscribers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Subscribers ({subscriberCount} active)
                </CardTitle>
                <CardDescription>People subscribed to your newsletter</CardDescription>
              </CardHeader>
              <CardContent>
                {subscribers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No subscribers yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {subscribers.map((sub) => (
                      <div 
                        key={sub.id} 
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          sub.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            sub.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            <Mail className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{sub.name || 'Anonymous'}</p>
                            <p className="text-sm text-muted-foreground">{sub.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={sub.is_active ? 'default' : 'secondary'}>
                            {sub.is_active ? 'Active' : 'Unsubscribed'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(sub.subscribed_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <AdminProjectsSection />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>

          <TabsContent value="deleted-accounts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Deleted Accounts ({deletedAccounts.length})
                </CardTitle>
                <CardDescription>Users who have deleted their accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {deletedAccounts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No deleted accounts yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deletedAccounts.map((account) => (
                      <div 
                        key={account.id} 
                        className="p-4 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{account.username || 'Anonymous'}</p>
                              <span className="text-sm text-muted-foreground">({account.email})</span>
                            </div>
                            <div className="mt-2 p-3 rounded bg-background border">
                              <p className="text-sm font-medium text-muted-foreground mb-1">Reason:</p>
                              <p className="text-sm">{account.reason}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge variant="destructive">Deleted</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(account.deleted_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <FileText className="h-5 w-5" />
              Content Required
            </DialogTitle>
            <DialogDescription>
              {errorModalMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowErrorModal(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Notification History
            </DialogTitle>
            <DialogDescription>
              Email notifications sent for "{historyPostTitle}"
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {notificationHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications sent yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notificationHistory.map((history) => (
                  <div 
                    key={history.id} 
                    className="p-3 border rounded-lg bg-secondary/30"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={history.is_test ? 'secondary' : 'default'}>
                        {history.is_test ? 'Test' : 'Broadcast'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(history.sent_at).toLocaleDateString()} at {new Date(history.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm">
                      {history.is_test ? (
                        <span className="text-muted-foreground">
                          Sent to: {history.test_email}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Recipients: {history.recipient_count} | 
                          <span className="text-primary ml-1">{history.success_count} sent</span>
                          {history.failed_count > 0 && (
                            <span className="text-destructive ml-1">| {history.failed_count} failed</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

// Settings Tab Component
const SettingsTab = () => {
  const { settings, updateSettings, fetchSettings } = useSiteSettingsStore();
  const [siteName, setSiteName] = useState(settings.site_name);
  const [siteDescription, setSiteDescription] = useState(settings.site_description);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setSiteName(settings.site_name);
    setSiteDescription(settings.site_description);
  }, [settings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const { error } = await updateSettings({
      site_name: siteName,
      site_description: siteDescription,
    });
    setIsSaving(false);

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved successfully');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Configure your blog settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Site Name</Label>
          <Input 
            value={siteName} 
            onChange={(e) => setSiteName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Site Description</Label>
          <Textarea 
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            rows={2}
          />
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminPage;
