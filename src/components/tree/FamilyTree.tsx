"use client";
import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Edge,
  Panel,
  ReactFlowProvider,
  NodeTypes,
  Handle,
  Position,
  EdgeTypes,
  BaseEdge,
  EdgeProps,
  getStraightPath,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTreeStore } from "@/store/treeStore";
import { Person, Relation } from "@/types";
import PersonNode from "./PersonNode";
import PersonDetailPanel from "./PersonDetailPanel";
import AddRelationModal from "./AddRelationModal";
import AddChildModal from "./AddChildModal";

// ─── Arête orthogonale (en L) ─────────────────────────────────────────────────
// Trace un chemin horizontal puis vertical pour éviter les obliques.
function OrthoEdge({
  sourceX, sourceY, targetX, targetY,
  style, markerEnd,
}: EdgeProps) {
  // Chemin : horizontal depuis source jusqu'à targetX, puis vertical jusqu'à target
  const midY = sourceY;
  const path = `M${sourceX},${sourceY} L${targetX},${midY} L${targetX},${targetY}`;
  return <BaseEdge path={path} style={style} markerEnd={markerEnd} />;
}

// Arête en T inversé : descend verticalement depuis source jusqu'à mi-chemin,
// puis horizontal jusqu'à targetX, puis vertical jusqu'à target.
function StepEdge({
  sourceX, sourceY, targetX, targetY,
  style, markerEnd,
}: EdgeProps) {
  const midY = sourceY + (targetY - sourceY) * 0.5;
  const path = `M${sourceX},${sourceY} L${sourceX},${midY} L${targetX},${midY} L${targetX},${targetY}`;
  return <BaseEdge path={path} style={style} markerEnd={markerEnd} />;
}

// ─── Nœud de jonction couple ♥ ───────────────────────────────────────────────
interface JunctionNodeData {
  p1Id: string;
  p2Id: string;
  p1Name: string;
  p2Name: string;
  marriageDate?: string;
  onAddChild?: (p1Id: string, p2Id: string) => void;
  isAdmin?: boolean;
}

function JunctionNode({ data }: { data: JunctionNodeData }) {
  const d = data as JunctionNodeData;
  return (
    <div
      style={{ position: "relative", width: 32, height: 32 }}
      title={`Union de ${d.p1Name} & ${d.p2Name}${d.marriageDate ? ` · ${d.marriageDate}` : ""}`}
    >
      {/* Cercle ♥ */}
      <div
        onClick={() => d.isAdmin && d.onAddChild?.(d.p1Id, d.p2Id)}
        style={{
          width: 32, height: 32,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)",
          border: "2.5px solid #3730a3",
          boxShadow: "0 2px 10px rgba(67,56,202,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: d.isAdmin ? "pointer" : "default",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={e => {
          if (d.isAdmin) {
            (e.currentTarget as HTMLElement).style.transform = "scale(1.2)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(67,56,202,0.6)";
          }
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(67,56,202,0.45)";
        }}
      >
        <span style={{ fontSize: 14, color: "white", userSelect: "none", lineHeight: 1 }}>♥</span>
      </div>

      {/* Tooltip admin */}
      {d.isAdmin && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)",
          background: "#1e1b4b", color: "white",
          fontSize: 10, padding: "3px 7px", borderRadius: 6,
          whiteSpace: "nowrap", pointerEvents: "none",
          opacity: 0,
        }}
          className="junction-tooltip"
        >
          + Ajouter un enfant
        </div>
      )}

      <Handle type="target" id="from-left"  position={Position.Left}   style={{ opacity: 0, top: "50%", left: 0,    width: 1, height: 1 }} />
      <Handle type="target" id="from-right" position={Position.Right}  style={{ opacity: 0, top: "50%", right: 0,   width: 1, height: 1 }} />
      <Handle type="source" id="to-bottom"  position={Position.Bottom} style={{ opacity: 0, bottom: 0, left: "50%", width: 1, height: 1 }} />
    </div>
  );
}

