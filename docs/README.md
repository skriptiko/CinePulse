# CinePulse — Документація

Повний документаційний пакет проєкту: від вимог до продакшн-експлуатації.

> **Почни звідси:** [**PROJECT_ROADMAP.md**](./00-roadmap/PROJECT_ROADMAP.md) — центральний живий трекер прогресу. Усі інші документи деталізують його пункти. У ньому ж — [каталог сторінок і план розробки](./00-roadmap/PROJECT_ROADMAP.md#каталог-сторінок-і-план-розробки).

## Структура

| Розділ | Документ | Про що |
|--------|----------|--------|
| **00 · Роадмап** | [PROJECT_ROADMAP](./00-roadmap/PROJECT_ROADMAP.md) | Трекер прогресу по 7 етапах + каталог сторінок |
| **01 · Продукт** | [PRD](./01-product/PRD.md) · [GLOSSARY](./01-product/GLOSSARY.md) | Вимоги, цілі, персони, термінологія |
| **02 · Дизайн** | [UX_NOTES](./02-design/UX_NOTES.md) | Дизайн-система, тема, стани UI, a11y |
| **03 · Архітектура** | [ARCHITECTURE](./03-architecture/ARCHITECTURE.md) · [DATA_MODEL](./03-architecture/DATA_MODEL.md) · [API_SPEC](./03-architecture/API_SPEC.md) · [ADR](./03-architecture/decisions/) | MFE, монорепо, дані, API, рішення |
| **04 · Розробка** | [SETUP](./04-development/SETUP.md) · [CONVENTIONS](./04-development/CONVENTIONS.md) | Локальний запуск, код-конвенції |
| **05 · Тестування** | [TEST_STRATEGY](./05-testing/TEST_STRATEGY.md) | Піраміда тестів, інструменти, цілі |
| **06 · Деплой** | [CI_CD](./06-deployment/CI_CD.md) · [ENVIRONMENTS](./06-deployment/ENVIRONMENTS.md) | Пайплайн, середовища |
| **07 · Операції** | [RUNBOOK](./07-operations/RUNBOOK.md) · [MONITORING](./07-operations/MONITORING.md) | Інциденти, моніторинг |

## Як користуватись

- **Що зроблено і що далі?** → [PROJECT_ROADMAP](./00-roadmap/PROJECT_ROADMAP.md) (Summary + Наступні кроки).
- **Стан кожної сторінки?** → [Каталог сторінок](./00-roadmap/PROJECT_ROADMAP.md#каталог-сторінок-і-план-розробки).
- **Запустити локально?** → [SETUP](./04-development/SETUP.md).
- **Кожен документ 01–07** починається з рядка-посилання назад на відповідний етап роадмапи.

## Легенда статусів

✅ готово · 🟡 в процесі / частково · ⬜ не почато · ⚠️ потребує участі власника продукту (дані/рішення поза кодом)
