#!/usr/bin/env bash
#
# BobConnect — installateur automatique
#
# Vérifie les prérequis, génère la configuration, construit les images Docker,
# démarre la stack complète (MongoDB + API + front) et charge un jeu d'essai.
#
#   ./install.sh                     installation complète + jeu de démo « full »
#   ./install.sh --dataset minimal   autre jeu d'essai (full | minimal | empty)
#   ./install.sh --dataset empty     VIDE la base (supprime toutes les collections)
#   ./install.sh --no-seed           NE TOUCHE PAS à la base (données conservées)
#   ./install.sh --help
#
# Différence « --dataset empty » vs « --no-seed » :
#   --dataset empty  supprime activement toutes les collections → base garantie vierge,
#                    même si une installation précédente contenait des données.
#   --no-seed        saute complètement l'étape de chargement → la base existante est
#                    conservée telle quelle (utile pour relancer l'installateur sans
#                    perdre ses données). Sur une toute première installation, le
#                    résultat est identique puisque la base est déjà vide.
#
set -euo pipefail

DATASET="full"
SEED=1
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

while [ $# -gt 0 ]; do
  case "$1" in
    --dataset) DATASET="$2"; shift 2 ;;
    --no-seed) SEED=0; shift ;;
    --help|-h) awk 'NR>1 { if (/^#/) { sub(/^# ?/, ""); print } else exit }' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "Option inconnue : $1 (voir --help)"; exit 1 ;;
  esac
done

echo "╭──────────────────────────────────────────────╮"
echo "│  BobConnect — installation                   │"
echo "╰──────────────────────────────────────────────╯"

# ── 1. Prérequis ──────────────────────────────────────────────────────────────
echo "▸ Vérification des prérequis…"
command -v docker >/dev/null 2>&1 || { echo "❌ Docker n'est pas installé — https://docs.docker.com/get-docker/"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "❌ Le plugin 'docker compose' est requis (Docker Compose v2)."; exit 1; }
docker info >/dev/null 2>&1 || { echo "❌ Le démon Docker ne répond pas. Démarrez Docker puis relancez."; exit 1; }
echo "  ✓ Docker et Docker Compose disponibles"

# ── 2. Configuration (.env) ───────────────────────────────────────────────────
if [ -f "$ROOT/.env" ]; then
  echo "▸ Fichier .env déjà présent — conservé tel quel."
else
  echo "▸ Génération du fichier .env (secrets aléatoires)…"
  JWT_SECRET="$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  JWT_REFRESH_SECRET="$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  cat > "$ROOT/.env" <<EOF
# Généré automatiquement par install.sh — ne pas versionner.

# URL publique de l'application (adaptez pour un déploiement en ligne)
PUBLIC_URL=http://localhost

JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# ─── Email (facultatif) ───────────────────────────────────────────────────────
# Laissez SMTP_HOST vide pour désactiver l'envoi d'emails : les comptes créés
# sont alors validés automatiquement (pratique en local / pour une démo).
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM_NAME=BobConnect
MAIL_FROM=no-reply@localhost
EOF
  echo "  ✓ .env créé (emails désactivés par défaut)"
fi

# ── 3. Construction et démarrage ──────────────────────────────────────────────
echo "▸ Construction des images et démarrage de la stack (cela peut prendre quelques minutes)…"
docker compose -f "$ROOT/docker-compose.yml" up -d --build

echo "▸ Attente de la disponibilité de l'API…"
for i in $(seq 1 60); do
  if curl -fs "http://127.0.0.1:3000/api/v1/health" >/dev/null 2>&1; then
    echo "  ✓ API opérationnelle"
    break
  fi
  [ "$i" = "60" ] && { echo "❌ L'API n'a pas répondu à temps. Diagnostic : docker compose logs back"; exit 1; }
  sleep 2
done

# ── 4. Jeu d'essai ────────────────────────────────────────────────────────────
if [ "$SEED" = "1" ]; then
  echo "▸ Chargement du jeu d'essai « ${DATASET} »…"
  bash "$ROOT/database/import.sh" "$DATASET"
else
  echo "▸ Chargement des données ignoré (--no-seed)."
fi

# ── 5. Récapitulatif ──────────────────────────────────────────────────────────
cat <<'EOF'

╭──────────────────────────────────────────────╮
│  ✅ Installation terminée                     │
╰──────────────────────────────────────────────╯

  Application    http://localhost:8080
  API            http://localhost:3000/api/v1
  Documentation  http://localhost:3000/api/docs   (Swagger)

  Comptes de démonstration — mot de passe : bobconnect123
    admin@bobconnect.fr    (administrateur)
    nassim@bobconnect.fr   (modérateur)
    jean@bobconnect.fr     (habitant)

  Commandes utiles
    docker compose logs -f          suivre les journaux
    docker compose down             arrêter la stack
    ./database/import.sh empty      repartir d'une base vide
EOF
