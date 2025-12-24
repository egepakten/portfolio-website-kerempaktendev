import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Panel,
  Connection,
  Node,
  Edge,
  OnConnect,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Loader2,
  Eye,
  Square,
  Circle,
  BoxSelect,
  FileText,
  Link2,
  X,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRoadmapStore, nodeToFlowNode, connectionToFlowEdge } from '@/store/roadmapStore';
import { useBlogStore } from '@/store/blogStore';
import { RoadmapNode } from '@/components/roadmap/RoadmapNode';
import { ContainerNode } from '@/components/roadmap/ContainerNode';
import type { RoadmapNode as RoadmapNodeType, RoadmapNodeType as NodeType, RoadmapNodeColor, ConnectionType } from '@/types';

const nodeTypes = {
  roadmapNode: RoadmapNode,
  containerNode: ContainerNode,
};

const NODE_COLORS: { value: RoadmapNodeColor; label: string; class: string }[] = [
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-400' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-400' },
  { value: 'green', label: 'Green', class: 'bg-green-400' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-400' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-400' },
  { value: 'gray', label: 'Gray', class: 'bg-gray-400' },
];

const NODE_TYPES: { value: NodeType; label: string }[] = [
  { value: 'main', label: 'Main Topic' },
  { value: 'topic', label: 'Topic' },
  { value: 'subtopic', label: 'Subtopic' },
  { value: 'resource', label: 'Resource' },
];

