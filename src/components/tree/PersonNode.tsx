"use client";
import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { User, Plus, Crown, Star, Shield, ArrowUpRight } from "lucide-react";
import { Person } from "@/types";
import { useTreeStore } from "@/store/treeStore";

interface PersonNodeData extends Person {
  isDeceased?: boolean;
  onAddRelation?: (personId: string) => void;
}

const SUCCESSION_BADGE: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  chef_famille: {
    label: "Chef de famille",
    icon: <Crown className="w-2.5 h-2.5" />,
    color: "bg-yellow-500 text-white",
  },
  heritier: {
    label: "Héritier",
    icon: <Star className="w-2.5 h-2.5" />,
    color: "bg-indigo-600 text-white",
  },
  representant: {
    label: "Représentant",
    icon: <Shield className="w-2.5 h-2.5" />,
    color: "bg-blue-500 text-white",
  },
  autre: {
    label: "Successeur",
    icon: <ArrowUpRight className="w-2.5 h-2.5" />,
    color: "bg-slate-500 text-white",
  },
};

function PersonNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as PersonNodeData;
  const { isAdmin, setSelectedPerson, relations, persons } = useTreeStore();
  const isFemale = nodeData.gender === "female";

  // Trouver toutes les successions où cette personne est le successeur (fromPersonId)
  const successions = relations.filter(
    (r) => r.relationType === "successor" && r.fromPersonId === nodeData.id
  );

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-200 ${selected ? "scale-105" : ""}`}
      onClick={() => setSelectedPerson(nodeData.id)}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-500 !w-3 !h-3" />

      <div
        className={`
          w-44 rounded-2xl border-2 shadow-lg overflow-hidden
          ${isFemale
            ? "border-sky-400 bg-gradient-to-b from-sky-50 to-white"
            : "border-indigo-600 bg-gradient-to-b from-indigo-50 to-white"
          }
          ${selected ? "ring-4 ring-blue-400 ring-offset-2" : ""}
          ${nodeData.isDeceased ? "opacity-60 grayscale-[40%]" : ""}
        `}
      >
        {/* Bande ndop */}
        <div className={`h-2 w-full ${isFemale
          ? "bg-gradient-to-r from-sky-400 via-white to-sky-400"
          : "bg-gradient-to-r from-indigo-700 via-white to-indigo-700"
        }`} />

        <div className="flex flex-col items-center pt-3 pb-2 px-2">
          {/* Photo / avatar */}
          <div className={`relative w-16 h-16 rounded-full border-2 overflow-hidden mb-2 ${isFemale ? "border-sky-400" : "border-indigo-500"}`}>
            {nodeData.photoUrl ? (
              <img src={nodeData.photoUrl} alt={nodeData.firstName} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${isFemale ? "bg-sky-100" : "bg-indigo-100"}`}>
                <User className={`w-8 h-8 ${isFemale ? "text-sky-400" : "text-indigo-500"}`} />
              </div>
            )}
          </div>

          {/* Nom */}
          <p className="font-bold text-xs text-center text-indigo-900 leading-tight">
            {nodeData.firstName}
          </p>
          <p className="text-xs text-center text-indigo-600 font-medium">
            {nodeData.lastName}
          </p>

          {/* Dates */}
          {nodeData.birthDate && (
            <p className="text-[10px] text-blue-400 mt-1 text-center">
              {nodeData.birthDate.slice(0, 4)}
              {nodeData.deathDate ? ` — ${nodeData.deathDate.slice(0, 4)}` : ""}
            </p>
          )}

          {/* Badge décédé */}
          {nodeData.isDeceased && (
            <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full mt-1">
              Décédé(e)
            </span>
          )}

          {/* Badges de succession */}
          {successions.length > 0 && (
            <div className="mt-2 w-full space-y-1">
              {successions.map((s) => {
                const badge = SUCCESSION_BADGE[s.successionType || "autre"];
                const parent = persons.find((p) => p.id === s.toPersonId);
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${badge.color} w-full justify-center`}
                    title={parent ? `${badge.label} de ${parent.firstName} ${parent.lastName}` : badge.label}
                  >
                    {badge.icon}
                    <span className="truncate">
                      {badge.label}{parent ? ` de ${parent.firstName}` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bouton + admin */}
      {isAdmin && (
        <button
          onClick={(e) => { e.stopPropagation(); nodeData.onAddRelation?.(nodeData.id); }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-3 !h-3" />
      <Handle type="source" id="left" position={Position.Left} className="!bg-sky-400 !w-3 !h-3" />
      <Handle type="source" id="right" position={Position.Right} className="!bg-sky-400 !w-3 !h-3" />
    </div>
  );
}

export default memo(PersonNode);
