import { randomUUID } from 'node:crypto';
import { expect, type Page } from '@playwright/test';

export async function signIn(page: Page) {
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  const popup = await popupPromise;
  const autogen = popup.locator('#autogen-button');
  // The emulator's widget ignores a click that lands before its script has run. One that lands can
  // still time out on a busy machine, with the form open and the button gone.
  await expect(async () => {
    if (!(await autogen.isVisible())) {
      await popup.locator('#add-account-button').click({ timeout: 1000 });
    }
    await expect(autogen).toBeVisible({ timeout: 1000 });
  }).toPass();
  await autogen.click();
  // The button draws from 100,000 emails, and a repeated one signs in to the same account, with
  // the data of the test that made it.
  await popup.locator('#email-input').fill(`${randomUUID()}@example.com`);
  await popup.locator('#sign-in').click();
}
