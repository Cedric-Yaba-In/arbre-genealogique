"use client";
import { useState, useEffect } from "react";
import { X, Edit2, Trash2, Save, Upload, Crown, User, CheckCircle } from "lucide-react";
import { Person } from "@/types";
import { useTreeStore } from "@/store/treeStore";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";

export default function PersonDetailPanel({ person }: { person: Person }) {
  const { isAdmin, updatePerson, deletePerson, setSelectedPerson, relations, persons } = useTreeStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...person });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [saved, setSaved] = useState(false);

  // Réinitialiser le formulaire quand la personne sélectionnée change
  useEffect(() => {
    setForm({ ...person });
    setEditing(false);
    setPhotoFile(null);
    setPhotoPreview("");
    setSaveError(null);
    setDeleteError(null);
  }, [person.id]);

  const personRelations = relations.filter((r) => r.fromPersonId === person.id || r.toPersonId === person.id);
  const isChefFamille = relations.some(
    (r) => r.fromPersonId === person.id && r.relationType === "successor" && r.successionType === "chef_famille"
  );

  function getRelatedPerson(id: string) { return persons.find((p) => p.id === id); }

  function getRelationLabel(r: typeof relations[0]) {
    if (r.relationType === "parent") {
      const label = r.fromPersonId === person.id ? "Parent de" : "Enfant de";
      if (r.coParentId) {
        const coParent = persons.find((p) => p.id === r.coParentId);
        if (coParent) return `${label} (avec ${coParent.firstName})`;
      }
      return label;
    }
    if (r.relationType === "spouse") return "Conjoint(e) de";
    const labels: Record<string, string> = {
      chef_famille: "Chef de famille", heritier: "Héritier de",
      representant: "Représentant de", autre: "Successeur de",
    };
    return labels[r.successionType || "autre"];
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      let photoUrl = form.photoUrl;
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error("Échec de l'upload de la photo");
        photoUrl = (await uploadRes.json()).url;
      }
      const updated = { ...form, photoUrl };
      const res = await fetch(`/api/persons/${person.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`);
      updatePerson(updated);
      setEditing(false);
      setPhotoFile(null);
      setPhotoPreview("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde :", err);
      setSaveError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally { setSaving(false); }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/persons/${person.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`);
      deletePerson(person.id);
      setSelectedPerson(null);
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      setDeleteError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setDeleting(false);
      setShowConfirmDelete(false);
    }
  }

  return (
    <>
      <div className="absolute right-4 top-4 bottom-4 w-80 bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden flex flex-col z-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-800 to-blue-600 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {isChefFamille && <Crown className="w-4 h-4 text-yellow-300 shrink-0" />}
            <h3 className="text-white font-bold truncate">{person.firstName} {person.lastName}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && !editing && (
              <>
                <button onClick={() => setEditing(true)} className="text-white/80 hover:text-white transition-colors" title="Modifier">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setShowConfirmDelete(true)} className="text-white/80 hover:text-red-300 transition-colors" title="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button onClick={() => setSelectedPerson(null)} className="text-white/80 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast succès */}
        {saved && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-xs text-green-700 font-medium">Modifications enregistrées</span>
          </div>
        )}

        {/* Toast erreur sauvegarde */}
        {saveError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2">
            <span className="text-red-600 shrink-0">⚠</span>
            <span className="text-xs text-red-700 font-medium">{saveError}</span>
          </div>
        )}

        {/* Toast erreur suppression */}
        {deleteError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2">
            <span className="text-red-600 shrink-0">⚠</span>
            <span className="text-xs text-red-700 font-medium">{deleteError}</span>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Photo */}
          <div className="flex justify-center">
            {editing ? (
              <label className="cursor-pointer group">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-indigo-400 overflow-hidden flex items-center justify-center bg-indigo-50 group-hover:border-indigo-600 transition-colors">
                  {photoPreview || form.photoUrl
                    ? <img src={photoPreview || form.photoUrl} className="w-full h-full object-cover" alt="" />
                    : <div className="flex flex-col items-center gap-1"><Upload className="w-6 h-6 text-indigo-400" /><span className="text-[10px] text-indigo-400">Changer</span></div>}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }
                }} />
              </label>
            ) : (
              <div className="w-24 h-24 rounded-full border-2 border-indigo-400 overflow-hidden">
                {person.photoUrl
                  ? <img src={person.photoUrl} className="w-full h-full object-cover" alt={person.firstName} />
                  : <div className="w-full h-full bg-indigo-100 flex items-center justify-center"><User className="w-10 h-10 text-indigo-400" /></div>}
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-indigo-900">Prénom</label>
                  <input className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:border-indigo-500" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-indigo-900">Nom</label>
                  <input className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:border-indigo-500" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-indigo-900">Genre</label>
                <select className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:border-indigo-500" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as "male" | "female" })}>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-indigo-900">Naissance</label>
                  <input type="date" className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:border-indigo-500" value={form.birthDate || ""} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-indigo-900">Décès</label>
                  <input type="date" className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:border-indigo-500" value={form.deathDate || ""} onChange={(e) => setForm({ ...form, deathDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-indigo-900">Lieu de naissance</label>
                <input className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:border-indigo-500" value={form.birthPlace || ""} onChange={(e) => setForm({ ...form, birthPlace: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-indigo-900">Biographie</label>
                <textarea className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-sm mt-1 resize-none focus:outline-none focus:border-indigo-500" rows={3} value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setForm({ ...person }); setPhotoPreview(""); }} disabled={saving} className="flex-1 border-2 border-indigo-600 text-indigo-600 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 disabled:opacity-50">
                  Annuler
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                  {saving ? "Sauvegarde..." : "Sauver"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-indigo-500 font-medium">Genre</span>
                  <span className="text-indigo-900">{person.gender === "male" ? "👨 Homme" : "👩 Femme"}</span>
                </div>
                {person.birthDate && (
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-indigo-500 font-medium">Naissance</span>
                    <span className="text-indigo-900">{person.birthDate}</span>
                  </div>
                )}
                {person.deathDate && (
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-indigo-500 font-medium">Décès</span>
                    <span className="text-indigo-900">{person.deathDate}</span>
                  </div>
                )}
                {person.birthPlace && (
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-indigo-500 font-medium">Lieu</span>
                    <span className="text-indigo-900 text-right max-w-[60%]">{person.birthPlace}</span>
                  </div>
                )}
              </div>

              {person.bio && (
                <div className="bg-indigo-50 rounded-xl p-3">
                  <p className="text-xs text-indigo-800 leading-relaxed">{person.bio}</p>
                </div>
              )}

              {personRelations.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-2">Relations</h4>
                  <div className="space-y-2">
                    {personRelations.map((r) => {
                      const otherId = r.fromPersonId === person.id ? r.toPersonId : r.fromPersonId;
                      const other = getRelatedPerson(otherId);
                      if (!other) return null;
                      return (
                        <div key={r.id} className="flex items-center gap-2 bg-indigo-50 rounded-lg p-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-200 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-indigo-400">{getRelationLabel(r)}</p>
                            <p className="text-sm font-semibold text-indigo-900 truncate">{other.firstName} {other.lastName}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmation suppression */}
      {showConfirmDelete && (
        <ConfirmModal
          title="Supprimer ce membre"
          message={`Êtes-vous sûr de vouloir supprimer ${person.firstName} ${person.lastName} ? Toutes ses relations seront également supprimées. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          danger
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirmDelete(false)}
        />
      )}
    </>
  );
}
