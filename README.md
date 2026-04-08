# BobConnect

Monorepo en preparation pour la plateforme de quartier BobConnect.

## Structure

- `back/` : API Node.js + TypeScript + Express
- `front/` : application web React + TypeScript + Vite
- `externals/` : Documentation et références techniques.

## Commandes

Depuis la racine du repo :

- `npm run dev` : lance le back et le front ensemble
- `npm run dev:back` : lance l'API avec Mongo local
- `npm run dev:front` : lance le front
- `npm run build` : build back + front
- `npm run lint` : lint du front
- `npm run typecheck` : verification TypeScript du front
- `npm run test` : tests front + back

## Developpement local

Le back tourne par defaut avec Mongo local sur `mongodb://127.0.0.1:27017/bobconnect`.
Neo4j est desactive en local par defaut.
Si la base est vide, un seed de demo est insere automatiquement au premier lancement.

Compte de demo disponible :

- `jean@bobconnect.fr`
- `bobconnect123`

Le front consomme l'API sur `http://localhost:3000/api/v1`.

## Docker

Builds separes :

- `npm run docker:build:front`
- `npm run docker:build:back`
