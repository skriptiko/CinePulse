import axe from 'axe-core';
import { expect } from 'vitest';

/** WCAG 2.2 A and AA, the product target, plus the axe best practices the tests ran before. */
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

/**
 * Asserts that `container` has no structural a11y violations (roles, names, ARIA).
 * `color-contrast` and `target-size` are disabled: jsdom computes neither styles nor layout,
 * so the browser run in `e2e/a11y.spec.ts` checks both.
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const { violations } = await axe.run(container, {
    runOnly: { type: 'tag', values: AXE_TAGS },
    rules: {
      'color-contrast': { enabled: false },
      'target-size': { enabled: false },
    },
  });

  expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}
