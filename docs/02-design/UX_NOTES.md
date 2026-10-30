🔗 Роадмап і задачі — у [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# UX Notes

Нотатки з дизайну та UX. Дизайн-система реалізована в коді (`packages/ui`) — її можна вважати джерелом істини; формальних макетів (Figma) немає.

## Компоненти дизайн-системи


Дизайн-система живе в `@repo/ui` (`packages/ui/src`). Стек: **Shadcn UI + Radix UI + Tailwind CSS**, іконки — `lucide-react`.

**Примітиви (UI-kit):**
- `Button` (+ `buttonVariants`), `Input`
- `DropdownMenu` (`Trigger`, `Content`, `RadioGroup`, `RadioItem`)
- `Skeleton`

**Доменні компоненти (кіно):**
- `MovieCard` — картка фільму (UI-модель `MovieCardData` з `toMovieCardData` / `toTvCardData`)
- `Hero` — головний банер
- `ContentRow` — горизонтальний ряд карток
- `FeaturedGrid` — сітка добірок («Editor's Picks»)
- `CategoryPills` — «пігулки» категорій/жанрів

**Каркас застосунку:**
- `Header`, `Footer`, `AppLayout` — оболонка сторінки
- `PageBoundary` / `AsyncBoundary` (page and section loading + errors), `ShellBoundary` (host), `PageErrorFallback`, `NotFound`
- `PageSkeleton`, `MovieGridSkeleton` (pages) and `HeroSkeleton`, `ContentRowSkeleton`, `FeaturedGridSkeleton` (Home sections) — shown after 300 ms; `SectionErrorFallback` — inline error of one section

Утиліти: `cn` (склейка класів), мапери `to…Data` у `lib/mappers/` (TMDB → UI-моделі).

## Тема та токени

Тема **dark-first**, побудована на CSS-змінних Tailwind (`packages/ui/src/styles/globals.css`). У компонентах використовуються семантичні токени, а не «сирі» кольори:
- поверхні: `bg-background`, `bg-secondary`, `bg-accent`
- текст: `text-foreground`, `text-muted-foreground`
- межі: `border-border`

The theme lives in the shared store (`@repo/events`, `theme`: `light | dark | system`, default `dark`). The header toggle (`aria-pressed`) switches light/dark; `AppLayout` mirrors the resolved theme onto `<html class="dark">`, and `system` follows `prefers-color-scheme`. The choice is not persisted yet (Settings page, CIN-29).

## Ізоляція стилів

Кожен MFE використовує **Tailwind-скоупінг з унікальними ID-префіксами**, щоб стилі одного MFE не конфліктували зі стилями іншого при завантаженні в спільну оболонку. Кожен застосунок має власний `styles/globals.css` та кореневий елемент (`#root`, `#mfe-pages-root` тощо).

## Макети

> ⬜ ⚠️ **потребує моєї участі.** Формальних макетів (Figma/Sketch) немає.
> Заповнити: посилання на дизайн-файли (якщо є), або зафіксувати, що джерело істини — реалізація в `@repo/ui`. За потреби — визначити дизайн-токени формально (палітра, типографіка, spacing).

## Стани UI

🟡 Частково уніфіковано:
- **Loading:** every page or Home section suspends into a skeleton shaped like it. The layout is reserved at once and the skeleton appears after 300 ms, so fast loads do not flicker.
- **Empty:** реалізовано в **Movies** («No movies found» + кнопка «Clear filters»). На інших сторінках порожніх станів немає.
- **Error:** without data, the page boundary shows a plain message with **Try again** (404 → `NotFound`); the host's `ShellBoundary` catches the rest and keeps the header; a failed background refetch keeps the data and shows one toast (bottom right).
- **Offline:** one global banner at the bottom, "You are offline. Showing saved results."

- **Home sections** load and fail independently: each has its own skeleton (`HeroSkeleton`, `ContentRowSkeleton`, `FeaturedGridSkeleton`) and an inline `SectionErrorFallback` with **Try again**; one failed row never blanks the page. All requests start together (`usePrefetchQuery` in the page).

TODO: inline states for "Load more" (item 6.2).

## Accessibility

> ⬜ Формального a11y-аудиту не проводилось.
- Використовуються семантичні елементи (`<main>`, `<h1>`, `<button type="button">`) і Radix-компоненти (мають вбудовану a11y-підтримку).
- Не перевірено: контраст у темній темі, навігація з клавіатури по всьому застосунку, ARIA для кастомних інтерактивних елементів (перемикач grid/compact у Movies), фокус-менеджмент.
- TODO: прогнати axe / Lighthouse, визначити цільовий рівень WCAG.
