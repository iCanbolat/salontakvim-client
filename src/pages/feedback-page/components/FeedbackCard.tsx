/**
 * Feedback Card
 */

import { format, isValid } from "date-fns";
import { enUS } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { FeedbackWithDetails } from "@/types";
import { StarDisplay } from "./FeedbackRating";

interface FeedbackCardProps {
  feedback: FeedbackWithDetails;
  onDelete: (feedbackId: string) => void;
}

export function FeedbackCard({ feedback, onDelete }: FeedbackCardProps) {
  const createdAtDate = feedback.createdAt
    ? new Date(feedback.createdAt)
    : null;
  const createdAtLabel =
    createdAtDate && isValid(createdAtDate)
      ? format(createdAtDate, "d MMMM yyyy, HH:mm", { locale: enUS })
      : "No date information";

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={feedback.customer?.avatar || undefined} />
            <AvatarFallback>
              {feedback.customer?.firstName?.charAt(0) ||
                feedback.customer?.lastName?.charAt(0) ||
                "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {feedback.customer?.firstName} {feedback.customer?.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{createdAtLabel}</p>
          </div>
        </div>
        <Button
          className="text-red-600"
          onClick={() => onDelete(feedback.id)}
          variant="ghost"
          size={"icon"}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-6 flex-wrap">
        <div>
          <span className="text-xs text-muted-foreground">Overall</span>
          <StarDisplay rating={feedback.overallRating} />
        </div>
        {feedback.serviceRating && (
          <div>
            <span className="text-xs text-muted-foreground">Service</span>
            <StarDisplay rating={feedback.serviceRating} />
          </div>
        )}
        {feedback.staffRating && (
          <div>
            <span className="text-xs text-muted-foreground">Staff</span>
            <StarDisplay rating={feedback.staffRating} />
          </div>
        )}
        {feedback.cleanlinessRating && (
          <div>
            <span className="text-xs text-muted-foreground">Cleanliness</span>
            <StarDisplay rating={feedback.cleanlinessRating} />
          </div>
        )}
        {feedback.valueRating && (
          <div>
            <span className="text-xs text-muted-foreground">Value</span>
            <StarDisplay rating={feedback.valueRating} />
          </div>
        )}
      </div>

      {/* Service & Staff info */}
      <div className="flex gap-4 text-sm">
        {feedback.service && (
          <Badge variant="outline">{feedback.service.name}</Badge>
        )}
        {feedback.staff && (
          <span className="text-muted-foreground">
            Staff: {feedback.staff.firstName} {feedback.staff.lastName}
          </span>
        )}
      </div>

      {/* Comment */}
      {feedback.comment && (
        <p className="text-sm bg-muted/50 p-3 rounded-lg">
          "{feedback.comment}"
        </p>
      )}
    </div>
  );
}
