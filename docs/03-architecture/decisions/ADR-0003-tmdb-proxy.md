🔗 Роадмап і задачі — у [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0003: Проксі до TMDB замість прямих запитів з клієнта

## Статус

Accepted

## Контекст

Дані застосунку надходять із TMDB API, доступ до якого потребує токена (`TMDB_API_READ_TOKEN`). Якщо звертатись до TMDB напряму з браузера, токен неминуче потрапить у клієнтський бандл або мережеві запити, що є витоком секрету. Потрібен спосіб приховати токен, зберігши простий клієнтський код.

## Рішення

Увесь трафік до TMDB йде через **серверний проксі за відносним шляхом `/api/tmdb`**:

- **Продакшн:** Firebase Function `tmdbProxy` (`functions/src/index.ts`, `onRequest`). Токен читається через `defineSecret('TMDB_API_READ_TOKEN')`; функція переписує шлях (прибирає префікс `/api/tmdb`), додає `Authorization: Bearer <token>` і проксує на `https://api.themoviedb.org/3`. Rewrite `"/api/tmdb/**" → tmdbProxy` описано в `firebase.json`.
- **Hardening (CIN-52):** the function is a read-only, allowlisted proxy, not an open relay. The rules are pure functions in `functions/src/proxy-rules.ts` (unit-tested):
  - Methods: `GET` and `HEAD` only; anything else → `405` with `Allow: GET, HEAD`.
  - Paths: exactly what `@repo/api` calls — `/movie/{popular|top_rated|upcoming|now_playing}`, `/movie/{id}`, `/tv/{popular|top_rated|on_the_air|airing_today}`, `/tv/{id}`, `/trending/{all|movie|tv|person}/{day|week}`, `/search/{multi|movie|tv|person}`, `/genre/{movie|tv}/list`, `/person/{id}` (numeric ids). Anything else → `404`. A new endpoint in `@repo/api` must be added to the allowlist too.
  - Query: list/trending routes accept only `page` (integer 1..500); search routes require `query` (trimmed, 1..100 chars) plus optional `page`; detail and genre routes accept no params. Unknown, repeated or invalid params → `400` (rejected rather than dropped, so junk params cannot bust the CDN cache). The query string forwarded to TMDB is rebuilt from validated values.
  - Upstream errors are neutral and never forward TMDB bodies: TMDB `404` → `404`; `429` → `503` (+ numeric `Retry-After` if TMDB sent one); 5xx, other 4xx (e.g. `401` for a bad token), network failure or the 10 s upstream timeout → `502 { "error": "Upstream unavailable" }`. A missing token → `500 { "error": "Proxy misconfigured" }`.
  - `Cache-Control`: 2xx → `public, max-age=300, s-maxage=3600` (genre lists: `public, max-age=3600, s-maxage=86400`); every error → `no-store`. Firebase Hosting's CDN honours `s-maxage` for function rewrites, so repeated requests do not invoke the function.
  - `cors: false` (the browser reaches the function same-origin through the Hosting rewrite), `maxInstances: 2`. Logs go through `logger` from `firebase-functions` with the TMDB path and status only (no token, no search query).
  - Cost guard: besides `maxInstances` and CDN caching, a GCP budget alert is configured on the project.
- **Розробка:** Vite `server.proxy` у `apps/*/vite.config.ts` робить те саме локально, читаючи `TMDB_API_READ_TOKEN` з `.env` через `loadEnv`.
- **Клієнт** (`packages/api/src/core`) завжди звертається лише до `/api/tmdb/...` (`API_CONFIG.PROXY_BASE_URL`) і не знає про токен.

## Наслідки

**Плюси:**
- Токен ніколи не потрапляє на клієнт (ні в бандл, ні в запити браузера).
- Єдиний контракт `/api/tmdb` однаковий у dev і prod — клієнтський код не змінюється між середовищами.
- Централізована точка для кешування (CDN через `s-maxage`) і обмежень на боці проксі.

**Мінуси / компроміси:**
- Додатковий мережевий хоп (браузер → проксі → TMDB).
- Залежність від Firebase Functions (холодний старт, квоти).
- The allowlist duplicates the endpoint list of `@repo/api`: a new endpoint returns `404` in production until it is added to `functions/src/proxy-rules.ts` (the Vite dev proxy has no allowlist).
- Секрет потрібно окремо конфігурувати в кожному середовищі (`.env` for Vite and `functions/.secret.local` for the emulator locally, Firebase Secret у проді) — див. [RUNBOOK](../../07-operations/RUNBOOK.md#секрети).
