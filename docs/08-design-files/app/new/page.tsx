"use client"

import { useState } from "react"
import { Header } from "@/components/cinepulse/header"
import { Footer } from "@/components/cinepulse/footer"
import { MovieCard } from "@/components/cinepulse/movie-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Play,
  TrendingUp,
  Clock,
  Star,
  Flame,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

// Trending content
const trendingNow = [
  { id: 1, title: "Stellar Odyssey", imageUrl: "/images/posters/poster-1.jpg", year: "2024", rating: "PG-13", duration: "2h 28m", rank: 1, type: "Movie" },
  { id: 2, title: "Crown of Shadows", imageUrl: "/images/series/series-2.jpg", year: "2024", rating: "TV-MA", duration: "4 Seasons", rank: 2, type: "Series" },
  { id: 3, title: "Shattered Reflections", imageUrl: "/images/posters/poster-2.jpg", year: "2024", rating: "R", duration: "1h 52m", rank: 3, type: "Movie" },
  { id: 4, title: "Starbound", imageUrl: "/images/series/series-5.jpg", year: "2024", rating: "TV-14", duration: "2 Seasons", rank: 4, type: "Series" },
  { id: 5, title: "High Stakes", imageUrl: "/images/posters/poster-6.jpg", year: "2024", rating: "PG-13", duration: "2h 05m", rank: 5, type: "Movie" },
  { id: 6, title: "Dark Investigations", imageUrl: "/images/series/series-1.jpg", year: "2024", rating: "TV-MA", duration: "3 Seasons", rank: 6, type: "Series" },
  { id: 7, title: "Dragon's Kingdom", imageUrl: "/images/posters/poster-7.jpg", year: "2024", rating: "PG-13", duration: "2h 32m", rank: 7, type: "Movie" },
  { id: 8, title: "Critical Care", imageUrl: "/images/series/series-3.jpg", year: "2024", rating: "TV-14", duration: "2 Seasons", rank: 8, type: "Series" },
  { id: 9, title: "Neon Detective", imageUrl: "/images/posters/poster-8.jpg", year: "2024", rating: "R", duration: "2h 10m", rank: 9, type: "Movie" },
  { id: 10, title: "Justice Prevails", imageUrl: "/images/series/series-4.jpg", year: "2024", rating: "TV-MA", duration: "5 Seasons", rank: 10, type: "Series" },
]

// New releases this week
const newReleases = [
  { id: 1, title: "Circuit Breaker", imageUrl: "/images/posters/poster-8.jpg", year: "2024", rating: "R", duration: "2h 02m", releaseDate: "Today", type: "Movie" },
  { id: 2, title: "Dragon Dynasty", imageUrl: "/images/series/series-2.jpg", year: "2024", rating: "TV-MA", duration: "1 Season", releaseDate: "Today", type: "Series" },
  { id: 3, title: "Echo Chamber", imageUrl: "/images/posters/poster-2.jpg", year: "2024", rating: "PG-13", duration: "1h 45m", releaseDate: "Yesterday", type: "Movie" },
  { id: 4, title: "Undercover Unit", imageUrl: "/images/series/series-1.jpg", year: "2024", rating: "TV-MA", duration: "1 Season", releaseDate: "2 days ago", type: "Series" },
  { id: 5, title: "Realm of Magic", imageUrl: "/images/posters/poster-7.jpg", year: "2024", rating: "PG", duration: "2h 45m", releaseDate: "3 days ago", type: "Movie" },
  { id: 6, title: "Manor House", imageUrl: "/images/series/series-6.jpg", year: "2024", rating: "TV-PG", duration: "2 Seasons", releaseDate: "4 days ago", type: "Series" },
]

// Coming soon
const comingSoon = [
  { id: 1, title: "Midnight Protocol", imageUrl: "/images/posters/poster-1.jpg", year: "2025", rating: "R", duration: "TBA", releaseDate: "March 28", type: "Movie" },
  { id: 2, title: "The Last Frontier", imageUrl: "/images/series/series-5.jpg", year: "2025", rating: "TV-14", duration: "TBA", releaseDate: "April 5", type: "Series" },
  { id: 3, title: "Shadow Empire", imageUrl: "/images/posters/poster-5.jpg", year: "2025", rating: "PG-13", duration: "TBA", releaseDate: "April 12", type: "Movie" },
  { id: 4, title: "Code Red", imageUrl: "/images/series/series-3.jpg", year: "2025", rating: "TV-MA", duration: "TBA", releaseDate: "April 20", type: "Series" },
]

// Top rated
const topRated = [
  { id: 1, title: "Stellar Odyssey", imageUrl: "/images/posters/poster-1.jpg", year: "2024", rating: "PG-13", duration: "2h 28m", score: 9.2, type: "Movie" },
  { id: 2, title: "Crown of Shadows", imageUrl: "/images/series/series-2.jpg", year: "2023", rating: "TV-MA", duration: "4 Seasons", score: 9.1, type: "Series" },
  { id: 3, title: "Lost Temple", imageUrl: "/images/posters/poster-3.jpg", year: "2023", rating: "PG-13", duration: "2h 15m", score: 8.9, type: "Movie" },
  { id: 4, title: "Galaxy Command", imageUrl: "/images/series/series-5.jpg", year: "2023", rating: "TV-14", duration: "4 Seasons", score: 8.8, type: "Series" },
  { id: 5, title: "The Manor", imageUrl: "/images/posters/poster-5.jpg", year: "2023", rating: "R", duration: "1h 55m", score: 8.7, type: "Movie" },
  { id: 6, title: "Cold Case Files", imageUrl: "/images/series/series-1.jpg", year: "2023", rating: "TV-MA", duration: "7 Seasons", score: 8.6, type: "Series" },
]

