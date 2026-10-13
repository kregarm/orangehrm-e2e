## Introduction

Testing OrangeHRM 5x via cypress framework. cypress execute test on native browser without any middleware server.
This is the main advantage of cypress over selenium.

## How to set up the project

- Install Yarn locally in your computer. pls refer https://yarnpkg.com/getting-started/install
- Install project dependencies via `yarn install`
- Modify test/cypress.json fie base url to working instance url

```
     {
        "baseUrl": "http://php80/orangehrm/web/index.php",
     }
```

- Modify your instance admin user details on `fixtures/user.json` file

```
   # Admin user details are included here
    "admin": {
       "userName": "Admin",
       "password": "Admin@123",
       "fullName": "Samantha Jayasinghe"
   },
```

## How to execute the cypress tests on cli

```bash
yarn test
```

## How to execute the cypress on browser

```bash
yarn open
```

## Run Playwright end to end

Playwright lives in the same workspace and reuses the Cypress fixtures (`cypress/fixtures/user.json`) and the functional-testing plugin. It provisions the same environment the Cypress suite expects: `orangehrm-os-dev-environment` with nginx, PHP and MySQL 5.5, the CLI installer with the Jacqueline White admin, and `tools/prepare.php`. The one difference is PHP 8.3 instead of 8.0: the dev environment's PHP 8.0 image is based on Debian bullseye, which is end of life, so it no longer builds. The app is served as `http://php83/web/index.php`.

Run from the OrangeHRM repository root. Tests run headless by default; add `--headfull` to watch them in a browser window. Other arguments go to `playwright test`:

```bash
bin/run-e2e
bin/run-e2e --headfull
bin/run-e2e playwright/e2e/feature/core/login.spec.ts
```

Prerequisites: Docker, Node.js with Corepack, git, and network access on the first run.

What it does:

- Copies the checkout (tracked files plus new unignored ones, so local edits are included) to a temp dir, so your working tree, `src/config` and dev database are never touched.
- Starts it as a separate compose project with its own container names and free host ports, so it can run next to your normal dev environment. Everything is removed on exit.
- Maps `php83` to `127.0.0.1` for Chromium and for Playwright's API requests (`E2E_LOCAL_HOSTS`), so no `/etc/hosts` entry is needed.

The dev environment is taken from an ancestor directory containing `docker-compose.yml` (the documented layout and the CI layout), `ORANGEHRM_DEV_ENV_DIR`, or a clone in `~/.cache/orangehrm-os-dev-environment` (`ORANGEHRM_DEV_ENV_CACHE`). Override ports with `E2E_HTTP_PORT`, `E2E_HTTPS_PORT` and `E2E_MYSQL_PORT`, and the PHP version with `E2E_PHP_VERSION` (default `8.3`; e.g. `8.4` serves the app as `php84`). Traces, screenshots and videos of failed tests, the HTML report and the app logs end up in `playwright/test-results`, `playwright-report` and `e2e-logs`.

### Writing Playwright specs

Specs live in `playwright/e2e/`, mirroring `cypress/e2e/integration/`. Import `test` and `expect` from `playwright/support/fixtures.ts`, which adds:

- `db` — the Cypress `db:*` tasks: `db.reset()`, `db.truncate(tables)`, `db.snapshot(name)`, `db.restore(name)`, `db.clearSnapshots(names)`. Worker-scoped, so it works in `test.beforeAll`.
- `users` — `cypress/fixtures/user.json`.

As with Cypress' `before:run`, savepoints are cleared once before the run (`playwright/global-setup.ts`). Navigate relative to `index.php`: `page.goto('auth/login')`.

To run against an app that is already installed and prepared, set `PLAYWRIGHT_BASE_URL` (default `http://php80/web/index.php`) and run `yarn test:playwright` from this directory.
