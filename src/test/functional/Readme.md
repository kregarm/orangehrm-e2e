# OrangeHRM end-to-end tests

[Playwright](https://playwright.dev) tests for the main flows of every module (Core, Admin, PIM, Leave, Time, Recruitment, Performance, Claim), run in Chromium against a real OrangeHRM instance. The specs are in [`playwright/e2e/feature/`](playwright/e2e/feature).

## How it works

```
your machine                              Docker
┌──────────────────────────────┐          ┌───────────────────────────┐
│ bin/run-e2e                  │   HTTP   │ nginx → PHP → OrangeHRM   │
│ Node + Playwright + Chromium │  ──────► │ MySQL                     │
│ specs from playwright/       │          │ functional-testing plugin │
└──────────────────────────────┘          └───────────────────────────┘
```

- **The app runs in Docker.** `bin/run-e2e` copies your checkout and starts it as a throwaway instance on free ports: nginx, PHP and MySQL, from the [OrangeHRM dev environment](https://github.com/orangehrm/orangehrm-os-dev-environment). It then installs OrangeHRM with a known admin (`Admin` / `Jacqueline@OHRM123`). Because it works on a copy, your working tree and any dev environment you already run are left alone.
- **Playwright runs on your machine.** The script installs the project's Playwright version and Chromium with Yarn (through Corepack), then runs the specs from your working tree. That's why the browser can open on your screen (`--headfull`) and why spec edits need no rebuild.
- **The tests talk to the app in two ways.** The browser drives the UI under test. Node calls the REST API to set up data (users, leave types, vacancies, …) and to reset the database through a small functional-testing plugin installed only for these tests. Each spec starts from a fresh database.
- **Afterwards** the containers are removed, unless you pass `--reuse` to keep them for faster reruns.

So you need Docker and Node, and nothing else: no PHP, MySQL, Yarn, global Playwright or `/etc/hosts` entry.

## Setup

### macOS

1. Install the command-line tools (git, curl, tar): `xcode-select --install`
2. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), start it, and give it at least 4 GB of memory.
3. Install Node.js 22, e.g. `brew install node@22`, then run `corepack enable`.

### Linux

1. Install git, curl and tar, and [Docker Engine](https://docs.docker.com/engine/install/) with the Compose plugin. Add yourself to the `docker` group so `docker` works without `sudo`.
2. Install Node.js 22 (package manager or [nvm](https://github.com/nvm-sh/nvm)), then run `corepack enable`.
3. On the first run, prefix the command with `PLAYWRIGHT_INSTALL_DEPS=true` to install Chromium's system libraries (it asks for `sudo`).

### Windows

Use WSL2. `bin/run-e2e` is a bash script and doesn't run in PowerShell or Git Bash.

1. In an admin PowerShell, run `wsl --install -d Ubuntu`, reboot, and create your Linux user.
2. Install Docker Desktop. In its settings, use the WSL 2 engine and enable it for Ubuntu under Resources → WSL integration.
3. In the Ubuntu terminal, follow the Linux steps, but skip Docker: Docker Desktop provides it.
4. Clone into the Linux filesystem (e.g. `~/orangehrm`), not `/mnt/c/...`, which is slow and can break the scripts.

`--headfull` needs Windows 11 (WSLg); headless runs work everywhere.

### Get the code

```bash
git clone https://github.com/kregarm/orangehrm-e2e.git
cd orangehrm-e2e
```

## Running the tests

From the repository root:

```bash
bin/run-e2e
```

The first run takes 5–15 minutes: it clones the dev environment, builds the images and frontend, and downloads Chromium.

Common variations:

```bash
bin/run-e2e --reuse                                    # keep the instance; later runs start in seconds
bin/run-e2e --reuse playwright/e2e/feature/leave       # one folder or spec file
bin/run-e2e --reuse -g "supervisor approves"           # tests by title
bin/run-e2e --reuse --headfull                         # watch the browser
bin/run-e2e --down                                     # remove the kept instance
```

With `--reuse`, editing specs or page objects doesn't trigger a rebuild. Changes to the app itself do, and so does `--rebuild`. Any argument the script doesn't recognise is passed on to `playwright test`.

### Results

```bash
cd src/test/functional
corepack yarn playwright show-report
```

When a test fails, its trace, screenshot and video are saved in `playwright/test-results/`, and the app's logs in `e2e-logs/`. Open a trace with `corepack yarn playwright show-trace <path>/trace.zip`.

CI runs the suite on pull requests labelled `run-e2e` ([workflow](../../../.github/workflows/playwright.yml)).

<details>
<summary>Running against an instance you already have</summary>

The instance must have been installed with the admin `Admin` / `Jacqueline@OHRM123` (employee Jacqueline White), in dev mode (`Config::PRODUCT_MODE = MODE_DEV`), and with `php src/test/functional/tools/prepare.php` run in the PHP container. **The specs reset its database.**

```bash
cd src/test/functional
corepack yarn install
corepack yarn playwright install chromium
PLAYWRIGHT_BASE_URL=http://php83/web/index.php corepack yarn test:playwright
```

If the host name isn't in `/etc/hosts`, add `E2E_LOCAL_HOSTS=php83` to resolve it to `127.0.0.1`.

</details>

## Writing tests

```
playwright/
├── e2e/feature/<module>/   specs
├── pages/<module>/         page objects; shared building blocks in pages/base-ui-elements/
├── api/<module>/           REST clients for test setup
├── data/                   test users and data helpers
└── support/fixtures.ts     test, expect and the fixtures below
```

Import `test` and `expect` from `support/fixtures.ts`. It adds:

- `db`: `db.reset()` restores a fresh install; call it in each `describe`'s `beforeAll`.
- `api`: REST clients logged in as admin, for setting up data, e.g. `api.users.ensure(users.john)`. Use `api.<client>.asUser('john', () => ...)` to make calls as another user.
- `users`: `admin`, `john` and `mike`. Only `admin` exists after a reset.
- `test.use({loginAs: 'john'})`: `page` starts logged in as that user.
- `guestPage`: a logged-out page, e.g. for the public job board.
- `pageAs('mike')`: a page logged in as another user, for flows between users.

[`admin/users.spec.ts`](playwright/e2e/feature/admin/users.spec.ts) is a short example of a spec.

Conventions:

- Set up data through `api`, and drive only the flow under test through the UI.
- Keep each test independent, with its own data (a new candidate, another week, another review period).
- Keep selectors out of specs; add them to a page object instead.
- Page objects: one class per file in `pages/<module>/`. Each has a `Form` (it doesn't extend one), finds fields by label and table cells by column header, and waits for something specific to the page (its heading, the loader, a toast).
- Name page-object variables after their class: `const addVacancyPage = new AddVacancyPage(page)`.

Before committing, from `src/test/functional`:

```bash
corepack yarn typecheck && corepack yarn lint && corepack yarn format
```

---

The older Cypress specs in `cypress/` are kept for reference only and no longer run in CI.
