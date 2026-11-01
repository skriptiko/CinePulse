import { expect, type Page } from '@playwright/test';

export async function signIn(page: Page) {
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  const popup = await popupPromise;
  // The emulator's widget ignores a click that lands before its script has run.
  await expect(async () => {
    await popup.locator('#add-account-button').click({ timeout: 1000 });
    await expect(popup.locator('#autogen-button')).toBeVisible({ timeout: 1000 });
  }).toPass();
  await popup.locator('#autogen-button').click();
  await popup.locator('#sign-in').click();
}
