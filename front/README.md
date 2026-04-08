# Front BobConnect

Base front-end du projet BobConnect construite avec React, TypeScript et Vite.

## Scripts

- `pnpm dev` : serveur de developpement avec watch
- `pnpm dev:open` : serveur de developpement avec ouverture auto du navigateur
- `pnpm build` : build de production
- `pnpm preview` : previsualisation du build
- `pnpm lint` : lint ESLint
- `pnpm typecheck` : verification TypeScript
- `pnpm test` : tests unitaires
- `pnpm test:watch` : tests en watch

## API

Le front consomme l'API via `VITE_API_BASE_URL`.

Valeur par defaut :

```text
http://localhost:3000/api/v1
```

Un exemple est fourni dans `front/.env.example`.

## Architecture

```text
src/
  app/          -> bootstrap applicatif et routing
  modules/      -> fonctionnalites metier, organisees par module
  shared/       -> config, layout, i18n et composants mutualises
  styles/       -> tokens et styles globaux
  test/         -> setup de test
```

Le module `home/` sert de reference pour le pattern MVC :

- `controller/` : orchestration de la vue
- `model/` : types et structures de donnees
- `view/` : rendu React

## Stack active

- React 19
- React Router
- i18next / react-i18next
- Vite
- TypeScript
- ESLint
- Vitest + Testing Library
