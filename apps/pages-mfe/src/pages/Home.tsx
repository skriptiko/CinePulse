import { useMovieGenres, useMovies, useSearchMovies } from '@repo/api';
import {
  Button,
  CategoryPills,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Footer,
  Header,
  Input,
  MovieCard,
  mapTmdbToMovieCard,
} from '@repo/ui';
import { ChevronDown, Grid3X3, LayoutGrid, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';

const sortOptions = ['Popular', 'Newest', 'Rating'];

function Home() {
  const [activeCategory, setActiveCategory] = useState<number | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Popular');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  const { data: genresData } = useMovieGenres();

  // Decide which query to use: search or discover
  const {
    data: moviesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = searchQuery ? useSearchMovies(searchQuery) : useMovies('popular');

  const categories = useMemo(() => {
    const list = genresData?.genres.map((g) => ({ id: g.id, name: g.name })) || [];
    return [{ id: 'All' as const, name: 'All' }, ...list];
  }, [genresData]);

  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);

  const filteredMovies = useMemo(() => {
    if (!moviesData) return [];

    // Combine all pages
    let allResults = moviesData.pages.flatMap((page) => page.results);

    // Filter by genre locally
    if (activeCategory !== 'All') {
      allResults = allResults.filter((movie) =>
        movie.genre_ids?.includes(activeCategory as number)
      );
    }

    // Sort locally
    const sorted = [...allResults];
    if (sortBy === 'Newest') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.release_date || '').getTime();
        const dateB = new Date(b.release_date || '').getTime();
        return dateB - dateA;
      });
    } else if (sortBy === 'Rating') {
      sorted.sort((a, b) => b.vote_average - a.vote_average);
    }

    return sorted;
  }, [moviesData, activeCategory, sortBy]);

  const handleCategoryChange = (categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName);
    if (category) {
      setActiveCategory(category.id);
    }
  };

  const activeCategoryName = useMemo(() => {
    return categories.find((c) => c.id === activeCategory)?.name || 'All';
  }, [categories, activeCategory]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="pt-20 sm:pt-24">
        {/* Page Header */}
        <div className="px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-2">Movies</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Explore our collection of movies
          </p>
        </div>

        {/* Filters Bar */}
        <div className="sticky top-16 sm:top-20 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-4 sm:px-6 lg:px-12 py-4">
            <div className="flex flex-col gap-4">
              {/* Search and Controls Row */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 bg-secondary border-0 rounded-lg"
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  {/* Sort Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" className="rounded-lg gap-2 h-10">
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">{sortBy}</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {sortOptions.map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onClick={() => setSortBy(option)}
                          className={sortBy === option ? 'bg-accent' : ''}
                        >
                          {option}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* View Toggle */}
                  <div className="flex items-center rounded-lg bg-secondary p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-background text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('compact')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'compact'
                          ? 'bg-background text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Pills */}
              <CategoryPills
                categories={categoryNames}
                defaultCategory={activeCategoryName}
                onChange={handleCategoryChange}
                className="px-0 -mx-4 sm:mx-0 sm:px-0"
              />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="px-4 sm:px-6 lg:px-12 py-4">
          <p className="text-sm text-muted-foreground">
            {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'} found
            {activeCategory !== 'All' && ` in ${activeCategoryName}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* Movies Grid */}
        <div className="px-4 sm:px-6 lg:px-12 pb-16">
          {filteredMovies.length > 0 ? (
            <>
              <div
                className={`grid gap-3 sm:gap-4 lg:gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                    : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'
                }`}
              >
                {filteredMovies.map((movie) => {
                  const props = mapTmdbToMovieCard(movie);
                  return <MovieCard key={movie.id} {...props} />;
                })}
              </div>

              {hasNextPage && (
                <div className="flex justify-center mt-12">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-full px-8"
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No movies found</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Try adjusting your search or filter to find what you&apos;re looking for.
              </p>
              <Button
                variant="secondary"
                className="mt-4 rounded-lg"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
