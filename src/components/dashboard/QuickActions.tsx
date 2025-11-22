/**
 * Quick Actions Component
 * Provides quick access buttons for common actions
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, UserPlus, Settings, BarChart3 } from "lucide-react";

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      label: "New Appointment",
      description: "Schedule a new appointment",
      icon: Calendar,
      onClick: () => navigate("/admin/appointments"),
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    },
    {
      label: "Invite Staff",
      description: "Add a new team member",
      icon: UserPlus,
      onClick: () => navigate("/admin/staff"),
      color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    },
    {
      label: "Analytics",
      description: "View detailed reports",
      icon: BarChart3,
      onClick: () => navigate("/admin/analytics"),
      color: "bg-green-50 text-green-600 hover:bg-green-100",
    },
    {
      label: "Settings",
      description: "Manage store settings",
      icon: Settings,
      onClick: () => navigate("/admin/settings"),
      color: "bg-orange-50 text-orange-600 hover:bg-orange-100",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto flex-col items-start p-4 gap-2"
                onClick={action.onClick}
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {action.description}
                  </p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