type TabType = "trending" | "new" | "coming" | "top"

const tabs = [
  { id: "trending" as TabType, label: "Trending Now", icon: TrendingUp },
  { id: "new" as TabType, label: "New Releases", icon: Sparkles },
  { id: "coming" as TabType, label: "Coming Soon", icon: Clock },
  { id: "top" as TabType, label: "Top Rated", icon: Star },
]

export default function NewPopularPage() {
  const [activeTab, setActiveTab] = useState<TabType>("trending")

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-20 sm:pt-24">
        {/* Hero Section */}
        <div className="relative px-4 sm:px-6 lg:px-12 py-8 sm:py-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/20">
                <Flame className="w-6 h-6 text-accent" />
              </div>
              <Badge variant="secondary" className="rounded-full">
                Updated daily
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-2">
              New & Popular
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
              Discover what everyone is watching. From trending titles to new releases and upcoming premieres.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-16 sm:top-20 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-4 sm:px-6 lg:px-12">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide py-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
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

        {/* Content */}
        <div className="px-4 sm:px-6 lg:px-12 py-8">
          {/* Trending Now */}
          {activeTab === "trending" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-semibold">Top 10 This Week</h2>
                <Badge variant="outline" className="rounded-full">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Live rankings
                </Badge>
              </div>
              
              {/* Top 10 List */}
              <div className="grid gap-4">
                {trendingNow.map((item) => (
                  <div 
                    key={item.id}
                    className="group flex items-center gap-4 p-3 sm:p-4 rounded-xl bg-card hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 sm:w-12 text-center">
                      <span className={cn(
                        "text-2xl sm:text-4xl font-bold",
                        item.rank <= 3 ? "text-accent" : "text-muted-foreground"
                      )}>
                        {item.rank}
                      </span>
                    </div>
                    
                    {/* Poster */}
                    <div className="flex-shrink-0 w-16 sm:w-20 aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-accent transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-muted-foreground">
                        <Badge variant="outline" className="rounded text-xs px-1.5 py-0">
                          {item.type}
                        </Badge>
                        <span>{item.year}</span>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden sm:inline">{item.rating}</span>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden sm:inline">{item.duration}</span>
                      </div>
                    </div>
                    
                    {/* Play Button */}
                    <Button size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 fill-current" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Releases */}
          {activeTab === "new" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-semibold">Just Added</h2>
                <Badge variant="outline" className="rounded-full">
                  <Sparkles className="w-3 h-3 mr-1" />
                  This week
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                {newReleases.map((item) => (
                  <div key={item.id} className="relative">
                    <MovieCard
                      title={item.title}
                      imageUrl={item.imageUrl}
                      year={item.year}
                      rating={item.rating}
                      duration={item.duration}
                    />
                    <Badge className="absolute top-2 left-2 rounded-full bg-accent text-accent-foreground text-xs">
                      {item.releaseDate}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coming Soon */}
          {activeTab === "coming" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-semibold">Coming Soon</h2>
                <Badge variant="outline" className="rounded-full">
                  <Clock className="w-3 h-3 mr-1" />
                  Premieres
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                {comingSoon.map((item) => (
                  <div key={item.id} className="relative">
                    <MovieCard
                      title={item.title}
                      imageUrl={item.imageUrl}
                      year={item.year}
                      rating={item.rating}
                      duration={item.duration}
                    />
                    <Badge className="absolute top-2 left-2 rounded-full bg-foreground text-background text-xs">
                      {item.releaseDate}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-4">
                  Set reminders for upcoming releases
                </p>
                <Button variant="secondary" className="rounded-lg">
                  View Full Calendar
                </Button>
              </div>
            </div>
          )}

          {/* Top Rated */}
          {activeTab === "top" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-semibold">Highest Rated</h2>
                <Badge variant="outline" className="rounded-full">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  All time
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {topRated.map((item, index) => (
                  <div 
                    key={item.id}
                    className="group flex items-center gap-4 p-3 sm:p-4 rounded-xl bg-card hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 sm:w-12 text-center">
                      <span className="text-2xl sm:text-4xl font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                    </div>
                    
                    {/* Poster */}
                    <div className="flex-shrink-0 w-16 sm:w-20 aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-accent transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-muted-foreground">
                        <Badge variant="outline" className="rounded text-xs px-1.5 py-0">
                          {item.type}
                        </Badge>
                        <span>{item.year}</span>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden sm:inline">{item.rating}</span>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden sm:inline">{item.duration}</span>
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/20">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      <span className="font-semibold text-accent">{item.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
