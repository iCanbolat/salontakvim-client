/**
 * Feedback Rating Display
 */

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarDisplay({
  rating,
  size = "sm",
}: {
  rating: number | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  if (rating === null || rating === undefined) {
    return <span className="text-gray-400">-</span>;
  }

  const sizeClass = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            rating >= star
              ? "fill-yellow-400 text-yellow-400"
              : rating >= star - 0.5
                ? "fill-yellow-200 text-yellow-400"
                : "text-gray-200",
          )}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}
