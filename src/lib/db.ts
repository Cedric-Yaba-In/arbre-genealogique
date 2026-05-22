import { PrismaClient } from "@/generated/prisma/client";
import { getPrismaClientClass } from "@/generated/prisma/internal/class";
import path from "path";

// Chemin absolu vers le dossier généré — nécessaire pour que Prisma localise
// le query engine (.dll.node) correctement avec Turbopack/Next.js
const generatedDir = path.join(process.cwd(), "src", "generated", "prisma");
const PrismaClientWithDir = getPrismaClientClass(generatedDir);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? (new PrismaClientWithDir() as unknown as PrismaClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
