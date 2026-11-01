import { expectNoA11yViolations, renderWithProviders, screen, within } from '@repo/test-utils';
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
