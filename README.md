# BobConnect

Monorepo en preparation pour la plateforme de quartier BobConnect.

## Structure

- `front/` : application web React + TypeScript + Vite
- `externals/` : Documentation et références techniques.

## Commandes

Depuis la racine du repo :

- `pnpm dev` : lance le front en developpement
- `pnpm build` : construit le front pour la production
- `pnpm preview` : previsualise le build de production
- `pnpm lint` : verifie le lint
- `pnpm typecheck` : verifie TypeScript
- `pnpm test` : lance les tests unitaires

## Docker

Construire et lancer le front (build Vite + nginx, port **8080**) :

```bash
docker compose up --build front
```

Puis ouvrir `http://localhost:8080`.

Les services API et bases de donnees pourront etre ajoutes dans `docker-compose.yml` quand ils existeront dans le repo.
