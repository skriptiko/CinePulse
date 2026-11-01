import { expectNoA11yViolations, renderWithProviders, screen } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { PersonCard, type PersonCardData } from '../person-card';

const PERSON: PersonCardData = {
  id: 1,
  name: 'Zendaya',
  department: 'Acting',
  photoUrl: 'https://image.tmdb.org/t/p/w185/zendaya.jpg',
  href: '/person/1',
};

describe('PersonCard', () => {
  it('links the name and the department to the page of the person', () => {
    renderWithProviders(<PersonCard person={PERSON} />);

    const link = screen.getByRole('link', { name: /Zendaya/ });
    expect(link).toHaveAttribute('href', '/person/1');
    expect(link).toHaveTextContent('Acting');
    expect(screen.getByRole('heading', { level: 3, name: 'Zendaya' })).toBeInTheDocument();
  });

  it('loads the photo lazily', () => {
    const { container } = renderWithProviders(<PersonCard person={PERSON} />);

    expect(container.querySelector('img')).toHaveAttribute('src', PERSON.photoUrl);
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
  });

  it('shows a placeholder without a photo', () => {
    const { container } = renderWithProviders(
      <PersonCard person={{ ...PERSON, photoUrl: null }} />
    );

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('leaves out a department TMDB does not know', () => {
    renderWithProviders(<PersonCard person={{ ...PERSON, department: null }} />);

    expect(screen.getByRole('link')).toHaveTextContent(/^Zendaya$/);
  });

  it('keeps a long unbroken name inside the card', () => {
    renderWithProviders(<PersonCard person={{ ...PERSON, name: 'x'.repeat(200) }} />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveClass('wrap-anywhere');
  });

  it('accepts a className', () => {
    renderWithProviders(<PersonCard person={PERSON} className="custom" />);

    expect(screen.getByRole('link')).toHaveClass('custom');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<PersonCard person={PERSON} />);

    await expectNoA11yViolations(container);
  });
});
