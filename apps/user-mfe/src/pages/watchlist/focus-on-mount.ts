/** A stable function: an inline one would run again on every keystroke. */
export function focusOnMount(element: HTMLElement | null): void {
  element?.focus();
}
