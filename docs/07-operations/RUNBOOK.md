🔗 Частина роадмапи: [Етап 7 — Операції](../00-roadmap/PROJECT_ROADMAP.md#етап-7-операції)

# Runbook

> **Статус: заглушка ⬜.** Більшість операційних процедур ще не відпрацьовано й не задокументовано. Заповнені лише пункти, підтверджені кодом/конфігом (деплой, секрети). Решта — TODO.

## Типові інциденти

> Для кожного інциденту заповнити: **симптоми → діагностика → дії → верифікація → післядія**. Зараз — каркас.

### TMDB proxy повертає 5xx
- **Симптоми:** сторінки без контенту; у клієнті сплив `notification:show` («Server error»).
- **Діагностика:** TODO — логи функції `tmdbProxy` (Firebase Console → Functions → Logs); перевірити валідність `TMDB_API_READ_TOKEN`; статус TMDB API.
- **Дії:** TODO.

### Remote MFE (remoteEntry) недоступний
- **Симптоми:** порожня зона контенту; спрацював module-level ErrorBoundary; у dev — `console.error('Failed to load remote routes')`.
- **Діагностика:** TODO — доступність `/pages-mfe/**` та `/user-mfe/**`; коректність rewrites; CORS-заголовок на `*.js`.
- **Дії:** TODO.

### Деплой впав
- **Симптоми:** червоний GitHub Actions run.
- **Діагностика:** TODO — крок, на якому впало (install / build / merge-dist / deploy); валідність `FIREBASE_SERVICE_ACCOUNT`.
- **Дії:** TODO; за потреби — [rollback](../06-deployment/CI_CD.md#rollback).

### Білий екран у production
- **Діагностика:** TODO — консоль браузера, завантаження remoteEntry, shell-level ErrorBoundary.
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
