# Base de données — jeux d'essais

La base de BobConnect est **MongoDB**. Les données sont livrées sous forme de
**fichiers texte JSON**, un par collection, directement importables avec
`mongoimport`.

## Jeux d'essais fournis

| Jeu | Contenu | Usage |
|---|---|---|
| **`full`** | Jeu complet : 8 comptes, 2 quartiers, 9 annonces, 5 sondages, 4 événements, 1 groupe de discussion, messages | Démonstration / soutenance |
| **`minimal`** | 1 compte administrateur + les 2 quartiers | Repartir d'une base quasi vierge tout en pouvant se connecter |
| **`empty`** | Toutes les collections vides | Test d'une installation vierge (parcours d'inscription complet) |

## Importer un jeu d'essai

```bash
./database/import.sh full      # jeu complet (défaut)
./database/import.sh minimal   # admin + quartiers
./database/import.sh empty     # base vide
```

Le script détecte automatiquement le conteneur Docker `cn_mongodb`.
Pour viser un MongoDB local à la place :

```bash
MONGO_URI="mongodb://127.0.0.1:27017/bobconnect" ./database/import.sh full
```

> ⚠️ L'import utilise `--drop` : **chaque collection importée est d'abord vidée**.

## Comptes de démonstration

Tous les comptes des jeux `full` et `minimal` utilisent le mot de passe **`bobconnect123`**.

| Rôle | Email |
|---|---|
| Administrateur | `admin@bobconnect.fr` |
| Modérateur | `nassim@bobconnect.fr` |
| Habitants | `jean@` · `camille@` · `sarah@` · `marc@` · `hugo@` · `lea@bobconnect.fr` |

Ils sont déjà vérifiés et sans 2FA : la connexion se fait directement avec
l'email et le mot de passe.

## Régénérer le jeu « full »

Après avoir enrichi les données de démonstration dans une base en cours
d'exécution :

```bash
./database/export.sh full
```

Les jetons de session (`tokens`) sont exclus, et seuls les comptes de
démonstration (`@bobconnect.fr`) sont exportés — jamais les comptes réels.

## Collections

`users` · `neighborhoods` · `services` · `events` · `votes` · `votecomments` ·
`groups` · `groupmessages` · `messages` · `documents` · `incidents` · `alertes` ·
`newsletters` · `messagereports`
