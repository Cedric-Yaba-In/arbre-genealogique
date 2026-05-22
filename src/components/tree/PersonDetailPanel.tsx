"use client";
import { useState, useEffect, useMemo } from "react";
import {
  X, Edit2, Trash2, Save, Upload, Crown, User,
  CheckCircle, UserPlus, Search,
} from "lucide-react";
import { Person } from "@/types";
import { useTreeStore } from "@/store/treeStore";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";

// ─── Sélecteur de personne inline ────────────────────────────────────────────
function PersonPicker({
  label, value, exclude, onChange,
}: {
  label: string;
  value: string;
  exclude: string[];
  onChange: (id: string) => void;
}) {
  const { persons } = useTreeStore();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = persons.find(p => p.id === value);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return persons.filter(p =>
      !exclude.includes(p.id) &&
      (p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q))
    );
  }, [persons, exclude, query]);

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-indigo-900 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm text-left flex items-center gap-2 hover:border-indigo-400 transition-colors focus:outline-none focus:border-indigo-500"
      >
        {selected ? (
          <>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${selected.gender === "female" ? "bg-sky-100 text-sky-700" : "bg-indigo-100 text-indigo-700"}`}>
              {selected.firstName[0]}{selected.lastName[0]}
            </div>
            <span className="truncate text-indigo-900">{selected.firstName} {selected.lastName}</span>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(""); setOpen(false); }}
              className="ml-auto text-gray-400 hover:text-red-500 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 text-indigo-300 shrink-0" />
            <span className="text-gray-400">Sélectionner…</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 right-0 bg-white border border-indigo-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-indigo-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400" />
              <input
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500"
                placeholder="Rechercher…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {/* Option "aucun" */}
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); setQuery(""); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Aucun
            </button>
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">Aucun résultat</p>
            ) : filtered.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onChange(p.id); setOpen(false); setQuery(""); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${p.id === value ? "bg-indigo-50 text-indigo-900" : "hover:bg-gray-50 text-gray-700"}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${p.gender === "female" ? "bg-sky-100 text-sky-700" : "bg-indigo-100 text-indigo-700"}`}>
                  {p.firstName[0]}{p.lastName[0]}
                </div>
                <div className="text-left min-w-0">
                  <p className="font-semibold truncate">{p.firstName} {p.lastName}</p>
                  {p.birthDate && <p className="text-gray-400">{p.birthDate.slice(0, 4)}</p>}
                </div>
                {p.deathDate && <span className="ml-auto text-gray-400 shrink-0">†</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panneau principal ────────────────────────────────────────────────────────
export default function PersonDetailPanel({ person }: { person: Person }) {
  const { isAdmin, updatePerson, deletePerson, setSelectedPerson, addRelation, deleteRelation, relations, persons } = useTreeStore();

  const [editing, setEditing]         = useState(false);
  const [form, setForm]               = useState({ ...person });
  const [photoFile, setPhotoFile]     = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [saved, setSaved]             = useState(false);

  // Parents actuels de cette personne (relations où elle est l'enfant)
  const parentRelations = useMemo(() =>
    relations.filter(r => r.relationType === "parent" && r.toPersonId === person.id),
    [relations, person.id]
  );

  // Père et mère actuels (déduits des relations parent)
  const currentFatherId = useMemo(() => {
    const rel = parentRelations.find(r => {
      const p = persons.find(x => x.id === r.fromPersonId);
      return p?.gender === "male";
    });
    return rel?.fromPersonId ?? "";
  }, [parentRelations, persons]);

  const currentMotherId = useMemo(() => {
    const rel = parentRelations.find(r => {
      const p = persons.find(x => x.id === r.fromPersonId);
      return p?.gender === "female";
    });
    return rel?.fromPersonId ?? "";
  }, [parentRelations, persons]);

  // État local des parents en édition
  const [fatherId, setFatherId] = useState(currentFatherId);
  const [motherId, setMotherId] = useState(currentMotherId);

  // Reset quand la personne change
  useEffect(() => {
    setForm({ ...person });
    setEditing(false);
    setPhotoFile(null);
    setPhotoPreview("");
    setSaveError(null);
    setDeleteError(null);
  }, [person.id]);

  // Sync parents quand les relations changent
  useEffect(() => {
    setFatherId(currentFatherId);
    setMotherId(currentMotherId);
  }, [currentFatherId, currentMotherId]);

  const isChefFamille = relations.some(
    r => r.fromPersonId === person.id && r.relationType === "successor" && r.successionType === "chef_famille"
  );

  const personRelations = relations.filter(
    r => (r.fromPersonId === person.id || r.toPersonId === person.id) && r.relationType !== "parent"
  );

  function getRelatedPerson(id: string) { return persons.find(p => p.id === id); }

  function getRelationLabel(r: typeof relations[0]) {
    if (r.relationType === "spouse") return "💍 Conjoint(e) de";
    const labels: Record<string, string> = {
      chef_famille: "👑 Chef de famille",
      heritier: "🏠 Héritier de",
      representant: "🤝 Représentant de",
      autre: "➕ Successeur de",
    };
    return labels[r.successionType || "autre"];
  }

  // ── Sauvegarde parents ──────────────────────────────────────────────────────
  async function saveParents() {
    // Supprimer les anciennes relations parent → cette personne
    for (const rel of parentRelations) {
      await fetch(`/api/relations/${rel.id}`, { method: "DELETE" });
      deleteRelation(rel.id);
    }

    // Créer les nouvelles si définies
    const newParents = [
      { parentId: fatherId, coId: motherId },
      { parentId: motherId, coId: fatherId },
    ].filter(x => x.parentId);

    for (const { parentId, coId } of newParents) {
      const res = await fetch("/api/relations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromPersonId: parentId,
          toPersonId: person.id,
          relationType: "parent",
          coParentId: coId || undefined,
        }),
      });
      if (res.ok) addRelation(await res.json());
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      let photoUrl = form.photoUrl;
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        if (!up.ok) throw new Error("Échec de l'upload de la photo");
        photoUrl = (await up.json()).url;
      }
      const updated = { ...form, photoUrl };
      const res = await fetch(`/api/persons/${person.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`);
      updatePerson(updated);

      // Sauvegarder les parents si modifiés
      if (fatherId !== currentFatherId || motherId !== currentMotherId) {
        await saveParents();
      }

      setEditing(false);
      setPhotoFile(null);
      setPhotoPreview("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
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
      setDeleteError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally { setDeleting(false); setShowConfirmDelete(false); }
  }

  const inp = "w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:border-indigo-500";

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
                <button onClick={() => setEditing(true)} className="text-white/80 hover:text-white" title="Modifier">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setShowConfirmDelete(true)} className="text-white/80 hover:text-red-300" title="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button onClick={() => setSelectedPerson(null)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toasts */}
        {saved && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center gap-2 shrink-0">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-xs text-green-700 font-medium">Modifications enregistrées</span>
          </div>
        )}
        {saveError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 shrink-0">
            <span className="text-red-600 shrink-0">⚠</span>
            <span className="text-xs text-red-700 font-medium">{saveError}</span>
          </div>
        )}
        {deleteError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 shrink-0">
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
                    : <div className="flex flex-col items-center gap-1"><Upload className="w-6 h-6 text-indigo-400" /><span className="text-[10px] text-indigo-400">Changer</span></div>
                  }
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }
                }} />
              </label>
            ) : (
              <div className="w-24 h-24 rounded-full border-2 border-indigo-400 overflow-hidden">
                {person.photoUrl
                  ? <img src={person.photoUrl} className="w-full h-full object-cover" alt={person.firstName} />
                  : <div className="w-full h-full bg-indigo-100 flex items-center justify-center"><User className="w-10 h-10 text-indigo-400" /></div>
                }
              </div>
            )}
          </div>

          {/* ── Mode édition ── */}
          {editing ? (
            <div className="space-y-3">

              {/* Identité */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-indigo-900">Prénom</label>
                  <input className={inp} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-indigo-900">Nom</label>
                  <input className={inp} value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-indigo-900">Genre</label>
                <select className={inp} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as "male" | "female" })}>
                  <option value="male">👨 Homme</option>
                  <option value="female">👩 Femme</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-indigo-900">Naissance</label>
                  <input type="date" className={inp} value={form.birthDate || ""} onChange={e => setForm({ ...form, birthDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-indigo-900">Décès</label>
                  <input type="date" className={inp} value={form.deathDate || ""} onChange={e => setForm({ ...form, deathDate: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-indigo-900">Lieu de naissance</label>
                <input className={inp} value={form.birthPlace || ""} onChange={e => setForm({ ...form, birthPlace: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-semibold text-indigo-900">Biographie</label>
                <textarea className={`${inp} resize-none`} rows={3} value={form.bio || ""} onChange={e => setForm({ ...form, bio: e.target.value })} />
              </div>

              {/* ── Section Parents ── */}
              <div className="border-t border-indigo-100 pt-3 space-y-3">
                <p className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Parents</p>
                <PersonPicker
                  label="👨 Père"
                  value={fatherId}
                  exclude={[person.id, motherId].filter(Boolean)}
                  onChange={setFatherId}
                />
                <PersonPicker
                  label="👩 Mère"
                  value={motherId}
                  exclude={[person.id, fatherId].filter(Boolean)}
                  onChange={setMotherId}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setEditing(false); setForm({ ...person }); setPhotoPreview(""); setFatherId(currentFatherId); setMotherId(currentMotherId); }}
                  disabled={saving}
                  className="flex-1 border-2 border-indigo-600 text-indigo-600 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                  {saving ? "Sauvegarde…" : "Sauver"}
                </button>
              </div>
            </div>

          ) : (
            /* ── Mode lecture ── */
            <>
              {/* Infos de base */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-indigo-400 font-medium">Genre</span>
                  <span className="text-indigo-900">{person.gender === "male" ? "👨 Homme" : "👩 Femme"}</span>
                </div>
                {person.birthDate && (
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-indigo-400 font-medium">Naissance</span>
                    <span className="text-indigo-900">{person.birthDate}</span>
                  </div>
                )}
                {person.deathDate && (
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-indigo-400 font-medium">Décès</span>
                    <span className="text-indigo-900">{person.deathDate}</span>
                  </div>
                )}
                {person.birthPlace && (
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-indigo-400 font-medium">Lieu</span>
                    <span className="text-indigo-900 text-right max-w-[60%]">{person.birthPlace}</span>
                  </div>
                )}
              </div>

              {/* Parents */}
              {(currentFatherId || currentMotherId) && (
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-2">Parents</h4>
                  <div className="space-y-1.5">
                    {[currentFatherId, currentMotherId].filter(Boolean).map(pid => {
                      const p = persons.find(x => x.id === pid);
                      if (!p) return null;
                      return (
                        <div key={pid} className="flex items-center gap-2 bg-indigo-50 rounded-lg p-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${p.gender === "female" ? "bg-sky-100 text-sky-700" : "bg-indigo-100 text-indigo-700"}`}>
                            {p.firstName[0]}{p.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-indigo-400">{p.gender === "male" ? "Père" : "Mère"}</p>
                            <p className="text-sm font-semibold text-indigo-900 truncate">{p.firstName} {p.lastName}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Biographie */}
              {person.bio && (
                <div className="bg-indigo-50 rounded-xl p-3">
                  <p className="text-xs text-indigo-800 leading-relaxed">{person.bio}</p>
                </div>
              )}

              {/* Autres relations (conjoints, successions) */}
              {personRelations.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-2">Relations</h4>
                  <div className="space-y-1.5">
                    {personRelations.map(r => {
                      const otherId = r.fromPersonId === person.id ? r.toPersonId : r.fromPersonId;
                      const other = getRelatedPerson(otherId);
                      if (!other) return null;
                      return (
                        <div key={r.id} className="flex items-center gap-2 bg-indigo-50 rounded-lg p-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${other.gender === "female" ? "bg-sky-100 text-sky-700" : "bg-indigo-100 text-indigo-700"}`}>
                            {other.firstName[0]}{other.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-indigo-400">{getRelationLabel(r)}</p>
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

      {showConfirmDelete && (
        <ConfirmModal
          title="Supprimer ce membre"
          message={`Supprimer ${person.firstName} ${person.lastName} ? Toutes ses relations seront également supprimées. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          danger loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirmDelete(false)}
        />
      )}
    </>
  );
}
