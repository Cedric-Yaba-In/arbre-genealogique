"use client";
import { useState } from "react";
import { X, Upload, Baby } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { Person } from "@/types";
import { useTreeStore } from "@/store/treeStore";
import { v4 as uuidv4 } from "uuid";

interface Props {
  parentAId: string;
  parentBId: string;
  onClose: () => void;
}

export default function AddChildModal({ parentAId, parentBId, onClose }: Props) {
  const { addPerson, addRelation, persons } = useTreeStore();

  const parentA = persons.find(p => p.id === parentAId)!;
  const parentB = persons.find(p => p.id === parentBId)!;

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [photoFile, setPhotoFile]   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: parentA?.lastName ?? "",
    gender: "male" as "male" | "female",
    birthDate: "", deathDate: "", birthPlace: "", bio: "",
  });

  const btn = (active: boolean) =>
    `py-2 rounded-xl border-2 text-sm font-medium transition-all ${
      active ? "border-indigo-600 bg-indigo-50 text-indigo-900" : "border-gray-200 text-gray-600 hover:border-indigo-300"
    }`;

  async function handleSubmit() {
    if (!form.firstName || !form.lastName) return;
    setLoading(true);
    setError(null);
    try {
      // Upload photo
      let photoUrl = "";
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        if (!up.ok) throw new Error("Échec de l'upload de la photo");
        photoUrl = (await up.json()).url;
      }

      // Calcul position : entre les deux parents, en dessous
      const midX = (parentA.positionX + parentB.positionX) / 2;
      const belowY = Math.max(parentA.positionY, parentB.positionY) + 220;
      // Décaler si d'autres enfants existent déjà à ce niveau
      const siblings = persons.filter(p => Math.abs(p.positionY - belowY) < 60);
      const posX = midX - 88 + siblings.length * 210;
      const posY = belowY;

      // Créer l'enfant
      const childId = uuidv4();
      const personRes = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: childId, ...form, photoUrl, positionX: posX, positionY: posY }),
      });
      if (!personRes.ok) throw new Error(`Erreur création : ${personRes.status}`);
      const newChild: Person = await personRes.json();
      addPerson(newChild);

      // Créer la relation parent → enfant avec coParentId
      const relRes = await fetch("/api/relations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromPersonId: parentAId,
          toPersonId: childId,
          relationType: "parent",
          coParentId: parentBId,
        }),
      });
      if (!relRes.ok) throw new Error(`Erreur relation : ${relRes.status}`);
      addRelation(await relRes.json());

      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-800 to-violet-700 p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Baby className="w-5 h-5 text-violet-200" />
            <div>
              <h2 className="text-white font-bold text-base">Ajouter un enfant</h2>
              <p className="text-violet-200 text-xs mt-0.5">
                {parentA?.firstName} &amp; {parentB?.firstName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Photo */}
          <div className="flex justify-center">
            <label className="cursor-pointer group">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-indigo-300 flex items-center justify-center overflow-hidden bg-indigo-50 group-hover:border-indigo-500 transition-colors">
                {photoPreview
                  ? <img src={photoPreview} className="w-full h-full object-cover" alt="" />
                  : <div className="flex flex-col items-center gap-1">
                      <Upload className="w-5 h-5 text-indigo-400" />
                      <span className="text-[10px] text-indigo-400">Photo</span>
                    </div>
                }
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }
              }} />
            </label>
          </div>

          {/* Prénom / Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-indigo-900 mb-1">Prénom *</label>
              <input
                className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                placeholder="Prénom"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-900 mb-1">Nom *</label>
              <input
                className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                placeholder="Nom"
              />
            </div>
          </div>

          {/* Genre */}
          <div>
            <label className="block text-xs font-semibold text-indigo-900 mb-1">Genre</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setForm({ ...form, gender: "male" })}   className={btn(form.gender === "male")}>👦 Garçon</button>
              <button onClick={() => setForm({ ...form, gender: "female" })} className={btn(form.gender === "female")}>👧 Fille</button>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-indigo-900 mb-1">Naissance</label>
              <input type="date" className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-900 mb-1">Décès</label>
              <input type="date" className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                value={form.deathDate} onChange={e => setForm({ ...form, deathDate: e.target.value })} />
            </div>
          </div>

          {/* Lieu */}
          <div>
            <label className="block text-xs font-semibold text-indigo-900 mb-1">Lieu de naissance</label>
            <input className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={form.birthPlace} onChange={e => setForm({ ...form, birthPlace: e.target.value })}
              placeholder="Ex: Bafoussam" />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-indigo-900 mb-1">Biographie</label>
            <textarea className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
              rows={2} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="Quelques mots..." />
          </div>

          {/* Résumé */}
          <div className="bg-violet-50 rounded-xl px-4 py-2.5 text-xs text-violet-800 border border-violet-100">
            Enfant de <strong>{parentA?.firstName} {parentA?.lastName}</strong> et <strong>{parentB?.firstName} {parentB?.lastName}</strong>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">⚠ {error}</div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading}
              className="flex-1 border-2 border-indigo-600 text-indigo-600 font-semibold py-2.5 rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={loading || !form.firstName || !form.lastName}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
              {loading ? <><Spinner size="sm" />Ajout...</> : <><Baby className="w-4 h-4" />Ajouter</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
