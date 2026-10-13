# shellcheck shell=bash
#
# The OrangeHRM instance under test: an isolated copy of the checkout, started
# as its own compose project from the dev environment, and provisioned like the
# Cypress suite expects.
#
# Reads: PROJECT_ROOT, DEV_ENV_DIR, DOCKER_CONFIG_DIR, E2E_PHP_VERSION,
#        PHP_SERVICE, DB_SERVICE, E2E_STATE_DIR
# Sets:  PROJECT_NAME, RUN_ROOT, SOURCE_DIR,
#        E2E_HTTP_PORT, E2E_HTTPS_PORT, E2E_MYSQL_PORT

# A kept instance (init_instance keep) has a fixed name and lives in the state
# dir; otherwise the copy goes to a temp dir and the project gets a unique name.
init_instance() {
  if [[ "$1" == keep ]]; then
    PROJECT_NAME=orangehrm-e2e
    RUN_ROOT="${E2E_STATE_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/orangehrm-e2e}"
    mkdir -p "$RUN_ROOT"
  else
    PROJECT_NAME="orangehrm-e2e-$(date +%s)-$$"
    RUN_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/orangehrm-e2e.XXXXXX")"
  fi
  SOURCE_DIR="$RUN_ROOT/html"
  FINGERPRINT_FILE="$RUN_ROOT/fingerprint"
  PORTS_FILE="$RUN_ROOT/ports"
}

# --- Kept instances ----------------------------------------------------------

# What a fresh checkout would contain (tracked files plus new, unignored ones),
# like a CI checkout, including local edits. NUL-separated, relative paths.
checkout_files() {
  git -C "$PROJECT_ROOT" ls-files -z --cached --others --exclude-standard |
    while IFS= read -r -d '' file; do
      # Skip tracked files deleted in the working tree.
      if [[ -e "$PROJECT_ROOT/$file" || -L "$PROJECT_ROOT/$file" ]]; then printf '%s\0' "$file"; fi
    done
}

# Identifies what an instance is built from: the checkout minus the specs, which
# run on the host (the functional-testing plugin under tools/ runs in the app),
# plus the PHP version and the dev environment revision.
app_fingerprint() {
  (
    cd "$PROJECT_ROOT"
    files="$(checkout_files | tr '\0' '\n' |
      awk '!/^src\/test\/functional\// || /^src\/test\/functional\/tools\//')"
    printf 'php %s\n' "$E2E_PHP_VERSION"
    printf 'dev-env %s\n' "$(git -C "$DEV_ENV_DIR" rev-parse HEAD 2>/dev/null || echo unknown)"
    paste <(printf '%s\n' "$files") <(printf '%s\n' "$files" | git hash-object --stdin-paths)
  ) | shasum -a 256 | cut -d' ' -f1
}

# Usage: instance_is_current FINGERPRINT
# Succeeds if the kept instance was fully provisioned from that app; its ports
# are loaded then.
instance_is_current() {
  [[ -f "$PORTS_FILE" && -f "$FINGERPRINT_FILE" ]] || return 1
  [[ "$(cat "$FINGERPRINT_FILE")" == "$1" ]] || return 1
  read -r E2E_HTTP_PORT E2E_HTTPS_PORT E2E_MYSQL_PORT <"$PORTS_FILE"
}

# Usage: mark_instance_current FINGERPRINT
# Records what the kept instance was provisioned from, once that succeeded. The
# fingerprint is taken before provisioning, so edits made meanwhile still count
# as changes on the next run.
mark_instance_current() {
  printf '%s %s %s\n' "$E2E_HTTP_PORT" "$E2E_HTTPS_PORT" "$E2E_MYSQL_PORT" >"$PORTS_FILE"
  printf '%s\n' "$1" >"$FINGERPRINT_FILE"
}

# Removes a kept instance's copy and state so it is provisioned from scratch.
forget_instance() {
  rm -rf "$SOURCE_DIR" "$FINGERPRINT_FILE" "$PORTS_FILE"
}

# --- Docker ------------------------------------------------------------------

free_port() {
  node -e '
    const server = require("node:net").createServer();
    server.listen(0, "127.0.0.1", () => {
      console.log(server.address().port);
      server.close();
    });
  '
}

choose_ports() {
  E2E_HTTP_PORT="${E2E_HTTP_PORT:-$(free_port)}"
  E2E_HTTPS_PORT="${E2E_HTTPS_PORT:-$(free_port)}"
  E2E_MYSQL_PORT="${E2E_MYSQL_PORT:-$(free_port)}"
  local port
  for port in "$E2E_HTTP_PORT" "$E2E_HTTPS_PORT" "$E2E_MYSQL_PORT"; do
    [[ "$port" =~ ^[0-9]+$ ]] && ((port >= 1 && port <= 65535)) ||
      fail "Invalid port: $port"
  done
}

