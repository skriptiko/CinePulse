import { deleteAccount, getSignInErrorMessage } from '@repo/firebase';
import { ROUTE_PATHS } from '@repo/routes';
import { Button, Dialog, DialogContent } from '@repo/ui';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** Read by the login page, which then confirms the deletion instead of offering a sign-in. */
export type AccountDeletedState = { accountDeleted: true };

export function DeleteAccount() {
  const [isOpen, setIsOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button
        ref={openerRef}
        variant="outline"
        className="touch-target text-destructive"
        onClick={() => setIsOpen(true)}
      >
        Delete account
      </Button>
      {isOpen && (
        <DeleteAccountDialog
          onClose={() => setIsOpen(false)}
          onCloseAutoFocus={() => openerRef.current?.focus()}
        />
      )}
    </>
  );
}

type DeleteAccountDialogProps = {
  onClose: () => void;
  onCloseAutoFocus: () => void;
};

function DeleteAccountDialog({ onClose, onCloseAutoFocus }: DeleteAccountDialogProps) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  // Back on the button that failed, so Enter tries again.
  useEffect(() => {
    if (errorMessage !== null) deleteButtonRef.current?.focus();
  }, [errorMessage]);

  // No await before `deleteAccount`: the browser allows the Google popup only right after the press.
  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      if (!(await deleteAccount())) return;
      // The sign-out has already sent this page to the login page; this replaces that entry.
      const state: AccountDeletedState = { accountDeleted: true };
      navigate(ROUTE_PATHS.AUTH_LOGIN, { replace: true, state });
    } catch (error) {
      setErrorMessage(getSignInErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isDeleting) onClose();
  };

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent
        title="Delete your account?"
        description="This deletes your watchlist: every title, folder and status. It also removes your Google sign-in from CinePulse. You cannot undo this."
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <p className="text-sm">
          Google opens a window to check that it is you. Your theme stays on this device.
        </p>
        {errorMessage !== null && (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage}
          </p>
        )}
        <output className="sr-only">{isDeleting ? 'Deleting your account…' : ''}</output>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            ref={deleteButtonRef}
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete account'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
