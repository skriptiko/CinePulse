🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0014: Add to watchlist through a dialog loaded on press

## Status

Accepted (2026-10-31). Builds on [ADR-0013](./ADR-0013-firestore-lite-watchlist-store.md).

## Context

CIN-26 puts a button on every `MovieCard` and on the details page, so that code sits on the first load of anonymous visitors. The host budget has 0.07 kB left, and pages-mfe chunks are in no budget, so nothing stops a catalog page from growing.

Measured gzip JS of Home from pages-mfe, before the shared singletons: about 24.8 kB today, 58.9 kB with a static `DropdownMenu`, 42.3 kB with a static `Dialog`.

A saved title has two write shapes under rules: a create needs `addedAt == request.time`, and an update needs `addedAt` unchanged. Only the current document says which one applies.

## Decision

- **`AddToWatchlist` is one button, with nothing else static.** It imports `./watchlist-dialog` on the press and adds 1.5 kB to a catalog page. It reads no auth state, so one component covers every state.
- **`import()` in the handler, not `lazy`.** A rejected `lazy` reaches the nearest boundary, which is a whole Home row or the Movies page. A failed `import()` goes through `vite:preloadError`: online, the first failure is the stale-deploy reload and a repeat within its cooldown is a toast; offline, `handlePreloadError` skips the reload, which could only land on the browser's error page, so the first failure is the toast.
- **One dialog at a time.** A module-level flag in `add-to-watchlist.tsx` ignores other presses during a download. Two modals would hide each other from assistive technology.
- **A Radix `Dialog`, not a menu.** Checkboxes with a save button are not a menu, and a trigger we own has no `pointerdown` opening, which starts a scroll on a phone. `@radix-ui/react-dialog` is a new dependency that shares its internals with the dropdown menu.
- **A press outside does not close it, and it has its own close button.** The second press of a double tap lands on the overlay, and a stray press must not lose the ticks.
- **The dialog takes focus itself, and the picker is no `<form>`.** Radix focuses once, on mount, when a first open still shows the skeleton, so focusing the first control would differ between a first and a cached open. On the dialog, a repeated Enter from the opener does nothing and a screen reader reads the title and description. Without a form, Enter on a checkbox does nothing either, so only the button saves. No UI removes a title yet, so an accidental add would stay.
- **The offer to sign in is a state of the dialog.** While a known session restores, the dialog waits and then becomes the picker or the offer, so the press is kept. A visitor can decline and stay on the page.
- **`saveTitle` reads, then creates or writes transforms.** `getDoc` picks the shape; a stored title gets `arrayUnion` and `arrayRemove` on `folderIds` only. Both go in one batch when one save does both, because one write cannot hold two transforms of a field. An added folder is first checked against a fresh read of the folders, as `moveFolder` does, because the picker's list can be five minutes old and a dangling id has no row to untick.
- **The picker reads `watchlistQueries.items`.** Ticks need no new query or store function. The save sends what changed, so stale ticks cannot drop a folder added elsewhere.
- **The mutation stays with the dialog,** as ADR-0013 keeps mutation hooks with the page. `onSettled` invalidates `watchlistQueries.all(uid)` with `refetchType: 'all'`: the dialog closes on success and `items` has no observer by then, and after a save refused over a deleted folder, its row must go before a retry. The picker ignores a choice whose folder is gone.

## Alternatives considered

- **`DropdownMenu` with `CheckboxItem`:** no new dependency, but 33.4 kB more on anonymous Home, and it needs a `pointerdown` workaround on touch.
- **`runTransaction`:** retries a lost create on the emulator, but the store reaches 38.57 kB against a 38 kB budget, and the outcome on a real project is unverified: rules may refuse the commit before its precondition does.
- **A `watchlistQueries.item` factory:** one read instead of one per title, for 0.02 kB of the 0.07 kB the host had left.
- **A sign-in link in place of the button:** opens no chunk, but a bookmark that leaves the page is no offer, and each card would read auth state.
- **Resuming the add after sign-in:** needs an untyped contract between `Login` and the catalog. `Login` already returns to the page.
- **Creating a folder in the dialog:** the ticket asks for a choice of folders, and the watchlist page creates them.

## Consequences

- The store chunk grows to 35.96 kB of its 38 kB. The host grows to 207.96 kB, because the offline guard and `aria-haspopup` on `Button` are static, which leaves 0.04 kB.
- The first press downloads about 16 kB of Radix and dialog code, also for an anonymous visitor; the button shows a spinner meanwhile. A signed-in visitor then loads the store and reads folders and titles.
- A picker that opens stale costs one read per folder and per title, and so does the refetch after every save. A save that adds a folder also reads the folders once. That is the cost ADR-0013 accepts for the watchlist page, now paid per save. An `item` factory is the way out, with a recorded budget move.
- A folder deleted elsewhere since the picker's read shows the generic error toast, as a stale move does. The list then refreshes, the row goes, and saving again works.
- A title past the 100 entries of `folderIds` is refused by the rules and shows the generic toast. It takes more than 100 ticked folders on one title, so it has no message of its own.
- Two tabs creating one new title at once: the second gets the generic error toast, keeps its ticks, and saving again works, because the failure refreshes the list.
- A batch with two writes to one document is verified on the emulator only. It is also the rare path, since only a save that both adds and removes takes it. A refusal would leave the data unchanged and show the toast. Check it once after deploy.
- A press that lands on the dialog's submit button after a double tap adds the title with no folder, and no UI removes a title yet.
- `e2e` covers the singleton and the chunk order, and it runs only on PRs into `main`, so run `pnpm test:e2e` locally before merging.