# The dev-environment pins container names (os_dev_*), so give this project
# its own to run alongside an existing dev environment. MySQL 5.5 has no arm64
# image; pin amd64 so it runs under emulation on Apple Silicon.
write_compose_files() {
  cp "$DEV_ENV_DIR/.env.dist" "$RUN_ROOT/.env"
  cat >"$RUN_ROOT/compose.override.yml" <<EOF
services:
  nginx:
    container_name: $PROJECT_NAME-nginx
  $PHP_SERVICE:
    container_name: $PROJECT_NAME-php
  $DB_SERVICE:
    container_name: $PROJECT_NAME-db
    platform: linux/amd64
EOF
  touch "$RUN_ROOT/.bash_history"
}

compose() {
  # HOME is redirected because the PHP service bind-mounts $HOME/.bash_history;
  # DOCKER_CONFIG keeps the docker CLI using the real config.
  HOME="$RUN_ROOT" \
    DOCKER_CONFIG="$DOCKER_CONFIG_DIR" \
    LOCAL_SRC="$SOURCE_DIR" \
    NGINX_PORT="$E2E_HTTP_PORT" \
    NGINX_SSL_PORT="$E2E_HTTPS_PORT" \
    MYSQL_55_PORT="$E2E_MYSQL_PORT" \
    docker compose \
    --project-directory "$DEV_ENV_DIR" \
    --env-file "$RUN_ROOT/.env" \
    --file "$DEV_ENV_DIR/docker-compose.yml" \
    --file "$RUN_ROOT/compose.override.yml" \
    --project-name "$PROJECT_NAME" \
    "$@"
}

php_exec() {
  docker exec "$PROJECT_NAME-php" bash --login -c "$1"
}

db_is_up() {
  docker exec "$PROJECT_NAME-db" mysqladmin ping -uroot -proot --silent >/dev/null 2>&1
}

wait_for_db() {
  log "Waiting for $DB_SERVICE"
  wait_until db_is_up || fail "$DB_SERVICE did not become ready"
}

# --- Lifecycle ---------------------------------------------------------------

provision_instance() {
  log "Copying source to $SOURCE_DIR"
  mkdir -p "$SOURCE_DIR"
  checkout_files | (cd "$PROJECT_ROOT" && tar --null -T - -cf -) | tar -xf - -C "$SOURCE_DIR"
  mkdir -p "$SOURCE_DIR/src/log" "$SOURCE_DIR/src/config"
  write_compose_files

  log "Starting nginx, $PHP_SERVICE and $DB_SERVICE ($PROJECT_NAME)"
  compose up --detach --build "$PHP_SERVICE" "$DB_SERVICE" ||
    fail "Could not build or start $PHP_SERVICE/$DB_SERVICE (see the docker output above). Some older dev-environment PHP images no longer build; try another E2E_PHP_VERSION."

  log "Installing dependencies and building the frontend"
  php_exec 'cd src && composer install --no-interaction'
  php_exec 'cd src/client && yarn install --immutable && yarn build --mode development'

  wait_for_db

  log "Installing OrangeHRM"
  php_exec "
    set -e
    sed -i 's/hostName: 127.0.0.1/hostName: $DB_SERVICE/g' installer/cli_install_config.yaml
    sed -i 's/adminPassword: Ohrm@1423/adminPassword: Jacqueline@OHRM123/g' installer/cli_install_config.yaml
    sed -i 's/adminEmployeeFirstName: OrangeHRM/adminEmployeeFirstName: Jacqueline/g' installer/cli_install_config.yaml
    sed -i 's/adminEmployeeLastName: Admin/adminEmployeeLastName: White/g' installer/cli_install_config.yaml
    sed -i 's/public const PRODUCT_MODE = self::MODE_PROD/public const PRODUCT_MODE = self::MODE_DEV/g' src/lib/config/Config.php
    chmod -R 777 src/log src/config
    php installer/cli_install.php
    php src/test/functional/tools/prepare.php
  "
}

# Starts a kept instance again in case Docker restarted; the DB volume is kept.
start_instance() {
  compose up --detach "$PHP_SERVICE" "$DB_SERVICE" >/dev/null ||
    fail "Could not start $PROJECT_NAME; try bin/run-e2e --rebuild"
  wait_for_db
}

# Removes the containers and DB volume; the copy and state files are left.
teardown_instance() {
  [[ -f "$RUN_ROOT/.env" ]] || return 0
  # compose needs the port variables, which down doesn't use; they are still
  # unset when a kept instance is replaced before new ports are chosen.
  local E2E_HTTP_PORT="${E2E_HTTP_PORT:-0}" E2E_HTTPS_PORT="${E2E_HTTPS_PORT:-0}" E2E_MYSQL_PORT="${E2E_MYSQL_PORT:-0}"
  # On Linux, files the containers created in the bind mount are root-owned;
  # hand them back so the copy and logs can be removed and read.
  docker exec "$PROJECT_NAME-php" chown -R "$(id -u):$(id -g)" /var/www >/dev/null 2>&1 || true
  # Quiet unless it fails. The subshell keeps a failure from ending the run.
  local output
  output="$(compose down --volumes --remove-orphans 2>&1)" ||
    printf 'Warning: could not remove %s:\n%s\n' "$PROJECT_NAME" "$output" >&2
}

# Copies the app logs next to the specs, replacing the previous run's.
save_logs() {
  [[ -d "$SOURCE_DIR/src/log" ]] || return 0
  rm -rf "$1"
  cp -R "$SOURCE_DIR/src/log" "$1"
}
