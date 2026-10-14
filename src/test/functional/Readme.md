# OrangeHRM end-to-end tests

The end-to-end suite is written in [Playwright](https://playwright.dev) and lives in [`playwright/`](playwright). It covers the main flows of each module in a real browser against a real OrangeHRM instance:

| Module      | Spec                               | What it covers                                                      |
| ----------- | ---------------------------------- | ------------------------------------------------------------------- |
| Core        | `core/login.spec.ts`               | Logging in, required fields, wrong password                         |
|             | `core/access-control.spec.ts`      | ESS users are kept out of admin pages; logging out ends the session |
| Admin       | `admin/users.spec.ts`              | A disabled user can no longer log in                                |
| PIM         | `pim/add-employee.spec.ts`         | Adding an employee with login details                               |
|             | `pim/employee-list.spec.ts`        | Searching by name and ID; past employees                            |
|             | `pim/my-info.spec.ts`              | An employee updates their own contact details                       |
| Leave       | `leave/leave-requests.spec.ts`     | Apply, approve, reject and cancel leave, with balances              |
| Time        | `time/timesheets.spec.ts`          | Submitting and approving timesheets                                 |
| Recruitment | `recruitment/vacancies.spec.ts`    | Published and unpublished vacancies on the public job board         |
|             | `recruitment/applications.spec.ts` | A visitor applies with a resume and becomes a candidate             |
|             | `recruitment/candidates.spec.ts`   | Filtering candidates by vacancy and status                          |
|             | `recruitment/hiring.spec.ts`       | Shortlist, interview, offer, hire and reject                        |
| Performance | `performance/reviews.spec.ts`      | Activating a review, self evaluation, supervisor evaluation         |
| Claim       | `claim/claims.spec.ts`             | Submitting a claim with expenses; approving it                      |

All specs are under `playwright/e2e/feature/`.

## Setup

You need:

- **Docker** with Compose (Docker Desktop, or Docker Engine on Linux)
- **Node.js 22** with **Corepack** (comes with Node; run `corepack enable` once)
- **git**, **curl** and **tar**
- network access the first time (images, the dev environment, Chromium)

You don't need PHP, MySQL, Yarn or an `/etc/hosts` entry on your machine. Everything except the browser runs in Docker.

## Running the suite

Run from the OrangeHRM repository root:

```bash
bin/run-e2e
```

This command:

1. Finds the [orangehrm-os-dev-environment](https://github.com/orangehrm/orangehrm-os-dev-environment). It uses the first of these that exists:
   - an ancestor directory that contains `docker-compose.yml` (the documented layout, also used in CI)
   - `ORANGEHRM_DEV_ENV_DIR`
   - a clone in `~/.cache/orangehrm-os-dev-environment`, which it creates if needed (`ORANGEHRM_DEV_ENV_CACHE`)
2. Copies the checkout to a temporary directory: tracked files plus new files that aren't ignored, so your uncommitted edits are included. Your working tree, `src/config` and dev database are never touched.
3. Starts nginx, PHP 8.3 and MySQL 5.5 as a separate compose project on free host ports, so it can run next to your normal dev environment.
4. Installs Composer and Yarn dependencies, builds the frontend and installs OrangeHRM with the CLI installer. The admin is `Admin` / `Jacqueline@OHRM123` (Jacqueline White).
5. Runs `tools/prepare.php`, which enables the functional-testing plugin (`tools/plugins/orangehrmFunctionalTestingPlugin`). The specs use that plugin to reset the database and log in over the API.
6. Installs Chromium and runs `playwright test`. Then it tears everything down.

It uses PHP 8.3 rather than 8.0 because the dev environment's PHP 8.0 image is based on Debian bullseye, which is end of life and no longer builds.

Tests run headless by default. Any argument the script doesn't recognise is passed on to `playwright test`:

```bash
bin/run-e2e --headfull                                         # watch the browser
bin/run-e2e playwright/e2e/feature/core/login.spec.ts          # one spec
bin/run-e2e -g "supervisor approves"                           # tests by title
E2E_SLOW_MO=500 bin/run-e2e --headfull playwright/e2e/feature/leave
```

### Keeping the instance between runs

Provisioning takes several minutes. When you work on specs locally, keep the instance running:

```bash
bin/run-e2e --reuse playwright/e2e/feature/core/login.spec.ts   # keep it running afterwards
bin/run-e2e --rebuild                                           # provision it again anyway
bin/run-e2e --down                                              # remove it
```

Later `--reuse` runs skip straight to Playwright while the app is unchanged. Edits under `src/test/functional/` don't count as a change, except edits in `tools/`, so you can edit specs and page objects and rerun immediately. Changes anywhere else in the checkout (uncommitted ones included), a different PHP version or a new dev-environment revision trigger a rebuild. The kept instance lives in `~/.cache/orangehrm-e2e` (`E2E_STATE_DIR`).

### Options

| Variable                                            | Default                                 | Purpose                                                      |
| --------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| `E2E_PHP_VERSION`                                   | `8.3`                                   | Dev-environment PHP service; `8.4` serves the app as `php84` |
| `E2E_HTTP_PORT`, `E2E_HTTPS_PORT`, `E2E_MYSQL_PORT` | any free port                           | Host ports; a kept instance keeps the ones it was given      |
| `E2E_SLOW_MO`                                       | `0`                                     | Milliseconds to pause after every browser action             |
| `E2E_STATE_DIR`                                     | `~/.cache/orangehrm-e2e`                | Where `--reuse` keeps the instance                           |
| `ORANGEHRM_DEV_ENV_DIR`                             |                                         | An existing dev-environment checkout                         |
| `ORANGEHRM_DEV_ENV_CACHE`                           | `~/.cache/orangehrm-os-dev-environment` | Where to clone it otherwise                                  |
| `PLAYWRIGHT_INSTALL_DEPS`                           | `false`                                 | `true` also installs Chromium's OS packages (CI)             |

### Against an instance you already run

If you already have OrangeHRM running from the dev environment, you can run Playwright against it directly from this directory. That instance needs two things:

- It was installed with the `Admin` / `Jacqueline@OHRM123` admin, whose employee is Jacqueline White. Before running the CLI installer, set `adminPassword`, `adminEmployeeFirstName` and `adminEmployeeLastName` in `installer/cli_install_config.yaml`.
- `Config::PRODUCT_MODE` is `MODE_DEV`, and `php src/test/functional/tools/prepare.php` has been run inside the PHP container.

Every spec resets the database to the freshly installed state, so don't point the suite at a database you care about.

```bash
cd src/test/functional
corepack yarn install
corepack yarn playwright install chromium
PLAYWRIGHT_BASE_URL=http://php83/web/index.php corepack yarn test:playwright
```

`PLAYWRIGHT_BASE_URL` defaults to `http://php80/web/index.php`. If the app's host name isn't in `/etc/hosts`, set `E2E_LOCAL_HOSTS=php83` (a comma-separated list) to resolve it to `127.0.0.1` for both Chromium and the API requests.

### Results

When a test fails, its trace, screenshot and video are saved in `playwright/test-results/`. The HTML report goes to `playwright-report/`, and `bin/run-e2e` copies the app's logs to `e2e-logs/`. To open them:

```bash
cd src/test/functional
corepack yarn playwright show-report
corepack yarn playwright show-trace playwright/test-results/<test>/trace.zip
```

### CI

[`.github/workflows/playwright.yml`](../../../.github/workflows/playwright.yml) runs `bin/run-e2e` on pull requests labelled `run-e2e`. It uploads the results and logs as artifacts.

## How the suite is organised

```
playwright/
├── e2e/feature/<module>/*.spec.ts   the tests
├── pages/                           page objects
│   ├── base-ui-elements/            Form, fields, Table, FilterPanel, toast
│   └── <module>/                    one page (or page component) per file
├── api/                             REST clients for test setup
│   ├── BaseApiClass.ts              ApiSession (login, cookies) and BaseApiClass
│   └── <module>/*ApiClass.ts        one class per resource
├── data/                            test users and data helpers
├── support/
│   ├── fixtures.ts                  test/expect with the fixtures below
│   ├── db.ts                        database reset through the functional-testing plugin
│   └── hosts.ts                     E2E_LOCAL_HOSTS name resolution
└── global-setup.ts                  clears leftover DB savepoints once per run
```

Specs share one database, so they run one at a time (`workers: 1`). Configuration is in [`playwright.config.ts`](playwright.config.ts).

## Writing specs

### Fixtures

Import `test` and `expect` from `playwright/support/fixtures.ts`, not from `@playwright/test`. The fixtures add:

| Fixture     | Scope  | What it is                                                                                                    |
| ----------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| `db`        | worker | `db.reset()` restores the fresh install; usable in `beforeAll`                                                |
| `users`     | worker | The known users (`data/users`): `admin`, `john` (ESS) and `mike` (ESS). Only `admin` exists after a reset     |
| `api`       | worker | REST clients for setup, logged in as admin, e.g. `api.users.ensure(users.john)`, `api.leaveTypes.create(...)` |
| `loginAs`   | option | `test.use({loginAs: 'john'})` starts each test's `page` logged in as that user, skipping the login form       |
| `guestPage` | test   | A logged-out page in its own browser context, e.g. for the public job board                                   |
| `pageAs`    | test   | `await pageAs('mike')` opens a page logged in as another user, for flows between users                        |

All API clients share one session. Requests that must be made as a different user go through `asUser`:

```ts
await api.leaveRequests.asUser('john', () =>
  api.leaveRequests.apply({leaveTypeId: annual.id, fromDate: date}),
);
```

### A typical spec

Set up the data a test needs through the API, and drive through the UI only the flow under test:

```ts
import {test, expect} from '../../../support/fixtures';
import {SystemUsersPage} from '../../../pages/admin/system-users-page';

test.describe('Admin - System Users', () => {
  test.use({loginAs: 'admin'});

  test.beforeAll(async ({db, api, users}) => {
    await db.reset();
    await api.users.ensure(users.john);
  });

  test('disabled user can no longer log in', async ({page, users}) => {
    const systemUsersPage = new SystemUsersPage(page);
    await systemUsersPage.goto();
    const row = systemUsersPage.row(users.john.username);
    await expect(await systemUsersPage.status(row)).toHaveText('Enabled');
    // ...
  });
});
```

Guidelines:

- **Start every `describe` with `db.reset()` in `beforeAll`.** Then create everything the tests need: users, leave periods, vacancies and so on. A fresh install has very little, e.g. no leave period, no timesheet period and no claim events.
- **Keep tests in a `describe` independent.** Give each its own data (a new candidate, a different week or review period) so that tests can run alone or in any order.
- **Navigate relative to `index.php`**: `page.goto('auth/login')`.
- **Write a comment before each step** in plain language (`// Mike approves it`). That way the spec reads as the scenario.

### Page objects

- One class per file, in `pages/<module>/`, matching `api/<module>/` and `e2e/feature/<module>/`.
- A page **has** a `Form` (`this.form = new Form(page)`) and exposes its fields as `TextField`, `SelectField`, `AutocompleteField` or `SwitchField`, found by their label. Only filter panels extend `Form` (through `FilterPanel`).
- Find table cells by column header with `Table.cell(row, 'Status')`, not by position.
- Actions that change the page wait for something specific to that page, such as its heading and `form.loader` being hidden, or the success toast. They don't wait on URL patterns or API responses.
- Keep selectors out of specs. If a spec needs an element, add it to the page object.
- In specs, name page-object instances after their class: `const addVacancyPage = new AddVacancyPage(page)`.

### Before committing

```bash
cd src/test/functional
corepack yarn typecheck
corepack yarn lint
corepack yarn format
```

## Legacy Cypress suite

The Cypress specs under `cypress/` are no longer run in CI and are kept for reference only. New tests go into the Playwright suite. To run Cypress against a working instance, set its URL and admin in `cypress.config.js` and `cypress/fixtures/user.json`, then run `yarn test` (headless) or `yarn open` (interactive).
