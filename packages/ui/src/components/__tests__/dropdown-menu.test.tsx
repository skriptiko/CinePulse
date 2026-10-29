import { expectNoA11yViolations, renderWithProviders, screen } from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../dropdown-menu';

const OPTIONS = ['Popular', 'Newest', 'Rating'];

function SortMenu({ onValueChange }: { onValueChange: (value: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Sort by: Popular">Popular</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value="Popular" onValueChange={onValueChange}>
          {OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {option}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('DropdownMenu radio group', () => {
  it('marks the current value as checked and reports a new choice', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(<SortMenu onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: 'Sort by: Popular' }));

    expect(screen.getByRole('menuitemradio', { name: 'Popular' })).toHaveAttribute(
      'aria-checked',
      'true'
    );

    await user.click(screen.getByRole('menuitemradio', { name: 'Rating' }));

    expect(onValueChange).toHaveBeenCalledWith('Rating');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('has no structural a11y violations when open', async () => {
    const { user } = renderWithProviders(<SortMenu onValueChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Sort by: Popular' }));

    await expectNoA11yViolations(screen.getByRole('menu'));
  });
});
