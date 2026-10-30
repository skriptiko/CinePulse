🔗 Роадмап і задачі — у [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Моніторинг та спостережуваність

> **Статус: заглушка ⬜.** Активного моніторингу, error tracking та алертів **не налаштовано**. Цей документ — план і чеклист впровадження.

## Що є зараз

- **Firebase Hosting/Functions вбудовані метрики** — доступні у Firebase Console (трафік хостингу; для функції `tmdbProxy` — кількість викликів, помилки, латентність, холодні старти). Пасивно збираються, але **активного спостереження/алертів немає**.
- **Логи функції** — `tmdbProxy` logs through `logger` from `firebase-functions` (structured entries with severity): `error` for a missing token or a failed/timed-out upstream request, `warn` for a non-404 TMDB error status; fields are the TMDB path and status only (no token, no search query). Cloud Logging (Firebase Console → Functions → Logs).
- **Budget alert** — a GCP budget alert is configured on the project (cost guard for the Blaze plan, together with `maxInstances: 2` and CDN caching of proxy responses).
- **Клієнт** — лише `console.error` у dev-режимі (`App.tsx` при збої завантаження remote-роутів); у production клієнтські помилки **ніде не збираються**.
- **User-facing error notifications** — a toast when a background refetch or a mutation fails (`QueryCache` / `MutationCache.onError` → `notification:show` → sonner in the host).
- **Error reports** — every boundary, failed query/mutation and uncaught window error emits `error:report`; the host listener (`apps/host/src/error-channel/error-reporting.ts`) filters expected failures and logs the rest in development. Sending reports anywhere in production needs a vendor decision.

## Error tracking

⬜ **Немає.** Рекомендація: підключити сервіс error tracking.
- Підключити SDK у `host` (і, за потреби, в кожен MFE).
- Інтегрувати з `ErrorBoundary` (`packages/ui`) — репортити перехоплені помилки shell/module рівнів.
- Listen to the `error:report` event in the host and report `ApiError` by `kind` (`server`, `network` separately), skipping 404 and aborts.
- Репортити збій завантаження remoteEntry (подія `mfe:error` вже є в `EventMap`).

## Логування

⬜ Структурованого логування немає.
- **Функції:** ✅ structured logs via `firebase-functions` `logger` with the TMDB path and status (CIN-52).
- **Клієнт:** централізувати через error-tracking SDK замість `console`.
- Визначити рівні (error/warn/info) і що саме логувати (без PII та без TMDB-токена).

## Алерти та SLO

⬜ ⚠️ **Потребує моєї участі** — SLO/цілі ще не визначені. TODO:
- [ ] Визначити SLO (напр.: доступність хостингу, частка 5xx від `tmdbProxy`, p95-латентність проксі).
- [ ] Налаштувати алерти (Google Cloud Monitoring / алерти error-tracking сервісу) на перевищення порогів помилок і латентності.
- [ ] Канал сповіщень (email / месенджер) — узгодити з [RUNBOOK → Контакти](./RUNBOOK.md#контакти--ескалація).

## Чеклист впровадження
- [ ] Підключити error-tracking сервіс (host + MFE), інтегрувати з ErrorBoundary та `apiGet`.
- [x] Структуровані логи у `tmdbProxy`.
- [ ] Дашборд ключових метрик (Hosting + Function).
- [ ] Визначити SLO та пороги.
- [ ] Налаштувати алерти й канал сповіщень.
- [ ] (Опційно) Web-vitals / продуктова аналітика на клієнті.
