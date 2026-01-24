/**
 * Recent Activity Component
 * Shows recent activity timeline
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, UserPlus, Users } from "lucide-react";
import type { RecentActivity } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityListProps {
  activities: RecentActivity[];
}

const activityIcons = {
  appointment: Calendar,
  customer: UserPlus,
  staff: Users,
};

const activityColors = {
  appointment: "bg-blue-100 text-blue-600",
  customer: "bg-green-100 text-green-600",
  staff: "bg-purple-100 text-purple-600",
};

export function RecentActivityList({ activities }: RecentActivityListProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activityIcons[activity.type];
              const colorClass = activityColors[activity.type];
              const timeAgo = formatDistanceToNow(
                new Date(activity.createdAt),
                {
                  addSuffix: true,
                }
              );

              return (
                <div key={index} className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${colorClass} shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
