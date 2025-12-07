import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Mail, MapPin, CalendarDays } from "lucide-react";
import { staffService, storeService, categoryService } from "@/services";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import {
  AssignedServicesList,
  StaffProfileDialog,
  ServiceAssignmentDialog,
  WorkingHoursDialog,
  TimeOffList,
} from "@/components/staff";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { WorkingHours, DayOfWeek } from "@/types";

const DAY_LABELS: { value: DayOfWeek; label: string }[] = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export function StaffDetails() {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreadcrumbLabel, clearBreadcrumbLabel } = useBreadcrumb();
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isServicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const parsedStaffId = Number(staffId);
  const isValidStaffId = Number.isInteger(parsedStaffId) && parsedStaffId > 0;

  const {
    data: store,
    isLoading: storeLoading,
    error: storeError,
  } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  const staffQuery = useQuery({
    queryKey: ["staff-member", store?.id, parsedStaffId],
    queryFn: () => staffService.getStaffMember(store!.id, parsedStaffId),
    enabled: Boolean(store?.id && isValidStaffId),
  });

  const staffServicesQuery = useQuery({
    queryKey: ["staff-services", store?.id, parsedStaffId],
    queryFn: () => staffService.getStaffServices(store!.id, parsedStaffId),
    enabled: Boolean(store?.id && isValidStaffId),
  });

  const workingHoursQuery = useQuery({
    queryKey: ["working-hours", store?.id, parsedStaffId],
    queryFn: () => staffService.getWorkingHours(store!.id, parsedStaffId),
    enabled: Boolean(store?.id && isValidStaffId),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", store?.id],
    queryFn: () => categoryService.getCategories(store!.id),
    enabled: Boolean(store?.id),
    staleTime: 1000 * 60 * 5,
  });

  const staff = staffQuery.data;

  const staffDisplayName =
    staff?.fullName?.trim() ||
    `${staff?.firstName ?? ""} ${staff?.lastName ?? ""}`.trim() ||
    staff?.email ||
    "Staff";

  useEffect(() => {
    if (!staff) {
      return () => {
        clearBreadcrumbLabel(location.pathname);
      };
    }

    setBreadcrumbLabel(location.pathname, staffDisplayName);

    return () => {
      clearBreadcrumbLabel(location.pathname);
    };
  }, [
    staff,
    staffDisplayName,
    location.pathname,
    setBreadcrumbLabel,
    clearBreadcrumbLabel,
  ]);

  if (!isValidStaffId) {
    return (
      <div className="space-y-6">
        <Button onClick={() => navigate("/admin/staff")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Staff
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Invalid staff identifier. Please return to the staff list.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (storeLoading || staffQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (storeError || staffQuery.isError || !store) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/admin/staff")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Staff
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load staff details. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/admin/staff")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Staff
        </Button>
        <Alert>
          <AlertDescription>Staff member not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const initials = `${staff.firstName?.[0] || ""}${
    staff.lastName?.[0] || ""
  }`.toUpperCase();

  const assignedServices = staffServicesQuery.data || [];
  const assignedServiceCount = assignedServices.length;
  const activeDayCount = workingHoursQuery.data?.filter(
    (h) => h.isActive
  ).length;
  const joinedDate = staff.createdAt
    ? new Date(staff.createdAt).toLocaleDateString()
    : "-";

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/admin/staff")}
        className="w-fit text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Staff
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {staff.avatar && (
                <AvatarImage src={staff.avatar} alt={staffDisplayName} />
              )}
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-semibold">
                {initials || "ST"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {staffDisplayName}
                </h2>
                <Badge variant={staff.isVisible ? "default" : "secondary"}>
                  {staff.isVisible ? "Visible" : "Hidden"}
                </Badge>
              </div>
              <p className="text-gray-600">
                {staff.title || "Title not specified"}
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Mail className="h-4 w-4" /> {staff.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            <SummaryStat
              label="Assigned Services"
              value={assignedServiceCount}
            />
            <SummaryStat
              label="Active Days"
              value={`${activeDayCount ?? 0}/7`}
            />
            <SummaryStat
              label="Location"
              value={staff.locationName || "Not set"}
            />
            <SummaryStat label="Since" value={joinedDate} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="timeoff">Time Off</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Basic details about this staff member
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setProfileDialogOpen(true)}>
                Edit Profile
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoRow
                  label="Email"
                  value={staff.email || "-"}
                  icon={<Mail className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow
                  label="Location"
                  value={staff.locationName || "Not assigned"}
                  icon={<MapPin className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow label="Title" value={staff.title || "Not set"} />
                <InfoRow
                  label="Member Since"
                  value={joinedDate}
                  icon={<CalendarDays className="h-4 w-4 text-gray-500" />}
                />
              </div>
              {staff.bio && (
                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {staff.bio}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardContent className="p-6">
              <AssignedServicesList
                services={assignedServices}
                categories={categoriesQuery.data}
                isLoading={staffServicesQuery.isLoading}
                onManageAssignments={() => setServicesDialogOpen(true)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardContent className="p-6">
              <WorkingHoursSummary
                workingHours={workingHoursQuery.data}
                isLoading={workingHoursQuery.isLoading}
                onManage={() => setScheduleDialogOpen(true)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeoff">
          <Card>
            <CardContent className="p-6">
              <TimeOffList
                storeId={store.id}
                staffId={staff.id}
                staffName={staffDisplayName}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isProfileDialogOpen && (
        <StaffProfileDialog
          storeId={store.id}
          staff={staff}
          open={isProfileDialogOpen}
          onClose={() => setProfileDialogOpen(false)}
        />
      )}

      {isServicesDialogOpen && (
        <ServiceAssignmentDialog
          storeId={store.id}
          staff={staff}
          open={isServicesDialogOpen}
          onClose={() => setServicesDialogOpen(false)}
        />
      )}

      {isScheduleDialogOpen && (
        <WorkingHoursDialog
          storeId={store.id}
          staff={staff}
          open={isScheduleDialogOpen}
          onClose={() => setScheduleDialogOpen(false)}
        />
      )}
    </div>
  );
}

interface SummaryStatProps {
  label: string;
  value: string | number;
}

function SummaryStat({ label, value }: SummaryStatProps) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function InfoRow({ label, value, icon }: InfoRowProps) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-1 flex items-center gap-2 text-sm text-gray-900">
        {icon}
        <span>{value}</span>
      </div>
    </div>
  );
}

interface WorkingHoursSummaryProps {
  workingHours?: WorkingHours[];
  isLoading?: boolean;
  onManage: () => void;
}

function WorkingHoursSummary({
  workingHours,
  isLoading,
  onManage,
}: WorkingHoursSummaryProps) {
  const hoursMap = useMemo(() => {
    const map = new Map<DayOfWeek, WorkingHours>();
    workingHours?.forEach((entry) => {
      map.set(entry.dayOfWeek, entry);
    });
    return map;
  }, [workingHours]);

  const formatTime = (value: string | null | undefined) =>
    value ? value.substring(0, 5) : "--:--";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Weekly Schedule
          </h3>
          <p className="text-sm text-gray-600">
            Overview of working hours by day
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onManage}>
          Manage Working Hours
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {DAY_LABELS.map((day) => {
          const entry = hoursMap.get(day.value);
          const isActive = Boolean(entry?.isActive);
          return (
            <div
              key={day.value}
              className={`flex items-center justify-between rounded-lg border p-4 ${
                isActive ? "border-blue-200 bg-blue-50" : "border-gray-200"
              }`}
            >
              <div>
                <p className="font-medium text-gray-900">{day.label}</p>
                <p className="text-sm text-gray-600">
                  {isActive && entry
                    ? `${formatTime(entry.startTime)} - ${formatTime(
                        entry.endTime
                      )}`
                    : "Closed"}
                </p>
              </div>
              <Badge variant={isActive ? "default" : "outline"}>
                {isActive ? "Active" : "Closed"}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StaffDetails;
