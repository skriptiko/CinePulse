🔗 Роадмап і задачі — у [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Runbook

> **Статус: заглушка ⬜.** Більшість операційних процедур ще не відпрацьовано й не задокументовано. Заповнені лише пункти, підтверджені кодом/конфігом (деплой, секрети). Решта — TODO.

## Типові інциденти

> Для кожного інциденту заповнити: **симптоми → діагностика → дії → верифікація → післядія**. Зараз — каркас.

### TMDB proxy повертає 5xx
- **Симптоми:** сторінки без контенту; fallback with Retry on pages (`ApiError` of kind `server`).
- **Діагностика:** логи функції `tmdbProxy` (Firebase Console → Functions → Logs). The proxy answers with neutral statuses, so the logs tell the cause:
  - `502` + `upstream error` warning with `status: 401` → the token is invalid or revoked; set a new secret and redeploy the functions.
  - `502` + `upstream error` with 5xx, or `upstream request failed` (`TimeoutError`/`TypeError`) → TMDB is down or slow; check the TMDB status page.
  - `503` → TMDB rate limit (`429`); it clears by itself, CDN caching keeps repeats off TMDB.
  - `500 Proxy misconfigured` + `TMDB_API_READ_TOKEN is not configured` → the secret is missing for the deployed function.
  - `404`/`400` for a real client request → the endpoint or param is missing from the allowlist in `functions/src/proxy-rules.ts`.
- **Дії:** TODO.

### Remote MFE (remoteEntry) недоступний
- **Симптоми:** the remote's URLs show "This section is unavailable", other sections work; an `mfe:error` event; in dev, `console.error('Failed to load remote "<name>"')`.
- **Діагностика:** TODO — доступність `/pages-mfe/**` та `/user-mfe/**`; коректність rewrites; CORS-заголовок на `*.js`.
- **Дії:** TODO.

### Деплой впав
- **Симптоми:** червоний GitHub Actions run.
- **Діагностика:** TODO — крок, на якому впало (install / build / merge-dist / deploy); валідність `FIREBASE_SERVICE_ACCOUNT`.
- **Дії:** TODO; за потреби — [rollback](../06-deployment/CI_CD.md#rollback).

### Білий екран у production
- **Діагностика:** TODO — browser console, `remoteEntry.js` loading, whether `ShellBoundary` shows "Something went wrong".
- **Дії:** TODO.

## Процедура деплою вручну

**Hosting (з локальної машини):**
```bash
# збірка + merge dist + деплой лише hosting (production)
pnpm deploy
# еквівалент: pnpm build:deploy && firebase deploy --only hosting:production
```

**Functions (вручну):**
```bash
# predeploy збере функції автоматично (firebase.json)
firebase deploy --only functions
```

**Повний деплой:**
```bash
pnpm build:deploy && firebase deploy
```

> Потрібні: автентифікація Firebase CLI (`firebase login`) і доступ до проєкту `cinepulse-eec15`.

## Секрети

✅ Реальна конфігурація:

- **`TMDB_API_READ_TOKEN`** — TMDB Read Access Token.
  - **Локально:** кореневий `.env` (використовує Vite proxy). Не комітиться.
  - **Functions emulator:** `functions/.secret.local` (copy `functions/.secret.local.example` and put the token in it). Ignored by git (`*.local`) and by the functions deploy.
  - **Production:** Firebase Secret Manager, оголошений через `defineSecret('TMDB_API_READ_TOKEN')` у `functions/src/index.ts`.
  - **Встановити/оновити секрет:**
    ```bash
    firebase functions:secrets:set TMDB_API_READ_TOKEN
    ```
  - Після зміни секрету — передеплоїти функції.
- **`FIREBASE_SERVICE_ACCOUNT`, `GITHUB_TOKEN`** — секрети GitHub Actions (деплой). Керуються в налаштуваннях репозиторію.

## Контакти / ескалація

⚠️ **Потребує моєї участі.** TODO:
- [ ] Власник проєкту / on-call.
- [ ] Доступи (Firebase Console, GitHub, TMDB-акаунт).
- [ ] Канал сповіщень про інциденти.

## TODO операційної готовності
- [ ] Заповнити кроки діагностики/дій для кожного інциденту.
- [ ] Відпрацювати й зафіксувати процедуру rollback.
- [ ] Додати посилання на дашборди (див. [MONITORING](./MONITORING.md)).
- [ ] Визначити контакти та ескалацію.