// ─── Nœud parent seul ────────────────────────────────────────────────────────
function SoloJunctionNode() {
  return (
    <div style={{ position: "relative", width: 10, height: 10 }}>
      <div style={{
        width: 10, height: 10, borderRadius: "50%",
        background: "#6366f1", border: "2px solid #4338ca",
      }} />
      <Handle type="target" id="from-top"  position={Position.Top}    style={{ opacity: 0, top: 0,    left: "50%", width: 1, height: 1 }} />
      <Handle type="source" id="to-bottom" position={Position.Bottom} style={{ opacity: 0, bottom: 0, left: "50%", width: 1, height: 1 }} />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  person:       PersonNode as any,
  junction:     JunctionNode as any,
  soloJunction: SoloJunctionNode,
};

const edgeTypes: EdgeTypes = {
  ortho: OrthoEdge as any,
  step:  StepEdge  as any,
};

// ─── Couleurs ─────────────────────────────────────────────────────────────────
const C_FILIATION = "#4338ca"; // indigo — parent → enfant
const C_SPOUSE    = "#d946ef"; // fuchsia — mariage sans enfants
const C_SOLO      = "#6366f1"; // indigo clair — parent seul

// ─── Construction du graphe ───────────────────────────────────────────────────
function buildGraph(
  persons: Person[],
  relations: Relation[],
  onAddRelation: (id: string) => void,
  onAddChild: (p1Id: string, p2Id: string) => void,
  isAdmin: boolean,
) {
  const nodes: any[] = [];
  const edges: Edge[] = [];

  // 1. Nœuds personnes
  persons.forEach((p) => {
    nodes.push({
      id: p.id,
      type: "person",
      position: { x: p.positionX, y: p.positionY },
      data: { ...p, isDeceased: !!p.deathDate, onAddRelation },
    });
  });

  // 2. Index mariages
  const spouseRelMap = new Map<string, Relation>();
  relations.filter(r => r.relationType === "spouse").forEach(r => {
    spouseRelMap.set([r.fromPersonId, r.toPersonId].sort().join("|"), r);
  });

  // 3. Grouper enfants par couple
  const coupleGroups = new Map<string, { p1: string; p2: string | null; children: string[] }>();
  relations.filter(r => r.relationType === "parent").forEach(r => {
    const co = r.coParentId ?? null;
    const key = co ? [r.fromPersonId, co].sort().join("|") : `solo-${r.fromPersonId}`;
    if (!coupleGroups.has(key)) {
      const sorted = co ? [r.fromPersonId, co].sort() : [r.fromPersonId, null];
      coupleGroups.set(key, { p1: sorted[0]!, p2: sorted[1], children: [] });
    }
    coupleGroups.get(key)!.children.push(r.toPersonId);
  });

  const couplesWithJunction = new Set<string>();

  coupleGroups.forEach((group, coupleKey) => {
    const p1 = persons.find(p => p.id === group.p1);
    const p2 = group.p2 ? persons.find(p => p.id === group.p2) : null;
    if (!p1) return;

    const childPersons = group.children.map(id => persons.find(p => p.id === id)).filter(Boolean) as Person[];

    // ── Couple avec deux parents ──────────────────────────────────────────────
    if (p2) {
      couplesWithJunction.add(coupleKey);
      const jId = `jct-${coupleKey}`;

      // Position jonction : milieu X entre parents, Y = niveau parents + 80px
      // (on force la jonction à la même hauteur que les parents pour des lignes droites)
      const parentY = Math.min(p1.positionY, p2.positionY); // prend le plus haut
      const jx = (p1.positionX + p2.positionX) / 2 + 88; // +88 = demi-largeur nœud (176/2)
      // Y de la jonction : entre les parents et les enfants
      const avgChildY = childPersons.length > 0
        ? childPersons.reduce((s, c) => s + c.positionY, 0) / childPersons.length
        : parentY + 250;
      const jy = parentY + 80; // fixe à 80px sous le niveau parent

      const spouseRel = spouseRelMap.get(coupleKey);
      const leftP  = p1.positionX <= p2.positionX ? p1 : p2;
      const rightP = p1.positionX <= p2.positionX ? p2 : p1;

      nodes.push({
        id: jId,
        type: "junction",
        position: { x: jx - 16, y: jy - 16 }, // centré (32/2)
        data: {
          p1Id: group.p1, p2Id: group.p2,
          p1Name: p1.firstName, p2Name: p2.firstName,
          marriageDate: spouseRel?.marriageDate,
          onAddChild, isAdmin,
        },
        draggable: false, selectable: false, zIndex: 10,
      });

      // Parent gauche → jonction (ligne droite horizontale)
      edges.push({
        id: `e-L-${jId}`,
        source: leftP.id, sourceHandle: "right",
        target: jId,      targetHandle: "from-left",
        type: "straight",
        style: { stroke: C_FILIATION, strokeWidth: 2.5 },
        zIndex: 5,
      });
      // Parent droit → jonction
      edges.push({
        id: `e-R-${jId}`,
        source: rightP.id, sourceHandle: "left",
        target: jId,       targetHandle: "from-right",
        type: "straight",
        style: { stroke: C_FILIATION, strokeWidth: 2.5 },
        zIndex: 5,
      });

      // Jonction → enfants (step : vertical puis horizontal puis vertical)
      group.children.forEach(childId => {
        edges.push({
          id: `e-C-${jId}-${childId}`,
          source: jId,    sourceHandle: "to-bottom",
          target: childId, targetHandle: "top",
          type: "step",
          style: { stroke: C_FILIATION, strokeWidth: 2 },
          zIndex: 5,
        });
      });
    }

    // ── Parent seul ───────────────────────────────────────────────────────────
    else {
      const jId = `solo-jct-${group.p1}`;
      const jx = p1.positionX + 88; // centre du nœud
      const avgChildY = childPersons.length > 0
        ? childPersons.reduce((s, c) => s + c.positionY, 0) / childPersons.length
        : p1.positionY + 200;
      const jy = p1.positionY + (avgChildY - p1.positionY) * 0.4;

      nodes.push({
        id: jId, type: "soloJunction",
        position: { x: jx - 5, y: jy - 5 },
        data: {}, draggable: false, selectable: false, zIndex: 10,
      });

      edges.push({
        id: `e-SP-${jId}`,
        source: group.p1, sourceHandle: "bottom",
        target: jId,      targetHandle: "from-top",
        type: "straight",
        style: { stroke: C_SOLO, strokeWidth: 2 },
        zIndex: 5,
      });

      group.children.forEach(childId => {
        edges.push({
          id: `e-SC-${jId}-${childId}`,
          source: jId,    sourceHandle: "to-bottom",
          target: childId, targetHandle: "top",
          type: "step",
          style: { stroke: C_SOLO, strokeWidth: 2 },
          zIndex: 5,
        });
      });
    }
  });

  // 4. Mariages sans enfants communs → ligne pointillée
  relations.filter(r => r.relationType === "spouse").forEach(r => {
    const key = [r.fromPersonId, r.toPersonId].sort().join("|");
    if (couplesWithJunction.has(key)) return;
    const p1 = persons.find(p => p.id === r.fromPersonId);
    const p2 = persons.find(p => p.id === r.toPersonId);
    if (!p1 || !p2) return;
    const leftP  = p1.positionX <= p2.positionX ? p1 : p2;
    const rightP = p1.positionX <= p2.positionX ? p2 : p1;
    edges.push({
      id: `spouse-${r.id}`,
      source: leftP.id,  sourceHandle: "right",
      target: rightP.id, targetHandle: "left",
      type: "straight",
      style: { stroke: C_SPOUSE, strokeWidth: 2, strokeDasharray: "8 4" },
      label: r.marriageDate ? `💍 ${r.marriageDate.slice(0, 4)}` : "💍",
      labelStyle: { fontSize: 10, fill: "#a21caf", fontWeight: 700 },
      labelBgStyle: { fill: "white", fillOpacity: 0.9 },
      labelBgPadding: [4, 3] as [number, number],
      zIndex: 5,
    });
  });

  return { nodes, edges };
}

// ─── Composant principal ──────────────────────────────────────────────────────
function FlowInner() {
  const {
    persons, relations, selectedPersonId, isAdmin,
    setPersons, setRelations, updatePersonPosition, setDataLoaded,
  } = useTreeStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [addRelationFor, setAddRelationFor]   = useState<string | null>(null);
  const [addChildForCouple, setAddChildForCouple] = useState<{ p1Id: string; p2Id: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleAddRelation = useCallback((id: string) => setAddRelationFor(id), []);
  const handleAddChild    = useCallback((p1Id: string, p2Id: string) => setAddChildForCouple({ p1Id, p2Id }), []);

  useEffect(() => {
    fetch("/api/persons")
      .then(r => { if (!r.ok) throw new Error(`Erreur ${r.status}`); return r.json(); })
      .then(({ persons: p, relations: r }) => { setPersons(p); setRelations(r); setDataLoaded(true); })
      .catch(err => { console.error(err); setLoadError("Impossible de charger l'arbre. Vérifiez votre connexion."); setDataLoaded(true); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { nodes: n, edges: e } = buildGraph(persons, relations, handleAddRelation, handleAddChild, isAdmin);
    setNodes(n);
    setEdges(e);
  }, [persons, relations, handleAddRelation, handleAddChild, isAdmin, setNodes, setEdges]);

  const onNodeDragStop = useCallback(async (_: any, node: any) => {
    if (!isAdmin || node.type !== "person") return;
    const prevX = node.data.positionX as number;
    const prevY = node.data.positionY as number;
    updatePersonPosition(node.id, node.position.x, node.position.y);
    try {
      const res = await fetch(`/api/persons/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionX: node.position.x, positionY: node.position.y }),
      });
      if (!res.ok) throw new Error();
    } catch {
      updatePersonPosition(node.id, prevX, prevY);
    }
  }, [isAdmin, updatePersonPosition]);

  const selectedPerson = persons.find(p => p.id === selectedPersonId);

  if (loadError) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-blue-50">
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 max-w-md text-center space-y-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-600 text-xl">⚠</span>
          </div>
          <p className="text-red-700 font-semibold">{loadError}</p>
          <button onClick={() => { setLoadError(null); window.location.reload(); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%" }} className="relative">
      <style>{`
        .react-flow__node-junction:hover .junction-tooltip { opacity: 1 !important; }
      `}</style>

      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={isAdmin ? onNodesChange : undefined}
        onEdgesChange={isAdmin ? onEdgesChange : undefined}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        nodesDraggable={isAdmin} nodesConnectable={false}
        fitView fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1} maxZoom={2}
        style={{ background: "#f0f4ff" }}
      >
        <Background color="#6366f1" gap={40} size={1} style={{ opacity: 0.08 }} />
        <Controls className="!border-indigo-200 !shadow-md" />
        <MiniMap
          nodeColor={n => {
            if (n.type === "junction" || n.type === "soloJunction") return "#4338ca";
            return (n.data as any)?.gender === "female" ? "#38bdf8" : "#4338ca";
          }}
          className="!border-indigo-200 !rounded-xl !shadow-md"
        />

        <Panel position="bottom-left">
          <div className="bg-white/95 backdrop-blur rounded-xl p-3 shadow-md border border-indigo-100 text-xs space-y-2 min-w-[180px]">
            <p className="font-bold text-indigo-900 text-[11px] uppercase tracking-wide">Légende</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-indigo-700" />
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm mx-0.5">
                  <span style={{ fontSize: 9, color: "white" }}>♥</span>
                </div>
                <div className="w-8 h-0.5 bg-indigo-700" />
              </div>
              <span className="text-indigo-700">Union père + mère</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-0.5 bg-indigo-700" />
              <span className="text-indigo-700">Filiation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-0" style={{ borderTop: "2px dashed #d946ef" }} />
              <span className="text-indigo-700">Mariage</span>
            </div>
            {isAdmin && (
              <div className="pt-1 border-t border-indigo-100 text-indigo-500 text-[10px]">
                💡 Cliquez sur ♥ pour ajouter un enfant
              </div>
            )}
          </div>
        </Panel>
      </ReactFlow>

      {selectedPerson && <PersonDetailPanel person={selectedPerson} />}

      {addRelationFor && (
        <AddRelationModal
          fromPersonId={addRelationFor}
          onClose={() => setAddRelationFor(null)}
        />
      )}

      {addChildForCouple && (
        <AddChildModal
          parentAId={addChildForCouple.p1Id}
          parentBId={addChildForCouple.p2Id}
          onClose={() => setAddChildForCouple(null)}
        />
      )}
    </div>
  );
}

export default function FamilyTree() {
  return (
    <ReactFlowProvider>
      <FlowInner />
    </ReactFlowProvider>
  );
}
