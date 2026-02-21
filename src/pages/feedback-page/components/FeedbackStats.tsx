/**
 * Feedback Stats Section
 */

import { MessageSquare, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FeedbackStats } from "@/types";
import { StarDisplay } from "./FeedbackRating";

function StatsCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function RatingBar({
  rating,
  count,
  total,
}: {
  rating: number;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3">{rating}</span>
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-muted-foreground">{count}</span>
    </div>
  );
}

interface FeedbackStatsProps {
  stats?: FeedbackStats;
}

export function FeedbackStats({ stats }: FeedbackStatsProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Reviews"
          value={stats?.totalFeedback || 0}
          icon={MessageSquare}
          description="All time"
        />
        <StatsCard
          title="Average Rating"
          value={<StarDisplay rating={stats?.averageOverallRating} size="lg" />}
          icon={Star}
        />
        <StatsCard
          title="Positive"
          value={
            stats?.ratingDistribution
              ? (stats.ratingDistribution[4] || 0) +
                (stats.ratingDistribution[5] || 0)
              : 0
          }
          icon={ThumbsUp}
          description="4+ stars"
        />
        <StatsCard
          title="Need Improvement"
          value={
            stats?.ratingDistribution
              ? (stats.ratingDistribution[1] || 0) +
                (stats.ratingDistribution[2] || 0)
              : 0
          }
          icon={ThumbsDown}
          description="2 stars and below"
        />
      </div>

      {stats && stats.totalFeedback > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <RatingBar
                  key={rating}
                  rating={rating}
                  count={
                    stats.ratingDistribution[
                      rating as keyof typeof stats.ratingDistribution
                    ] || 0
                  }
                  total={stats.totalFeedback}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
