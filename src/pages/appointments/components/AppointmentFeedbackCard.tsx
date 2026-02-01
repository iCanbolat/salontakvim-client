/**
 * Appointment Feedback Card
 */

import { Star } from "lucide-react";
import type { FeedbackWithDetails } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AppointmentFeedbackCardProps {
  feedback: FeedbackWithDetails;
}

const renderStars = (rating: number) =>
  Array.from({ length: 5 }).map((_, index) => {
    const filled = index < rating;
    return (
      <Star
        key={index}
        className={
          filled
            ? "h-4 w-4 text-yellow-500 fill-yellow-500"
            : "h-4 w-4 text-gray-300"
        }
      />
    );
  });

export function AppointmentFeedbackCard({
  feedback,
}: AppointmentFeedbackCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {renderStars(feedback.overallRating)}
          </div>
          <span className="text-sm font-medium">
            {feedback.overallRating}/5
          </span>
        </div>
        {feedback.comment && (
          <p className="text-sm text-gray-700">“{feedback.comment}”</p>
        )}
      </CardContent>
    </Card>
  );
}
