import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimeOffStatusBadge } from "@/components/staff/TimeOffStatusBadge";
import { Plus, CheckCircle2 } from "lucide-react";

export function StaffSchedule() {
  const timeOffRequests = useMemo(
    () => [
      {
        id: "REQ-1042",
        type: "Paid Leave",
        range: "Dec 28 - Dec 29",
        status: "pending" as const,
        note: "Family trip",
      },
      {
        id: "REQ-1037",
        type: "Sick Day",
        range: "Dec 12",
        status: "approved" as const,
        note: "Flu",
      },
      {
        id: "REQ-1032",
        type: "Unpaid Leave",
        range: "Nov 20",
        status: "declined" as const,
        note: "Conflict with peak hours",
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Off</h1>
          <p className="text-gray-600">
            Manage your leave requests and track your time-off balance.
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Request time off
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-700">Balance</CardTitle>
            </CardHeader>
            <CardContent className="flex items-baseline gap-2 text-gray-900">
              <span className="text-3xl font-bold">7</span>
              <span className="text-sm text-gray-600">days left</span>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-700">Pending</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-gray-900">
              <CheckCircle2 className="h-4 w-4 text-amber-500" />
              <span className="text-sm">1 request waiting approval</span>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-700">
                Next day off
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-900 text-sm">
              Dec 28 (Pending)
            </CardContent>
          </Card>
        </div>

        <Card className="border-dashed">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
            <div>
              <CardTitle className="text-base">Requests</CardTitle>
              <p className="text-sm text-gray-600">
                Recent time-off submissions.
              </p>
            </div>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New request
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {timeOffRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border px-3 py-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">
                    {req.type}
                  </div>
                  <TimeOffStatusBadge status={req.status} />
                </div>
                <div className="text-sm text-gray-800">{req.range}</div>
                <div className="text-xs text-gray-600">{req.note}</div>
              </div>
            ))}
            {timeOffRequests.length === 0 && (
              <p className="text-sm text-gray-600">No requests yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
