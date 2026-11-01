import { describe, expect, it } from 'vitest';
import { parseSearchState, searchHref } from '../use-search-state';

function parse(search: string) {
  return parseSearchState(new URLSearchParams(search));
}

describe('parseSearchState', () => {
  it('reads the query and the type', () => {
    expect(parse('?q=dune&type=tv')).toEqual({ query: 'dune', type: 'tv' });
    expect(parse('?q=dune&type=person')).toEqual({ query: 'dune', type: 'person' });
  });

  it('searches movies with no type', () => {
    expect(parse('?q=dune')).toEqual({ query: 'dune', type: 'movie' });
  });

  it('counts an unknown type as movie', () => {
    expect(parse('?q=dune&type=books').type).toBe('movie');
    expect(parse('?q=dune&type=').type).toBe('movie');
  });

  it('counts a missing, empty or blank query as none', () => {
    expect(parse('').query).toBe('');
    expect(parse('?q=').query).toBe('');
    expect(parse('?q=%20%20').query).toBe('');
  });

  it('trims the query', () => {
    expect(parse('?q=%20dune%20').query).toBe('dune');
  });

  it('keeps an over-long query whole, so the proxy refuses it and the error shows', () => {
    const query = 'x'.repeat(101);

    expect(parse(`?q=${query}`).query).toBe(query);
  });
});

describe('searchHref', () => {
  it('leaves out what is at its default', () => {
    expect(searchHref('', 'movie')).toBe('/search');
    expect(searchHref('dune', 'movie')).toBe('/search?q=dune');
    expect(searchHref('', 'tv')).toBe('/search?type=tv');
  });

  it('names the type and keeps the query', () => {
    expect(searchHref('dune', 'person')).toBe('/search?q=dune&type=person');
  });

  it('encodes what a URL gives a meaning to, and reads it back', () => {
    const href = searchHref('fast & furious #9?', 'tv');
    const search = href.slice(href.indexOf('?'));

    expect(parse(search)).toEqual({ query: 'fast & furious #9?', type: 'tv' });
  });
});
