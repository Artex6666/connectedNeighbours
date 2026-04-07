# BobConnect — Infrastructure et Technologies

## Back-end
| Technologie | Rôle |
|---|---|
| **Node.js + Express** | API REST principale |
| **Socket.IO** | Messagerie et présence online/offline en temps réel |
| **JWT** | Gestion des tokens d'authentification |
| **TOTP (speakeasy)** | MFA — authentification à deux facteurs |
| **SSO (Passport.js / OAuth2)** | Authentification unique web ↔ desktop Java |

## Bases de données
| Technologie | Rôle |
|---|---|
| **MongoDB** | Documents (contrats, signatures), événements, messages, annonces |
| **Neo4j** | Graphe social des interactions, moteur de recommandations |
| **SQLite / H2** | Base locale embarquée dans l'application Java (mode offline) |

## Langage d'interrogation maison
| Technologie | Rôle |
|---|---|
| **lex / yacc** | Analyseur lexical et syntaxique du langage de requête custom pour MongoDB |

## Front-end Web
| Technologie | Rôle |
|---|---|
| **React** | Interface habitant + back-office administrateur |
| **Leaflet** | Carte interactive et outil de dessin des quartiers |
| **Socket.IO client** | Messagerie et mises à jour temps réel |
| **i18next** | Internationalisation |

## Application desktop
| Technologie | Rôle |
|---|---|
| **Java + JavaFX** | Interface graphique de l'application administrateur |
| **SQLite / H2** | Persistance locale offline |

## DevOps & Infrastructure
| Technologie | Rôle |
|---|---|
| **Docker + Docker Compose** | Conteneurisation de tous les services (API, BDD, front) |
| **Jest / Vitest** | Tests unitaires back-end et front-end |
| **Cypress** | Tests End-to-End |
| **JUnit** | Tests unitaires application Java |
| **Swagger / OpenAPI** | Documentation de l'API REST |
| **GitHub Actions** | CI/CD (lint, tests, build, déploiement) |

## Architecture globale

```
┌─────────────────┐     ┌─────────────────┐
│  Front React    │     │  Front React    │
│   (habitant)    │◄───►│  (back-office)  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│              Back Node.js               │
│        (API REST + Socket.IO)           │
└──────┬──────────────┬───────────────────┘
       │              │
  ┌────▼────┐    ┌────▼────┐
  │ MongoDB │    │  Neo4j  │
  └─────────┘    └─────────┘
                      │
          ┌───────────▼───────────────────┐
          │      App Desktop Java         │
          │  (JavaFX — SSO — offline)     │
          └──────────────┬────────────────┘
                         │
                    ┌────▼────┐
                    │ SQLite  │◄── synchronisation auto
                    └─────────┘
```
