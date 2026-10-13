# shellcheck shell=bash
#
# Host checks and locating the orangehrm-os-dev-environment checkout.
#
# Reads: PROJECT_ROOT, ORANGEHRM_DEV_ENV_DIR, ORANGEHRM_DEV_ENV_CACHE
# Sets:  DEV_ENV_DIR

require_host_tools() {
  if ! command -v docker >/dev/null 2>&1 && [[ -x "$HOME/.docker/bin/docker" ]]; then
    export PATH="$HOME/.docker/bin:$PATH"
  fi
  local cmd
  for cmd in docker node corepack curl git tar; do
    command -v "$cmd" >/dev/null 2>&1 || fail "Required command not found: $cmd"
  done
  docker info >/dev/null 2>&1 || fail "Docker daemon is not reachable. Is Docker running?"
}

find_dev_env() {
  DEV_ENV_DIR="${ORANGEHRM_DEV_ENV_DIR:-}"
  if [[ -z "$DEV_ENV_DIR" ]]; then
    # The documented layout checks OrangeHRM out inside the dev environment.
    local candidate
    candidate="$(dirname "$PROJECT_ROOT")"
    while [[ "$candidate" != "/" ]]; do
      if [[ -f "$candidate/docker-compose.yml" ]]; then
        DEV_ENV_DIR="$candidate"
        break
      fi
      candidate="$(dirname "$candidate")"
    done
  fi
  if [[ -z "$DEV_ENV_DIR" ]]; then
    DEV_ENV_DIR="${ORANGEHRM_DEV_ENV_CACHE:-${XDG_CACHE_HOME:-$HOME/.cache}/orangehrm-os-dev-environment}"
    if [[ ! -f "$DEV_ENV_DIR/docker-compose.yml" ]]; then
      log "Cloning orangehrm-os-dev-environment into $DEV_ENV_DIR"
      mkdir -p "$(dirname "$DEV_ENV_DIR")"
      git clone --depth 1 https://github.com/orangehrm/orangehrm-os-dev-environment.git "$DEV_ENV_DIR"
    fi
  fi
  [[ -f "$DEV_ENV_DIR/docker-compose.yml" ]] || fail "No docker-compose.yml in $DEV_ENV_DIR"
  [[ -f "$DEV_ENV_DIR/.env.dist" ]] || fail "No .env.dist in $DEV_ENV_DIR"
}
