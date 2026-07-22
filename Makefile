# BobConnect — raccourcis de développement et d'exploitation.
# Usage : make <cible>   (make help pour la liste)

DATASET ?= full

.PHONY: help install up down restart logs build seed seed-empty test typecheck clean

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Installation complète (prérequis, .env, build, démarrage, jeu d'essai)
	@./install.sh --dataset $(DATASET)

up: ## Démarre la stack (sans reconstruire)
	docker compose up -d

down: ## Arrête la stack
	docker compose down

restart: ## Redémarre la stack
	docker compose restart

build: ## Reconstruit les images et redémarre
	docker compose up -d --build

logs: ## Suit les journaux de tous les services
	docker compose logs -f

seed: ## Charge le jeu d'essai complet (DATASET=minimal pour un autre)
	@./database/import.sh $(DATASET)

seed-empty: ## Repart d'une base totalement vide
	@./database/import.sh empty

test: ## Lance les tests du back et du front
	pnpm test

typecheck: ## Vérifie les types du front
	pnpm typecheck

clean: ## Arrête la stack et supprime les volumes (⚠ efface la base)
	docker compose down -v
