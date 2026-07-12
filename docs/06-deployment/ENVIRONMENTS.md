🔗 Частина роадмапи: [Етап 6 — Деплой та CI/CD](../00-roadmap/PROJECT_ROADMAP.md#етап-6-деплой-та-cicd)

# Середовища

Статус: **🟡** — є локальне dev і production; окремого staging / preview немає.

## Огляд

| Середовище | Де | Хостинг | TMDB-доступ | Статус |
|-----------|-----|---------|-------------|:---:|
| **Local dev** | локальна машина | Vite dev-servers (5000/5001/5002) | Vite proxy + `.env` | ✅ |
| **Production** | Firebase | Firebase Hosting `cinepulse-eec15` | Cloud Function `tmdbProxy` + Secret | ✅ |
| **Staging / Preview** | — | — | — | ⬜ немає |

## Local dev

Три Vite-сервери (Module Federation), запускаються разом через `pnpm dev` (Turbo):

| Застосунок | Роль | Порт |
|-----------|------|------|
| `@repo/host` | shell (оболонка) | 5000 |
| `@repo/pages-mfe` | remote: Home, Movies | 5001 |
| `@repo/user-mfe` | remote: Profile, Settings | 5002 |

- Порти фіксовані (`strictPort: true`).
- **TMDB у dev:** Vite proxy (`vite.config.ts`) перехоплює `/api/tmdb` → `https://api.themoviedb.org/3`, додаючи заголовок `Authorization: Bearer ${TMDB_API_READ_TOKEN}` з кореневого `.env`.
- Гібридний режим: вказати staging-адреси remote через `PAGES_MFE_URL` / `USER_MFE_URL` (див. [SETUP](../04-development/SETUP.md)).

## production

- **Firebase project:** `cinepulse-eec15` (з `.firebaserc`, default).
- **Hosting target:** `production` → сайт `cinepulse-eec15` (домен виду `https://cinepulse-eec15.web.app`).
- **Public dir:** `dist` (об'єднаний через `merge-dist.js`).
- **TMDB у prod:** Cloud Function `tmdbProxy` з токеном із Secret Manager (`defineSecret('TMDB_API_READ_TOKEN')`) — токен **не** потрапляє в клієнтський бандл.

**Rewrites (`firebase.json`):**
| Патерн | Призначення |
|--------|-------------|
| `/api/tmdb/**` | функція `tmdbProxy` |
| `/pages-mfe/**` | `/pages-mfe/index.html` |
| `/user-mfe/**` | `/user-mfe/index.html` |
| `**` | `/index.html` (SPA-fallback) |

**Headers:** `**/*.js` → `Access-Control-Allow-Origin: *` (потрібно для завантаження remoteEntry між MFE).

## Змінні оточення

| Змінна | Local dev | Production |
|--------|-----------|-----------|
| `TMDB_API_READ_TOKEN` | кореневий `.env`, використовується Vite proxy | Firebase Secret Manager (`defineSecret`) у функції |
| `PAGES_MFE_URL` | (опційно) staging-URL remote для гібридного dev | — |
| `USER_MFE_URL` | (опційно) staging-URL remote для гібридного dev | — |

> `.env` не комітиться. Приклад/інструкція — у кореневому `.env` (шаблон із коментарем).

## staging

⬜ **Немає окремого staging-середовища та PR-preview.** Деплой одразу в production на `push` у `main`.

**Рекомендація:** використати **Firebase Hosting preview channels**:
- Тимчасовий канал на кожен PR:
  ```bash
  firebase hosting:channel:deploy pr-<N> --expires 7d
  ```
- Або окремий постійний канал `staging` для інтеграційного тестування перед промоушеном у `live`.
- Інтегрувати в CI через `FirebaseExtended/action-hosting-deploy` з `channelId` замість `live` для не-`main` гілок.

**TODO:** визначити модель гілок → середовищ (напр. `develop` → staging-канал, `main` → production).
