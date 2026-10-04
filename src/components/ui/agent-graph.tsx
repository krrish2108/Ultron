"use client";

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppStore } from '@/store/useAppStore';
import dagre from 'dagre';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 180;
const nodeHeight = 80;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' : 'top';
    node.sourcePosition = isHorizontal ? 'right' : 'bottom';
    
    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { layoutedNodes: nodes, layoutedEdges: edges };
};

// Custom Node component for Ultron Theme
const UltronNode = ({ data, isConnectable }: any) => {
  const isError = data.status === 'error';
  const isActive = data.status === 'active';
  const isDone = data.status === 'done';

  const borderColor = isError 
    ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
    : isActive 
      ? 'border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.3)] animate-pulse' 
      : 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]';

  const textColor = isError ? 'text-red-400' : isActive ? 'text-[#00f0ff]' : 'text-emerald-400';

  return (
    <div className={`px-4 py-3 rounded-lg bg-[#0a0a0a]/90 backdrop-blur-md border ${borderColor} min-w-[150px] font-sans flex flex-col items-center justify-center`}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-2 h-2 bg-muted-foreground border-none" />
      <div className={`text-[11px] font-bold tracking-widest uppercase mb-1 ${textColor}`}>
        {data.label}
      </div>
      <div className="text-[9px] text-muted-foreground max-w-[120px] text-center overflow-hidden text-ellipsis whitespace-nowrap">
        {data.detail || 'Processing...'}
      </div>
      {isError && (
        <button className="mt-2 text-[9px] bg-red-500/20 hover:bg-red-500/40 text-red-300 px-2 py-1 rounded transition-colors">
          Resume
        </button>
      )}
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-2 h-2 bg-muted-foreground border-none" />
    </div>
  );
};

const nodeTypes = {
  ultron: UltronNode,
};

export function AgentGraph() {
  const graphNodes = useAppStore(state => state.transparency.graphNodes);
  const graphEdges = useAppStore(state => state.transparency.graphEdges);
  
  // Local state for dragging, initialized from store
  const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes.length > 0 ? graphNodes : []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges.length > 0 ? graphEdges : []);

  // Update local state when store changes
  React.useEffect(() => {
    if (graphNodes.length > 0) {
      // Auto-layout nodes before passing them to react-flow
      const { layoutedNodes, layoutedEdges } = getLayoutedElements(
        JSON.parse(JSON.stringify(graphNodes)), // clone to avoid mutating store directly
        JSON.parse(JSON.stringify(graphEdges))
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [graphNodes, graphEdges, setNodes, setEdges]);

  // If graph is empty, show a fallback message
  if (nodes.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-background/50 border border-border rounded-xl">
        <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin mb-4" />
        <span className="text-[10px] uppercase tracking-widest font-bold">Waiting for agent activity...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-background/50 border border-border rounded-xl overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
        minZoom={0.2}
      >
        <Background color="#ffffff" gap={16} size={1} opacity={0.05} />
      </ReactFlow>
    </div>
  );
}
