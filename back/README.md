# Back BobConnect

API REST Express + TypeScript du projet BobConnect.

## Scripts

- `npm run dev` : lance l'API avec Mongo local et Neo4j desactive
- `npm run dev:mock` : lance l'API en mode memoire
- `npm run build` : build TypeScript
- `npm run start` : lance le build compile
- `npm run start:mock` : lance le build compile en mode memoire
- `npm run test` : tests Jest

## Mode local Mongo

Le script `npm run dev` utilise :

- `MONGO_URI=mongodb://127.0.0.1:27017/bobconnect`
- `NEO4J_ENABLED=false`

Si la base `bobconnect` est vide, des utilisateurs et messages de demo sont crees automatiquement.

## Mode memoire

Le script `npm run dev:mock` active `USE_IN_MEMORY_DB=true`.

Compte de demo :

- `jean@bobconnect.fr`
- `bobconnect123`
