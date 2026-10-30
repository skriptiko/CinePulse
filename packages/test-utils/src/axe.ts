import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Asserts that `container` has no structural a11y violations (roles, names, ARIA).
 * `color-contrast` is disabled: jsdom does not compute styles.
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const { violations } = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });

  expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}
