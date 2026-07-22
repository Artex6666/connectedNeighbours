# BobConnect — « Voisins, services et bonne humeur »

Plateforme collaborative de quartier permettant aux habitants d'échanger des
services, de signer des documents numériques, de participer à des événements,
de voter sur la vie locale et de communiquer via une messagerie multimédia.

Le projet se compose d'une **application web** (React + Node.js) destinée aux
habitants et aux modérateurs, et d'une **application desktop Java** (JavaFX)
réservée à l'administration du quartier.

## Équipe

| Membre | Contribution principale |
|---|---|
| **Loris RAMEAU** | Application web : front React, API Node.js, base de données, messagerie, votes, documents & signatures, RGPD, 2FA, emails, back-office, déploiement / conteneurisation |
| **Fabio DUGAY** | Application desktop Java (JavaFX, offline-first, synchronisation, plugins, SSO) et une partie des routes back-end |
| **Théo ROUABLE** | Langage d'interrogation maison (Mongo DSL) et son intégration, base initiale de l'application Java |

> La répartition détaillée est traçable via l'historique des commits du dépôt.

## Sommaire

- [Installation automatique](#installation-automatique)
- [Lancement en développement](#lancement-en-développement)
- [Lancement en production](#lancement-en-production)
- [Jeux de données (seed)](#jeux-de-données-seed)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Application desktop Java](#application-desktop-java)
- [Documentation & outils](#documentation--outils)
- [Tests](#tests)
- [Structure du projet](#structure-du-projet)

---

## Installation automatique

La façon la plus simple de tout lancer (prérequis vérifiés, configuration
générée, images construites, stack démarrée, données chargées) :

```bash
./install.sh                    # installation complète + jeu de démonstration
./install.sh --dataset minimal  # 1 administrateur + les quartiers
./install.sh --dataset empty    # vide la base (parcours d'inscription complet)
./install.sh --no-seed          # ne touche pas à la base existante
```

> **`--dataset empty` vs `--no-seed`** : `empty` **supprime activement** toutes
> les collections (base garantie vierge, même si une installation précédente
> contenait des données) ; `--no-seed` **saute l'étape de chargement** et
> conserve la base telle quelle — pratique pour relancer l'installateur sans
> perdre ses données. Sur une première installation, le résultat est identique.

Équivalent via Make :

```bash
make install            # installation complète
make help               # liste toutes les commandes disponibles
```

**Prérequis** : Docker + Docker Compose v2. (Node.js 20+ et pnpm 10+ uniquement
pour le développement hors conteneur ; Java 21 + Maven pour recompiler le client
desktop.)

Une fois terminé :

| Service | URL |
|---|---|
| Application web | <http://localhost:8080> |
| API REST | <http://localhost:3000/api/v1> |
| Documentation Swagger | <http://localhost:3000/api/docs> |

---

## Lancement en développement

Mode « hot reload », back et front lancés hors conteneur, seule la base tourne
dans Docker :

```bash
pnpm install            # une seule fois
pnpm dev                # démarre MongoDB (Docker) + API + front
```

| Service | URL |
|---|---|
| Front (Vite) | <http://localhost:5173> |
| API | <http://localhost:3000/api/v1> |

Commandes séparées si besoin :

```bash
pnpm dev:back           # API seule
pnpm dev:front          # front seul
pnpm dev:stop           # arrête la base de développement
```

**Seed automatique en développement** : au démarrage, si la base est **vide**,
un jeu de données de démonstration est inséré automatiquement (comptes,
quartiers, annonces, événements, sondages, groupe de discussion). Ce
comportement est **désactivé en production** — voir la section suivante.

**Configuration** : copiez `back/src/.env.example` vers `back/.env` et adaptez si
nécessaire. Sans configuration SMTP, l'envoi d'emails est désactivé et les
comptes créés sont validés automatiquement (pratique en local).

---

## Lancement en production

Toute la stack est conteneurisée (MongoDB + API + front servi par Nginx) :

```bash
docker compose up -d --build
```

La configuration se fait via un fichier `.env` à la racine (généré par
`install.sh`, jamais versionné) :

```dotenv
PUBLIC_URL=https://mon-domaine.fr     # URL publique (intégrée au build front)
JWT_SECRET=…                          # secrets aléatoires
JWT_REFRESH_SECRET=…

# Email — laisser SMTP_HOST vide pour désactiver l'envoi
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=…
SMTP_PASS=…                           # clé SMTP du fournisseur
MAIL_FROM_NAME=BobConnect
MAIL_FROM=no-reply@mon-domaine.fr
```

**Ports** : les conteneurs n'exposent rien publiquement — ils écoutent sur
`127.0.0.1` (front `8080`, API `3000`, MongoDB `27017`) et un **reverse proxy
Nginx** en frontal assure le HTTPS et route `/api/*` et `/uploads/*` vers l'API,
le reste vers le front. Depuis l'extérieur, **aucun port n'est nécessaire** :
tout passe par le domaine en HTTPS.

**Pas de seed automatique en production** : la base démarre vide. Chargez
explicitement un jeu de données si vous le souhaitez (section suivante).

Instance de démonstration : <https://projet-annuel.lorisrameau.pro>

---

## Jeux de données (seed)

La base est livrée sous forme de **fichiers texte JSON importables**, un par
collection, dans `database/datasets/`.

| Jeu | Contenu |
|---|---|
| **`full`** | 8 comptes, 2 quartiers, 9 annonces, 5 sondages, 4 événements, 1 groupe, messages |
| **`minimal`** | 1 administrateur + les 2 quartiers |
| **`empty`** | Toutes les collections vides |

```bash
./database/import.sh full       # jeu complet
./database/import.sh minimal
./database/import.sh empty      # base vierge
```

Ou via Make : `make seed`, `make seed DATASET=minimal`, `make seed-empty`.

> ⚠️ L'import vide chaque collection avant de la recharger (`--drop`).

Pour régénérer le jeu `full` depuis une base enrichie : `./database/export.sh`.
Détails dans [`database/README.md`](database/README.md).

---

## Comptes de démonstration

Présents dans les jeux `full` et `minimal`. **Mot de passe commun :
`bobconnect123`**. Tous sont déjà vérifiés et sans 2FA — connexion directe.

| Rôle | Email |
|---|---|
| 🔴 Administrateur | `admin@bobconnect.fr` |
| 🟡 Modérateur | `nassim@bobconnect.fr` |
| 🟢 Habitant | `jean@bobconnect.fr` |
| 🟢 Habitant | `camille@bobconnect.fr` |
| 🟢 Habitant | `sarah@bobconnect.fr` |
| 🟢 Habitant | `marc@bobconnect.fr` |
| 🟢 Habitant | `hugo@bobconnect.fr` |
| 🟢 Habitant | `lea@bobconnect.fr` |

Tous appartiennent au même quartier, ce qui permet de tester immédiatement les
annonces, la messagerie, les votes et les événements entre eux.

---

## Application desktop Java

L'application d'administration est livrée sous forme de **JAR auto-exécutable**.

- **Téléchargement** : depuis le tableau de bord de l'application web, ou
  directement sur `/bobconnect.jar`.
- **Lancement** : `java -jar bobconnect.jar`
- **Compilation manuelle** : `cd desktop && mvn package` → `target/bobconnect.jar`

Le JAR est construit automatiquement lors du build Docker du front, puis servi
par Nginx.

---

## Documentation & outils

| Ressource | Emplacement |
|---|---|
| Documentation API (Swagger) | `/api/docs` |
| Langage d'interrogation maison (Mongo DSL) | `/mongo-dsl` dans l'application web |
| Descriptif fonctionnel | [`externals/DESCRIPTIF_FONCTIONNEL.md`](externals/DESCRIPTIF_FONCTIONNEL.md) |
| Choix technologiques | [`externals/TECHNOLOGIES.md`](externals/TECHNOLOGIES.md) |
| Jeux de données | [`database/README.md`](database/README.md) |

---

## Tests

```bash
pnpm test               # tests back (Jest + Supertest) et front
pnpm typecheck          # vérification des types du front
pnpm lint               # ESLint
```

Les tests d'intégration du back s'exécutent sur des bases MongoDB temporaires
isolées par worker — ils ne touchent jamais aux données de développement.

---

## Structure du projet

```
.
├── back/                 API Node.js + Express + TypeScript (MongoDB, Neo4j)
│   ├── src/controllers/  logique métier par domaine
│   ├── src/models/       schémas Mongoose
│   ├── src/routes/       routes Express + annotations Swagger
│   └── src/test/         tests d'intégration (Jest + Supertest)
├── front/                Client web React 19 + Vite + TypeScript
│   ├── src/modules/      pages par domaine (services, votes, documents…)
│   └── src/shared/       composants, contexte d'authentification, client API
├── desktop/              Application Java 21 + JavaFX (Maven, SQLite offline)
├── database/             Jeux de données importables + scripts d'import/export
├── externals/            Documentation fonctionnelle et technique
├── install.sh            Installateur automatique
├── Makefile              Raccourcis de développement
└── docker-compose.yml    Stack conteneurisée (MongoDB + API + front)
```

## Stack technique

| Composant | Technologies |
|---|---|
| **Backend** | Node.js, Express, TypeScript, MongoDB (Mongoose), Neo4j, JWT, bcrypt, Nodemailer, pdf-lib, speakeasy (TOTP) |
| **Frontend** | React 19, Vite, TypeScript, React Router, Leaflet, i18next (FR/EN) |
| **Desktop** | Java 21, JavaFX, Maven, SQLite (mode hors-ligne) |
| **Qualité** | Jest, Supertest, ESLint, TypeScript strict, Swagger |
| **DevOps** | Docker, Docker Compose, Nginx (reverse proxy + TLS) |
