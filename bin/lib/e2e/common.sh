# shellcheck shell=bash
#
# Output and retry helpers shared by bin/run-e2e and its libraries.

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

log() {
  printf '\n==> %s\n' "$*"
}

# Runs the command every 2 seconds until it succeeds, for up to 2 minutes.
wait_until() {
  for _ in {1..60}; do
    "$@" && return 0
    sleep 2
  done
  return 1
}
