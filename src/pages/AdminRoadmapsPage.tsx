import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Map, Settings2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRoadmapStore } from '@/store/roadmapStore';
import type { Roadmap } from '@/types';

export default function AdminRoadmapsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { roadmaps, isLoading, fetchRoadmaps, createRoadmap, updateRoadmap, deleteRoadmap } = useRoadmapStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState<Roadmap | null>(null);
  const [newRoadmap, setNewRoadmap] = useState({ title: '', slug: '', description: '', icon: '' });
  const [editForm, setEditForm] = useState({ title: '', slug: '', description: '', icon: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  const handleCreateRoadmap = async () => {
    if (!newRoadmap.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    const slug = newRoadmap.slug.trim() || newRoadmap.title.toLowerCase().replace(/\s+/g, '-');
    const roadmap = await createRoadmap({
      title: newRoadmap.title.trim(),
      slug,
      description: newRoadmap.description.trim() || undefined,
      icon: newRoadmap.icon.trim() || undefined,
    });

    if (roadmap) {
      toast({ title: 'Roadmap created!' });
      setCreateDialogOpen(false);
      setNewRoadmap({ title: '', slug: '', description: '', icon: '' });
    } else {
      toast({ title: 'Failed to create roadmap', variant: 'destructive' });
    }
    setIsCreating(false);
  };

  const handleOpenEditDialog = (roadmap: Roadmap) => {
    setEditingRoadmap(roadmap);
    setEditForm({
      title: roadmap.title,
      slug: roadmap.slug,
      description: roadmap.description || '',
      icon: roadmap.icon || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateRoadmap = async () => {
    if (!editingRoadmap) return;
    if (!editForm.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    setIsUpdating(true);
    await updateRoadmap(editingRoadmap.id, {
      title: editForm.title.trim(),
      slug: editForm.slug.trim() || editForm.title.toLowerCase().replace(/\s+/g, '-'),
      description: editForm.description.trim() || undefined,
      icon: editForm.icon.trim() || undefined,
    });

    toast({ title: 'Roadmap updated!' });
    setEditDialogOpen(false);
    setEditingRoadmap(null);
    setIsUpdating(false);
  };

  const handleTogglePublish = async (roadmap: Roadmap) => {
    setTogglingId(roadmap.id);
    await updateRoadmap(roadmap.id, { isPublished: !roadmap.isPublished });
    setTogglingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteRoadmap(id);
    toast({ title: 'Roadmap deleted' });
  };

  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Manage Roadmaps</h1>
            <p className="text-muted-foreground">
              Create and manage learning roadmaps for your blog.
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Roadmap
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Roadmap</DialogTitle>
                <DialogDescription>
                  Create a new learning roadmap to organize your content.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., DevOps Roadmap"
                    value={newRoadmap.title}
                    onChange={(e) => setNewRoadmap(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL path)</Label>
                  <Input
                    id="slug"
                    placeholder="e.g., devops (auto-generated if empty)"
                    value={newRoadmap.slug}
                    onChange={(e) => setNewRoadmap(prev => ({ ...prev, slug: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this roadmap..."
                    value={newRoadmap.description}
                    onChange={(e) => setNewRoadmap(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon (Lucide icon name)</Label>
                  <Input
                    id="icon"
                    placeholder="e.g., server, code, database"
                    value={newRoadmap.icon}
                    onChange={(e) => setNewRoadmap(prev => ({ ...prev, icon: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRoadmap} disabled={isCreating}>
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Roadmap Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Roadmap</DialogTitle>
                <DialogDescription>
                  Update the roadmap's title, slug, and description.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    placeholder="e.g., DevOps Roadmap"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-slug">Slug (URL path)</Label>
                  <Input
                    id="edit-slug"
                    placeholder="e.g., devops"
                    value={editForm.slug}
                    onChange={(e) => setEditForm(prev => ({ ...prev, slug: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Brief description of this roadmap..."
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-icon">Icon (Lucide icon name)</Label>
                  <Input
                    id="edit-icon"
                    placeholder="e.g., server, code, database"
                    value={editForm.icon}
                    onChange={(e) => setEditForm(prev => ({ ...prev, icon: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateRoadmap} disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Roadmaps</CardTitle>
            <CardDescription>
              Click on a roadmap to edit its nodes and connections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : roadmaps.length === 0 ? (
              <div className="text-center py-12">
                <Map className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No roadmaps yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first roadmap to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {roadmaps.map((roadmap) => (
                  <div
                    key={roadmap.id}
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={roadmap.isPublished}
                        onCheckedChange={() => handleTogglePublish(roadmap)}
                        disabled={togglingId === roadmap.id}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{roadmap.title}</h3>
                          {roadmap.isPublished ? (
                            <Badge variant="default" className="text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Draft
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          /roadmaps/{roadmap.slug}
                        </p>
                        {roadmap.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {roadmap.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditDialog(roadmap)}
                      >
                        <Settings2 className="w-4 h-4 mr-1" />
                        Settings
                      </Button>
                      <Link to={`/admin/roadmaps/${roadmap.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit Nodes
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Roadmap</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{roadmap.title}"? This will also delete all nodes and connections. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(roadmap.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
