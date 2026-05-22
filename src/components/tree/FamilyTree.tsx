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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTreeStore } from "@/store/treeStore";
import { Person, Relation } from "@/types";
import PersonNode from "./PersonNode";
import PersonDetailPanel from "./PersonDetailPanel";
import AddRelationModal from "./AddRelationModal";

// ─── Nœud de jonction ────────────────────────────────────────────────────────
// Petit losange positionné au milieu du lien de mariage.
// Les enfants descendent de ce point.
function JunctionNode() {
  return (
    <div style={{ position: "relative", width: 14, height: 14 }}>
      {/* Losange visuel */}
      <div style={{
        width: 10, height: 10,
        background: "#4338ca",
        border: "2px solid #3730a3",
        transform: "rotate(45deg)",
        position: "absolute", top: 2, left: 2,
      }} />
      {/* Handles invisibles couvrant tout le nœud */}
      <Handle type="target" id="from-left"  position={Position.Left}   style={{ opacity: 0, top: "50%", left: 0 }} />
      <Handle type="target" id="from-right" position={Position.Right}  style={{ opacity: 0, top: "50%", right: 0 }} />
      <Handle type="target" id="from-top"   position={Position.Top}    style={{ opacity: 0, top: 0, left: "50%" }} />
      <Handle type="source" id="to-bottom"  position={Position.Bottom} style={{ opacity: 0, bottom: 0, left: "50%" }} />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  person: PersonNode as any,
  junction: JunctionNode,
};

// ─── Construction du graphe ───────────────────────────────────────────────────

function buildGraph(persons: Person[], relations: Relation[], onAddRelation: (id: string) => void) {
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

  // 2. Construire un index des mariages : pour chaque couple, on connaît leur relation spouse
  const spouseMap = new Map<string, string>(); // coupleKey → spouseRelationId
  relations.filter((r) => r.relationType === "spouse").forEach((r) => {
    const key = [r.fromPersonId, r.toPersonId].sort().join("|");
    spouseMap.set(key, r.id);
  });

  // 3. Grouper les enfants par couple (père + mère identifiés via coParentId)
  //    coupleKey → { p1, p2, children[] }
  const coupleGroups = new Map<string, {
    p1: string; p2: string | null; children: string[];
  }>();

  relations.filter((r) => r.relationType === "parent").forEach((r) => {
    const coParent = r.coParentId ?? null;
    const coupleKey = coParent
      ? [r.fromPersonId, coParent].sort().join("|")
      : `solo-${r.fromPersonId}`;

    if (!coupleGroups.has(coupleKey)) {
      // p1 = le parent déclaré, p2 = le co-parent (peut être null)
      const sorted = coParent ? [r.fromPersonId, coParent].sort() : [r.fromPersonId, null];
      coupleGroups.set(coupleKey, { p1: sorted[0]!, p2: sorted[1], children: [] });
    }
    coupleGroups.get(coupleKey)!.children.push(r.toPersonId);
  });

  // 4. Pour chaque groupe couple → créer jonction + arêtes
  coupleGroups.forEach((group, coupleKey) => {
    const junctionId = `jct-${coupleKey}`;
    const p1 = persons.find((p) => p.id === group.p1);
    const p2 = group.p2 ? persons.find((p) => p.id === group.p2) : null;
    if (!p1) return;

    const childPersons = group.children
      .map((id) => persons.find((p) => p.id === id))
      .filter(Boolean) as Person[];

    // Position de la jonction :
    // - Si couple avec 2 parents : milieu horizontal entre eux, à mi-hauteur vers les enfants
    // - Si parent seul : juste en dessous du parent
    let jx: number, jy: number;
    if (p2) {
      jx = (p1.positionX + p2.positionX) / 2;
      const avgChildY = childPersons.length > 0
        ? childPersons.reduce((s, c) => s + c.positionY, 0) / childPersons.length
        : p1.positionY + 200;
      jy = p1.positionY + (avgChildY - p1.positionY) * 0.4;
    } else {
      jx = p1.positionX + 70;
      const avgChildY = childPersons.length > 0
        ? childPersons.reduce((s, c) => s + c.positionY, 0) / childPersons.length
        : p1.positionY + 200;
      jy = p1.positionY + (avgChildY - p1.positionY) * 0.4;
    }

    nodes.push({
      id: junctionId,
      type: "junction",
      position: { x: jx - 7, y: jy - 7 },
      data: {},
      draggable: false,
      selectable: false,
    });

    // Arête p1 → jonction
    edges.push({
      id: `e-p1-${junctionId}`,
      source: group.p1,
      target: junctionId,
      targetHandle: "from-left",
      type: "smoothstep",
      style: { stroke: "#3730a3", strokeWidth: 2 },
    });

    // Arête p2 → jonction (si couple)
    if (group.p2) {
      edges.push({
        id: `e-p2-${junctionId}`,
        source: group.p2,
        target: junctionId,
        targetHandle: "from-right",
        type: "smoothstep",
        style: { stroke: "#3730a3", strokeWidth: 2 },
      });
    }

    // Arêtes jonction → enfants
    group.children.forEach((childId) => {
      edges.push({
        id: `e-jct-${junctionId}-${childId}`,
        source: junctionId,
        sourceHandle: "to-bottom",
        target: childId,
        type: "smoothstep",
        style: { stroke: "#3730a3", strokeWidth: 2 },
      });
    });
  });

  // 5. Liens de mariage : ligne horizontale en pointillés ENTRE les deux conjoints
  //    On ne trace ce lien QUE si les deux conjoints n'ont pas déjà un lien via jonction
  //    (pour éviter la double ligne). On le trace toujours pour la lisibilité.
  relations.filter((r) => r.relationType === "spouse").forEach((r) => {
    edges.push({
      id: `spouse-${r.id}`,
      source: r.fromPersonId,
      target: r.toPersonId,
      type: "straight",
      style: { stroke: "#38bdf8", strokeWidth: 2, strokeDasharray: "6 3" },
    });
  });

  // 6. Successions → pas de lien visuel (badges sur les nœuds)

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
  const [addRelationFor, setAddRelationFor] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleAddRelation = useCallback((id: string) => setAddRelationFor(id), []);

  useEffect(() => {
    fetch("/api/persons")
      .then((r) => {
        if (!r.ok) throw new Error(`Erreur serveur : ${r.status}`);
        return r.json();
      })
      .then(({ persons: p, relations: r }) => {
        setPersons(p);
        setRelations(r);
        setDataLoaded(true);
      })
      .catch((err) => {
        console.error("Impossible de charger l'arbre :", err);
        setLoadError("Impossible de charger l'arbre généalogique. Vérifiez votre connexion.");
        setDataLoaded(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { nodes: n, edges: e } = buildGraph(persons, relations, handleAddRelation);
    setNodes(n);
    setEdges(e);
  }, [persons, relations, handleAddRelation, setNodes, setEdges]);

  const onNodeDragStop = useCallback(
    async (_: any, node: any) => {
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
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
      } catch (err) {
        console.error("Impossible de sauvegarder la position :", err);
        // Rollback de la position locale en cas d'échec
        updatePersonPosition(node.id, prevX, prevY);
      }
    },
    [isAdmin, updatePersonPosition]
  );

  const selectedPerson = persons.find((p) => p.id === selectedPersonId);

  if (loadError) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-blue-50">
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 max-w-md text-center space-y-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-600 text-xl">⚠</span>
          </div>
          <p className="text-red-700 font-semibold">{loadError}</p>
          <button
            onClick={() => { setLoadError(null); window.location.reload(); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%" }} className="relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isAdmin ? onNodesChange : undefined}
        onEdgesChange={isAdmin ? onEdgesChange : undefined}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        nodesDraggable={isAdmin}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        style={{ background: "#eff6ff" }}
      >
        <Background color="#6366f1" gap={32} size={1} style={{ opacity: 0.12 }} />
        <Controls className="!border-indigo-200 !shadow-md" />
        <MiniMap
          nodeColor={(n) =>
            n.type === "junction" ? "#4338ca"
            : (n.data as any)?.gender === "female" ? "#38bdf8"
            : "#4338ca"
          }
          className="!border-indigo-200 !rounded-xl !shadow-md"
        />
        <Panel position="bottom-left">
          <div className="bg-white/90 backdrop-blur rounded-xl p-3 shadow-md border border-indigo-100 text-xs space-y-1.5">
            <p className="font-bold text-indigo-900 mb-2">Légende</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-indigo-800" />
              <span className="text-indigo-700">Filiation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0" style={{ borderTop: "2px dashed #38bdf8" }} />
              <span className="text-indigo-700">Mariage / Union</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-700" style={{ transform: "rotate(45deg)" }} />
              <span className="text-indigo-700">Point d'union (enfants)</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {selectedPerson && <PersonDetailPanel person={selectedPerson} />}
      {addRelationFor && (
        <AddRelationModal fromPersonId={addRelationFor} onClose={() => setAddRelationFor(null)} />
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
