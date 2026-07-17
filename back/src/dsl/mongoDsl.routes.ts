import { Router, type Router as ExpressRouter } from 'express'
import { executeMongoDsl } from './mongoDsl.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router: ExpressRouter = Router()


/**
 * @swagger
 * /dsl/query:
 *   post:
 *     summary: Exécute une requête du langage DSL MongoDB
 *     description: |
 *       ## Présentation du langage
 *
 *       Ce DSL (Domain Specific Language) permet d'interroger la base MongoDB
 *       à l'aide d'une syntaxe simplifiée proche du langage naturel.
 *
 *       ---
 *
 *       ## Syntaxe générale
 *
 *       ```text
 *       FIND <collection> WHERE <champ> = "<valeur>"
 *       ```
 *
 *       ---
 *
 *       ## Mot-clé principal
 *
 *       | Mot-clé | Description |
 *       |---------|-------------|
 *       | FIND | Recherche des documents dans une collection |
 *       | WHERE | Ajoute un filtre sur un champ |
 *
 *       ---
 *
 *       ## Collections disponibles
 *
 *       - users
 *       - events
 *       - services
 *       - incidents
 *       - alertes
 *
 *       ---
 *
 *       ## Exemples
 *
 *       ### Rechercher un utilisateur par email
 *
 *       ```text
 *       FIND users WHERE email = "dsl@test.fr"
 *       ```
 *
 *       ### Rechercher un événement
 *
 *       ```text
 *       FIND events WHERE title = "Fête des voisins"
 *       ```
 *
 *       ### Rechercher un incident ouvert
 *
 *       ```text
 *       FIND incidents WHERE status = "open"
 *       ```
 *
 *       ---
 *
 *       ## Fonctionnement interne
 *
 *       La requête texte est :
 *
 *       1. analysée par le parseur du DSL ;
 *       2. transformée en AST (Abstract Syntax Tree) ;
 *       3. convertie en requête MongoDB ;
 *       4. exécutée sur la base de données.
 *
 *       ---
 *
 *       ## Exemple de transformation
 *
 *       ```text
 *       FIND users WHERE email = "dsl@test.fr"
 *       ```
 *
 *       devient :
 *
 *       ```javascript
 *       db.users.find({
 *         email: "dsl@test.fr"
 *       })
 *       ```
 *
 *       ---
 *
 *       ## Erreurs possibles
 *
 *       - collection inconnue ;
 *       - syntaxe invalide ;
 *       - champ inexistant ;
 *       - requête vide.
 *
 *     tags:
 *       - DSL
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DslQueryRequest'
 *
 *     responses:
 *       200:
 *         description: Résultat de la requête DSL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DslQueryResponse'
 *
 *       400:
 *         description: Requête DSL invalide
 *
 *       500:
 *         description: Erreur serveur
 */

router.post('/query', executeMongoDsl)
export default router