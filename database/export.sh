#!/usr/bin/env bash
#
# Régénère le jeu d'essai « full » à partir d'une base MongoDB en cours d'exécution.
# Utile après avoir enrichi les données de démonstration.
#
#   ./database/export.sh [nom_du_jeu]     (défaut: full)
#
# Les collections de session (tokens) sont volontairement exclues, et seuls les
# comptes de démonstration (@bobconnect.fr) sont exportés — pas les comptes réels.
#
set -euo pipefail

DATASET="${1:-full}"
DB="${MONGO_DB:-bobconnect}"
CONTAINER="${MONGO_CONTAINER:-cn_mongodb}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/datasets/${DATASET}"

COLLECTIONS="users neighborhoods services events votes votecomments groups groupmessages messages documents incidents alertes newsletters messagereports"

mkdir -p "$DIR"
echo "📤 Export de la base « ${DB} » vers datasets/${DATASET}"

for COLLECTION in $COLLECTIONS; do
  if [ "$COLLECTION" = "users" ]; then
    # On n'exporte que les comptes de démonstration (jamais les comptes réels).
    docker exec "$CONTAINER" mongoexport --db "$DB" --collection users \
      --jsonArray --pretty --query '{"email":{"$regex":"@bobconnect\\.fr$"}}' \
      2>/dev/null > "$DIR/users.json"
  else
    docker exec "$CONTAINER" mongoexport --db "$DB" --collection "$COLLECTION" \
      --jsonArray --pretty 2>/dev/null > "$DIR/$COLLECTION.json"
  fi
  # Une collection vide produit un fichier vide : on écrit un tableau JSON valide.
  [ -s "$DIR/$COLLECTION.json" ] || echo "[]" > "$DIR/$COLLECTION.json"
  printf "  ✓ %-18s\n" "$COLLECTION"
done

echo "✅ Export terminé dans datasets/${DATASET}"
