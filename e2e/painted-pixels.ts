import { expect, type Locator, type Page } from '@playwright/test';

export type Rgb = [red: number, green: number, blue: number];

type Spot = { x: number; y: number };

function toLinear(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function getLuminance([red, green, blue]: Rgb): number {
  return 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
}

export function getContrast(first: Rgb, second: Rgb): number {
  const luminances = [getLuminance(first), getLuminance(second)];
  return (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05);
}

/** The colours on screen at `spots`, in viewport pixels. */
export async function readPixels(page: Page, spots: Spot[]): Promise<Rgb[]> {
  const screenshot = await page.screenshot({ animations: 'disabled' });
  return page.evaluate(
    async ({ src, spots }) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      const canvas = new OffscreenCanvas(image.width, image.height);
      const context = canvas.getContext('2d');
      context?.drawImage(image, 0, 0);
      return spots.map(({ x, y }): Rgb => {
        const [red = 0, green = 0, blue = 0] =
          context?.getImageData(Math.round(x), Math.round(y), 1, 1).data ?? [];
        return [red, green, blue];
      });
    },
    { src: `data:image/png;base64,${screenshot.toString('base64')}`, spots }
  );
}

/** Focuses `target` as a keyboard does, in the middle of the screen, and returns its box. */
export async function focusByKeyboard(page: Page, target: Locator) {
  // A blur and a key first: `focus()` shows the ring only to someone using the keyboard, and does
  // nothing on a target that a press has already focused.
  await target.evaluate((element) => {
    if (element instanceof HTMLElement) element.blur();
  });
  await page.keyboard.press('Shift');
  await target.focus();
  return centerOnScreen(target);
}

/** Focus alone can leave the target at the edge of the screen, with its ring past it. */
async function centerOnScreen(target: Locator) {
  await target.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  const box = await target.boundingBox();
  if (!box) throw new Error('No target');
  return box;
}

/**
 * The lowest contrast between the pixels `near` and `far` px outside the box of `target`, a negative
 * distance being inside it. Painted pixels, not styles: a ring on a gradient has no one colour to
 * compute with.
 */
export async function getEdgeContrast(page: Page, target: Locator, near: number, far: number) {
  const { x, y, width, height } = await centerOnScreen(target);
  const [middleX, middleY, right, bottom] = [x + width / 2, y + height / 2, x + width, y + height];
  const spots = [near, far].flatMap((distance) => [
    { x: middleX, y: y - distance },
    { x: middleX, y: bottom + distance - 1 },
    { x: x - distance, y: middleY },
    { x: right + distance - 1, y: middleY },
  ]);

  const pixels = await readPixels(page, spots);

  const sides = pixels.length / 2;
  return Math.min(
    ...pixels.slice(0, sides).map((pixel, side) => {
      const farPixel = pixels[sides + side];
      if (!farPixel) throw new Error('No pixel');
      return getContrast(pixel, farPixel);
    })
  );
}

/** `getEdgeContrast` with `target` focused as by a keyboard, around `ringHolder` if not itself. */
export async function getRingContrast(
  page: Page,
  target: Locator,
  near: number,
  far: number,
  ringHolder = target
) {
  await focusByKeyboard(page, target);
  return getEdgeContrast(page, ringHolder, near, far);
}

export function expectRingToStandOut(page: Page, target: Locator) {
  return expect(getRingContrast(page, target, 2, 6)).resolves.toBeGreaterThanOrEqual(3);
}

/** For a ring inside the target: the control sits in a scroller, or against a neighbour. */
export function expectInsetRingToStandOut(page: Page, target: Locator) {
  return expect(getRingContrast(page, target, 0, -4)).resolves.toBeGreaterThanOrEqual(3);
}

/** 9:1 between the ring and its band leaves one of them at 3:1 on any colour of an image. */
export function expectTwoColoursOnImage(page: Page, target: Locator) {
  return expect(getRingContrast(page, target, 1, 4)).resolves.toBeGreaterThanOrEqual(9);
}
