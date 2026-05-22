"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, TreePine } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { useTreeStore } from "@/store/treeStore";

export default function LoginPage() {
  const router = useRouter();
  const { setIsAdmin } = useTreeStore();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { setError("Identifiants incorrects"); return; }
      setIsAdmin(true);
      router.push("/admin");
    } finally { setLoading(false); }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-900 to-blue-700 p-8 text-center relative">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: `repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)`, backgroundSize: "12px 12px" }}
            />
            <div className="relative">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                <TreePine className="w-9 h-9 text-indigo-700" />
              </div>
              <h1 className="text-white font-bold text-xl">Espace Administrateur</h1>
              <p className="text-blue-200 text-sm mt-1">Arbre Généalogique Bafang</p>
            </div>
          </div>

          {/* Bande ndop bleu/blanc */}
          <div className="flex h-1.5">
            {["bg-indigo-700", "bg-white", "bg-blue-500", "bg-white", "bg-indigo-700", "bg-white"].map((c, i) => (
              <div key={i} className={`flex-1 ${c}`} />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-indigo-900 mb-2">Identifiant</label>
              <input
                type="text" required value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-600 transition-colors"
                placeholder="Votre identifiant"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-indigo-900 mb-2">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-indigo-600 transition-colors"
                  placeholder="Votre mot de passe"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-center">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-800 to-blue-600 hover:from-indigo-900 hover:to-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
              {loading ? <Spinner size="sm" /> : <Shield className="w-5 h-5" />}
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
