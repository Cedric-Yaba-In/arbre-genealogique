"use client";
import { useState } from "react";
import { X, Upload, TreePine } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { Person } from "@/types";
import { useTreeStore } from "@/store/treeStore";
import { v4 as uuidv4 } from "uuid";

export default function AddRootPersonModal({ onClose }: { onClose: () => void }) {
  const { addPerson } = useTreeStore();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", gender: "male" as "male" | "female", birthDate: "", deathDate: "", birthPlace: "", bio: "" });

  async function handleSubmit() {
    if (!form.firstName || !form.lastName) return;
    setLoading(true);
    setSubmitError(null);
    try {
      let photoUrl = "";
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error("Échec de l'upload de la photo");
        photoUrl = (await uploadRes.json()).url;
      }
      const id = uuidv4();
      const res = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...form, photoUrl, positionX: 400, positionY: 300 }),
      });
      if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`);
      const person: Person = await res.json();
      addPerson(person);
      onClose();
    } catch (err) {
      console.error("Erreur lors de la création :", err);
      setSubmitError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally { setLoading(false); }
  }

  const btnActive = "border-indigo-600 bg-indigo-50";
  const btnInactive = "border-gray-200";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-800 to-blue-600 p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TreePine className="w-5 h-5 text-blue-200" />
            <h2 className="text-white font-bold text-lg">Premier membre de l'arbre</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-indigo-400 flex items-center justify-center overflow-hidden bg-indigo-50">
                {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" alt="" /> : <Upload className="w-6 h-6 text-indigo-400" />}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); } }} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-indigo-900 mb-1">Prénom *</label><input className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Prénom" /></div>
            <div><label className="block text-xs font-semibold text-indigo-900 mb-1">Nom *</label><input className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Nom" /></div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-indigo-900 mb-1">Genre</label>
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as const).map((g) => (
                <button key={g} onClick={() => setForm({ ...form, gender: g })} className={`py-2 rounded-lg border-2 text-sm font-medium transition-all ${form.gender === g ? btnActive : btnInactive}`}>{g === "male" ? "👨 Homme" : "👩 Femme"}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-indigo-900 mb-1">Naissance</label><input type="date" className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></div>
            <div><label className="block text-xs font-semibold text-indigo-900 mb-1">Décès</label><input type="date" className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={form.deathDate} onChange={(e) => setForm({ ...form, deathDate: e.target.value })} /></div>
          </div>

          <div><label className="block text-xs font-semibold text-indigo-900 mb-1">Lieu de naissance</label><input className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={form.birthPlace} onChange={(e) => setForm({ ...form, birthPlace: e.target.value })} placeholder="Ex: Bafoussam" /></div>
          <div><label className="block text-xs font-semibold text-indigo-900 mb-1">Biographie</label><textarea className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Quelques mots..." /></div>

          {/* Message d'erreur */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              ⚠ {submitError}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading || !form.firstName || !form.lastName} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Spinner size="sm" />Création...</> : "Créer le premier membre"}
          </button>
        </div>
      </div>
    </div>
  );
}
