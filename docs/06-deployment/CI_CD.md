🔗 Частина роадмапи: [Етап 6 — Деплой та CI/CD](../00-roadmap/PROJECT_ROADMAP.md#етап-6-деплой-та-cicd)

# CI/CD

Автоматичний деплой на Firebase Hosting (+ Cloud Functions) через GitHub Actions. Статус етапу: **🟡 частково** — деплой працює, але немає quality gates і документованого rollback.

## GitHub Actions

Пайплайн: [`.github/workflows/firebase-deploy.yml`](../../.github/workflows/firebase-deploy.yml).

- **Тригер:** `push` у гілку `main`.
- **Runner:** `ubuntu-latest`, Node.js `20`.
- **Кроки:**
  1. `actions/checkout@v4`.
  2. `pnpm/action-setup@v4` — pnpm `9.15.4`.
  3. `actions/setup-node@v4` — Node `20`, кеш `pnpm`.
  4. `pnpm install --frozen-lockfile`.
  5. `pnpm build` — Turbo збирає всі застосунки й пакети.
  6. `node scripts/merge-dist.js` — об'єднання `dist/` (див. нижче).
  7. `FirebaseExtended/action-hosting-deploy@v0` — деплой на `projectId: cinepulse-eec15`, `target: production`, `channelId: live`.

**Секрети GitHub:**

| Секрет | Призначення |
|--------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | Service account для деплою на Firebase |
| `GITHUB_TOKEN` | Стандартний токен Actions (`repoToken`) |

> ⚠️ Workflow деплоїть лише **hosting**. Деплой Cloud Functions наразі виконується вручну (див. [RUNBOOK](../07-operations/RUNBOOK.md#процедура-деплою-вручну)) або спрацьовує через `firebase deploy` локально.

## Функції (Functions)

Firebase Function `tmdbProxy` ([`functions/src/index.ts`](../../functions/src/index.ts)) — проксі до TMDB.

- Джерело: `functions` (з `firebase.json`), codebase `default`.
- **Predeploy hook:** `pnpm --filter @repo/functions build` — функції збираються перед деплоєм.
- Секрет `TMDB_API_READ_TOKEN` — через `defineSecret` (Firebase Secret Manager), не в коді.
- Rewrite `/api/tmdb/**` → функція `tmdbProxy` (з `firebase.json`).

## Збірка і merge

Кожен застосунок (`host`, `pages-mfe`, `user-mfe`) збирається у власний `dist/`. Оскільки Firebase Hosting віддає єдину теку `dist` (з `firebase.json`), скрипт [`scripts/merge-dist.js`](../../scripts/merge-dist.js) об'єднує їх:

- очищає/створює кореневий `/dist`;
- `apps/host/dist` → корінь `/dist` (shell-застосунок);
- `apps/pages-mfe/dist` → `/dist/pages-mfe`;
- `apps/user-mfe/dist` → `/dist/user-mfe`.

Rewrites у `firebase.json` спрямовують `/pages-mfe/**` і `/user-mfe/**` на відповідні `index.html`, решту — на SPA-fallback `/index.html`.

**Локальні скрипти деплою** (`package.json`):
- `pnpm build:deploy` = `pnpm build && pnpm merge-dist`.
- `pnpm deploy` = `pnpm build:deploy && firebase deploy --only hosting:production`.

## Quality gates

⬜ **Наразі відсутні** — пайплайн не запускає lint / typecheck / test перед деплоєм.

**Рекомендований блок кроків** (додати перед деплоєм або окремим workflow на `pull_request`):
```yaml
- name: Lint
  run: pnpm lint
- name: Typecheck
  run: pnpm typecheck
- name: Test
  run: pnpm test        # після впровадження тестів (див. TEST_STRATEGY)
```
Деплой на `main` має бути **заблокований** до проходження цих кроків (branch protection + required checks). Див. [TEST_STRATEGY → CI-інтеграція](../05-testing/TEST_STRATEGY.md#ci-інтеграція).

## Rollback

⬜ **Не задокументовано.** Рекомендований підхід через Firebase Hosting (кожен деплой = окремий реліз):

- **Через консоль:** Firebase Console → Hosting → історія релізів → обрати попередній справний → «Rollback».
- **Через CLI (орієнтовно):**
  ```bash
  firebase hosting:clone cinepulse-eec15:live:<PREV_VERSION> cinepulse-eec15:live
  ```
- **Через Git:** `revert` проблемного коміту в `main` → пайплайн задеплоїть попередній стан.

**TODO:** зафіксувати перевірену процедуру rollback і додати її в [RUNBOOK](../07-operations/RUNBOOK.md).
