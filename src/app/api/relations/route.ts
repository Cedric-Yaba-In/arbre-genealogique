import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();
    // Filtrer uniquement les champs connus du modèle Relation
    const { fromPersonId, toPersonId, relationType, successionType, marriageOrder, marriageDate, coParentId } = body;
    const relation = await prisma.relation.create({
      data: { fromPersonId, toPersonId, relationType, successionType, marriageOrder, marriageDate, coParentId },
    });
    return NextResponse.json(relation, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/relations] Erreur:", e?.message, "| code:", e?.code, "| cause:", e?.cause?.message ?? e?.cause);
    return NextResponse.json({ error: e?.message ?? "Erreur interne" }, { status: 500 });
  }
}
