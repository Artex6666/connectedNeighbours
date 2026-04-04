# BobConnect — Descriptif fonctionnel

## Présentation du projet

**BobConnect** est une plateforme numérique de quartier permettant aux habitants de s'entraider, de signer des documents en ligne, de participer à des événements communautaires et de communiquer via une messagerie multimédia sécurisée.

Le projet se compose de deux applications complémentaires :
- Une **application web** (React + Node.js) destinée aux habitants et aux modérateurs
- Une **application desktop Java** (JavaFX) réservée à l'administrateur du quartier

---

### 1. Gestion des utilisateurs et des rôles

L'application distingue trois types d'utilisateurs :

- **Habitant** : rôle de base, attribué à toute personne qui s'inscrit et dont l'adresse est vérifiée comme appartenant à un quartier enregistré. Il peut accéder à l'ensemble des fonctionnalités de la plateforme (annonces, messagerie, événements, votes, documents).
- **Modérateur** : habitant promu par un administrateur. Il peut signaler, masquer ou supprimer des contenus inappropriés (annonces, messages, événements), gérer les signalements d'autres utilisateurs et débloquer des comptes.
- **Administrateur** : gère la plateforme dans son ensemble via l'application web (back-office) et l'application desktop Java. Il crée/modifie les quartiers, gère les comptes, consulte les statistiques et traite les incidents.

**Inscription :**
L'utilisateur crée un compte en renseignant son nom, prénom, adresse e-mail, numéro de téléphone et adresse postale. L'adresse est géocodée automatiquement et vérifiée pour correspondre à un quartier existant. Un code de confirmation est envoyé par e-mail pour valider le compte. L'activation du **MFA (authentification à deux facteurs par TOTP)** est obligatoire pour les actions sensibles.

**Authentification :**
Connexion par e-mail + mot de passe, suivi d'une vérification MFA pour les actions sensibles. Un **SSO (Single Sign-On)** permet à l'administrateur de se connecter une seule fois pour accéder à la fois au back-office web et à l'application desktop Java.

---

### 2. Modélisation géographique des quartiers

L'administrateur dispose d'un outil de dessin cartographique (carte interactive) pour **définir les limites géographiques d'un quartier** en traçant un polygone directement sur la carte.

Règles de gestion :
- Deux quartiers ne peuvent pas se chevaucher (détection et rejet des intersections).
- Un quartier peut être modifié ou supprimé tant qu'aucun habitant n'y est rattaché.
- En cas de modification des limites, les habitants dont l'adresse sort de la nouvelle zone sont notifiés et peuvent être réaffectés manuellement.
- Chaque quartier possède un nom, une description et un administrateur référent.

Lors de l'inscription d'un habitant, son adresse est automatiquement rattachée au quartier correspondant. Si aucun quartier ne correspond, l'inscription est mise en attente d'une décision administrative.

---

### 3. Services entre voisins

Les habitants peuvent publier des **petites annonces** pour offrir ou demander des services au sein de leur quartier.

**Publication d'une annonce :**
L'habitant choisit une catégorie (bricolage, garde d'animaux, cours particuliers, jardinage, etc.), rédige un titre et une description, précise si le service est gratuit ou payant, et peut ajouter des photos. Une annonce est visible uniquement par les habitants du même quartier.

**Services gratuits :**
La mise en relation se fait directement via la messagerie intégrée. Aucun contrat n'est requis. L'habitant intéressé envoie une demande de contact, l'offrant accepte ou refuse.

**Services payants — Système de points :**
Les services payants fonctionnent sur la base d'un **système de crédits (points)** internes à la plateforme, non convertibles en monnaie réelle. Chaque habitant dispose d'un solde de points visible sur son profil.

- Le tarif d'un service est fixé en points par l'offreur au moment de la publication (ex. : 3h de babysitting = 4 points, 1h de cours particulier = 2 points).
- Lors de l'acceptation d'un service payant, les points sont **bloqués** sur le compte du demandeur jusqu'à la validation de la prestation par les deux parties.
- À la fin du service, le demandeur valide la prestation : les points sont alors transférés à l'offreur.
- En cas de litige, un modérateur peut intervenir pour arbitrer.
- Un administrateur peut créditer des points à un habitant (points de bienvenue, compensation, etc.).

