import { expectNoA11yViolations, renderWithProviders, screen, within } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { BiographySection } from '../biography-section';

const SHORT = 'An actress.';
const LONG = 'A long life. '.repeat(100).trim();

describe('BiographySection', () => {
  it('shows a short biography whole, with no toggle', () => {
    renderWithProviders(<BiographySection biography={SHORT} />);

    expect(screen.getByText(SHORT)).not.toHaveClass('line-clamp-6');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps the paragraph breaks of TMDB', () => {
    renderWithProviders(<BiographySection biography={'First.\n\nSecond.'} />);

    const text = screen.getByRole('region', { name: 'Biography' }).querySelector('p');

    expect(text?.textContent).toBe('First.\n\nSecond.');
    expect(text).toHaveClass('whitespace-pre-line');
  });

  it('renders markup as text', () => {
    renderWithProviders(<BiographySection biography="<b>Bold</b>" />);

    expect(screen.getByText('<b>Bold</b>')).toBeInTheDocument();
    expect(document.querySelector('b')).not.toBeInTheDocument();
  });

  it('clamps a long biography behind a toggle', async () => {
    const { user } = renderWithProviders(<BiographySection biography={LONG} />);
    const text = screen.getByText(LONG);
    const toggle = screen.getByRole('button', { name: 'Show more' });

    expect(text).toHaveClass('line-clamp-6');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(text).not.toHaveClass('line-clamp-6');
    expect(toggle).toHaveAccessibleName('Show less');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveFocus();

    await user.click(toggle);

    expect(text).toHaveClass('line-clamp-6');
    expect(toggle).toHaveAccessibleName('Show more');
  });

  it('keeps its heading and one line when TMDB has none', () => {
    renderWithProviders(<BiographySection biography={null} />);

    const region = screen.getByRole('region', { name: 'Biography' });
    expect(within(region).getByText('No biography yet.')).toBeInTheDocument();
    expect(within(region).queryByRole('button')).not.toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = renderWithProviders(<BiographySection biography={LONG} />);

    await expectNoA11yViolations(container);
  });
});
