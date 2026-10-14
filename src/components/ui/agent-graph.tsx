"use client";

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Minus, Maximize2 } from 'lucide-react';
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
  const isTimeTravelActive = !!data.isTimeTravelActive;

  const borderColor = isError 
    ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
    : isTimeTravelActive || isActive
      ? 'border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.6)] ring-2 ring-[#00f0ff]/50' 
      : isDone
        ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
        : 'border-border/50 opacity-60';

  const textColor = isError 
    ? 'text-red-400' 
    : isTimeTravelActive || isActive 
      ? 'text-[#00f0ff] font-extrabold' 
      : isDone 
        ? 'text-emerald-400' 
        : 'text-muted-foreground';

  return (
    <div className={`px-4 py-3 rounded-lg bg-[#0a0a0a]/90 backdrop-blur-md border ${borderColor} min-w-[150px] font-sans flex flex-col items-center justify-center transition-all duration-300 relative ${isTimeTravelActive ? 'scale-105' : ''}`}>
      {isTimeTravelActive && (
        <div className="absolute -top-2 right-2 px-1.5 py-0.2 bg-[#00f0ff] text-black text-[8px] font-mono font-bold rounded uppercase tracking-wider shadow-[0_0_10px_rgba(0,240,255,0.8)]">
          Scrub
        </div>
      )}
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

const DEFAULT_GRAPH_NODES = [
  {"id": "super", "position": {"x": 250, "y": 0}, "data": {"label": "Supervisor", "status": "active", "detail": "Orchestrating agents..."}, "type": "ultron"},
  {"id": "rag", "position": {"x": 50, "y": 150}, "data": {"label": "Validator Studio", "status": "done", "detail": "Schema ready"}, "type": "ultron"},
  {"id": "mcp", "position": {"x": 250, "y": 150}, "data": {"label": "MCP Gateway", "status": "active", "detail": "Siemens S7 (Air-Gap)", "isTimeTravelActive": true}, "type": "ultron"},
  {"id": "doc", "position": {"x": 450, "y": 150}, "data": {"label": "Auditor", "status": "pending", "detail": "Awaiting verify"}, "type": "ultron"}
];

const DEFAULT_GRAPH_EDGES = [
  {"id": "e-super-rag", "source": "super", "target": "rag", "animated": true, "style": {"stroke": "#ffffff50"}},
  {"id": "e-super-mcp", "source": "super", "target": "mcp", "animated": true, "style": {"stroke": "#00f0ff"}},
  {"id": "e-super-doc", "source": "super", "target": "doc", "animated": false, "style": {"stroke": "#ffffff30"}}
];

export function AgentGraph() {
  const graphNodes = useAppStore(state => state.transparency.graphNodes);
  const graphEdges = useAppStore(state => state.transparency.graphEdges);
  
  const effectiveNodes = graphNodes.length > 0 ? graphNodes : DEFAULT_GRAPH_NODES;
  const effectiveEdges = graphEdges.length > 0 ? graphEdges : DEFAULT_GRAPH_EDGES;

  // Local state for dragging, initialized from store
  const [nodes, setNodes, onNodesChange] = useNodesState(effectiveNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(effectiveEdges);

  // Update local state when store changes
  React.useEffect(() => {
    // Auto-layout nodes before passing them to react-flow
    const { layoutedNodes, layoutedEdges } = getLayoutedElements(
      JSON.parse(JSON.stringify(effectiveNodes)),
      JSON.parse(JSON.stringify(effectiveEdges))
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [graphNodes, graphEdges, setNodes, setEdges]);

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
        <Background color="#ffffff" gap={16} size={1} className="opacity-5" />
        <CustomGraphControls />
      </ReactFlow>
    </div>
  );
}

function CustomGraphControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  return (
    <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-lg p-1 shadow-lg">
      <button
        onClick={() => zoomIn({ duration: 300 })}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/70 hover:text-[#00f0ff] transition-colors cursor-pointer"
        title="Zoom In"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => zoomOut({ duration: 300 })}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/70 hover:text-[#00f0ff] transition-colors cursor-pointer"
        title="Zoom Out"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => fitView({ duration: 300 })}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/70 hover:text-[#00f0ff] transition-colors cursor-pointer"
        title="Fit View"
      >
        <Maximize2 className="w-3 h-3" />
      </button>
    </div>
  );
}
