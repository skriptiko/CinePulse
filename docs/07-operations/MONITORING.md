🔗 Roadmap and tasks are in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Monitoring and observability

> **Status: stub ⬜.** Active monitoring, error tracking and alerts are **not set up**. This document is a plan and an implementation checklist.

## What exists now

- **Firebase Hosting/Functions built-in metrics** — available in the Firebase Console (hosting traffic; for the `tmdbProxy` function: invocations, errors, latency, cold starts). Collected passively, but there is **no active observation/alerting**.
- **Function logs** — `tmdbProxy` logs through `logger` from `firebase-functions` (structured entries with severity): `error` for a missing token or a failed/timed-out upstream request, `warn` for a non-404 TMDB error status; fields are the TMDB path and status only (no token, no search query). Cloud Logging (Firebase Console → Functions → Logs).
- **Budget alert** — a GCP budget alert is configured on the project (cost guard for the Blaze plan, together with `maxInstances: 2` and CDN caching of proxy responses).
- **Client** — only `console.error` in dev mode (`App.tsx` when loading remote routes fails); in production client errors are **not collected anywhere**.
- **User-facing error notifications** — a toast when a background refetch or a mutation fails (`QueryCache` / `MutationCache.onError` → `notification:show` → sonner in the host).
- **Error reports** — every boundary, failed query/mutation and uncaught window error emits `error:report`; the host listener (`apps/host/src/error-channel/error-reporting.ts`) filters expected failures and logs the rest in development. Sending reports anywhere in production needs a vendor decision.

## Error tracking

⬜ **None.** Recommendation: connect an error tracking service.
- Add the SDK to `host` (and, if needed, to each MFE).
- Integrate with `ErrorBoundary` (`packages/ui`) — report errors caught at the shell/module levels.
- Listen to the `error:report` event in the host and report `ApiError` by `kind` (`server`, `network` separately), skipping 404 and aborts.
- Report remoteEntry loading failures (the `mfe:error` event already exists in `EventMap`).

## Logging

⬜ There is no structured logging.
- **Functions:** ✅ structured logs via `firebase-functions` `logger` with the TMDB path and status (CIN-52).
- **Client:** centralize through the error-tracking SDK instead of `console`.
- Define levels (error/warn/info) and what exactly to log (no PII and no TMDB token).

## Alerts and SLOs

⬜ ⚠️ **Needs my input** — SLOs/targets are not defined yet. TODO:
- [ ] Define SLOs (e.g. hosting availability, share of 5xx from `tmdbProxy`, p95 proxy latency).
- [ ] Set up alerts (Google Cloud Monitoring / error-tracking service alerts) on error and latency thresholds being exceeded.
- [ ] Notification channel (email / messenger) — align with [RUNBOOK → Contacts](./RUNBOOK.md#contacts--escalation).

## Implementation checklist
- [ ] Connect an error-tracking service (host + MFE), integrate with ErrorBoundary and `apiGet`.
- [x] Structured logs in `tmdbProxy`.
- [ ] Dashboard of key metrics (Hosting + Function).
- [ ] Define SLOs and thresholds.
- [ ] Set up alerts and a notification channel.
- [ ] (Optional) Web vitals / product analytics on the client.
