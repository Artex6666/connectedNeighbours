# Connected Neighbours — "Voisins, services et bonne humeur"

Plateforme collaborative de quartier permettant aux habitants d'échanger des services, signer des documents numériques, participer à des événements et communiquer via une messagerie multimédia.

## Structure du projet

```
connectedNeighbours/
├── back/          # API Node.js + Express + TypeScript
├── front/         # Client Web React + Vite (utilisateurs)
├── desktop/       # Application Java JavaFX (administrateur)
├── externals/     # Documentation fonctionnelle et technique
└── docker-compose.yml
```

## Stack technique

| Composant | Technologies |
|-----------|-------------|
| **Backend** | Node.js, Express, TypeScript, MongoDB, Neo4j |
| **Frontend** | React 19, Vite, TypeScript, Leaflet, i18next |
| **Desktop** | Java 21, JavaFX, Maven, SQLite (offline) |
| **DevOps** | Docker, Docker Compose |

## Démarrage rapide

### Prérequis
- Node.js 20+, pnpm 10+
- Docker + Docker Compose
- Java 21+ (pour le client desktop)

### Développement local

```bash
# Backend + Frontend ensemble
pnpm dev

# Ou séparément
pnpm dev:back
pnpm dev:front
```

Le back tourne par défaut avec Mongo local sur `mongodb://127.0.0.1:27017/bobconnect`.
Neo4j est désactivé en local par défaut.
Si la base est vide, un seed de démo est inséré automatiquement au premier lancement.

### Avec Docker (environnement complet)

```bash
docker compose up --build
```

## Documentation API

Swagger disponible sur : `http://localhost:3000/api-docs`

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Résident | jean@bobconnect.fr | bobconnect123 |
