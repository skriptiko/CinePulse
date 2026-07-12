"use client"

import { useState } from "react"
import { Play, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface MovieCardProps {
  title: string
  imageUrl: string
  year?: string
  rating?: string
  duration?: string
  isInList?: boolean
  className?: string
}

export function MovieCard({
  title,
  imageUrl,
  year,
  rating,
  duration,
  isInList = false,
  className,
}: MovieCardProps) {
  const [inList, setInList] = useState(isInList)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        "group relative rounded-lg overflow-hidden cursor-pointer",
        "transition-all duration-300 motion-safe:hover:scale-105 hover:z-10",
        "@container/card",
        className
      )}
      style={{ containerType: "inline-size", containerName: "card" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster Image */}
      <div className="aspect-[2/3] relative">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-110"
        />
        
        {/* Hover Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          )}
        />

        {/* Play Button - Center */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center hover-only",
            "opacity-0 group-hover:opacity-100 motion-safe:transition-all duration-300"
          )}
        >
          <button className="card-play-btn w-12 h-12 @[250px]/card:w-14 @[250px]/card:h-14 rounded-full bg-foreground/90 hover:bg-foreground flex items-center justify-center motion-safe:transition-all motion-safe:hover:scale-110 touch-target">
            <Play className="w-5 h-5 @[250px]/card:w-6 @[250px]/card:h-6 text-background fill-current ml-0.5" />
          </button>
        </div>

        {/* Bottom Content */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 p-3 hover-only",
            "motion-safe:translate-y-full motion-safe:group-hover:translate-y-0 transition-transform duration-300"
          )}
        >
          <h3 className="card-title font-medium text-foreground truncate mb-1 @[200px]/card:text-sm @[300px]/card:text-base">
            {title}
          </h3>
          {(year || rating || duration) && (
            <div className="card-meta flex items-center gap-2 text-muted-foreground @[200px]/card:text-[10px] @[300px]/card:text-xs">
              {rating && (
                <span className="px-1.5 py-0.5 rounded bg-foreground/10 text-foreground font-medium">
                  {rating}
                </span>
              )}
              {year && <span>{year}</span>}
              {duration && (
                <>
                  <span>•</span>
                  <span>{duration}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Add to List Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setInList(!inList)
          }}
          className={cn(
            "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center",
            "opacity-0 group-hover:opacity-100 transition-all duration-300",
            inList
              ? "bg-accent text-accent-foreground"
              : "bg-background/60 text-foreground hover:bg-background/80"
          )}
        >
          {inList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
