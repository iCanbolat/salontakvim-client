/**
 * Recent Activity Component
 * Shows recent activity timeline
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  CalendarPlus,
  CalendarX,
  CalendarCheck,
  CalendarClock,
  UserPlus,
  Users,
  UserCog,
  Mail,
  Bell,
  Star,
} from "lucide-react";
import type { RecentActivity } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface RecentActivityListProps {
  activities: RecentActivity[];
}

function getActivityIcon(activity: RecentActivity) {
  const message = activity.message.toLowerCase();
  const type = activity.type;

  if (type === "appointment") {
    if (message.includes("değerlendirme"))
      return { icon: Star, color: "bg-indigo-100 text-indigo-600" };
    if (message.includes("iptal"))
      return { icon: CalendarX, color: "bg-rose-100 text-rose-600" };
    if (message.includes("oluştur"))
      return { icon: CalendarPlus, color: "bg-emerald-100 text-emerald-600" };
    if (message.includes("onay"))
      return { icon: CalendarCheck, color: "bg-sky-100 text-sky-600" };
    if (message.includes("güncellendi") || message.includes("durumu"))
      return { icon: CalendarClock, color: "bg-amber-100 text-amber-600" };
    return { icon: Calendar, color: "bg-blue-100 text-blue-600" };
  }

  if (type === "customer") {
    if (message.includes("oluştur") || message.includes("yeni"))
      return { icon: UserPlus, color: "bg-emerald-100 text-emerald-600" };
    if (message.includes("güncel"))
      return { icon: UserCog, color: "bg-amber-100 text-amber-600" };
    return { icon: Users, color: "bg-green-100 text-green-600" };
  }

  if (type === "staff") {
    if (message.includes("davet"))
      return { icon: Mail, color: "bg-violet-100 text-violet-600" };
    if (message.includes("oluştur") || message.includes("yeni"))
      return { icon: UserPlus, color: "bg-emerald-100 text-emerald-600" };
    if (message.includes("güncel"))
      return { icon: UserCog, color: "bg-amber-100 text-amber-600" };
    return { icon: Users, color: "bg-purple-100 text-purple-600" };
  }

  return { icon: Bell, color: "bg-gray-100 text-gray-600" };
}

export function RecentActivityList({ activities }: RecentActivityListProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl border-gray-100">
            <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p>Henüz bir aktivite bulunmuyor</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm overflow-hidden flex flex-col h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Son Aktiviteler</CardTitle>
          <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full text-gray-500 font-medium">
            Canlı
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 px-6 pb-6">
        <ScrollArea className="h-[400px]">
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-px before:bg-gray-100 before:pointer-events-none pb-6">
            {activities.map((activity, index) => {
              const { icon: Icon, color: colorClass } =
                getActivityIcon(activity);
              const timeAgo = formatDistanceToNow(
                new Date(activity.createdAt),
                {
                  addSuffix: true,
                  locale: tr,
                },
              );

              return (
                <div
                  key={activity.id || index}
                  className="flex items-start gap-4 relative"
                >
                  <div
                    className={`p-2 rounded-xl ${colorClass} shrink-0 z-10 shadow-sm ring-4 ring-white`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-medium text-gray-900 leading-snug">
                      {activity.message}
                    </p>
                    <p className="text-[11px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">
                      {timeAgo}
                    </p>
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
