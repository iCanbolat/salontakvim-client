import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isToday, isFuture, compareAsc } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimeOffStatusBadge } from "@/components/staff/TimeOffStatusBadge";
import { Loader2, Plus, Calendar, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts";
import { breakService, staffService, storeService } from "@/services";
import type { StaffBreak } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TimeOffDialog } from "@/components/staff/TimeOffDialog";

type SummaryCard = {
  title: string;
  value: string | number;
  helper?: string;
};

export function StaffSchedule() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  const {
    data: staffMember,
    isLoading: staffLoading,
    error: staffError,
  } = useQuery({
    queryKey: ["my-staff-member", store?.id, user?.id],
    queryFn: async () => {
      const staffMembers = await staffService.getStaffMembers(store!.id);
      return staffMembers.find((s) => s.userId === user?.id) ?? null;
    },
    enabled: !!store?.id && !!user?.id,
  });

  const {
    data: breaks = [],
    isLoading: breaksLoading,
    error: breaksError,
  } = useQuery({
    queryKey: ["staff-breaks", store?.id, staffMember?.id],
    queryFn: () => breakService.getStaffBreaks(store!.id, staffMember!.id),
    enabled: !!store?.id && !!staffMember?.id,
  });

  const isLoading = storeLoading || staffLoading || breaksLoading;

  const summaryCards: SummaryCard[] = useMemo(() => {
    const pending = breaks.filter((b) => b.status === "pending").length;
    const approved = breaks.filter((b) => b.status === "approved").length;

    const nextUpcoming = [...breaks]
      .filter(
        (b) => isFuture(parseISO(b.startDate)) || isToday(parseISO(b.startDate))
      )
      .sort((a, b) =>
        compareAsc(parseISO(a.startDate), parseISO(b.startDate))
      )[0];

    return [
      {
        title: "Pending",
        value: pending,
        helper: pending > 0 ? "Waiting for approval" : "No pending requests",
      },
      {
        title: "Approved",
        value: approved,
        helper: "Total approved requests",
      },
      {
        title: "Next day off",
        value: nextUpcoming
          ? format(parseISO(nextUpcoming.startDate), "MMM d")
          : "Not scheduled",
        helper: nextUpcoming ? nextUpcoming.status : "",
      },
    ];
  }, [breaks]);

  const formattedBreaks: StaffBreak[] = useMemo(
    () =>
      breaks.sort((a, b) =>
        compareAsc(parseISO(a.startDate), parseISO(b.startDate))
      ),
    [breaks]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!staffMember) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Staff kaydı bulunamadı.</AlertDescription>
      </Alert>
    );
  }

  const errorMessage = (staffError || breaksError) as Error | undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Off</h1>
          <p className="text-gray-600">
            Manage your leave requests and track your time-off balance.
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => setIsDialogOpen(true)}
          disabled={!staffMember}
        >
          <Plus className="h-4 w-4" />
          Request time off
        </Button>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <Card key={card.title} className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-700">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-baseline gap-2 text-gray-900">
                <span className="text-3xl font-bold">{card.value}</span>
                {card.helper && (
                  <span className="text-sm text-gray-600">{card.helper}</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-dashed">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
            <div>
              <CardTitle className="text-base">Requests</CardTitle>
              <p className="text-sm text-gray-600">
                Recent time-off submissions.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {formattedBreaks.map((req) => {
              const dateLabel =
                req.startDate === req.endDate
                  ? format(parseISO(req.startDate), "MMM d, yyyy")
                  : `${format(parseISO(req.startDate), "MMM d")} - ${format(
                      parseISO(req.endDate),
                      "MMM d, yyyy"
                    )}`;

              const timeLabel =
                req.startTime && req.endTime
                  ? `${req.startTime.substring(0, 5)} - ${req.endTime.substring(
                      0,
                      5
                    )}`
                  : "Full day";

              return (
                <div
                  key={req.id}
                  className="rounded-lg border px-3 py-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      {dateLabel}
                    </div>
                    <TimeOffStatusBadge status={req.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-800">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{timeLabel}</span>
                    {req.isRecurring && (
                      <span className="text-xs text-gray-500">Recurring</span>
                    )}
                  </div>
                  {req.reason && (
                    <div className="text-xs text-gray-600">{req.reason}</div>
                  )}
                </div>
              );
            })}

            {formattedBreaks.length === 0 && (
              <p className="text-sm text-gray-600">No requests yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <TimeOffDialog
        storeId={store!.id}
        staffId={staffMember.id}
        staffName={staffMember.fullName || user?.firstName || ""}
        timeOff={null}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
}
