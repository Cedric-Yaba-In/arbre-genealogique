import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    // Filtrer uniquement les champs modifiables
    const { firstName, lastName, gender, birthDate, deathDate, birthPlace, photoUrl, bio, positionX, positionY } = body;
    const data: Record<string, any> = {};
    if (firstName   !== undefined) data.firstName   = firstName;
    if (lastName    !== undefined) data.lastName    = lastName;
    if (gender      !== undefined) data.gender      = gender;
    if (birthDate   !== undefined) data.birthDate   = birthDate;
    if (deathDate   !== undefined) data.deathDate   = deathDate;
    if (birthPlace  !== undefined) data.birthPlace  = birthPlace;
    if (photoUrl    !== undefined) data.photoUrl    = photoUrl;
    if (bio         !== undefined) data.bio         = bio;
    if (positionX   !== undefined) data.positionX   = positionX;
    if (positionY   !== undefined) data.positionY   = positionY;

    const updated = await prisma.person.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("[PATCH /api/persons/:id] Erreur:", e?.message, "| code:", e?.code);
    return NextResponse.json({ error: e?.message ?? "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.person.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[DELETE /api/persons/:id] Erreur:", e?.message, "| code:", e?.code);
    return NextResponse.json({ error: e?.message ?? "Erreur interne" }, { status: 500 });
  }
}
