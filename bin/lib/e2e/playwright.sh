# shellcheck shell=bash
#
# Running the Playwright suite on the host against the instance.
#
# Reads: FUNCTIONAL_DIR, APP_HOST, E2E_HTTP_PORT, PLAYWRIGHT_INSTALL_DEPS
# Sets:  PLAYWRIGHT_BASE_URL, E2E_LOCAL_HOSTS (exported)

app_is_up() {
  curl --fail --silent --output /dev/null \
    --resolve "$APP_HOST:$E2E_HTTP_PORT:127.0.0.1" \
    "$PLAYWRIGHT_BASE_URL/auth/login"
}

# Usage: run_playwright [playwright test args...]
run_playwright() {
  export PLAYWRIGHT_BASE_URL="http://$APP_HOST:$E2E_HTTP_PORT/web/index.php"
  # Resolve the app host to the published nginx port without touching /etc/hosts.
  export E2E_LOCAL_HOSTS="$APP_HOST"

  log "Waiting for $PLAYWRIGHT_BASE_URL"
  wait_until app_is_up || fail "OrangeHRM did not become ready at $PLAYWRIGHT_BASE_URL"

  log "Running Playwright"
  cd "$FUNCTIONAL_DIR"
  corepack yarn install --immutable
  if [[ "${PLAYWRIGHT_INSTALL_DEPS:-false}" == "true" ]]; then
    corepack yarn playwright install --with-deps chromium
  else
    corepack yarn playwright install chromium
  fi
  corepack yarn test:playwright "$@"
}
