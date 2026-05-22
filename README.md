# Arbre Généalogique — Famille Bafang

Application Next.js pour visualiser et gérer l'arbre généalogique d'une famille de l'Ouest Cameroun.

## Stack

- **Next.js 16** — App Router
- **Tailwind CSS 4** — Styles avec couleurs inspirées du ndop
- **@xyflow/react** — Visualisation interactive de l'arbre
- **Prisma ORM + Neon** — Base de données PostgreSQL serverless
- **Google Cloud Storage** — Stockage des photos
- **Zustand** — State management
- **JWT** — Authentification admin

## Configuration

### 1. Base de données (Neon)

1. Créer un compte sur [neon.tech](https://neon.tech)
2. Créer un nouveau projet
3. Copier la `DATABASE_URL` dans `.env.local`
4. Lancer la migration : `npm run db:push` (ou `npm run db:migrate` en dev)

### 2. Google Cloud Storage

1. Créer un projet sur [Google Cloud Console](https://console.cloud.google.com)
2. Activer l'API Cloud Storage
3. Créer un bucket (ex: `arbre-genealogie-photos`)
4. Rendre le bucket public : `allUsers` → `Storage Object Viewer`
5. Créer un compte de service avec le rôle `Storage Object Admin`
6. Télécharger la clé JSON et extraire :
   - `project_id` → `GCS_PROJECT_ID`
   - `client_email` → `GCS_CLIENT_EMAIL`
   - `private_key` → `GCS_PRIVATE_KEY`

### 3. Variables d'environnement

Remplir `.env.local` :

```env
DATABASE_URL=postgresql://...
GCS_PROJECT_ID=mon-projet
GCS_BUCKET_NAME=arbre-genealogie-photos
GCS_CLIENT_EMAIL=service@projet.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
JWT_SECRET=une_chaine_aleatoire_longue
ADMIN_USERNAME=admin
ADMIN_PASSWORD=votre_mot_de_passe
```

## Lancer en développement

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Déploiement sur Vercel

1. Pousser le code sur GitHub
2. Importer le projet sur [vercel.com](https://vercel.com)
3. Ajouter toutes les variables d'environnement dans les settings Vercel
4. Déployer

## Utilisation

### Vue publique
- Accéder à `/` pour voir l'arbre en lecture seule
- Cliquer sur un nœud pour voir les détails

### Administration
- Accéder à `/admin/login`
- Se connecter avec les identifiants définis dans `.env.local`
- Cliquer sur `+` près d'un nœud pour ajouter un membre lié
- Glisser les nœuds pour les repositionner
- Cliquer sur un nœud pour modifier ses informations

## Relations supportées

- **Filiation** : parent → enfant (père, mère, fils, fille)
- **Mariage** : conjoints (plusieurs mariages supportés)
- **Succession** : chef de famille, héritier, représentant, autre
