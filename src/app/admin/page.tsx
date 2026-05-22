"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useTreeStore } from "@/store/treeStore";
import { Shield, Info, UserPlus } from "lucide-react";
import AddRootPersonModal from "@/components/tree/AddRootPersonModal";

const FamilyTree = dynamic(() => import("@/components/tree/FamilyTree"), { ssr: false });

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, setIsAdmin, persons, dataLoaded } = useTreeStore();
  const [showAddRoot, setShowAddRoot] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(({ isAdmin: v }) => {
        setIsAdmin(v);
        if (!v) router.push("/admin/login");
      })
      .catch(() => router.push("/admin/login"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Barre admin */}
      <div className="bg-indigo-900 border-b border-indigo-700 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-300" />
          <span className="text-blue-100 text-sm font-semibold">Mode Administration</span>
          <span className="text-indigo-400 text-xs">— Glissez les nœuds pour les repositionner</span>
        </div>
        <div className="flex items-center gap-3">
          {dataLoaded && persons.length === 0 && (
            <button
              onClick={() => setShowAddRoot(true)}
              className="flex items-center gap-1.5 bg-white hover:bg-blue-50 text-indigo-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter le premier membre
            </button>
          )}
          <div className="flex items-center gap-1.5 text-indigo-300 text-xs">
            <Info className="w-3.5 h-3.5" />
            <span>Cliquez sur + près d'un nœud pour ajouter un lien</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <FamilyTree />
      </div>

      {showAddRoot && <AddRootPersonModal onClose={() => setShowAddRoot(false)} />}
    </div>
  );
}
