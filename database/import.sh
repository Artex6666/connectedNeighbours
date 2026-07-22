#!/usr/bin/env bash
#
# Importe un jeu d'essai dans MongoDB.
#
#   ./database/import.sh [full|minimal|empty]
#
# Variables d'environnement facultatives :
#   MONGO_DB         nom de la base           (défaut: bobconnect)
#   MONGO_CONTAINER  conteneur Docker Mongo   (défaut: cn_mongodb)
#   MONGO_URI        URI d'un Mongo local ; si défini, on n'utilise pas Docker
#
set -euo pipefail

DATASET="${1:-full}"
DB="${MONGO_DB:-bobconnect}"
CONTAINER="${MONGO_CONTAINER:-cn_mongodb}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/datasets/${DATASET}"

if [ ! -d "$DIR" ]; then
  echo "❌ Jeu d'essai inconnu : '${DATASET}'"
  echo "   Disponibles : full, minimal, empty"
  exit 1
fi

# Choix du mode : Mongo local (MONGO_URI) ou conteneur Docker.
if [ -n "${MONGO_URI:-}" ]; then
  MODE="local"
  command -v mongoimport >/dev/null 2>&1 || { echo "❌ mongoimport introuvable (installez les MongoDB Database Tools)"; exit 1; }
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTAINER"; then
  MODE="docker"
else
  echo "❌ Conteneur '${CONTAINER}' introuvable et MONGO_URI non défini."
  echo "   Lancez la stack (docker compose up -d) ou exportez MONGO_URI."
  exit 1
fi

echo "📦 Import du jeu d'essai « ${DATASET} » dans la base « ${DB} » (mode: ${MODE})"

TOTAL=0
for FILE in "$DIR"/*.json; do
  COLLECTION="$(basename "$FILE" .json)"
  COUNT=$(grep -c '"_id"' "$FILE" || true)

  if [ "$COUNT" -eq 0 ]; then
    # Collection vide : mongoimport refuse un tableau JSON vide, on se contente
    # donc de supprimer la collection pour repartir d'un état propre.
    if [ "$MODE" = "docker" ]; then
      docker exec "$CONTAINER" mongosh "$DB" --quiet \
        --eval "db.getCollection('${COLLECTION}').drop()" >/dev/null 2>&1 || true
    else
      mongosh "$MONGO_URI" --quiet \
        --eval "db.getCollection('${COLLECTION}').drop()" >/dev/null 2>&1 || true
    fi
  elif [ "$MODE" = "docker" ]; then
    docker exec -i "$CONTAINER" mongoimport \
      --db "$DB" --collection "$COLLECTION" \
      --jsonArray --drop --quiet < "$FILE"
  else
    mongoimport --uri "$MONGO_URI" \
      --collection "$COLLECTION" \
      --jsonArray --drop --quiet < "$FILE"
  fi

  printf "  ✓ %-18s\n" "$COLLECTION"
  TOTAL=$((TOTAL + COUNT))
done

# Récapitulatif fiable : on interroge la base plutôt que de compter dans les
# fichiers (les documents imbriqués fausseraient le décompte).
SUMMARY='db.getCollectionNames().sort().forEach(c => { const n = db.getCollection(c).countDocuments(); if (n > 0) print("    " + c + ": " + n); });'
echo "  Contenu importé :"
if [ "$MODE" = "docker" ]; then
  docker exec "$CONTAINER" mongosh "$DB" --quiet --eval "$SUMMARY" 2>/dev/null || true
else
  mongosh "$MONGO_URI" --quiet --eval "$SUMMARY" 2>/dev/null || true
fi

echo "✅ Import terminé — base « ${DB} » réinitialisée avec le jeu « ${DATASET} »."
if [ "$DATASET" != "empty" ]; then
  echo "   Comptes de démonstration : mot de passe « bobconnect123 »"
  echo "   admin@bobconnect.fr (admin) · nassim@bobconnect.fr (modérateur) · jean@bobconnect.fr (habitant)"
fi
