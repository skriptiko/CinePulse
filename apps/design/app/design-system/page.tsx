"use client"

import React from "react"

import { useState } from "react"
import { Header } from "@/components/cinepulse/header"
import { MovieCard } from "@/components/cinepulse/movie-card"
import { CategoryPills } from "@/components/cinepulse/category-pills"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Play, 
  Plus, 
  Heart, 
  Star, 
  Search, 
  ChevronRight,
  Check,
  X,
  Info,
  AlertTriangle,
  Loader2
} from "lucide-react"

export default function DesignSystemPage() {
  const [activeCategory, setActiveCategory] = useState("All")

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="px-6 lg:px-12 mb-20">
          <div className="max-w-4xl">
            <Badge variant="secondary" className="mb-4">Design System v1.0</Badge>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-balance">
              CinePulse Design System
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              A comprehensive design system for building premium cinematic experiences. 
              Inspired by Apple TV and Linear, featuring dark-first aesthetics, glassmorphism, 
              and high-contrast typography.
            </p>
          </div>
        </section>

        {/* Color Palette */}
        <section className="px-6 lg:px-12 mb-20">
          <SectionHeader 
            title="Color Palette" 
            description="Deep charcoal and slate tones with subtle blue undertones for both dark and light modes."
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <ColorSwatch name="Background" variable="--background" className="bg-background" />
            <ColorSwatch name="Foreground" variable="--foreground" className="bg-foreground" />
            <ColorSwatch name="Card" variable="--card" className="bg-card" />
            <ColorSwatch name="Primary" variable="--primary" className="bg-primary" />
            <ColorSwatch name="Secondary" variable="--secondary" className="bg-secondary" />
            <ColorSwatch name="Muted" variable="--muted" className="bg-muted" />
            <ColorSwatch name="Accent" variable="--accent" className="bg-accent" />
            <ColorSwatch name="Destructive" variable="--destructive" className="bg-destructive" />
            <ColorSwatch name="Border" variable="--border" className="bg-border" />
            <ColorSwatch name="Input" variable="--input" className="bg-input" />
            <ColorSwatch name="Ring" variable="--ring" className="bg-ring" />
            <ColorSwatch name="Highlight" variable="--highlight" className="bg-highlight" />
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Glassmorphism</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative h-48 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-primary/20" />
                <div className="absolute inset-4 glass rounded-lg flex items-center justify-center">
                  <span className="font-medium">Glass Effect</span>
                </div>
              </div>
              <div className="relative h-48 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-destructive/30 to-accent/20" />
                <div className="absolute inset-4 glass-subtle rounded-lg flex items-center justify-center">
                  <span className="font-medium">Glass Subtle Effect</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="px-6 lg:px-12 mb-20">
          <SectionHeader 
            title="Typography" 
            description="Geist font family with clear hierarchy and high contrast for readability."
          />
          
          <div className="space-y-8">
            <div className="grid gap-6">
              <TypographyRow label="Display" className="text-6xl lg:text-7xl font-bold tracking-tight">
                CinePulse
              </TypographyRow>
              <TypographyRow label="Heading 1" className="text-5xl font-bold tracking-tight">
                Streaming Reimagined
              </TypographyRow>
              <TypographyRow label="Heading 2" className="text-3xl font-semibold">
                Featured Collections
              </TypographyRow>
              <TypographyRow label="Heading 3" className="text-xl font-semibold">
                Trending This Week
              </TypographyRow>
              <TypographyRow label="Body Large" className="text-lg leading-relaxed">
                Experience cinema like never before with our curated selection of premium content.
              </TypographyRow>
              <TypographyRow label="Body" className="text-base leading-relaxed">
                Discover thousands of movies and shows, from blockbuster hits to hidden gems.
              </TypographyRow>
              <TypographyRow label="Body Small" className="text-sm leading-relaxed text-muted-foreground">
                Updated daily with new releases and exclusive content.
              </TypographyRow>
              <TypographyRow label="Caption" className="text-xs uppercase tracking-wider text-muted-foreground">
                Now Streaming
              </TypographyRow>
            </div>
          </div>
        </section>

        {/* Spacing & Radius */}
        <section className="px-6 lg:px-12 mb-20">
          <SectionHeader 
            title="Spacing & Border Radius" 
            description="Consistent 8px border radius system with harmonious spacing scale."
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="space-y-3">
              <div className="h-16 w-16 bg-muted rounded" />
              <p className="text-sm text-muted-foreground">rounded (4px)</p>
            </div>
            <div className="space-y-3">
              <div className="h-16 w-16 bg-muted rounded-md" />
              <p className="text-sm text-muted-foreground">rounded-md (6px)</p>
            </div>
            <div className="space-y-3">
              <div className="h-16 w-16 bg-muted rounded-lg" />
              <p className="text-sm text-muted-foreground">rounded-lg (8px)</p>
            </div>
            <div className="space-y-3">
              <div className="h-16 w-16 bg-muted rounded-xl" />
              <p className="text-sm text-muted-foreground">rounded-xl (12px)</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-4">Spacing Scale</h3>
          <div className="flex items-end gap-4 flex-wrap">
            {[1, 2, 3, 4, 6, 8, 12, 16].map((space) => (
              <div key={space} className="flex flex-col items-center gap-2">
                <div 
                  className="bg-accent" 
                  style={{ width: `${space * 4}px`, height: `${space * 4}px` }} 
                />
                <span className="text-xs text-muted-foreground">{space * 4}px</span>
              </div>
            ))}
          </div>
        </section>

        {/* Buttons */}
        <section className="px-6 lg:px-12 mb-20">
          <SectionHeader 
            title="Buttons" 
            description="Multiple button variants for different use cases and visual hierarchy."
          />
          
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button>
                  <Play className="w-4 h-4" />
                  Watch Now
                </Button>
                <Button variant="secondary">
                  <Plus className="w-4 h-4" />
                  Add to List
                </Button>
                <Button variant="outline">
                  <Info className="w-4 h-4" />
                  Details
                </Button>
                <Button variant="ghost">
                  <Heart className="w-4 h-4" />
                  Like
                </Button>
                <Button variant="destructive">
                  <X className="w-4 h-4" />
                  Remove
                </Button>
                <Button variant="link">Learn More</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Play className="w-4 h-4" /></Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">States</h3>
              <div className="flex flex-wrap gap-4">
                <Button>Default</Button>
                <Button disabled>Disabled</Button>
                <Button disabled>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Glass Button</h3>
              <div className="relative h-32 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/40 to-primary/20" />
                <div className="absolute inset-0 flex items-center justify-center gap-4">
                  <button className="glass px-6 py-3 rounded-lg font-medium transition-all hover:scale-105">
                    Glass Primary
                  </button>
                  <button className="glass-subtle px-6 py-3 rounded-lg font-medium transition-all hover:scale-105">
                    Glass Subtle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="px-6 lg:px-12 mb-20">
          <SectionHeader 
            title="Badges" 
            description="Tags and labels for categorization and status indication."
          />
          
          <div className="flex flex-wrap gap-4">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="bg-accent text-accent-foreground">Accent</Badge>
            <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              <Star className="w-3 h-3 mr-1 fill-current" />
              9.2
            </Badge>
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
              <Check className="w-3 h-3 mr-1" />
              Verified
            </Badge>
            <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </div>
        </section>

        {/* Inputs */}
        <section className="px-6 lg:px-12 mb-20">
          <SectionHeader 
            title="Form Elements" 
            description="Input fields and form controls with consistent styling."
          />
          
          <div className="max-w-md space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Input</label>
              <Input placeholder="Search movies..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">With Icon</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Disabled</label>
              <Input placeholder="Disabled input" disabled />
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="px-6 lg:px-12 mb-20">
          <SectionHeader 
            title="Cards" 
            description="Container components for grouping related content."
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>A simple card with header and content.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cards provide a flexible container for content with consistent styling.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary">
              <CardHeader>
                <CardTitle>Secondary Card</CardTitle>
                <CardDescription>Using secondary background color.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Variants can be created by changing the background.
                </p>
              </CardContent>
            </Card>

            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-primary/10" />
              <Card className="glass border-0 h-full">
                <CardHeader>
                  <CardTitle>Glass Card</CardTitle>
                  <CardDescription>With glassmorphism effect.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Perfect for overlays and featured content.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Category Pills */}
        <section className="px-6 lg:px-12 mb-20">
          <SectionHeader 
            title="Category Pills" 
            description="Filter and navigation pills for content categorization."
          />
          
          <CategoryPills 
            categories={["All", "Action", "Drama", "Sci-Fi", "Horror", "Comedy", "Romance", "Thriller"]}
            defaultCategory={activeCategory}
            onChange={setActiveCategory}
          />
        </section>

        {/* Movie Cards */}
        <section className="px-6 lg:px-12 mb-20">
          <SectionHeader 
            title="Movie Cards" 
            description="Interactive poster cards with hover animations and actions."
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <MovieCard
              id="1"
              title="Stellar Odyssey"
              year={2024}
              rating={8.9}
              genre="Sci-Fi"
              poster="/images/posters/poster-1.jpg"
            />
            <MovieCard
              id="2"
              title="Fractured Mirror"
              year={2024}
              rating={8.2}
              genre="Thriller"
              poster="/images/posters/poster-2.jpg"
            />
            <MovieCard
              id="3"
              title="Temple of Shadows"
              year={2024}
              rating={7.8}
              genre="Adventure"
              poster="/images/posters/poster-3.jpg"
            />
            <MovieCard
              id="4"
              title="Neon Hearts"
              year={2024}
              rating={8.5}
              genre="Romance"
              poster="/images/posters/poster-4.jpg"
            />
            <MovieCard
              id="5"
              title="The Manor"
              year={2024}
              rating={7.6}
              genre="Horror"
              poster="/images/posters/poster-5.jpg"
            />
          </div>
        </section>

        {/* Icons */}
        <section className="px-6 lg:px-12 mb-20">
          <SectionHeader 
            title="Icons" 
            description="Lucide icons used throughout the design system."
          />
          
          <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4">
            {[
              { icon: Play, name: "Play" },
              { icon: Plus, name: "Plus" },
              { icon: Heart, name: "Heart" },
              { icon: Star, name: "Star" },
              { icon: Search, name: "Search" },
              { icon: ChevronRight, name: "Chevron" },
              { icon: Check, name: "Check" },
              { icon: X, name: "Close" },
              { icon: Info, name: "Info" },
              { icon: AlertTriangle, name: "Alert" },
              { icon: Loader2, name: "Loader" },
            ].map(({ icon: Icon, name }) => (
              <div key={name} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/50">
                <Icon className="w-5 h-5" />
                <span className="text-xs text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Shadows & Effects */}
        <section className="px-6 lg:px-12 mb-20">
          <SectionHeader 
            title="Shadows & Effects" 
            description="Elevation and visual effects for depth hierarchy."
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="h-24 w-full bg-card rounded-lg shadow-sm" />
              <p className="text-sm text-muted-foreground">shadow-sm</p>
            </div>
            <div className="space-y-3">
              <div className="h-24 w-full bg-card rounded-lg shadow-md" />
              <p className="text-sm text-muted-foreground">shadow-md</p>
            </div>
            <div className="space-y-3">
              <div className="h-24 w-full bg-card rounded-lg shadow-lg" />
              <p className="text-sm text-muted-foreground">shadow-lg</p>
            </div>
            <div className="space-y-3">
              <div className="h-24 w-full bg-card rounded-lg shadow-xl" />
              <p className="text-sm text-muted-foreground">shadow-xl</p>
            </div>
          </div>
        </section>

        {/* Usage Guidelines */}
        <section className="px-6 lg:px-12">
          <SectionHeader 
            title="Usage Guidelines" 
            description="Best practices for implementing the CinePulse design system."
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dark Mode First</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Design with dark mode as the primary theme. Light mode should complement, not compete.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consistent Radius</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Use 8px (rounded-lg) as the default border radius. Smaller elements can use 4px or 6px.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">High Contrast</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Maintain clear contrast between text and backgrounds for accessibility and readability.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subtle Animations</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Use smooth, subtle transitions. Avoid jarring movements. Scale and opacity work well.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Glassmorphism Sparingly</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Reserve glass effects for overlays, modals, and featured elements. Don&apos;t overuse.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visual Hierarchy</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Use size, weight, and color to establish clear content hierarchy and guide the eye.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function ColorSwatch({ name, variable, className }: { name: string; variable: string; className: string }) {
  return (
    <div className="space-y-2">
      <div className={`h-20 rounded-lg border border-border ${className}`} />
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground font-mono">{variable}</p>
      </div>
    </div>
  )
}

function TypographyRow({ label, className, children }: { label: string; className: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-baseline gap-2 lg:gap-8 pb-6 border-b border-border">
      <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
      <span className={className}>{children}</span>
    </div>
  )
}
