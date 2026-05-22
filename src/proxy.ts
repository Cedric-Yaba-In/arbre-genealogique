import { NextRequest, NextResponse } from "next/server";

// La page de login est publique, toutes les autres routes /admin/* sont protégées
const PUBLIC_ADMIN_PATHS = ["/admin/login"];

/**
 * Vérifie la présence et la validité structurelle du cookie admin_token.
 * On ne peut pas utiliser jsonwebtoken dans le proxy (Node.js runtime),
 * donc on vérifie la structure JWT et l'expiration via décodage Base64.
 * La validation cryptographique complète est faite dans chaque route API via getSession().
 */
function hasValidAdminCookie(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;

  // Vérification structurelle d'un JWT (3 parties séparées par des points)
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  // Vérifier que le payload n'est pas expiré (décodage Base64 sans vérification de signature)
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );
    if (payload.exp && Date.now() / 1000 > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicAdmin = PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (!isPublicAdmin) {
    if (!hasValidAdminCookie(req)) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // S'applique uniquement aux routes /admin/* sauf /admin/login
  matcher: ["/admin/:path*"],
};
