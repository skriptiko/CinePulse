🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0015: A status write patches the cache and keeps its row

## Status

Accepted (2026-10-31). Builds on [ADR-0013](./ADR-0013-firestore-lite-watchlist-store.md).

## Context

CIN-27 adds a Watched or Planned switch to every row of the watchlist page and a filter by status. The status is one field of a title's item document, and the page holds one `items` query, so a title already has one status in all its folders.

Every read of `items` costs one read per title. A list of rows also differs from the folder forms of ADR-0013: many controls can be pressed in turn, a press needs no second step, and a filter can remove the row a person just changed. CIN-25 and CIN-26 both had real bugs of this family: a control moving under a double tap, and focus lost after a write.

## Decision

- **`setTitleStatus` writes `status` and nothing else.** `updateDoc` reads nothing, and a title deleted elsewhere is refused, not recreated.
- **One mutation per row.** `useTitleStatus` is page-local, as ADR-0013 keeps mutation hooks with the page. `variables` follows a single call, so one mutation for the list would lose the state of every row but the last.
- **The row shows the press, and the cache holds only what the server accepted.** A row shows `variables` while the write is pending. There is no `onMutate`, so a failure has nothing to roll back: pending ends and the stored value shows again. This stays true for any mix of success and failure across queued presses.
- **`scope: { id: titleId }` runs the writes of a title in order,** so the last press is the last write.
- **Success patches `items` from the write and does not refetch.** This deviates from engineering standards §7.5, because a refetch would cost a read of every title per press. A running or paused read is cancelled first, so that a read from before the commit cannot bring the old status back. It then runs again, as it can carry another change, such as a title just added, and so does a read that a failure left owing, because the patch marks `items` fresh. A failure does refetch: the title may be gone.
- **No `disabled` and no spinner.** A disabled control drops focus, and the press already shows.
- **A row changed under a filter stays until the folder or the filter changes.** If it left at once, the next row would move under the finger, and the second tap of a double tap would change that title. It also gives an undo in place. A kept row does not come back when the person returns to the filter.
- **The filter is `?status=`,** with pills as on Movies, so that it looks different from the control that writes. A press pushes a history entry, an unknown value reads as All, and a press on the chosen pill adds nothing. `getFolderSearch` keeps other params, so neither param knows the other, and a folder delete reads them when it lands, so a filter pressed during the delete stays.
- **In forced colours, a chosen segment or pill takes the system highlight.** Forced colours remove the fill and the ring, the only marks of the chosen state, and the row no longer prints its status as text. An outline would look like focus. The highlight needs `forced-color-adjust: none`, which also frees the focus ring from the system colours, so a chosen control draws its own inset ring.
- **Removing a title asks first and rereads `items`.** The title has one document, so `removeTitle` deletes it and it leaves every folder. A removal is rare, so it may cost a read of every title, and it reuses the lock and the focus handling of `useFolderWrite`. The cache is also patched, so the row does not wait for that read. The question sits below the controls, with Cancel focused, as a double tap must not reach the confirming button. One question is open at a time, as in the folder forms. The rows ignore pointer presses for 400 ms after a removal: they move up under the finger, and the second press of a double one changed the status of another title. Keyboard focus is free, as focus moves to the heading anyway. Focus goes there without scrolling, so a long list keeps its place. A status press during a slow delete can end in the error toast for a title that is gone as asked; that is accepted, as the switch is never disabled.
- **A closing folder form holds the section the same way.** The form goes on the first press of Cancel, so the pills and the rows move up under the finger, and where the toolbar wraps its buttons come back over the top of Cancel. The second press of a double one then changed the filter, opened a title or opened another form. `useDoublePressHold` serves both holds, and the page holds the whole section, the toolbar included, as `pointer-events` does not stop focus returning to the toolbar. The form closing on a landed write holds it too. The hold costs something: a real press in those 400 ms is lost as well, so it stays just longer than the pause within a double press. During a hold a press also moves no focus, as otherwise the second press would clear the focus the first one placed. The keyboard is not held.
- **`WATCH_STATUSES` and `STATUS_LABELS` stay in user-mfe.** A value on the entry of `@repo/firebase` would reach anonymous visitors.

## Alternatives considered

- **Reusing `useFolderWrite`:** it has one lock and one submit ref, and it refetches after each success.
- **Patching in `onMutate` with a rollback:** two presses and a failure can restore a value the server no longer has.
- **Refetching after every success, or marking `items` stale:** one read per title per press, or a later refetch that gains nothing while no read was running, as the cache already holds the written value.
- **Cancelling a running read without repeating it:** a title added in the picker stayed missing until a reload, with `items` marked fresh.
- **A one-button toggle:** a double tap undoes itself.
- **A `DropdownMenu` per row:** two presses for two values.
- **Moving focus to the next row under a filter:** the double-tap hazard stays.
- **A `ToggleGroup` as the filter:** it would look identical to the switch.
- **A `Show all` button in the empty state:** the All pill sits right above it, and a button that removes itself is another focus case. This departs from a SHOULD in standards §8.6.
- **A status in the folder picker:** a second write shape. A person adding a title they have seen goes through `Open watchlist`.

## Consequences

- The store chunk grows by about 0.02 kB, and host JS does not grow. The host stylesheet, which every visitor loads, grows by about 0.2 kB gzip. The watchlist page chunk grows from 3.9 to 13.7 kB gzip for Radix ToggleGroup, for signed-in visitors only.
- A kept row can contradict the filter on screen, and the count includes it. The state is local, so it is lost on leaving the page.
- Each row adds a Tab stop, so a movie row now takes two.
- A second tab keeps the old status until its next read.
- A write that lands during a read costs another read of every title. In a burst of presses each read is the running read for the next landing, so one overlap costs one read per landing while presses land faster than a read finishes. A cancelled read also still completes on the server, as `getItems` passes no abort signal. Repeating only after the last landing would need a mutation key and a marker for the owed read, which is not worth it for a burst.
- A failed press shows the generic toast, which names no title, and each failed press shows its own.
- A row remounted during a write shows the old value until the write lands.
- Whether Lite gives up on a write that hangs is unverified. The row would show the press until it does.
