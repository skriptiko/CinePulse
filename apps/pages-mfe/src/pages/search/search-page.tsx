import {
  AsyncBoundary,
  CardGridSkeleton,
  CategoryLinks,
  SectionErrorFallback,
  usePageMeta,
} from '@repo/ui';
import { CatalogHeader } from '../../components/catalog/catalog-header';
import { SearchForm } from './search-form';
import { SearchResults } from './search-results';
import { SEARCH_LABELS, SEARCH_TYPES, searchHref, useSearchState } from './use-search-state';

const PAGE_TITLE = 'Search';

export function Search() {
  const { query, type, submit } = useSearchState();
  usePageMeta(query === '' ? PAGE_TITLE : `${PAGE_TITLE}: ${query}`);

  const tabs = SEARCH_TYPES.map((option) => ({
    label: SEARCH_LABELS[option].tab,
    href: searchHref(query, option),
    isCurrent: option === type,
  }));

  return (
    <div className="pt-20 sm:pt-24">
      <CatalogHeader title={PAGE_TITLE} noun="movies, TV shows and people" />
      <SearchForm query={query} onSubmit={submit} />
      <CategoryLinks
        links={tabs}
        label="Search results by type"
        className="px-4 sm:px-6 md:px-6 lg:px-12"
      />

      <div className="px-4 pt-4 pb-16 sm:px-6 lg:px-12">
        {query === '' ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            What are you looking for? Enter a title or a name above.
          </p>
        ) : (
          // Its own boundary, so the form and the tabs stay on screen. A new key shows the skeleton
          // and not the last results, as navigation runs in a transition.
          <AsyncBoundary
            fallback={<CardGridSkeleton />}
            errorFallback={SectionErrorFallback}
            resetKeys={[query, type]}
            suspenseKey={`${type}:${query}`}
          >
            <SearchResults type={type} query={query} onClear={() => submit('')} />
          </AsyncBoundary>
        )}
      </div>
    </div>
  );
}
