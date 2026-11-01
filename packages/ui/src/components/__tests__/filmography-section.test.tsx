import { expectNoA11yViolations, renderWithProviders, screen, within } from '@repo/test-utils';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { type FilmographyCreditData, FilmographySection } from '../filmography-section';

const CREDIT: FilmographyCreditData = {
  key: 'movie-1',
  year: '2021',
  title: 'Dune',
  roles: 'Chani, Producer',
  href: '/movies/1',
};

function buildCredits(count: number): FilmographyCreditData[] {
  return Array.from({ length: count }, (_, index) => ({
    ...CREDIT,
    key: `movie-${index}`,
    title: `Title ${index}`,
    href: `/movies/${index}`,
  }));
}

function Probes() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <div data-testid="location">{`${pathname}${search}`}</div>
      <button type="button" onClick={() => navigate(-1)}>
        Go back
      </button>
    </>
  );
}

/** The section on its page, one press from the page before it and from the titles it lists. */
function renderPages(route = '/') {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/" element={<Link to="/person/1">Open the person</Link>} />
        <Route path="/person/1" element={<FilmographySection credits={buildCredits(45)} />} />
        <Route path="/movies/:id" element={<p>A movie</p>} />
      </Routes>
      <Probes />
    </>,
    { route }
  );
}

function currentUrl(): string {
  return screen.getByTestId('location').textContent ?? '';
}

describe('FilmographySection', () => {
  it('shows a row with the year, the linked title and the roles', () => {
    renderWithProviders(<FilmographySection credits={[CREDIT]} />);

    const region = screen.getByRole('region', { name: 'Filmography' });
    const row = within(region).getByRole('listitem');
    expect(within(row).getByText('2021')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: 'Dune' })).toHaveAttribute('href', '/movies/1');
    expect(within(row).getByText('Chani, Producer')).toBeInTheDocument();
  });

  it('leaves out a year and roles it does not have', () => {
    renderWithProviders(<FilmographySection credits={[{ ...CREDIT, year: null, roles: null }]} />);

    expect(screen.getByRole('listitem')).toHaveTextContent(/^Dune$/);
  });

  it('shows no button for a list that fits', () => {
    renderWithProviders(<FilmographySection credits={buildCredits(30)} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(30);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the first 30 of a longer list and a button that names the count', () => {
    renderWithProviders(<FilmographySection credits={buildCredits(31)} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(30);
    expect(screen.getByRole('button', { name: 'Show all 31 credits' })).toBeInTheDocument();
  });

  it('shows the whole list on a press and moves focus to the first new row', async () => {
    const { user } = renderWithProviders(<FilmographySection credits={buildCredits(45)} />);

    await user.click(screen.getByRole('button', { name: 'Show all 45 credits' }));

    expect(screen.getAllByRole('listitem')).toHaveLength(45);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Title 30' })).toHaveFocus();
  });

  it('takes no focus before the press', () => {
    renderWithProviders(<FilmographySection credits={buildCredits(45)} />);

    expect(document.body).toHaveFocus();
  });

  it('keeps the open list in the URL and any other param beside it', async () => {
    const { user } = renderPages('/person/1?tab=a');

    await user.click(screen.getByRole('button', { name: 'Show all 45 credits' }));

    expect(currentUrl()).toBe('/person/1?tab=a&credits=all');
  });

  it('adds no history entry on a press, so Back leaves the page', async () => {
    const { user } = renderPages();
    await user.click(screen.getByRole('link', { name: 'Open the person' }));

    await user.click(screen.getByRole('button', { name: 'Show all 45 credits' }));
    expect(currentUrl()).toBe('/person/1?credits=all');
    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(currentUrl()).toBe('/');
  });

  it('opens with the whole list from the URL and takes no focus', () => {
    renderPages('/person/1?credits=all');

    expect(screen.getAllByRole('listitem')).toHaveLength(45);
    expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument();
    expect(document.body).toHaveFocus();
  });

  it('comes back open from a title, with no focus on the first new row', async () => {
    const { user } = renderPages('/person/1');
    await user.click(screen.getByRole('button', { name: 'Show all 45 credits' }));

    await user.click(screen.getByRole('link', { name: 'Title 40' }));
    expect(currentUrl()).toBe('/movies/40');
    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(currentUrl()).toBe('/person/1?credits=all');
    expect(screen.getAllByRole('listitem')).toHaveLength(45);
    expect(screen.getByRole('link', { name: 'Title 30' })).not.toHaveFocus();
  });

  it('counts any other value of the param as the short list', () => {
    renderPages('/person/1?credits=some');

    expect(screen.getAllByRole('listitem')).toHaveLength(30);
    expect(screen.getByRole('button', { name: 'Show all 45 credits' })).toBeInTheDocument();
  });

  it('shows a list that fits the same way with the param', () => {
    renderWithProviders(<FilmographySection credits={buildCredits(30)} />, {
      route: '/person/1?credits=all',
    });

    expect(screen.getAllByRole('listitem')).toHaveLength(30);
    expect(document.body).toHaveFocus();
  });

  it('does not carry the param on its links', () => {
    renderPages('/person/1?credits=all');

    expect(screen.getByRole('link', { name: 'Title 40' })).toHaveAttribute('href', '/movies/40');
  });

  it('keeps its heading and one line when there is nothing to list', () => {
    renderWithProviders(<FilmographySection credits={[]} />);

    const region = screen.getByRole('region', { name: 'Filmography' });
    expect(within(region).getByText('No credits listed.')).toBeInTheDocument();
    expect(within(region).queryByRole('list')).not.toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = renderWithProviders(<FilmographySection credits={buildCredits(31)} />);

    await expectNoA11yViolations(container);
  });
});
