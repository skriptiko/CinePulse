import { Header } from "@/components/cinepulse/header"
import { Hero } from "@/components/cinepulse/hero"
import { ContentRow } from "@/components/cinepulse/content-row"
import { FeaturedGrid } from "@/components/cinepulse/featured-grid"
import { CategoryPills } from "@/components/cinepulse/category-pills"
import { Footer } from "@/components/cinepulse/footer"

// Movie data
const trendingMovies = [
  { id: "1", title: "Stellar Odyssey", imageUrl: "/images/posters/poster-1.jpg", year: "2026", rating: "PG-13", duration: "2h 18m" },
  { id: "2", title: "Fractured Minds", imageUrl: "/images/posters/poster-2.jpg", year: "2025", rating: "R", duration: "1h 52m" },
  { id: "3", title: "The Lost Temple", imageUrl: "/images/posters/poster-3.jpg", year: "2026", rating: "PG-13", duration: "2h 31m" },
  { id: "4", title: "Midnight in Paris", imageUrl: "/images/posters/poster-4.jpg", year: "2025", rating: "PG", duration: "1h 48m" },
  { id: "5", title: "The Haunting Hour", imageUrl: "/images/posters/poster-5.jpg", year: "2026", rating: "R", duration: "1h 59m" },
  { id: "6", title: "Royal Flush", imageUrl: "/images/posters/poster-6.jpg", year: "2025", rating: "PG-13", duration: "2h 05m" },
  { id: "7", title: "Dragon's Crown", imageUrl: "/images/posters/poster-7.jpg", year: "2026", rating: "PG-13", duration: "2h 45m" },
  { id: "8", title: "Neon Streets", imageUrl: "/images/posters/poster-8.jpg", year: "2025", rating: "R", duration: "2h 12m" },
]

const newReleases = [
  { id: "n1", title: "Neon Streets", imageUrl: "/images/posters/poster-8.jpg", year: "2025", rating: "R", duration: "2h 12m" },
  { id: "n2", title: "Dragon's Crown", imageUrl: "/images/posters/poster-7.jpg", year: "2026", rating: "PG-13", duration: "2h 45m" },
  { id: "n3", title: "Royal Flush", imageUrl: "/images/posters/poster-6.jpg", year: "2025", rating: "PG-13", duration: "2h 05m" },
  { id: "n4", title: "The Haunting Hour", imageUrl: "/images/posters/poster-5.jpg", year: "2026", rating: "R", duration: "1h 59m" },
  { id: "n5", title: "Midnight in Paris", imageUrl: "/images/posters/poster-4.jpg", year: "2025", rating: "PG", duration: "1h 48m" },
  { id: "n6", title: "The Lost Temple", imageUrl: "/images/posters/poster-3.jpg", year: "2026", rating: "PG-13", duration: "2h 31m" },
  { id: "n7", title: "Fractured Minds", imageUrl: "/images/posters/poster-2.jpg", year: "2025", rating: "R", duration: "1h 52m" },
  { id: "n8", title: "Stellar Odyssey", imageUrl: "/images/posters/poster-1.jpg", year: "2026", rating: "PG-13", duration: "2h 18m" },
]

const topRated = [
  { id: "t1", title: "Fractured Minds", imageUrl: "/images/posters/poster-2.jpg", year: "2025", rating: "R", duration: "1h 52m" },
  { id: "t2", title: "Stellar Odyssey", imageUrl: "/images/posters/poster-1.jpg", year: "2026", rating: "PG-13", duration: "2h 18m" },
  { id: "t3", title: "Dragon's Crown", imageUrl: "/images/posters/poster-7.jpg", year: "2026", rating: "PG-13", duration: "2h 45m" },
  { id: "t4", title: "The Lost Temple", imageUrl: "/images/posters/poster-3.jpg", year: "2026", rating: "PG-13", duration: "2h 31m" },
  { id: "t5", title: "Neon Streets", imageUrl: "/images/posters/poster-8.jpg", year: "2025", rating: "R", duration: "2h 12m" },
  { id: "t6", title: "Royal Flush", imageUrl: "/images/posters/poster-6.jpg", year: "2025", rating: "PG-13", duration: "2h 05m" },
  { id: "t7", title: "Midnight in Paris", imageUrl: "/images/posters/poster-4.jpg", year: "2025", rating: "PG", duration: "1h 48m" },
  { id: "t8", title: "The Haunting Hour", imageUrl: "/images/posters/poster-5.jpg", year: "2026", rating: "R", duration: "1h 59m" },
]

const featuredItems = [
  { id: "f1", title: "Warriors of the Dawn", imageUrl: "/images/featured/featured-1.jpg", rating: 9.2, genre: "Action", year: "2026" },
  { id: "f2", title: "Depths Unknown", imageUrl: "/images/featured/featured-2.jpg", rating: 8.7, genre: "Adventure", year: "2025" },
  { id: "f3", title: "Final Stride", imageUrl: "/images/featured/featured-3.jpg", rating: 8.9, genre: "Drama", year: "2026" },
  { id: "f4", title: "Shadow Protocol", imageUrl: "/images/featured/featured-4.jpg", rating: 8.5, genre: "Thriller", year: "2025" },
  { id: "f5", title: "One Last Song", imageUrl: "/images/featured/featured-5.jpg", rating: 8.8, genre: "Musical", year: "2026" },
]

const categories = [
  "All",
  "Action",
  "Drama",
  "Sci-Fi",
  "Thriller",
  "Comedy",
  "Horror",
  "Documentary",
  "Animation",
]

export default function CinePulsePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <Hero
          title="Stellar Odyssey"
          description="A groundbreaking journey through space and time. When humanity's last hope rests on one mission, Captain Elena must navigate impossible choices to save two civilizations."
          rating="PG-13"
          year="2026"
          duration="2h 18m"
          imageUrl="/images/hero-cinematic.jpg"
        />

        {/* Content Sections */}
        <div className="relative z-[1] space-y-12 pb-16 bg-gradient-to-b from-transparent via-background to-background pt-8">
          {/* Categories */}
          <CategoryPills categories={categories} />

          {/* Trending Now */}
          <ContentRow title="Trending Now" movies={trendingMovies} />

          {/* Featured Grid */}
          <FeaturedGrid
            title="Editor's Picks"
            items={featuredItems}
            className="max-w-[1800px] mx-auto"
          />

          {/* New Releases */}
          <ContentRow title="New Releases" movies={newReleases} />

          {/* Top Rated */}
          <ContentRow title="Top Rated" movies={topRated} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
