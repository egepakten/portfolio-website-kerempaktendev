import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useRoadmapStore } from '@/store/roadmapStore';
import { RoadmapNode } from './RoadmapNode';
import { ContainerNode } from './ContainerNode';
import { NodeDetailModal } from './NodeDetailModal';
import { RoadmapLegend } from './RoadmapLegend';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { RotateCcw, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';

const nodeTypes = {
  roadmapNode: RoadmapNode,
  containerNode: ContainerNode,
};

interface RoadmapViewerProps {
  slug: string;
  showProgress?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function RoadmapViewer({
  slug,
  showProgress = true,
  showLegend = true,
  className,
}: RoadmapViewerProps) {
  const {
    currentRoadmap,
    nodes: storeNodes,
    isLoading,
    error,
    fetchRoadmapBySlug,
    getFlowNodes,
    getFlowEdges,
    getProgress,
    toggleNodeCompleted,
    resetProgress,
    getNodePosts,
  } = useRoadmapStore();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  // Fetch roadmap data
  useEffect(() => {
    fetchRoadmapBySlug(slug);
  }, [slug, fetchRoadmapBySlug]);

  // Update nodes and edges when store changes
  useEffect(() => {
    const flowNodes = getFlowNodes();
    const flowEdges = getFlowEdges();
    setNodes(flowNodes as Node[]);
    setEdges(flowEdges as Edge[]);
  }, [storeNodes, getFlowNodes, getFlowEdges, setNodes, setEdges]);

  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.data.isContainer) return;
    setSelectedNodeId(node.id);
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Toggle node completion
  const handleToggleComplete = useCallback(() => {
    if (selectedNodeId) {
      toggleNodeCompleted(selectedNodeId);
    }
  }, [selectedNodeId, toggleNodeCompleted]);

  // Get progress data
  const progress = useMemo(() => {
    if (!currentRoadmap) return { completed: 0, total: 0, percentage: 0 };
    return getProgress(currentRoadmap.id);
  }, [currentRoadmap, getProgress, storeNodes]);

  // Get selected node data
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return storeNodes.find(n => n.id === selectedNodeId);
  }, [selectedNodeId, storeNodes]);

  const selectedNodePosts = useMemo(() => {
    if (!selectedNodeId) return [];
    return getNodePosts(selectedNodeId);
  }, [selectedNodeId, getNodePosts]);

  const isSelectedNodeCompleted = useMemo(() => {
    if (!selectedNodeId) return false;
    return useRoadmapStore.getState().completedNodes.has(selectedNodeId);
  }, [selectedNodeId, storeNodes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-background">
        <div className="text-muted-foreground">Loading roadmap...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-background">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  if (!currentRoadmap) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-background">
        <div className="text-muted-foreground">Roadmap not found</div>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full h-[700px] bg-background rounded-lg border', className)}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">{currentRoadmap.title}</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {progress.completed} / {progress.total} completed ({progress.percentage}%)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetProgress(currentRoadmap.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>
      )}

      {/* React Flow Canvas - Read Only for public view */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        className={cn(showProgress && 'pt-20')}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls showInteractive={false}>
          <button className="react-flow__controls-button">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button className="react-flow__controls-button">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button className="react-flow__controls-button">
            <Maximize className="w-4 h-4" />
          </button>
        </Controls>
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
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-background"
        />

        {/* Legend */}
        {showLegend && (
          <Panel position="bottom-left" className="!m-4">
            <RoadmapLegend />
          </Panel>
        )}
      </ReactFlow>

      {/* Node Detail Modal */}
      <NodeDetailModal
        open={!!selectedNode}
        onClose={handleCloseModal}
        node={selectedNode}
        posts={selectedNodePosts}
        isCompleted={isSelectedNodeCompleted}
        onToggleComplete={handleToggleComplete}
      />
    </div>
  );
}
