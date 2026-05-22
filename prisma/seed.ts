import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Démarrage du seed...");

  await prisma.relation.deleteMany();
  await prisma.person.deleteMany();

  // ── Génération 1 ──────────────────────────────────────────────
  const grandPere = await prisma.person.create({ data: {
    id: "seed-001",
    firstName: "Jean-Baptiste", lastName: "Kamga",
    gender: "male", birthDate: "1920-03-15", deathDate: "1998-11-02",
    birthPlace: "Bafoussam, Cameroun",
    bio: "Fondateur de la lignée Kamga. Chef de famille respecté, il a guidé sa famille avec sagesse pendant des décennies.",
    positionX: 600, positionY: 50,
  }});

  // 1ère épouse de Jean-Baptiste
  const grandMere1 = await prisma.person.create({ data: {
    id: "seed-002",
    firstName: "Marie-Claire", lastName: "Kamga",
    gender: "female", birthDate: "1925-07-20", deathDate: "1965-03-10",
    birthPlace: "Bafang, Cameroun",
    bio: "Première épouse de Jean-Baptiste. Décédée jeune, mère de Paul et Pierre.",
    positionX: 900, positionY: 50,
  }});

  // 2ème épouse de Jean-Baptiste (tradition bamiléké : remariage dans la famille après décès)
  const grandMere2 = await prisma.person.create({ data: {
    id: "seed-009",
    firstName: "Agnès", lastName: "Kamga",
    gender: "female", birthDate: "1935-05-12", deathDate: "2005-08-22",
    birthPlace: "Bafoussam, Cameroun",
    bio: "Deuxième épouse de Jean-Baptiste, selon la tradition bamiléké. Mère de Théodore.",
    positionX: 300, positionY: 50,
  }});

  // ── Génération 2 ──────────────────────────────────────────────
  const pere = await prisma.person.create({ data: {
    id: "seed-003",
    firstName: "Paul", lastName: "Kamga",
    gender: "male", birthDate: "1952-06-10",
    birthPlace: "Bafoussam, Cameroun",
    bio: "Fils aîné de Jean-Baptiste et Marie-Claire. Ingénieur, chef de famille depuis 1998.",
    positionX: 750, positionY: 300,
  }});

  const oncle = await prisma.person.create({ data: {
    id: "seed-005",
    firstName: "Pierre", lastName: "Kamga",
    gender: "male", birthDate: "1955-09-03",
    birthPlace: "Bafoussam, Cameroun",
    bio: "Fils de Jean-Baptiste et Marie-Claire. Commerçant prospère.",
    positionX: 1050, positionY: 300,
  }});

  // Fils de Jean-Baptiste avec sa 2ème épouse Agnès
  const oncle2 = await prisma.person.create({ data: {
    id: "seed-010",
    firstName: "Théodore", lastName: "Kamga",
    gender: "male", birthDate: "1960-11-18",
    birthPlace: "Bafoussam, Cameroun",
    bio: "Fils de Jean-Baptiste et Agnès. Représentant de la famille dans la région de l'Ouest.",
    positionX: 300, positionY: 300,
  }});

  // 1ère épouse de Paul
  const mere1 = await prisma.person.create({ data: {
    id: "seed-004",
    firstName: "Suzanne", lastName: "Kamga",
    gender: "female", birthDate: "1958-02-14", deathDate: "1990-06-30",
    birthPlace: "Douala, Cameroun",
    bio: "Première épouse de Paul. Enseignante, décédée en 1990. Mère d'Emmanuel et Christelle.",
    positionX: 550, positionY: 300,
  }});

  // 2ème épouse de Paul (remariage tradition bamiléké)
  const mere2 = await prisma.person.create({ data: {
    id: "seed-011",
    firstName: "Cécile", lastName: "Kamga",
    gender: "female", birthDate: "1965-09-05",
    birthPlace: "Bafoussam, Cameroun",
    bio: "Deuxième épouse de Paul, selon la tradition bamiléké après le décès de Suzanne. Mère de Rodrigue.",
    positionX: 950, positionY: 300,
  }});

  // ── Génération 3 ──────────────────────────────────────────────
  const fils1 = await prisma.person.create({ data: {
    id: "seed-006",
    firstName: "Emmanuel", lastName: "Kamga",
    gender: "male", birthDate: "1980-11-25",
    birthPlace: "Yaoundé, Cameroun",
    bio: "Fils aîné de Paul et Suzanne. Médecin. Héritier désigné de Paul.",
    positionX: 550, positionY: 550,
  }});

  const fille1 = await prisma.person.create({ data: {
    id: "seed-007",
    firstName: "Christelle", lastName: "Kamga",
    gender: "female", birthDate: "1983-04-08",
    birthPlace: "Yaoundé, Cameroun",
    bio: "Fille de Paul et Suzanne. Avocate.",
    positionX: 750, positionY: 550,
  }});

  // Fils de Paul avec sa 2ème épouse Cécile
  const fils2 = await prisma.person.create({ data: {
    id: "seed-008",
    firstName: "Rodrigue", lastName: "Kamga",
    gender: "male", birthDate: "1987-08-19",
    birthPlace: "Douala, Cameroun",
    bio: "Fils de Paul et Cécile. Entrepreneur.",
    positionX: 950, positionY: 550,
  }});

  // Fils de Théodore (génération 3, branche Agnès)
  const fils3 = await prisma.person.create({ data: {
    id: "seed-012",
    firstName: "Hervé", lastName: "Kamga",
    gender: "male", birthDate: "1985-03-22",
    birthPlace: "Bafoussam, Cameroun",
    bio: "Fils de Théodore. Représentant de la branche cadette.",
    positionX: 300, positionY: 550,
  }});

  // ── MARIAGES ──────────────────────────────────────────────────
  await prisma.relation.create({ data: {
    id: "rel-001",
    fromPersonId: grandPere.id, toPersonId: grandMere1.id,
    relationType: "spouse", marriageOrder: 1, marriageDate: "1948-01-10",
  }});

  await prisma.relation.create({ data: {
    id: "rel-010",
    fromPersonId: grandPere.id, toPersonId: grandMere2.id,
    relationType: "spouse", marriageOrder: 2, marriageDate: "1967-04-15",
  }});

  await prisma.relation.create({ data: {
    id: "rel-002",
    fromPersonId: pere.id, toPersonId: mere1.id,
    relationType: "spouse", marriageOrder: 1, marriageDate: "1979-08-20",
  }});

  await prisma.relation.create({ data: {
    id: "rel-011",
    fromPersonId: pere.id, toPersonId: mere2.id,
    relationType: "spouse", marriageOrder: 2, marriageDate: "1992-12-05",
  }});

  // ── FILIATIONS avec coParentId ─────────────────────────────────
  // Jean-Baptiste + Marie-Claire → Paul
  await prisma.relation.create({ data: {
    id: "rel-003",
    fromPersonId: grandPere.id, toPersonId: pere.id,
    relationType: "parent", coParentId: grandMere1.id,
  }});

  // Jean-Baptiste + Marie-Claire → Pierre
  await prisma.relation.create({ data: {
    id: "rel-004",
    fromPersonId: grandPere.id, toPersonId: oncle.id,
    relationType: "parent", coParentId: grandMere1.id,
  }});

  // Jean-Baptiste + Agnès → Théodore
  await prisma.relation.create({ data: {
    id: "rel-012",
    fromPersonId: grandPere.id, toPersonId: oncle2.id,
    relationType: "parent", coParentId: grandMere2.id,
  }});

  // Paul + Suzanne → Emmanuel
  await prisma.relation.create({ data: {
    id: "rel-005",
    fromPersonId: pere.id, toPersonId: fils1.id,
    relationType: "parent", coParentId: mere1.id,
  }});

  // Paul + Suzanne → Christelle
  await prisma.relation.create({ data: {
    id: "rel-006",
    fromPersonId: pere.id, toPersonId: fille1.id,
    relationType: "parent", coParentId: mere1.id,
  }});

  // Paul + Cécile → Rodrigue
  await prisma.relation.create({ data: {
    id: "rel-007",
    fromPersonId: pere.id, toPersonId: fils2.id,
    relationType: "parent", coParentId: mere2.id,
  }});

  // Théodore → Hervé
  await prisma.relation.create({ data: {
    id: "rel-013",
    fromPersonId: oncle2.id, toPersonId: fils3.id,
    relationType: "parent",
  }});

  // ── SUCCESSIONS ───────────────────────────────────────────────
  // Paul = chef de famille, successeur de Jean-Baptiste
  await prisma.relation.create({ data: {
    id: "rel-008",
    fromPersonId: pere.id, toPersonId: grandPere.id,
    relationType: "successor", successionType: "chef_famille",
  }});

  // Emmanuel = héritier de Paul (génération suivante)
  await prisma.relation.create({ data: {
    id: "rel-009",
    fromPersonId: fils1.id, toPersonId: pere.id,
    relationType: "successor", successionType: "heritier",
  }});

  // Théodore = représentant de Jean-Baptiste pour la branche cadette
  await prisma.relation.create({ data: {
    id: "rel-014",
    fromPersonId: oncle2.id, toPersonId: grandPere.id,
    relationType: "successor", successionType: "representant",
  }});

  // Hervé = héritier de Théodore (saut de génération : grand-père → petit-fils possible)
  await prisma.relation.create({ data: {
    id: "rel-015",
    fromPersonId: fils3.id, toPersonId: oncle2.id,
    relationType: "successor", successionType: "heritier",
  }});

  console.log("✅ Seed terminé avec succès !");
  console.log(`   👥 ${await prisma.person.count()} personnes créées`);
  console.log(`   🔗 ${await prisma.relation.count()} relations créées`);
  console.log("");
  console.log("🔐 Identifiants admin :");
  console.log("   Utilisateur : admin");
  console.log("   Mot de passe : admin123");
}

main()
  .catch((e) => { console.error("❌ Erreur seed :", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
