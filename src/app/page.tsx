"use client";
import dynamic from "next/dynamic";

const FamilyTree = dynamic(() => import("@/components/tree/FamilyTree"), { ssr: false });

export default function HomePage() {
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Bannière ndop bleu/blanc */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-700 px-6 py-3 flex items-center gap-4 border-b-4 border-white/30 shrink-0">
        <div className="flex gap-1.5">
          {["bg-white", "bg-blue-400", "bg-indigo-700", "bg-white", "bg-blue-400"].map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${c}`} />
          ))}
        </div>
        <p className="text-blue-100 text-sm font-medium">
          Explorez l'histoire et les liens de notre famille — Cliquez sur un membre pour en savoir plus
        </p>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <FamilyTree />
      </div>
    </div>
  );
}
