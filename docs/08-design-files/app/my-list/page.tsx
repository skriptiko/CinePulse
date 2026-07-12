"use client"

import { useState } from "react"
import { Header } from "@/components/cinepulse/header"
import { Footer } from "@/components/cinepulse/footer"
import { MovieCard } from "@/components/cinepulse/movie-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Grid3X3, 
  List,
  SlidersHorizontal,
  Trash2,
  Clock,
  CheckCircle,
  Film,
  Tv,
  Bookmark
} from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { id: "all", label: "All", icon: Bookmark },
  { id: "movies", label: "Movies", icon: Film },
  { id: "series", label: "Series", icon: Tv },
  { id: "watching", label: "Continue Watching", icon: Clock },
  { id: "completed", label: "Completed", icon: CheckCircle },
]

const myListItems = [
  {
    id: 1,
    title: "Stellar Odyssey",
    image: "/images/posters/poster-1.jpg",
    rating: 8.7,
    year: "2024",
    duration: "2h 28m",
    type: "movie",
    status: "watching",
    progress: 45,
    genres: ["Sci-Fi", "Adventure"],
  },
  {
    id: 2,
    title: "The Last Kingdom",
    image: "/images/series/series-2.jpg",
    rating: 9.1,
    year: "2023",
    duration: "5 Seasons",
    type: "series",
    status: "watching",
    progress: 72,
    genres: ["Fantasy", "Drama"],
  },
  {
    id: 3,
    title: "Midnight Echo",
    image: "/images/posters/poster-2.jpg",
    rating: 8.4,
    year: "2024",
    duration: "1h 56m",
    type: "movie",
    status: "completed",
    progress: 100,
    genres: ["Thriller", "Mystery"],
  },
  {
    id: 4,
    title: "City Lights",
    image: "/images/posters/poster-4.jpg",
    rating: 8.9,
    year: "2024",
    duration: "2h 12m",
    type: "movie",
    status: "unwatched",
    progress: 0,
    genres: ["Romance", "Drama"],
  },
  {
    id: 5,
    title: "The Verdict",
    image: "/images/series/series-4.jpg",
    rating: 8.6,
    year: "2024",
    duration: "3 Seasons",
    type: "series",
    status: "watching",
    progress: 30,
    genres: ["Legal", "Drama"],
  },
  {
    id: 6,
    title: "Dark Manor",
    image: "/images/posters/poster-5.jpg",
    rating: 7.8,
    year: "2023",
    duration: "1h 48m",
    type: "movie",
    status: "unwatched",
    progress: 0,
    genres: ["Horror", "Mystery"],
  },
  {
    id: 7,
    title: "High Stakes",
    image: "/images/posters/poster-6.jpg",
    rating: 8.5,
    year: "2024",
    duration: "2h 05m",
    type: "movie",
    status: "completed",
    progress: 100,
    genres: ["Crime", "Thriller"],
  },
  {
    id: 8,
    title: "Galactic Command",
    image: "/images/series/series-5.jpg",
    rating: 9.0,
    year: "2024",
    duration: "2 Seasons",
    type: "series",
    status: "watching",
    progress: 55,
    genres: ["Sci-Fi", "Action"],
  },
]

export default function MyListPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [items, setItems] = useState(myListItems)

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "movies" && item.type === "movie") ||
      (activeTab === "series" && item.type === "series") ||
      (activeTab === "watching" && item.status === "watching") ||
      (activeTab === "completed" && item.status === "completed")
    
    return matchesSearch && matchesTab
  })

  const removeFromList = (id: number) => {
    setItems(items.filter(item => item.id !== id))
  }

  const stats = {
    total: items.length,
    movies: items.filter(i => i.type === "movie").length,
    series: items.filter(i => i.type === "series").length,
    watching: items.filter(i => i.status === "watching").length,
    completed: items.filter(i => i.status === "completed").length,
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-20">
        {/* Page Header */}
        <div className="px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
          <div className="max-w-[1800px] mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-2">
              My List
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {stats.total} titles saved · {stats.watching} in progress · {stats.completed} completed
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 sm:px-6 lg:px-12 pb-6">
          <div className="max-w-[1800px] mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="glass rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Film className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.movies}</p>
                    <p className="text-xs text-muted-foreground">Movies</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Tv className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.series}</p>
                    <p className="text-xs text-muted-foreground">Series</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.watching}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 lg:px-12 pb-4">
          <div className="max-w-[1800px] mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                      activeTab === tab.id
                        ? "bg-foreground text-background"
                        : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-4 sm:px-6 lg:px-12 py-4">
            <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search your list..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary border-0 rounded-lg h-10"
                />
              </div>

              <div className="flex items-center gap-2 justify-between sm:justify-end">
                {/* Filter */}
                <Button variant="outline" size="sm" className="rounded-lg gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>

                {/* View Toggle */}
                <div className="flex items-center bg-secondary rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      viewMode === "grid" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      viewMode === "list" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid/List */}
        <div className="px-4 sm:px-6 lg:px-12 py-8">
          <div className="max-w-[1800px] mx-auto">
            {filteredItems.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="relative group">
                      <MovieCard
                        title={item.title}
                        image={item.image}
                        rating={item.rating}
                        year={item.year}
                        duration={item.duration}
                        genres={item.genres}
                      />
                      {/* Progress bar for watching items */}
                      {item.status === "watching" && item.progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary rounded-b-lg overflow-hidden">
                          <div 
                            className="h-full bg-accent transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                      {/* Remove button */}
                      <button
                        onClick={() => removeFromList(item.id)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center gap-4 p-3 rounded-lg bg-card hover:bg-secondary/50 transition-colors group"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-16 sm:w-20 aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        {item.status === "watching" && item.progress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
                            <div 
                              className="h-full bg-accent"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span>{item.year}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                          <span>{item.duration}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                          <span className="capitalize">{item.type}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm font-medium text-accent">{item.rating}</span>
                          {item.status === "watching" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                              {item.progress}% watched
                            </span>
                          )}
                          {item.status === "completed" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => removeFromList(item.id)}
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Bookmark className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No items found</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  {searchQuery 
                    ? `No results for "${searchQuery}". Try a different search term.`
                    : "Your list is empty. Browse movies and series to add them to your list."
                  }
                </p>
                <Button className="mt-6 rounded-lg" asChild>
                  <a href="/movies">Browse Content</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
