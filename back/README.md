# Back BobConnect

API REST Express + TypeScript du projet BobConnect.

## Scripts

- `npm run dev` : lance l'API avec Mongo local et Neo4j desactive
- `npm run build` : build TypeScript
- `npm run start` : lance le build compile
- `npm run test` : tests Jest

## Variables d'environnement

- `back/.env.example` : modele versionne
- `back/.env` : fichier reel utilise au lancement

Le projet charge `back/.env` automatiquement via `dotenv/config`.

## Mode local Mongo

Le script `npm run dev` utilise :

- `MONGO_URI=mongodb://127.0.0.1:27017/bobconnect`
- `NEO4J_ENABLED=false`

Si la base `bobconnect` est vide, des utilisateurs et messages de demo sont crees automatiquement.

Compte de demo :

- `jean@bobconnect.fr`
- `bobconnect123`
