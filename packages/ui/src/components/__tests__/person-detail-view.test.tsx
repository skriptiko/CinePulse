import { expectNoA11yViolations, render, screen, within } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { type PersonDetailData, PersonDetailView } from '../person-detail-view';

const PERSON: PersonDetailData = {
  name: 'Zendaya',
  photoUrl: 'https://image.tmdb.org/t/p/h632/zendaya.jpg',
  department: 'Acting',
  born: 'Sep 1, 1996',
  died: 'Jan 2, 2090',
  birthplace: 'Oakland, California, USA',
  biography: 'An actress.',
};

describe('PersonDetailView', () => {
  it('shows the name, the department, the facts and the biography', () => {
    render(<PersonDetailView person={PERSON} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Zendaya' })).toBeInTheDocument();
    expect(screen.getByText('Acting')).toBeInTheDocument();
    expect(screen.getByText('Sep 1, 1996')).toBeInTheDocument();
    expect(screen.getByText('Jan 2, 2090')).toBeInTheDocument();
    expect(screen.getByText('Oakland, California, USA')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Biography' })).getByText('An actress.')
    ).toBeInTheDocument();
  });

  it('shows each fact only when it is present', () => {
    render(<PersonDetailView person={{ ...PERSON, died: null }} />);

    expect(screen.getByText('Born')).toBeInTheDocument();
    expect(screen.getByText('Place of birth')).toBeInTheDocument();
    expect(screen.queryByText('Died')).not.toBeInTheDocument();
  });

  it('leaves out the department and the whole list when TMDB knows nothing', () => {
    render(
      <PersonDetailView
        person={{ ...PERSON, department: null, born: null, died: null, birthplace: null }}
      />
    );

    expect(screen.queryByText('Acting')).not.toBeInTheDocument();
    expect(screen.queryByRole('term')).not.toBeInTheDocument();
  });

  it('shows the photo, or a placeholder without one', () => {
    const { container, rerender } = render(<PersonDetailView person={PERSON} />);

    expect(container.querySelector('img')).toHaveAttribute('src', PERSON.photoUrl);

    rerender(<PersonDetailView person={{ ...PERSON, photoUrl: null }} />);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('renders the sections below the hero block', () => {
    render(
      <PersonDetailView person={PERSON}>
        <p>A section</p>
      </PersonDetailView>
    );

    const heading = screen.getByRole('heading', { level: 1, name: 'Zendaya' });
    const section = screen.getByText('A section');
    expect(heading.compareDocumentPosition(section)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByRole('article').children).toHaveLength(2);
  });

  it('has no a11y violations', async () => {
    const { container } = render(<PersonDetailView person={PERSON} />);

    await expectNoA11yViolations(container);
  });
});
