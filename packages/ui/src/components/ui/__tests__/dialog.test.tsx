import { expectNoA11yViolations, renderWithProviders, screen } from '@repo/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { Dialog, DialogContent } from '../dialog';

function renderDialog(onOpenChange = vi.fn(), onCloseAutoFocus = vi.fn()) {
  return renderWithProviders(
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent
        title="Add Dune"
        description="Pick folders"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <button type="button">Save</button>
      </DialogContent>
    </Dialog>
  );
}

describe('Dialog', () => {
  it('names the dialog by its title and description', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog', { name: 'Add Dune' });
    expect(dialog).toHaveAccessibleDescription('Pick folders');
  });

  it('asks to close on Escape', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderDialog(onOpenChange);

    await user.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes from its button and stays open on a press outside', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderDialog(onOpenChange);

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    if (overlay === null) throw new Error('No overlay');
    await user.click(overlay);
    expect(onOpenChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('focuses the dialog itself, and Tab reaches its content before the close button', async () => {
    const { user } = renderDialog();

    expect(screen.getByRole('dialog')).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
  });

  it('has no structural a11y violations', async () => {
    renderDialog();

    await expectNoA11yViolations(screen.getByRole('dialog'));
  });
});
