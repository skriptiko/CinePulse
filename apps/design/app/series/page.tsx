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

// Sample series data
const allSeries = [
  { id: 1, title: "Dark Investigations", imageUrl: "/images/series/series-1.jpg", year: "2024", rating: "TV-MA", seasons: "3 Seasons", genre: "Crime" },
  { id: 2, title: "Crown of Shadows", imageUrl: "/images/series/series-2.jpg", year: "2023", rating: "TV-14", seasons: "4 Seasons", genre: "Fantasy" },
  { id: 3, title: "Critical Care", imageUrl: "/images/series/series-3.jpg", year: "2024", rating: "TV-14", seasons: "2 Seasons", genre: "Drama" },
  { id: 4, title: "Justice Prevails", imageUrl: "/images/series/series-4.jpg", year: "2023", rating: "TV-MA", seasons: "5 Seasons", genre: "Drama" },
  { id: 5, title: "Starbound", imageUrl: "/images/series/series-5.jpg", year: "2024", rating: "TV-14", seasons: "2 Seasons", genre: "Sci-Fi" },
  { id: 6, title: "The Gilded Age", imageUrl: "/images/series/series-6.jpg", year: "2023", rating: "TV-PG", seasons: "3 Seasons", genre: "Drama" },
  { id: 7, title: "Undercover Unit", imageUrl: "/images/series/series-1.jpg", year: "2024", rating: "TV-MA", seasons: "1 Season", genre: "Crime" },
  { id: 8, title: "Realm Wars", imageUrl: "/images/series/series-2.jpg", year: "2024", rating: "TV-MA", seasons: "2 Seasons", genre: "Fantasy" },
  { id: 9, title: "Emergency Room", imageUrl: "/images/series/series-3.jpg", year: "2023", rating: "TV-14", seasons: "6 Seasons", genre: "Drama" },
  { id: 10, title: "The Verdict", imageUrl: "/images/series/series-4.jpg", year: "2024", rating: "TV-14", seasons: "3 Seasons", genre: "Drama" },
  { id: 11, title: "Galaxy Command", imageUrl: "/images/series/series-5.jpg", year: "2023", rating: "TV-14", seasons: "4 Seasons", genre: "Sci-Fi" },
  { id: 12, title: "Manor House", imageUrl: "/images/series/series-6.jpg", year: "2024", rating: "TV-PG", seasons: "2 Seasons", genre: "Drama" },
  { id: 13, title: "Cold Case Files", imageUrl: "/images/series/series-1.jpg", year: "2023", rating: "TV-MA", seasons: "7 Seasons", genre: "Crime" },
  { id: 14, title: "Dragon Dynasty", imageUrl: "/images/series/series-2.jpg", year: "2024", rating: "TV-MA", seasons: "1 Season", genre: "Fantasy" },
  { id: 15, title: "Night Shift", imageUrl: "/images/series/series-3.jpg", year: "2024", rating: "TV-14", seasons: "4 Seasons", genre: "Drama" },
  { id: 16, title: "Deep Space Nine", imageUrl: "/images/series/series-5.jpg", year: "2023", rating: "TV-PG", seasons: "5 Seasons", genre: "Sci-Fi" },
]

const categories = ["All", "Drama", "Crime", "Fantasy", "Sci-Fi", "Comedy", "Thriller"]
const sortOptions = ["Popular", "Newest", "A-Z", "Rating"]

export default function SeriesPage() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("Popular")
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid")

  const filteredSeries = useMemo(() => {
    let series = [...allSeries]
    
    // Filter by category
    if (activeCategory !== "All") {
      series = series.filter(s => s.genre === activeCategory)
    }
    
    // Filter by search
    if (searchQuery) {
      series = series.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Sort
    switch (sortBy) {
      case "Newest":
        series.sort((a, b) => parseInt(b.year) - parseInt(a.year))
        break
      case "A-Z":
        series.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "Rating":
        series.sort((a, b) => a.rating.localeCompare(b.rating))
        break
      default:
        break
    }
    
    return series
  }, [activeCategory, searchQuery, sortBy])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-20 sm:pt-24">
        {/* Page Header */}
        <div className="px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-2">
            TV Series
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Binge-worthy shows from our collection of {allSeries.length} series
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
                    placeholder="Search series..."
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
            {filteredSeries.length} {filteredSeries.length === 1 ? "series" : "series"} found
            {activeCategory !== "All" && ` in ${activeCategory}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* Series Grid */}
        <div className="px-4 sm:px-6 lg:px-12 pb-16">
          {filteredSeries.length > 0 ? (
            <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${
              viewMode === "grid"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
            }`}>
              {filteredSeries.map((series) => (
                <MovieCard
                  key={series.id}
                  title={series.title}
                  imageUrl={series.imageUrl}
                  year={series.year}
                  rating={series.rating}
                  duration={series.seasons}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No series found</h3>
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
