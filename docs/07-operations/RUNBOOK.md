🔗 Roadmap and tasks are in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Runbook

> **Status: stub ⬜.** Most operational procedures have not been worked out or documented yet. Only items confirmed by code/config (deployment, secrets) are filled in. The rest is TODO.

## Common incidents

> For each incident, fill in: **symptoms → diagnosis → actions → verification → follow-up**. For now this is a skeleton.

### TMDB proxy returns 5xx
- **Symptoms:** pages without content; fallback with Retry on pages (`ApiError` of kind `server`).
- **Diagnosis:** `tmdbProxy` function logs (Firebase Console → Functions → Logs). The proxy answers with neutral statuses, so the logs tell the cause:
  - `502` + `upstream error` warning with `status: 401` → the token is invalid or revoked; set a new secret and redeploy the functions.
  - `502` + `upstream error` with 5xx, or `upstream request failed` (`TimeoutError`/`TypeError`) → TMDB is down or slow; check the TMDB status page.
  - `503` → TMDB rate limit (`429`); it clears by itself, CDN caching keeps repeats off TMDB.
  - `500 Proxy misconfigured` + `TMDB_API_READ_TOKEN is not configured` → the secret is missing for the deployed function.
  - `404`/`400` for a real client request → the endpoint or param is missing from the allowlist in `functions/src/proxy-rules.ts`.
- **Actions:** TODO.

### Remote MFE (remoteEntry) unavailable
- **Symptoms:** the remote's URLs show "This section is unavailable", other sections work; an `mfe:error` event; in dev, `console.error('Failed to load remote "<name>"')`.
- **Diagnosis:** TODO — reachability of `/pages-mfe/**` and `/user-mfe/**`; correctness of rewrites; CORS header on `*.js`.
- **Actions:** TODO.

### Deployment failed
- **Symptoms:** a red GitHub Actions run.
- **Diagnosis:** TODO — the step that failed (install / build / merge-dist / deploy); validity of `FIREBASE_SERVICE_ACCOUNT`.
- **Actions:** TODO; if needed, [rollback](../06-deployment/CI_CD.md#rollback).

### White screen in production
- **Diagnosis:** TODO — browser console, `remoteEntry.js` loading, whether `ShellBoundary` shows "Something went wrong".
- **Actions:** TODO.

## Manual deploy procedure

**Hosting (from a local machine):**
```bash
# build + merge dist + deploy hosting only (production)
pnpm deploy
# equivalent: pnpm build:deploy && firebase deploy --only hosting:production
```

**Functions (manually):**
```bash
# predeploy builds the functions automatically (firebase.json)
firebase deploy --only functions
```

**Full deploy:**
```bash
pnpm build:deploy && firebase deploy
```

> Required: Firebase CLI authentication (`firebase login`) and access to the `cinepulse-eec15` project.

## Secrets

✅ Actual configuration:

- **`TMDB_API_READ_TOKEN`** — TMDB Read Access Token.
  - **Locally:** root `.env` (used by the Vite proxy). Not committed.
  - **Functions emulator:** `functions/.secret.local` (copy `functions/.secret.local.example` and put the token in it). Ignored by git (`*.local`) and by the functions deploy.
  - **Production:** Firebase Secret Manager, declared via `defineSecret('TMDB_API_READ_TOKEN')` in `functions/src/index.ts`.
  - **Set/update the secret:**
    ```bash
    firebase functions:secrets:set TMDB_API_READ_TOKEN
    ```
  - After changing the secret, redeploy the functions.
- **`FIREBASE_SERVICE_ACCOUNT`, `GITHUB_TOKEN`** — GitHub Actions secrets (deployment). Managed in the repository settings.

## Contacts / escalation

⚠️ **Needs my input.** TODO:
- [ ] Project owner / on-call.
- [ ] Access (Firebase Console, GitHub, TMDB account).
- [ ] Incident notification channel.

## Operational readiness TODO
- [ ] Fill in diagnosis/action steps for each incident.
- [ ] Work out and record the rollback procedure.
- [ ] Add links to dashboards (see [MONITORING](./MONITORING.md)).
- [ ] Define contacts and escalation.
