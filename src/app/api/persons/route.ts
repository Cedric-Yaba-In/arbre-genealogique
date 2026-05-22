import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const [persons, relations] = await Promise.all([
      prisma.person.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.relation.findMany({ orderBy: { createdAt: "asc" } }),
    ]);
    return NextResponse.json({ persons, relations });
  } catch (e: any) {
    console.error("[GET /api/persons] Erreur Prisma:", e?.message, "| code:", e?.code, "| cause:", e?.cause?.message ?? e?.cause);
    return NextResponse.json({ error: e?.message ?? "Erreur interne" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();
    // Filtrer uniquement les champs connus du modèle Person
    const { id, firstName, lastName, gender, birthDate, deathDate, birthPlace, photoUrl, bio, positionX, positionY } = body;
    const person = await prisma.person.create({
      data: { id, firstName, lastName, gender, birthDate, deathDate, birthPlace, photoUrl, bio, positionX, positionY },
    });
    return NextResponse.json(person, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/persons] Erreur Prisma:", e?.message, "| code:", e?.code, "| cause:", e?.cause?.message ?? e?.cause);
    return NextResponse.json({ error: e?.message ?? "Erreur interne" }, { status: 500 });
  }
}