**Contrat automatique :**
Chaque service payant accepté génère automatiquement un **contrat numérique** (PDF) pré-rempli avec les informations des deux parties, la description du service, le nombre de points convenus et la date. Ce contrat doit être signé numériquement par les deux parties avant que la prestation ne débute (voir module Signatures).

---

### 4. Documents et signatures numériques

La plateforme permet l'échange, la signature et l'archivage de documents PDF entre habitants du même quartier.

**Import d'un document :**
Un utilisateur peut importer un fichier PDF depuis son poste. Le document est analysé et affiché dans un visualiseur intégré. L'importateur peut ensuite **placer des zones de signature et d'initiales** à des emplacements précis du document (par glisser-déposer).

**Envoi pour signature :**
L'importateur désigne les signataires parmi les habitants du quartier et définit l'ordre de signature. Chaque signataire reçoit une notification par e-mail et dans l'application.

**Processus de signature :**
- Le signataire ouvre le document dans l'application.
- Avant de signer, une **vérification MFA** est obligatoire (code TOTP).
- Il appose sa signature ou ses initiales dans les zones prévues.
- La signature est horodatée et chiffrée (hachage du document + identité du signataire).
- Une fois tous les signataires ayant signé, le document est **verrouillé** et ne peut plus être modifié.

**Archivage :**
Les documents signés sont archivés dans MongoDB et accessibles à tout moment par les signataires. Une copie est envoyée par e-mail à chacun. L'intégrité du document peut être vérifiée à tout moment via son empreinte cryptographique.

---

### 5. Événements et activités communautaires

Les habitants peuvent créer et participer à des **événements de quartier** (soirées, ateliers, collectes de fond, réunions, etc.).

**Création d'un événement :**
L'organisateur renseigne le titre, la description, la date, le lieu, le nombre maximum de participants, et peut ajouter une photo de couverture. L'événement est visible par tous les habitants du quartier.

**Consultation et intérêt :**
La liste des événements à venir est présentée sous forme de cartes consultables. L'habitant peut **swiper** (gauche = pas intéressé, droite = intéressé) pour indiquer son niveau d'intérêt. Cela alimente le moteur de recommandations.

**Inscription à un événement :**
Les habitants intéressés peuvent s'inscrire. L'organisateur peut définir une liste d'attente si la capacité maximale est atteinte. Les inscrits reçoivent un rappel par notification avant l'événement.

**Suggestions automatiques (Neo4j) :**
Le moteur de recommandations analyse le graphe social (qui a participé à quoi, quels voisins ont des intérêts similaires) pour proposer des événements pertinents à chaque habitant. Les suggestions s'affichent dans un fil dédié.

**Gestion par l'organisateur :**
L'organisateur peut modifier, annuler ou clôturer son événement. En cas d'annulation, tous les inscrits sont notifiés automatiquement.

---

### 6. Messagerie multimédia sécurisée

La plateforme intègre un **système de messagerie** permettant aux habitants d'un même quartier de communiquer directement.

**Conversations privées :**
Chaque habitant peut initier une conversation privée avec un autre habitant de son quartier. Les messages sont chiffrés en transit et au repos.

