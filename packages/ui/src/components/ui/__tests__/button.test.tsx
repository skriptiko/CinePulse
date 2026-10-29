import { renderWithProviders, screen } from '@repo/test-utils';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../button';

describe('Button', () => {
  it('defaults to type="button" so it never submits a form by accident', () => {
    renderWithProviders(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('passes the supported attributes and the ref to the DOM button', async () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    const { user } = renderWithProviders(
      <Button ref={ref} aria-label="Close dialog" onClick={onClick} className="extra">
        ×
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Close dialog' });
    await user.click(button);

    expect(onClick).toHaveBeenCalledOnce();
    expect(ref.current).toBe(button);
    expect(button).toHaveClass('extra');
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Button disabled onClick={onClick}>
        Save
      </Button>
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
