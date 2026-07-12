"use client"

import { Play, Plus, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroProps {
  title: string
  description: string
  rating: string
  year: string
  duration: string
  imageUrl: string
}

export function Hero({ title, description, rating, year, duration, imageUrl }: HeroProps) {
  return (
    <section className="relative z-0 min-h-[70vh] sm:min-h-[80vh] lg:min-h-[85vh] flex items-end safe-area-padding overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 pb-12 sm:pb-16 md:pb-24 pt-24 sm:pt-32 w-full">
        <div className="max-w-2xl">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4 text-xs sm:text-sm">
            <span className="px-2 py-1 rounded bg-foreground text-background font-medium">
              {rating}
            </span>
            <span className="text-muted-foreground">{year}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{duration}</span>
          </div>

          {/* Title */}
          <h1 className="fluid-display font-bold tracking-tight mb-3 sm:mb-4 text-balance">
            {title}
          </h1>

          {/* Description */}
          <p className="text-muted-foreground fluid-body mb-6 sm:mb-8 max-w-lg">
            {description}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              size="lg"
              className="rounded-lg gap-2 px-5 sm:px-8 h-10 sm:h-12 text-sm sm:text-base font-medium"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              Play
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="rounded-lg gap-2 px-4 sm:px-6 h-10 sm:h-12 text-sm sm:text-base font-medium glass"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              My List
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg w-10 h-10 sm:w-12 sm:h-12 glass"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="sr-only">More Info</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