**Types de messages :**
- Texte (avec support Markdown basique)
- Photos (compression automatique avant envoi)
- Messages vocaux (enregistrement depuis l'interface, lecture intégrée)
- Appels vidéo *(fonctionnalité bonus)*

**Présence en temps réel :**
Un indicateur **online / offline** est visible sur le profil de chaque utilisateur et dans les conversations. La dernière activité est affichée lorsque l'utilisateur est hors ligne. Ces mises à jour sont propagées en temps réel via WebSocket.

**Groupes de discussion :**
Des canaux de discussion collectifs peuvent être créés pour un événement, un groupe de voisinage ou un sujet spécifique.

**Modération :**
Les messages peuvent être signalés. Les modérateurs peuvent consulter les signalements et supprimer les contenus inappropriés.

---

### 7. Votes communautaires

Les habitants peuvent **voter sur des sujets liés à la vie du quartier** (travaux, règles de vie commune, choix d'un prestataire, etc.).

**Création d'un vote :**
Un habitant (ou un modérateur) crée un vote en renseignant : le sujet, la question, le type de vote, la durée et la liste des choix.

**Types de votes disponibles :**
- Oui / Non
- Choix unique parmi plusieurs options
- Choix multiples (plusieurs réponses possibles)
- Vote pondéré (chaque votant répartit un nombre fixe de points entre les options)

**Paramétrage :**
- Vote anonyme ou nominatif
- Date d'ouverture et de clôture
- Visibilité des résultats (en direct ou seulement à la clôture)
- Quorum optionnel (nombre minimum de participants pour que le vote soit valide)

**Résultats :**
Les résultats sont affichés sous forme de graphiques. Une notification est envoyée à tous les habitants du quartier à la clôture du vote.

**Extensibilité :**
L'architecture du module de votes est conçue pour permettre l'ajout de nouveaux types de votes sans modifier le code existant (système de plugins).

---

### 8. Application desktop Java — Administration (offline-first)

L'administrateur dispose d'une application **Java + JavaFX** dédiée à la gestion opérationnelle du quartier.

**Gestion des incidents et alertes :**
Les habitants peuvent signaler des incidents depuis l'application web (dégradation, problème de sécurité, nuisance...). L'administrateur visualise ces signalements dans l'application desktop, peut changer leur statut (en cours, résolu, rejeté) et ajouter des commentaires.

**Statistiques de participation :**
L'application affiche des tableaux de bord sur la participation des habitants : nombre de services échangés, taux de participation aux événements, activité sur la messagerie, etc.

**Mode offline-first :**
Toutes les données sont **répliquées localement** dans une base SQLite/H2 embarquée. En l'absence de connexion Internet, l'administrateur peut consulter les incidents et statistiques déjà synchronisés, et même ajouter de nouvelles entrées. Dès que la connexion est rétablie, une **synchronisation automatique** est déclenchée avec résolution des éventuels conflits (stratégie last-write-wins ou manuelle selon le type de donnée).

**Système de plugins :**
L'application supporte des plugins chargés dynamiquement :
- Export des statistiques (CSV, PDF)
- Analyse sociale (visualisation du graphe Neo4j)
- Calendrier local des événements

**Personnalisation par thèmes :**
L'administrateur peut choisir parmi plusieurs thèmes visuels (couleurs, polices, disposition des panneaux). Les thèmes sont appliqués en temps réel sans redémarrage.

**Mises à jour automatiques :**
L'application vérifie au démarrage si une nouvelle version est disponible sur le serveur central. Si c'est le cas, elle propose (ou effectue automatiquement) la mise à jour, puis se relance.

**Désinstallation :**
Un bouton de désinstallation est accessible depuis les paramètres de l'application. Il supprime proprement les fichiers et la base locale.

**Livraison :** fichier `.jar` exécutable.

---

### 9. Langage d'interrogation maison (lex/yacc)

Un **langage de requête custom** est développé pour permettre d'interroger les documents stockés dans MongoDB de manière simplifiée et lisible. Ce langage est analysé via **lex** (analyse lexicale) et **yacc** (analyse syntaxique), puis traduit en requêtes MongoDB natives.

Exemple de syntaxe envisagée :
```
FIND contrats WHERE signataire = "Jean Dupont" AND statut = "signé" ORDER BY date DESC LIMIT 10
```

---

### 10. Sécurité transversale

- **MFA (TOTP)** : obligatoire pour la connexion, la modification du mot de passe / e-mail / téléphone, et toute signature de document.
- **SSO** : l'administrateur s'authentifie une seule fois pour accéder au back-office web et à l'application Java.
- **Gestion des rôles** : Habitant / Modérateur / Administrateur, avec des permissions distinctes vérifiées côté back-end.
- **Chiffrement** : signatures numériques chiffrées et horodatées, messages chiffrés en transit et au repos.

---

### 11. Conformité RGPD

Chaque habitant dispose d'un espace "Mes données" permettant de :
- **Consulter** l'ensemble des données personnelles le concernant
- **Rectifier** ses informations (nom, adresse, contact)
- **Supprimer** son compte (anonymisation des données liées aux contrats archivés)
- **Exporter** ses données au format JSON ou CSV

Les données de messagerie, de signature et d'interaction sont traitées dans le strict respect du RGPD.

---

### 12. Extensibilité et internationalisation

- L'architecture de la plateforme permet l'ajout de **nouveaux modules sans modifier le code existant** (système d'événements internes, plugins enregistrables dynamiquement).
- L'application est entièrement **multilingue** (français et anglais par défaut, autres langues ajoutables via fichiers de traduction i18n).
