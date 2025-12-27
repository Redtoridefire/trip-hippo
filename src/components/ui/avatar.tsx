import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = "md", ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false)

    const initials = React.useMemo(() => {
      if (fallback) return fallback.slice(0, 2).toUpperCase()
      if (alt) {
        const parts = alt.split(" ")
        if (parts.length >= 2) {
          return (parts[0][0] + parts[1][0]).toUpperCase()
        }
        return alt.slice(0, 2).toUpperCase()
      }
      return "?"
    }, [fallback, alt])

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || "Avatar"}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="font-medium text-gray-600">{initials}</span>
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }
