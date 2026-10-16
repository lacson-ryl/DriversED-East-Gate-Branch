# DriversED East Gate

## User Manual: Local Installation and Use

DriversED East Gate is a driving-school management system with a public website, an accounts and administration website, MySQL persistence, Redis-backed sessions and notifications, a GitHub webhook service, Tailwind CSS asset generation, and an Nginx HTTPS reverse proxy.

This manual explains how to run the complete system locally with WSL 2, Ubuntu 22.04 LTS, Docker Desktop, and Docker Compose.

> **Security notice:** Never copy credentials from another environment into your local setup. The values in `.env.production` are examples of required variable names only. Use new passwords, tokens, OAuth credentials, reCAPTCHA keys, and webhook secrets for your installation. Any credentials shared publicly or committed to a repository should be revoked and replaced.

## 1. Prerequisites

Install or enable the following on Windows:

- Windows Subsystem for Linux 2 (WSL 2)
- Ubuntu 22.04 LTS inside WSL
- Docker Desktop for Windows
- Docker Desktop's WSL 2 backend and Ubuntu integration
- Git
- VS Code with the WSL extension (recommended)

The application runs MySQL 8.0 and Redis as Docker services. A separate MySQL server is not required. A MySQL client is useful for troubleshooting. If MySQL is already running on Windows or WSL, stop it or change the Compose mapping because this project publishes MySQL on host port `3306`.

## 2. Install WSL and Ubuntu 22.04

Open **PowerShell as Administrator**:

```powershell
wsl --install
wsl --set-default-version 2
wsl --install -d Ubuntu-22.04
```

Restart Windows if prompted. Open Ubuntu from the Start menu and create a Linux username and password. Confirm the distribution uses WSL 2:

```powershell
wsl --list --verbose
```

The Ubuntu distribution should show version `2`. Update it before continuing:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl git openssl
```

## 3. Install and Configure Docker Desktop

1. Install Docker Desktop from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/).
2. Enable **Settings > General > Use the WSL 2 based engine**.
3. Open **Settings > Resources > WSL Integration** and enable integration for `Ubuntu-22.04`.
4. Verify Docker from Ubuntu:

```bash
docker --version
docker compose version
docker run --rm hello-world
```

This repository uses both `docker compose` and the older `docker-compose` spelling. Current Docker Desktop installations support `docker compose`; use it if `docker-compose` is unavailable.

## 4. Get the Source Code

From Ubuntu:

```bash
mkdir -p ~/projects
cd ~/projects
git clone <YOUR_REPOSITORY_URL> new12
cd new12
```

If the project is already on Windows, you can work from `/mnt/c/Users/<your-windows-user>/Desktop/new12`. The project root is the directory containing `docker-compose.yml`.

Confirm the important files exist:

```bash
ls docker-compose.yml Dockerfile.accounts-site Dockerfile.public-site Dockerfile.tailwind Dockerfile.webhook mysql-init/b-schema.sql
```

## 5. Create `.env.production`

Create this file in the project root. Never commit it or paste real secrets into documentation:

```bash
touch .env.production
chmod 600 .env.production
```

Use this template and replace every `<...>` value:

```dotenv
NODE_ENV=production
HOST=https://localhost
GEN_CERT_HOST=http://nodeapp:8000
MYSQL_ROOT_PASSWORD=<long-unique-mysql-root-password>
MYSQL_HOST=mysql
MYSQL_USER=<local-application-database-user>
MYSQL_PASSWORD=<long-unique-application-database-password>
MYSQL_DATABASE=<database-name>
port=8000
PUBLIC_PORT=8001
WEBHOOK_PORT=9000
secret_key=<at-least-64-character-random-secret>
GOOGLE_ADMIN_CLIENT_ID=<google-oauth-client-id-for-admin-login>
GOOGLE_ADMIN_CLIENT_SECRET=<google-oauth-client-secret-for-admin-login>
GOOGLE_USER_CLIENT_ID=<google-oauth-client-id-for-user-login>
GOOGLE_USER_CLIENT_SECRET=<google-oauth-client-secret-for-user-login>
GOOGLE_CHANGE_PASSWORD_CLIENT_ID=<google-oauth-client-id-for-password-change>
GOOGLE_CHANGE_PASSWORD_SECRET=<google-oauth-client-secret-for-password-change>
RECAPTCHA_SITE_KEY=<recaptcha-site-key>
RECAPTCHA_SECRET_KEY=<recaptcha-secret-key>
GOOGLE_EMAIL=<gmail-or-google-workspace-sender-address>
GOOGLE_APP_PASSWORD=<16-character-google-app-password>
REDIS_URL=redis://redis:6379
REDIS_SECRET=<long-unique-redis-secret>
GITHUB_SECRET=<github-webhook-signing-secret>
EXEC_SECRET=<long-unique-rebuild-trigger-secret>
```

### Environment variable reference

| Variable | What to enter |
| --- | --- |
| `NODE_ENV` | Use `production` for the current Docker configuration. This enables secure cookies. |
| `HOST` | Browser-facing origin. Use `https://localhost` with the included Nginx configuration. |
| `GEN_CERT_HOST` | Docker-internal accounts service URL. Keep `http://nodeapp:8000` unless the Compose service name changes. |
| `MYSQL_ROOT_PASSWORD` | New strong password for the MySQL root account. |
| `MYSQL_HOST` | `mysql`, the Compose service name. Do not use `localhost` from another container. |
| `MYSQL_USER` and `MYSQL_PASSWORD` | New application database username and password. |
| `MYSQL_DATABASE` | Database created on first initialization, for example `drivereadydb`. |
| `port`, `PUBLIC_PORT`, `WEBHOOK_PORT` | Internal service ports. Keep `8000`, `8001`, and `9000` unless the source and Compose mappings are changed together. |
| `secret_key` | Random secret used for sessions, JWTs, and application encryption. Generate it; do not reuse a password. |
| `GOOGLE_*_CLIENT_ID` and secrets | OAuth credentials for admin login, user login, and change-password verification. |
| `RECAPTCHA_SITE_KEY` and secret | Public/private reCAPTCHA key pair for the local hostname. |
| `GOOGLE_EMAIL` | Mailbox used to send account, contact, and notification email. |
| `GOOGLE_APP_PASSWORD` | Google app password for that mailbox, not the normal mailbox password. |
| `REDIS_URL` | Keep `redis://redis:6379` for the Compose Redis service. |
| `REDIS_SECRET` | Separate strong secret for Redis-related application configuration. |
| `GITHUB_SECRET` | Secret configured in the GitHub webhook settings. |
| `EXEC_SECRET` | Separate secret authorizing rebuild requests sent by the webhook service. |

### Generate local secrets

Run these commands in Ubuntu and use different output for each secret:

```bash
openssl rand -hex 32
openssl rand -hex 64
```

Use unique values for `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, `secret_key`, `REDIS_SECRET`, `GITHUB_SECRET`, and `EXEC_SECRET`.

### Create Google OAuth credentials

In [Google Cloud Console](https://console.cloud.google.com/), create or select a project, configure the OAuth consent screen, add a test user if needed, and create three **Web application** OAuth clients. Add these exact redirect URIs to the corresponding client:

- `https://localhost/auth/google/admin/callback`
- `https://localhost/auth/google/user/callback`
- `https://localhost/auth/google/change-password/callback`

Put each client ID and secret in its matching environment variable. Because local development uses a self-signed certificate, open `https://localhost` once and accept the browser certificate warning before testing OAuth.

### Create reCAPTCHA keys

In the [Google reCAPTCHA admin console](https://www.google.com/recaptcha/admin), register a site using the version expected by the templates and add `localhost` as a domain. Copy the public key to `RECAPTCHA_SITE_KEY` and the private key to `RECAPTCHA_SECRET_KEY`.

### Create a Google app password

For `GOOGLE_EMAIL`, enable two-step verification on the Google account, then create an app password in the account security settings. Put the generated value in `GOOGLE_APP_PASSWORD`. Do not use the regular Google account password.

### Configure the GitHub webhook

The endpoint is `/github-webhook`. In GitHub repository settings, create a webhook with:

- Payload URL: `https://localhost/github-webhook` for local-only testing, or an externally reachable HTTPS URL for remote testing
- Content type: `application/json`
- Secret: the value used for `GITHUB_SECRET`
- Events: at minimum, **Just the push event**

GitHub cannot reach `localhost` from its servers. Local webhook testing requires a secure tunnel or another reachable development host. `EXEC_SECRET` must match the secret accepted by the rebuild endpoint.

## 6. Create Local HTTPS Certificates

Nginx expects `certs/server.crt` and `certs/server.key` and serves `https://localhost`. From the project root:

```bash
mkdir -p certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
	-keyout certs/server.key \
	-out certs/server.crt \
	-subj "/CN=localhost" \
	-addext "subjectAltName=DNS:localhost"
chmod 600 certs/server.key
```

The browser warning is expected for a self-signed local certificate. Never use this certificate in production.

## 7. Initialize and Start the System

Run all commands from the project root.

### Terminal 1: Build Tailwind assets

```bash
docker compose --env-file .env.production run --rm tailwind-builder
```

The current Compose command uses Tailwind `--watch` mode, so this terminal stays attached while CSS is regenerated. Leave it running during development. For a one-time build, stop it with `Ctrl+C` after `output.css` is written.

### Terminal 2: Build application images

```bash
docker compose --env-file .env.production build --no-cache
```

The first build can take several minutes because the accounts image installs Chromium/Puppeteer and native image-processing dependencies.

### Terminal 2: Start services

```bash
docker compose --env-file .env.production up -d
```

The first start creates named volumes and initializes MySQL from `mysql-init/b-schema.sql`. MySQL initialization scripts run only when the database volume is empty.

The equivalent legacy command sequence is:

```bash
docker-compose --env-file .env.production --profile build-assets run --rm tailwind-builder
docker-compose --env-file .env.production build --no-cache
docker-compose --env-file .env.production up -d
```

The repository currently does not assign `tailwind-builder` to a `build-assets` profile, so `--profile build-assets` is not required. The watcher behavior still applies.

## 8. Verify the Installation

Check service state:

```bash
docker compose --env-file .env.production ps
```

Inspect logs if a service is restarting:

```bash
docker compose --env-file .env.production logs --tail=100 nodeapp
docker compose --env-file .env.production logs --tail=100 public-site
docker compose --env-file .env.production logs --tail=100 mysql
docker compose --env-file .env.production logs --tail=100 nginx
```

Check health endpoints:

```bash
curl -k https://localhost/account/health-check-docker
curl -k https://localhost/public/health-check-docker
curl -k http://localhost:9000/health-check-docker
```

Open these browser URLs:

- Public website: [https://localhost/public/](https://localhost/public/)
- User login: `https://localhost/account/user-login`
- Admin login: `https://localhost/account/adminlogin`

Direct service ports are useful for diagnostics but bypass Nginx:

- Accounts service: `http://localhost:8000`
- Public service: `http://localhost:8001`
- Webhook service: `http://localhost:9000`

## 9. First Use

1. Open the public website and confirm CSS, images, and JavaScript load.
2. Register a user account from the user registration page.
3. Confirm email delivery before testing password recovery.
4. Sign in to the admin area with an administrator account already present in the database, or create one through the authorized administration workflow.
5. Configure programs, instructors, vehicles, certificates, and payment methods from the admin dashboard.
6. Test a user application and confirm it appears in the admin dashboard.
7. Test Google sign-in after the redirect URIs exactly match the local HTTPS URLs.

The SQL schema creates tables but does not provide a universal default administrator password. Do not add a hard-coded administrator credential to the repository.

## 10. Common Operations

Stop the stack without deleting data:

```bash
docker compose --env-file .env.production down
```

Start it again:

```bash
docker compose --env-file .env.production up -d
```

Rebuild after changing dependencies or a Dockerfile:

```bash
docker compose --env-file .env.production down
docker compose --env-file .env.production build --no-cache
docker compose --env-file .env.production up -d
```

Follow logs:

```bash
docker compose --env-file .env.production logs -f nodeapp public-site
```

Open a shell in a running container:

```bash
docker compose --env-file .env.production exec nodeapp sh
docker compose --env-file .env.production exec mysql sh
```

## 11. Reset the Local Database

This permanently deletes local MySQL data and causes the schema script to run again on the next start:

```bash
docker compose --env-file .env.production down
docker volume ls
docker volume rm <project>_mysql-data
docker compose --env-file .env.production up -d
```

Remove only the project database volume. Do not remove `redis-data` or `tailwind-cache` unless you also intend to reset those stores.

## 12. Troubleshooting

### Port already in use

```bash
sudo ss -ltnp | grep -E ':80|:443|:3306|:6379|:8000|:8001|:9000'
```

Stop the conflicting service, or update both the Compose port mapping and dependent browser URLs. Container values such as `MYSQL_HOST=mysql` and `REDIS_URL=redis://redis:6379` should not be changed for a host-port conflict.

### Nginx exits immediately

```bash
ls -l certs/server.crt certs/server.key
docker compose --env-file .env.production logs nginx
```

### MySQL does not accept connections

```bash
docker compose --env-file .env.production ps mysql
docker compose --env-file .env.production logs mysql
```

If credentials or the database name changed after first startup, the existing MySQL volume still contains the old initialization. Use the original values or reset the database volume deliberately.

### CSS is missing or stale

Make sure the Tailwind terminal is running and inspect the generated file:

```bash
docker compose --env-file .env.production logs tailwind-builder
docker compose --env-file .env.production exec nodeapp ls -l /app/shared/f-css
```

Run the asset builder again after changing templates or frontend JavaScript files.

### OAuth callback fails

Use `https://localhost`, not `http://localhost`, and verify the Google redirect URI exactly matches the callback path. Confirm the browser accepted the local certificate and `HOST=https://localhost` is set.

### Email or reCAPTCHA fails

Check the sender address, app password, reCAPTCHA domain, and provider configuration. Inspect logs:

```bash
docker compose --env-file .env.production logs --tail=200 nodeapp public-site
```

## 13. Data and Secret Handling

- Keep `.env.production` and private keys out of Git.
- Use different credentials for local, staging, and production.
- Rotate credentials pasted into an issue, chat, screenshot, or committed history.
- Back up MySQL before destructive maintenance.
- Do not expose MySQL, Redis, or the webhook service directly to the public internet.
- Use a trusted certificate authority and a real domain in production instead of the local certificate.

## 14. Important Project Files

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Defines MySQL, Redis, both Node services, Tailwind, webhook, and Nginx. |
| `Dockerfile.accounts-site` | Builds the accounts and administration service, including Puppeteer dependencies. |
| `Dockerfile.public-site` | Builds the public website service. |
| `Dockerfile.tailwind` | Builds the one-off Tailwind asset generator. |
| `Dockerfile.webhook` | Builds the GitHub webhook service. |
| `mysql-init/b-schema.sql` | Creates the database schema on an empty MySQL volume. |
| `nginx/conf.d/default.conf` | Routes local HTTPS requests to internal services. |
| `certs/` | Local TLS certificate and private key used by Nginx. |

## 15. Hosted Deployment Reference

The original hosted deployment is available at [https://drivingwithdriversed.xyz/public/](https://drivingwithdriversed.xyz/public/). Local installations must use their own environment values and must not reuse credentials from that deployment.
