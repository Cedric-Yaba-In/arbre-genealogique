"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TreePine, Shield, LogOut, Menu, X } from "lucide-react";
import { useTreeStore } from "@/store/treeStore";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, setIsAdmin } = useTreeStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(({ isAdmin: v }) => setIsAdmin(v));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    setIsAdmin(false);
    router.push("/");
  }

  return (
    <header className="relative bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-700 shadow-xl">
      {/* Motif ndop bleu/blanc */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)`,
          backgroundSize: "12px 12px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <TreePine className="w-6 h-6 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Arbre Généalogique</h1>
            <p className="text-blue-200 text-xs font-medium">Famille Bafang — Peuple de l'Ouest</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          <Link
            href="/"
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
              pathname === "/" ? "bg-white text-indigo-800" : "text-blue-100 hover:bg-indigo-700"
            }`}
          >
            L'Arbre
          </Link>
          {isAdmin ? (
            <>
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                  pathname === "/admin" ? "bg-white text-indigo-800" : "text-blue-100 hover:bg-indigo-700"
                }`}
              >
                <Shield className="w-4 h-4" /> Administration
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-blue-100 hover:bg-red-600/50 transition-all"
              >
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </>
          ) : (
            <Link
              href="/admin/login"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-blue-100 hover:bg-indigo-700 transition-all"
            >
              <Shield className="w-4 h-4" /> Admin
            </Link>
          )}
        </nav>

        <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden relative bg-indigo-900 border-t border-indigo-700 px-4 py-3 space-y-2">
          <Link href="/" className="block text-blue-100 font-medium py-2" onClick={() => setMenuOpen(false)}>L'Arbre</Link>
          {isAdmin ? (
            <>
              <Link href="/admin" className="block text-blue-100 font-medium py-2" onClick={() => setMenuOpen(false)}>Administration</Link>
              <button onClick={handleLogout} className="block text-blue-100 font-medium py-2 w-full text-left">Déconnexion</button>
            </>
          ) : (
            <Link href="/admin/login" className="block text-blue-100 font-medium py-2" onClick={() => setMenuOpen(false)}>Admin</Link>
          )}
        </div>
      )}
    </header>
  );
}
