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

## How Cypress prepares its app in GitHub Actions

The Cypress workflow checks out the separate `orangehrm-os-dev-environment` repository and this app into its `html` directory. It builds the dev-environment images, starts PHP 8.0 and MySQL 5.5, installs the app and its frontend assets, then runs `tools/prepare.php` to enable the functional-testing plugin and create the database savepoint. Cypress runs on the GitHub runner against that already-installed app; its tasks use the plugin's API to reset, snapshot, and restore database state. Cypress remains unchanged by the Playwright setup.

## Run Playwright end to end

Playwright uses the same Cypress functional-test workspace and fixtures, but runs independently. It starts a fresh, disposable Docker Compose project with PHP 8.3 and MySQL 5.5, builds and installs a temporary copy of OrangeHRM, enables the functional-testing plugin, then runs the Playwright suite in Chromium. The MySQL container uses amd64 emulation where necessary because MySQL 5.5 does not publish an Apple Silicon image. The normal app checkout and its database are not reset or reconfigured.

Prerequisites:

- Docker Desktop or Docker CLI, and network access on the first run so the launcher can clone `orangehrm-os-dev-environment` if it is not already checked out.
- Node.js with Corepack available, and Yarn selected by the workspace's `packageManager` field.

Run from the OrangeHRM repository root:

```bash
bin/run-e2e
```

The launcher uses an existing dev-environment checkout if it is an ancestor of this repository. Otherwise it clones one into `~/.cache/orangehrm-os-dev-environment` (override with `ORANGEHRM_DEV_ENV_CACHE`) and creates its default `.env`; set `ORANGEHRM_DEV_ENV_DIR` to use a checkout elsewhere. Docker Desktop's standard macOS CLI path is detected when it is not already on `PATH`. HTTP, HTTPS, and MySQL host ports are selected automatically to avoid conflicts with other local services; override them with `E2E_HTTP_PORT`, `E2E_HTTPS_PORT`, and `E2E_MYSQL_PORT`. Test traces, the HTML report, and app logs are saved in `src/test/functional/playwright/test-results`, `src/test/functional/playwright-report`, and `src/test/functional/e2e-logs`.

To run Playwright directly against an already-running app instead, enable the functional-testing plugin with `tools/prepare.php`, install the functional-test dependencies and Chromium, set `PLAYWRIGHT_BASE_URL` (default: `http://php80/web/index.php`), then run `yarn test:playwright` from `src/test/functional`.
