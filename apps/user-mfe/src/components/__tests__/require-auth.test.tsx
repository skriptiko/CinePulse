import { type AuthStatus, globalStore } from '@repo/events';
import { ROUTE_PATHS } from '@repo/routes';
import { renderWithProviders, screen } from '@repo/test-utils';
import { Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { RequireAuth } from '../require-auth';

function LoginProbe() {
  const { state } = useLocation();
  return <p>login, back to {state?.from}</p>;
}

function renderProtected(authStatus: AuthStatus, route: string = ROUTE_PATHS.USER_PROFILE) {
  globalStore.setState({ authStatus });
  return renderWithProviders(
    <Routes>
      <Route
        path={ROUTE_PATHS.USER_PROFILE}
        element={
          <RequireAuth>
            <p>secret</p>
          </RequireAuth>
        }
      />
      <Route path={ROUTE_PATHS.AUTH_LOGIN} element={<LoginProbe />} />
    </Routes>,
    { route }
  );
}

describe('RequireAuth', () => {
  afterEach(() => globalStore.setState({ user: null, authStatus: 'anonymous' }));

  it('renders the page for a signed-in user', () => {
    renderProtected('authenticated');

    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('sends an anonymous visitor to the login page and remembers the target', () => {
    renderProtected('anonymous');

    expect(screen.getByText('login, back to /user/profile')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('remembers the query string of the target', () => {
    renderProtected('anonymous', `${ROUTE_PATHS.USER_PROFILE}?folder=top`);

    expect(screen.getByText('login, back to /user/profile?folder=top')).toBeInTheDocument();
  });

  it('waits while the session is being restored', () => {
    renderProtected('loading');

    expect(screen.queryByText('secret')).not.toBeInTheDocument();
    expect(screen.queryByText(/^login/)).not.toBeInTheDocument();
  });
});
