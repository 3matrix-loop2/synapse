import React, { useCallback, useMemo, useState } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap, addEdge, applyNodeChanges, applyEdgeChanges, Handle, Position
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useApp } from '../context/AppContext.jsx'
import { Panel, Input, Button } from '../components/ui.jsx'

function CoreNode({ data }) {
  return (
    <div className="px-5 py-3 rounded-full bg-gradient-to-br from-ember-500 to-ember-700 text-white font-display text-sm shadow-glow border border-white/10">
      <Handle type="source" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      {data.label}
    </div>
  )
}
function BranchNode({ data }) {
  return (
    <div className="px-4 py-2 rounded-xl bg-ink-600/90 border border-white/10 text-ink-50 text-xs font-medium backdrop-blur">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      {data.label}
    </div>
  )
}

const nodeTypes = { core: CoreNode, branch: BranchNode }

export default function KnowledgeGraph() {
  const { graph, updateGraph, notes, tasks, projects, resources } = useApp()
  const [nodes, setNodes] = useState(graph.nodes)
  const [edges, setEdges] = useState(graph.edges)
  const [label, setLabel] = useState('')

  const onNodesChange = useCallback((changes) => setNodes(nds => applyNodeChanges(changes, nds)), [])
  const onEdgesChange = useCallback((changes) => setEdges(eds => applyEdgeChanges(changes, eds)), [])
  const onConnect = useCallback((params) => setEdges(eds => addEdge(params, eds)), [])

  function persist() {
    updateGraph({ nodes, edges })
  }

  function addNode() {
    if (!label.trim()) return
    const id = 'n' + Date.now()
    const angle = Math.random() * Math.PI * 2
    const newNode = { id, position: { x: Math.cos(angle) * 260, y: Math.sin(angle) * 200 }, data: { label: label.trim() }, type: 'branch' }
    const newEdge = { id: `core-${id}`, source: 'core', target: id }
    setNodes(n => [...n, newNode])
    setEdges(e => [...e, newEdge])
    setLabel('')
  }

  const counts = useMemo(() => ({
    notes: notes.length, tasks: tasks.length, projects: projects.length, resources: resources.length
  }), [notes, tasks, projects, resources])

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4 h-[calc(100vh-140px)]">
      <Panel className="p-0 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div>
            <h2 className="font-display text-lg text-ink-50">Knowledge Graph</h2>
            <p className="text-xs text-ink-300">Drag nodes, draw connections, build your map of ideas.</p>
          </div>
          <Button variant="ghost" onClick={persist}>Save layout</Button>
        </div>
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#3D372D" gap={20} />
            <Controls />
            <MiniMap nodeColor={() => '#D9722E'} maskColor="rgba(11,10,8,0.75)" style={{ background: '#14120E' }} />
          </ReactFlow>
        </div>
      </Panel>

      <div className="flex flex-col gap-4">
        <Panel title="Add Node">
          <div className="flex flex-col gap-2">
            <Input placeholder="e.g. Marketing Plan" value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNode()} />
            <Button onClick={addNode}>Add to graph</Button>
          </div>
        </Panel>
        <Panel title="Workspace Overview">
          <ul className="flex flex-col gap-2 text-sm">
            <li className="flex justify-between text-ink-100"><span>Notes</span><span className="text-ink-300">{counts.notes}</span></li>
            <li className="flex justify-between text-ink-100"><span>Tasks</span><span className="text-ink-300">{counts.tasks}</span></li>
            <li className="flex justify-between text-ink-100"><span>Projects</span><span className="text-ink-300">{counts.projects}</span></li>
            <li className="flex justify-between text-ink-100"><span>Resources</span><span className="text-ink-300">{counts.resources}</span></li>
          </ul>
        </Panel>
      </div>
    </div>
  )
}
