import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

console.log("DATABASE_URL:", process.env.DATABASE_URL ? process.env.DATABASE_URL.slice(0, 40) + "..." : "NON DÉFINIE");

import { PrismaClient } from "./src/generated/prisma/client.js";

const prisma = new PrismaClient({ log: ["error", "warn"] });

try {
  const count = await prisma.person.count();
  console.log("✅ Connexion OK — personnes en base:", count);
} catch (e) {
  console.error("❌ Erreur Prisma:", e.message);
  if (e.cause) console.error("   Cause:", e.cause.message ?? e.cause);
} finally {
  await prisma.$disconnect();
}
