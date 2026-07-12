"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/cinepulse/header"
import { Footer } from "@/components/cinepulse/footer"
import { MovieCard } from "@/components/cinepulse/movie-card"
import { CategoryPills } from "@/components/cinepulse/category-pills"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  SlidersHorizontal, 
  Grid3X3, 
  LayoutGrid,
  ChevronDown
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Sample movie data
const allMovies = [
  { id: 1, title: "Stellar Odyssey", imageUrl: "/images/posters/poster-1.jpg", year: "2024", rating: "PG-13", duration: "2h 28m", genre: "Sci-Fi" },
  { id: 2, title: "Shattered Reflections", imageUrl: "/images/posters/poster-2.jpg", year: "2024", rating: "R", duration: "1h 52m", genre: "Thriller" },
  { id: 3, title: "Lost Temple", imageUrl: "/images/posters/poster-3.jpg", year: "2023", rating: "PG-13", duration: "2h 15m", genre: "Action" },
  { id: 4, title: "Midnight Rain", imageUrl: "/images/posters/poster-4.jpg", year: "2024", rating: "R", duration: "1h 48m", genre: "Romance" },
  { id: 5, title: "The Manor", imageUrl: "/images/posters/poster-5.jpg", year: "2023", rating: "R", duration: "1h 55m", genre: "Horror" },
  { id: 6, title: "High Stakes", imageUrl: "/images/posters/poster-6.jpg", year: "2024", rating: "PG-13", duration: "2h 05m", genre: "Action" },
  { id: 7, title: "Dragon's Kingdom", imageUrl: "/images/posters/poster-7.jpg", year: "2024", rating: "PG-13", duration: "2h 32m", genre: "Fantasy" },
  { id: 8, title: "Neon Detective", imageUrl: "/images/posters/poster-8.jpg", year: "2023", rating: "R", duration: "2h 10m", genre: "Sci-Fi" },
  { id: 9, title: "The Last Stand", imageUrl: "/images/posters/poster-1.jpg", year: "2023", rating: "R", duration: "1h 58m", genre: "Action" },
  { id: 10, title: "Echo Chamber", imageUrl: "/images/posters/poster-2.jpg", year: "2024", rating: "PG-13", duration: "1h 45m", genre: "Thriller" },
  { id: 11, title: "Sacred Ground", imageUrl: "/images/posters/poster-3.jpg", year: "2024", rating: "PG", duration: "2h 20m", genre: "Drama" },
  { id: 12, title: "City Lights", imageUrl: "/images/posters/poster-4.jpg", year: "2023", rating: "PG-13", duration: "1h 52m", genre: "Romance" },
  { id: 13, title: "Dark Whispers", imageUrl: "/images/posters/poster-5.jpg", year: "2024", rating: "R", duration: "1h 48m", genre: "Horror" },
  { id: 14, title: "Royal Heist", imageUrl: "/images/posters/poster-6.jpg", year: "2023", rating: "PG-13", duration: "2h 15m", genre: "Action" },
  { id: 15, title: "Realm of Magic", imageUrl: "/images/posters/poster-7.jpg", year: "2024", rating: "PG", duration: "2h 45m", genre: "Fantasy" },
  { id: 16, title: "Circuit Breaker", imageUrl: "/images/posters/poster-8.jpg", year: "2024", rating: "R", duration: "2h 02m", genre: "Sci-Fi" },
]

const categories = ["All", "Action", "Sci-Fi", "Thriller", "Romance", "Horror", "Fantasy", "Drama"]
const sortOptions = ["Popular", "Newest", "A-Z", "Rating"]

export default function MoviesPage() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("Popular")
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid")

  const filteredMovies = useMemo(() => {
    let movies = [...allMovies]
    
    // Filter by category
    if (activeCategory !== "All") {
      movies = movies.filter(movie => movie.genre === activeCategory)
    }
    
    // Filter by search
    if (searchQuery) {
      movies = movies.filter(movie => 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Sort
    switch (sortBy) {
      case "Newest":
        movies.sort((a, b) => parseInt(b.year) - parseInt(a.year))
        break
      case "A-Z":
        movies.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "Rating":
        movies.sort((a, b) => a.rating.localeCompare(b.rating))
        break
      default:
        // Popular - keep original order
        break
    }
    
    return movies
  }, [activeCategory, searchQuery, sortBy])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-20 sm:pt-24">
        {/* Page Header */}
        <div className="px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-2">
            Movies
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Explore our collection of {allMovies.length} movies
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
                          className={sortBy === option ? "bg-accent" : ""}
                        >
                          {option}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* View Toggle */}
                  <div className="flex items-center rounded-lg bg-secondary p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === "grid" 
                          ? "bg-background text-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("compact")}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === "compact" 
                          ? "bg-background text-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Pills */}
              <CategoryPills
                categories={categories}
                defaultCategory={activeCategory}
                onChange={setActiveCategory}
                className="px-0 -mx-4 sm:mx-0 sm:px-0"
              />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="px-4 sm:px-6 lg:px-12 py-4">
          <p className="text-sm text-muted-foreground">
            {filteredMovies.length} {filteredMovies.length === 1 ? "movie" : "movies"} found
            {activeCategory !== "All" && ` in ${activeCategory}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* Movies Grid */}
        <div className="px-4 sm:px-6 lg:px-12 pb-16">
          {filteredMovies.length > 0 ? (
            <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${
              viewMode === "grid"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
            }`}>
              {filteredMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  title={movie.title}
                  imageUrl={movie.imageUrl}
                  year={movie.year}
                  rating={movie.rating}
                  duration={movie.duration}
                />
              ))}
            </div>
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
                  setSearchQuery("")
                  setActiveCategory("All")
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
  )
}
