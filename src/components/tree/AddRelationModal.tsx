"use client";
import { useState, useMemo } from "react";
import { X, Upload, Users, UserPlus, Search } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { Person, RelationType, SuccessionType } from "@/types";
import { useTreeStore } from "@/store/treeStore";
import { v4 as uuidv4 } from "uuid";

const SUCCESSION_LABELS: Record<SuccessionType, string> = {
  chef_famille: "👑 Chef de famille",
  heritier: "🏠 Héritier",
  representant: "🤝 Représentant",
  autre: "➕ Autre",
};

type Mode = "new" | "existing"; // créer une nouvelle personne ou lier une existante

export default function AddRelationModal({ fromPersonId, onClose }: { fromPersonId: string; onClose: () => void }) {
  const { addPerson, addRelation, persons, relations } = useTreeStore();

  const [step, setStep] = useState<"relation" | "person">("relation");
  const [relationType, setRelationType] = useState<RelationType>("parent");
  const [successionType, setSuccessionType] = useState<SuccessionType>("chef_famille");
  // Pour filiation : "to" = nouvel enfant, "from" = nouveau parent
  const [direction, setDirection] = useState<"from" | "to">("to");
  // Co-parent sélectionné (pour les enfants)
  const [coParentId, setCoParentId] = useState<string>("");
  // Mode : nouvelle personne ou personne existante (pour succession)
  const [mode, setMode] = useState<Mode>("new");
  const [existingTargetId, setExistingTargetId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "",
    gender: "male" as "male" | "female",
    birthDate: "", deathDate: "", birthPlace: "", bio: "",
  });

  const fromPerson = persons.find((p) => p.id === fromPersonId)!;

  // Conjoints actuels de la personne source
  const spouses = useMemo(() => {
    const spouseIds = relations
      .filter((r) => r.relationType === "spouse" && (r.fromPersonId === fromPersonId || r.toPersonId === fromPersonId))
      .map((r) => (r.fromPersonId === fromPersonId ? r.toPersonId : r.fromPersonId));
    return persons.filter((p) => spouseIds.includes(p.id));
  }, [relations, persons, fromPersonId]);

  // Personnes disponibles pour lier (exclure soi-même et déjà liés directement)
  // Pour le mariage, on exclut uniquement les conjoints déjà existants
  const availablePersons = useMemo(() => {
    if (relationType === "spouse") {
      // Pour un mariage, exclure soi-même et les conjoints déjà liés
      const existingSpouseIds = new Set(
        relations
          .filter((r) => r.relationType === "spouse" && (r.fromPersonId === fromPersonId || r.toPersonId === fromPersonId))
          .flatMap((r) => [r.fromPersonId, r.toPersonId])
      );
      return persons.filter((p) => p.id !== fromPersonId && !existingSpouseIds.has(p.id));
    }
    const directlyLinked = new Set(
      relations
        .filter((r) => r.fromPersonId === fromPersonId || r.toPersonId === fromPersonId)
        .flatMap((r) => [r.fromPersonId, r.toPersonId])
    );
    return persons.filter((p) => p.id !== fromPersonId && !directlyLinked.has(p.id));
  }, [persons, relations, fromPersonId, relationType]);

  const filteredPersons = useMemo(() => {
    if (!searchQuery) return availablePersons;
    const q = searchQuery.toLowerCase();
    return availablePersons.filter(
      (p) => p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q)
    );
  }, [availablePersons, searchQuery]);

  // Pour succession : toutes les personnes sauf soi-même
  const allOtherPersons = useMemo(() => {
    if (!searchQuery) return persons.filter((p) => p.id !== fromPersonId);
    const q = searchQuery.toLowerCase();
    return persons.filter(
      (p) => p.id !== fromPersonId && (p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q))
    );
  }, [persons, fromPersonId, searchQuery]);

  function calcPosition() {
    const fp = fromPerson;
    let posX = fp.positionX, posY = fp.positionY;
    if (relationType === "parent" && direction === "to") {
      posY += 200;
      const sameRow = persons.filter((p) => Math.abs(p.positionY - posY) < 50).length;
      posX = fp.positionX - 100 + sameRow * 200;
    } else if (relationType === "parent" && direction === "from") {
      posY -= 200;
    } else if (relationType === "spouse") {
      const existingSpouses = spouses.length;
      posX += 220 * (existingSpouses + 1);
    } else {
      posY += 200; posX += 100;
    }
    return { posX, posY };
  }

  async function handleSubmitNew() {
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

      const { posX, posY } = calcPosition();
      const newId = uuidv4();
      const personRes = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: newId, ...form, photoUrl, positionX: posX, positionY: posY }),
      });
      if (!personRes.ok) throw new Error(`Erreur création personne : ${personRes.status}`);
      const newPerson: Person = await personRes.json();
      addPerson(newPerson);

      const relPayload: any = {
        fromPersonId: direction === "from" ? newId : fromPersonId,
        toPersonId: direction === "from" ? fromPersonId : newId,
        relationType,
        successionType: relationType === "successor" ? successionType : undefined,
        coParentId: relationType === "parent" && direction === "to" && coParentId ? coParentId : undefined,
      };
      const relRes = await fetch("/api/relations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(relPayload),
      });
      if (!relRes.ok) throw new Error(`Erreur création relation : ${relRes.status}`);
      const newRelation = await relRes.json();
      addRelation(newRelation);
      onClose();
    } catch (err) {
      console.error("Erreur lors de l'ajout :", err);
      setSubmitError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally { setLoading(false); }
  }

  async function handleSubmitExisting() {
    if (!existingTargetId) return;
    setLoading(true);
    setSubmitError(null);
    try {
      // Pour un mariage (spouse), la relation va toujours de fromPersonId → existingTargetId
      // Pour parent direction "from", le nouveau parent est existingTargetId → fromPersonId
      const isParentFrom = relationType === "parent" && direction === "from";
      const relPayload: any = {
        fromPersonId: isParentFrom ? existingTargetId : fromPersonId,
        toPersonId: isParentFrom ? fromPersonId : existingTargetId,
        relationType,
        successionType: relationType === "successor" ? successionType : undefined,
        coParentId: relationType === "parent" && direction === "to" && coParentId ? coParentId : undefined,
      };
      const relRes = await fetch("/api/relations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(relPayload),
      });
      if (!relRes.ok) throw new Error(`Erreur création relation : ${relRes.status}`);
      const newRelation = await relRes.json();
      addRelation(newRelation);
      onClose();
    } catch (err) {
      console.error("Erreur lors du lien :", err);
      setSubmitError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally { setLoading(false); }
  }

  const btnActive = "border-indigo-600 bg-indigo-50 text-indigo-900";
  const btnInactive = "border-gray-200 text-gray-600 hover:border-indigo-300";

  // Détermine si on peut lier à une personne existante (toutes les relations le supportent)
  const canLinkExisting = true;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-800 to-blue-600 p-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Ajouter un lien</h2>
            <p className="text-blue-200 text-xs mt-0.5">
              {fromPerson.firstName} {fromPerson.lastName}
            </p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {step === "relation" ? (
            <>
              {/* Type de relation */}
              <div>
                <label className="block text-sm font-semibold text-indigo-900 mb-2">Type de relation</label>
                <div className="grid grid-cols-1 gap-2">
                  {([
                    { value: "parent", label: "👨‍👩‍👧 Filiation (parent / enfant)" },
                    { value: "spouse", label: "💍 Conjoint(e) / Mariage" },
                    { value: "successor", label: "👑 Succession" },
                  ] as { value: RelationType; label: string }[]).map(({ value, label }) => (
                    <button key={value} onClick={() => { setRelationType(value); setMode("new"); setCoParentId(""); setSearchQuery(""); }}
                      className={`p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${relationType === value ? btnActive : btnInactive}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filiation : direction */}
              {relationType === "parent" && (
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 mb-2">Direction</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setDirection("to")} className={`p-2 rounded-xl border-2 text-sm font-medium transition-all ${direction === "to" ? btnActive : btnInactive}`}>
                      Enfant de {fromPerson.firstName}
                    </button>
                    <button onClick={() => setDirection("from")} className={`p-2 rounded-xl border-2 text-sm font-medium transition-all ${direction === "from" ? btnActive : btnInactive}`}>
                      Parent de {fromPerson.firstName}
                    </button>
                  </div>
                </div>
              )}

              {/* Co-parent : seulement si "enfant de" et qu'il y a des conjoints */}
              {relationType === "parent" && direction === "to" && spouses.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 mb-2">
                    Avec quel(le) conjoint(e) ? <span className="text-indigo-400 font-normal">(optionnel)</span>
                  </label>
                  <div className="space-y-2">
                    <button onClick={() => setCoParentId("")} className={`w-full p-2 rounded-xl border-2 text-sm font-medium text-left transition-all ${!coParentId ? btnActive : btnInactive}`}>
                      Non précisé
                    </button>
                    {spouses.map((s) => (
                      <button key={s.id} onClick={() => setCoParentId(s.id)}
                        className={`w-full p-2 rounded-xl border-2 text-sm font-medium text-left transition-all flex items-center gap-2 ${coParentId === s.id ? btnActive : btnInactive}`}>
                        <Users className="w-4 h-4 shrink-0" />
                        {s.firstName} {s.lastName}
                        {s.deathDate && <span className="text-xs text-gray-400 ml-auto">†{s.deathDate}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Succession : type */}
              {relationType === "successor" && (
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 mb-2">Type de succession</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(SUCCESSION_LABELS) as SuccessionType[]).map((type) => (
                      <button key={type} onClick={() => setSuccessionType(type)}
                        className={`p-2 rounded-xl border-2 text-sm font-medium transition-all ${successionType === type ? btnActive : btnInactive}`}>
                        {SUCCESSION_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode : nouvelle personne ou existante */}
              {canLinkExisting && (
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 mb-2">Personne</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setMode("new")} className={`p-2 rounded-xl border-2 text-sm font-medium flex items-center gap-1.5 justify-center transition-all ${mode === "new" ? btnActive : btnInactive}`}>
                      <UserPlus className="w-4 h-4" /> Nouvelle
                    </button>
                    <button onClick={() => setMode("existing")} className={`p-2 rounded-xl border-2 text-sm font-medium flex items-center gap-1.5 justify-center transition-all ${mode === "existing" ? btnActive : btnInactive}`}>
                      <Users className="w-4 h-4" /> Existante
                    </button>
                  </div>
                </div>
              )}

              {/* Sélection personne existante */}
              {mode === "existing" && (
                <div>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                    <input
                      className="w-full border border-indigo-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-indigo-100 rounded-xl p-2">
                    {(relationType === "successor" ? allOtherPersons : filteredPersons).length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">Aucune personne trouvée</p>
                    ) : (
                      (relationType === "successor" ? allOtherPersons : filteredPersons).map((p) => (
                        <button key={p.id} onClick={() => setExistingTargetId(p.id)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-all ${existingTargetId === p.id ? "bg-indigo-100 text-indigo-900" : "hover:bg-gray-50 text-gray-700"}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${p.gender === "female" ? "bg-sky-100 text-sky-700" : "bg-indigo-100 text-indigo-700"}`}>
                            {p.firstName[0]}{p.lastName[0]}
                          </div>
                          <div className="text-left min-w-0">
                            <p className="font-semibold truncate">{p.firstName} {p.lastName}</p>
                            {p.birthDate && <p className="text-xs text-gray-400">{p.birthDate}</p>}
                          </div>
                          {p.deathDate && <span className="ml-auto text-xs text-gray-400 shrink-0">†</span>}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Message d'erreur */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  ⚠ {submitError}
                </div>
              )}

              <button
                onClick={() => mode === "existing" ? handleSubmitExisting() : setStep("person")}
                disabled={loading || (mode === "existing" && !existingTargetId)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <><Spinner size="sm" />En cours...</> : mode === "existing" ? "Lier cette personne" : "Suivant →"}
              </button>
            </>
          ) : (
            /* Étape 2 : formulaire nouvelle personne */
            <>
              <div className="flex justify-center">
                <label className="cursor-pointer group">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-indigo-400 flex items-center justify-center overflow-hidden bg-indigo-50 group-hover:border-indigo-600 transition-colors">
                    {photoPreview
                      ? <img src={photoPreview} className="w-full h-full object-cover" alt="" />
                      : <div className="flex flex-col items-center"><Upload className="w-6 h-6 text-indigo-400" /><span className="text-[10px] text-indigo-400 mt-1">Photo</span></div>}
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
                    <button key={g} onClick={() => setForm({ ...form, gender: g })} className={`py-2 rounded-lg border-2 text-sm font-medium transition-all ${form.gender === g ? btnActive : btnInactive}`}>
                      {g === "male" ? "👨 Homme" : "👩 Femme"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-indigo-900 mb-1">Naissance</label><input type="date" className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></div>
                <div><label className="block text-xs font-semibold text-indigo-900 mb-1">Décès</label><input type="date" className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={form.deathDate} onChange={(e) => setForm({ ...form, deathDate: e.target.value })} /></div>
              </div>

              <div><label className="block text-xs font-semibold text-indigo-900 mb-1">Lieu de naissance</label><input className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={form.birthPlace} onChange={(e) => setForm({ ...form, birthPlace: e.target.value })} placeholder="Ex: Bafoussam" /></div>
              <div><label className="block text-xs font-semibold text-indigo-900 mb-1">Biographie</label><textarea className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Quelques mots..." /></div>

              {/* Résumé du lien */}
              <div className="bg-indigo-50 rounded-xl p-3 text-xs text-indigo-700">
                <span className="font-semibold">Lien créé : </span>
                {relationType === "parent" && direction === "to" && <>Enfant de <strong>{fromPerson.firstName}</strong>{coParentId && <> et <strong>{persons.find(p => p.id === coParentId)?.firstName}</strong></>}</>}
                {relationType === "parent" && direction === "from" && <>Parent de <strong>{fromPerson.firstName}</strong></>}
                {relationType === "spouse" && <>Conjoint(e) de <strong>{fromPerson.firstName}</strong></>}
                {relationType === "successor" && <><strong>{SUCCESSION_LABELS[successionType]}</strong> de <strong>{fromPerson.firstName}</strong></>}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("relation")} disabled={loading} className="flex-1 border-2 border-indigo-600 text-indigo-600 font-semibold py-3 rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50">← Retour</button>
                <button onClick={handleSubmitNew} disabled={loading || !form.firstName || !form.lastName} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                  {loading ? <><Spinner size="sm" />Ajout...</> : "Ajouter"}
                </button>
              </div>

              {/* Message d'erreur étape 2 */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  ⚠ {submitError}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}