export default function AdminRoadmapEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const {
    currentRoadmap,
    nodes: storeNodes,
    connections: storeConnections,
    nodePosts,
    isLoading,
    fetchRoadmapById,
    updateRoadmap,
    createNode,
    updateNode,
    deleteNode,
    createConnection,
    deleteConnection,
    linkPostToNode,
    unlinkPostFromNode,
    getFlowNodes,
    getFlowEdges,
  } = useRoadmapStore();

  const { posts } = useBlogStore();

  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<RoadmapNodeType | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [nodePropertiesOpen, setNodePropertiesOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    nodeType: 'topic' as NodeType,
    color: 'yellow' as RoadmapNodeColor,
    isOptional: false,
    isRecommended: false,
    isContainer: false,
    parentId: '' as string | undefined,
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (id) {
      fetchRoadmapById(id);
    }
  }, [id, fetchRoadmapById]);

  // Update React Flow nodes when store changes
  useEffect(() => {
    const flowNodes = getFlowNodes();
    const flowEdges = getFlowEdges();
    setNodes(flowNodes as Node[]);
    setEdges(flowEdges as Edge[]);
  }, [storeNodes, storeConnections, getFlowNodes, getFlowEdges, setNodes, setEdges]);

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const storeNode = storeNodes.find(n => n.id === node.id);
    if (storeNode) {
      setSelectedNode(storeNode);
      setEditForm({
        title: storeNode.title,
        description: storeNode.description || '',
        nodeType: storeNode.nodeType,
        color: storeNode.color,
        isOptional: storeNode.isOptional,
        isRecommended: storeNode.isRecommended,
        isContainer: storeNode.isContainer,
        parentId: storeNode.parentId || '',
      });
      setNodePropertiesOpen(true);
    }
    setSelectedEdgeId(null);
  }, [storeNodes]);

  // Handle edge selection
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNode(null);
    setNodePropertiesOpen(false);
  }, []);

  // Handle connection creation
  const onConnect: OnConnect = useCallback(async (connection: Connection) => {
    if (connection.source && connection.target) {
      await createConnection({
        fromNodeId: connection.source,
        toNodeId: connection.target,
        connectionType: 'default',
      });
    }
  }, [createConnection]);

  // Handle node position and dimension changes
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds) as Node[]);

    // Save position and dimension changes to database
    changes.forEach(async (change) => {
      if (change.type === 'position' && change.position && change.dragging === false) {
        const nodeId = change.id;
        await updateNode(nodeId, {
          positionX: change.position.x,
          positionY: change.position.y,
        });
      }
      // Handle resize changes (dimensions)
      if (change.type === 'dimensions' && change.dimensions && change.resizing === false) {
        const nodeId = change.id;
        await updateNode(nodeId, {
          width: change.dimensions.width,
          height: change.dimensions.height,
        });
      }
    });
  }, [setNodes, updateNode]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds) as Edge[]);
  }, [setEdges]);

  // Add new node
  const handleAddNode = async (type: NodeType, isContainer = false) => {
    if (!currentRoadmap) return;

    const newNode = await createNode({
      title: isContainer ? 'New Group' : `New ${type}`,
      nodeType: type,
      color: 'yellow',
      positionX: 250 + Math.random() * 100,
      positionY: 100 + Math.random() * 100,
      roadmapId: currentRoadmap.id,
      isContainer,
      width: isContainer ? 300 : 200,
      height: isContainer ? 200 : 50,
    });

    if (newNode) {
      toast({ title: 'Node created' });
    }
  };

  // Update selected node
  const handleUpdateNode = async () => {
    if (!selectedNode) return;
    setIsSaving(true);

    await updateNode(selectedNode.id, {
      title: editForm.title,
      description: editForm.description || undefined,
      nodeType: editForm.nodeType,
      color: editForm.color,
      isOptional: editForm.isOptional,
      isRecommended: editForm.isRecommended,
      parentId: editForm.parentId || undefined,
    });

    setSelectedNode({ ...selectedNode, ...editForm, parentId: editForm.parentId || undefined });
    toast({ title: 'Node updated' });
    setIsSaving(false);
  };

  // Delete selected node
  const handleDeleteNode = async () => {
    if (!selectedNode) return;
    await deleteNode(selectedNode.id);
    setSelectedNode(null);
    setNodePropertiesOpen(false);
    toast({ title: 'Node deleted' });
  };

  // Delete selected edge
  const handleDeleteEdge = async () => {
    if (!selectedEdgeId) return;
    await deleteConnection(selectedEdgeId);
    setSelectedEdgeId(null);
    toast({ title: 'Connection deleted' });
  };

  // Link/unlink posts
  const handleTogglePost = async (postId: string) => {
    if (!selectedNode) return;
    const currentPosts = nodePosts.get(selectedNode.id) || [];
    const isLinked = currentPosts.some(p => p.id === postId);

    if (isLinked) {
      await unlinkPostFromNode(selectedNode.id, postId);
      toast({ title: 'Post unlinked' });
    } else {
      await linkPostToNode(selectedNode.id, postId);
      toast({ title: 'Post linked' });
    }
  };

  const linkedPostIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const posts = nodePosts.get(selectedNode.id) || [];
    return new Set(posts.map(p => p.id));
  }, [selectedNode, nodePosts]);

  const publishedPosts = useMemo(() => {
    return posts.filter(p => p.status === 'published');
  }, [posts]);

  // Get container nodes for parent selection (exclude the current node)
  const containerNodes = useMemo(() => {
    return storeNodes.filter(n => n.isContainer && n.id !== selectedNode?.id);
  }, [storeNodes, selectedNode]);

  if (!isAdmin) return null;

  if (isLoading || !currentRoadmap) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <div className="flex items-center gap-4">
            <Link to="/admin/roadmaps">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold">{currentRoadmap.title}</h1>
              <p className="text-xs text-muted-foreground">/roadmaps/{currentRoadmap.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/roadmaps/${currentRoadmap.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </Link>
            <Badge variant={currentRoadmap.isPublished ? 'default' : 'secondary'}>
              {currentRoadmap.isPublished ? 'Published' : 'Draft'}
            </Badge>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex">
          {/* Toolbox */}
          <div className="w-48 border-r bg-muted/30 p-3 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Add Node
              </h3>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleAddNode('main')}
                >
                  <Square className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-600" />
                  Main Topic
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleAddNode('topic')}
                >
                  <Square className="w-4 h-4 mr-2 fill-yellow-200 text-yellow-500" />
                  Topic
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleAddNode('subtopic')}
                >
                  <Circle className="w-4 h-4 mr-2 fill-yellow-100 text-yellow-400" />
                  Subtopic
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleAddNode('resource')}
                >
                  <Circle className="w-4 h-4 mr-2 fill-gray-200 text-gray-400" />
                  Resource
                </Button>
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Container
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleAddNode('topic', true)}
              >
                <BoxSelect className="w-4 h-4 mr-2 text-muted-foreground" />
                Group Box
              </Button>
            </div>
            <Separator />
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Instructions
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Drag nodes to position</li>
                <li>Connect nodes by dragging handles</li>
                <li>Click node to edit properties</li>
                <li>Click edge to delete it</li>
              </ul>
            </div>

            {selectedEdgeId && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Selected Edge
                  </h3>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={handleDeleteEdge}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Connection
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              <Controls />
              <MiniMap
                nodeColor={(node) => {
                  const color = node.data?.color as string;
                  const colorMap: Record<string, string> = {
                    yellow: '#facc15',
                    purple: '#a855f7',
                    gray: '#9ca3af',
                    green: '#22c55e',
                    blue: '#3b82f6',
                    orange: '#f97316',
                  };
                  return colorMap[color] || '#9ca3af';
                }}
              />
            </ReactFlow>
          </div>
        </div>

        {/* Node Properties Sheet */}
        <Sheet open={nodePropertiesOpen} onOpenChange={setNodePropertiesOpen}>
          <SheetContent className="w-[400px] sm:max-w-[400px]">
            <SheetHeader>
              <SheetTitle>Node Properties</SheetTitle>
              <SheetDescription>
                Edit the selected node's properties and linked posts.
              </SheetDescription>
            </SheetHeader>

            {selectedNode && (
              <div className="mt-6 space-y-6">
                {/* Basic Properties */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="node-title">Title</Label>
                    <Input
                      id="node-title"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="node-description">Description</Label>
                    <Textarea
                      id="node-description"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={editForm.nodeType}
                        onValueChange={(v) => setEditForm(prev => ({ ...prev, nodeType: v as NodeType }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NODE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Select
                        value={editForm.color}
                        onValueChange={(v) => setEditForm(prev => ({ ...prev, color: v as RoadmapNodeColor }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NODE_COLORS.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded ${color.class}`} />
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-recommended">Recommended</Label>
                    <Switch
                      id="is-recommended"
                      checked={editForm.isRecommended}
                      onCheckedChange={(v) => setEditForm(prev => ({ ...prev, isRecommended: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-optional">Optional</Label>
                    <Switch
                      id="is-optional"
                      checked={editForm.isOptional}
                      onCheckedChange={(v) => setEditForm(prev => ({ ...prev, isOptional: v }))}
                    />
                  </div>

                  {/* Parent Group Selection - only show for non-container nodes */}
                  {!editForm.isContainer && containerNodes.length > 0 && (
                    <div className="space-y-2">
                      <Label>Parent Group</Label>
                      <Select
                        value={editForm.parentId || 'none'}
                        onValueChange={(v) => setEditForm(prev => ({ ...prev, parentId: v === 'none' ? undefined : v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="No parent (free floating)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No parent (free floating)</SelectItem>
                          {containerNodes.map((container) => (
                            <SelectItem key={container.id} value={container.id}>
                              {container.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Child nodes move with their parent group
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Linked Posts */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      Linked Posts
                    </Label>
                    <Badge variant="secondary">{linkedPostIds.size}</Badge>
                  </div>

                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    {publishedPosts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No published posts available.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {publishedPosts.map((post) => {
                          const isLinked = linkedPostIds.has(post.id);
                          return (
                            <div
                              key={post.id}
                              className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                                isLinked ? 'bg-primary/10' : 'hover:bg-muted'
                              }`}
                              onClick={() => handleTogglePost(post.id)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className={`w-4 h-4 flex-shrink-0 ${isLinked ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="text-sm truncate">{post.title}</span>
                              </div>
                              {isLinked && (
                                <Badge variant="default" className="flex-shrink-0">
                                  Linked
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={handleUpdateNode} disabled={isSaving} className="flex-1">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteNode}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
}
