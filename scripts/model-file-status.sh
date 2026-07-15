#!/usr/bin/env bash
# Overview table: which models have meta.ts, model.ts, model.mxl.json, and a non-empty figs/ dir.
#
# Usage: scripts/model-file-status.sh
set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

dir="$(git rev-parse --show-toplevel)/src/lib/models"

check() {
    if [[ -f "$1" ]]; then
        printf "${GREEN}✓${RESET}"
    else
        printf "${RED}✗${RESET}"
    fi
}

check_figs() {
    if [[ -d "$1" ]] && [[ -n "$(ls -A "$1")" ]]; then
        printf "${GREEN}✓${RESET}"
    else
        printf "${RED}✗${RESET}"
    fi
}

printf "${BOLD}%-25s %-10s %-10s %-10s %-15s %-10s${RESET}\n" "model" "meta.ts" "model.ts" "model.md" "model.mxl.json" "figs/"

for model_dir in "$dir"/*/; do
    slug="$(basename "$model_dir")"

    printf "%-25s " "$slug"
    check "$model_dir/meta.ts"
    printf "          "
    check "$model_dir/model.ts"
    printf "          "
    check "$model_dir/model.md"
    printf "          "
    check "$model_dir/model.mxl.json"
    printf "               "
    check_figs "$model_dir/figs"
    printf "\n"
done
