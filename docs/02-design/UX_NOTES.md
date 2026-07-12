🔗 Частина роадмапи: [Етап 2 — Дизайн та UX](../00-roadmap/PROJECT_ROADMAP.md#етап-2-дизайн-та-ux)

# UX Notes

Нотатки з дизайну та UX. Дизайн-система реалізована в коді (`packages/ui`) — її можна вважати джерелом істини; формальних макетів (Figma) немає.

## Компоненти дизайн-системи


Дизайн-система живе в `@repo/ui` (`packages/ui/src`). Стек: **Shadcn UI + Radix UI + Tailwind CSS**, іконки — `lucide-react`.

**Примітиви (UI-kit):**
- `Button` (+ `buttonVariants`), `Input`, `Badge`
- `Card` (+ `CardHeader/Content/Footer/Title/Description`)
- `DropdownMenu` (повний набір Radix-підкомпонентів)
- `ScrollArea` / `ScrollBar`, `Separator`, `Skeleton`

**Доменні компоненти (кіно):**
- `MovieCard` — картка фільму (пропси мапляться через `mapTmdbToMovieCard`)
- `Hero` — головний банер
- `ContentRow` — горизонтальний ряд карток
- `FeaturedGrid` — сітка добірок («Editor's Picks»)
- `CategoryPills` — «пігулки» категорій/жанрів

**Каркас застосунку:**
- `Header`, `Footer`, `AppLayout` — оболонка сторінки
- `MfeContainer` — контейнер для MFE
- `ErrorBoundary` — межа обробки помилок (shell/module)
- `Providers` — обгортка з `QueryClientProvider` (React Query)

Утиліти: `cn` (склейка класів), `mapTmdbToMovieCard` (mapper TMDB → пропси картки).

## Тема та токени

Тема **dark-first**, побудована на CSS-змінних Tailwind (`packages/ui/src/styles/globals.css`). У компонентах використовуються семантичні токени, а не «сирі» кольори:
- поверхні: `bg-background`, `bg-secondary`, `bg-accent`
- текст: `text-foreground`, `text-muted-foreground`
- межі: `border-border`

Це дає узгодженість і теоретичну можливість світлої теми (у `globalStore` є `theme: 'light' | 'dark' | 'system'` та `setTheme`, але перемикач у UI ще не реалізований).

## Ізоляція стилів

Кожен MFE використовує **Tailwind-скоупінг з унікальними ID-префіксами**, щоб стилі одного MFE не конфліктували зі стилями іншого при завантаженні в спільну оболонку. Кожен застосунок має власний `styles/globals.css` та кореневий елемент (`#root`, `#mfe-pages-root` тощо).

## Макети

> ⬜ ⚠️ **потребує моєї участі.** Формальних макетів (Figma/Sketch) немає.
> Заповнити: посилання на дизайн-файли (якщо є), або зафіксувати, що джерело істини — реалізація в `@repo/ui`. За потреби — визначити дизайн-токени формально (палітра, типографіка, spacing).

## Стани UI

🟡 Частково уніфіковано:
- **Loading:** компонент `Skeleton` існує, але застосований не всюди — зокрема на **Home skeleton немає** (контент «стрибає» під час завантаження). Сторінки використовують Suspense (`fallback={<div>Loading...</div>}`) — грубий стан.
- **Empty:** реалізовано в **Movies** («No movies found» + кнопка «Clear filters»). На інших сторінках порожніх станів немає.
- **Error:** глобально через `ErrorBoundary` + сповіщення (`notification:show`) на серверні/мережеві помилки з `@repo/api`.

TODO: єдиний патерн loading/empty/error для всіх сторінок; замінити `<div>Loading...</div>` на Skeleton-екрани.

## Accessibility

> ⬜ Формального a11y-аудиту не проводилось.
- Використовуються семантичні елементи (`<main>`, `<h1>`, `<button type="button">`) і Radix-компоненти (мають вбудовану a11y-підтримку).
- Не перевірено: контраст у темній темі, навігація з клавіатури по всьому застосунку, ARIA для кастомних інтерактивних елементів (перемикач grid/compact у Movies), фокус-менеджмент.
- TODO: прогнати axe / Lighthouse, визначити цільовий рівень WCAG.
