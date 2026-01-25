import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, MapPin, CalendarDays } from "lucide-react";
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
import {
  AssignedServicesList,
  StaffProfileDialog,
  ServiceAssignmentDialog,
  WorkingHoursDialog,
  TimeOffList,
} from "./components";
import type { DayOfWeek } from "@/types";
import { useStaffDetails } from "./hooks/useStaffDetails";

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
  const navigate = useNavigate();
  const { state, actions, data } = useStaffDetails();
  const {
    isProfileDialogOpen,
    isServicesDialogOpen,
    isScheduleDialogOpen,
    isLoading,
    error,
    isValidStaffId,
  } = state;

  const {
    store,
    staff,
    staffServices,
    workingHours,
    categories,
    staffDisplayName,
  } = data;

  if (isLoading && !staff) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !isValidStaffId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/admin/staff")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Staff
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            {error ? "Failed to load staff details" : "Invalid staff ID"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!staff || !store) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/admin/staff")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Staff
        </Button>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Profile Sidebar */}
        <div className="w-full space-y-6 md:w-80">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={staff.avatar || undefined}
                    alt={staffDisplayName}
                  />
                  <AvatarFallback className="text-xl">
                    {staff.firstName?.[0]}
                    {staff.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-bold">{staffDisplayName}</h2>
                <p className="text-sm text-muted-foreground">
                  {staff.title || "Team Member"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Badge variant={staff.isVisible ? "default" : "secondary"}>
                    {staff.isVisible ? "Visible" : "Hidden"}
                  </Badge>
                  <Badge variant="outline">Member</Badge>
                </div>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{staff.email}</span>
                </div>
                {staff.locationName && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{staff.locationName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Staff since {new Date(staff.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Button
                className="mt-6 w-full"
                variant="outline"
                onClick={() => actions.setProfileDialogOpen(true)}
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Areas */}
        <div className="flex-1 space-y-6">
          <Tabs defaultValue="services" className="w-full">
            <TabsList>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="schedule">Working Hours</TabsTrigger>
              <TabsTrigger value="timeoff">Time Off</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="mt-6 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Assigned Services</CardTitle>
                    <CardDescription>
                      Services this staff member can perform
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => actions.setServicesDialogOpen(true)}
                  >
                    Manage Services
                  </Button>
                </CardHeader>
                <CardContent>
                  <AssignedServicesList
                    services={staffServices || []}
                    categories={categories || []}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="mt-6 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Working Hours</CardTitle>
                    <CardDescription>Default weekly schedule</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => actions.setScheduleDialogOpen(true)}
                  >
                    Edit Hours
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {DAY_LABELS.map((day) => {
                      const hours = workingHours?.find(
                        (h) => h.dayOfWeek === day.value,
                      );
                      return (
                        <div
                          key={day.value}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <span className="font-medium capitalize">
                            {day.label}
                          </span>
                          <div className="flex items-center gap-2">
                            {hours && hours.isActive ? (
                              <Badge variant="outline">
                                {hours.startTime.substring(0, 5)} -{" "}
                                {hours.endTime.substring(0, 5)}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Closed</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeoff" className="mt-6">
              <TimeOffList
                storeId={store.id}
                staffId={staff.id}
                staffName={staffDisplayName}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <StaffProfileDialog
        staff={staff}
        storeId={store.id}
        open={isProfileDialogOpen}
        onClose={() => actions.setProfileDialogOpen(false)}
      />

      <ServiceAssignmentDialog
        staff={staff}
        storeId={store.id}
        open={isServicesDialogOpen}
        onClose={() => actions.setServicesDialogOpen(false)}
      />

      <WorkingHoursDialog
        staff={staff}
        storeId={store.id}
        open={isScheduleDialogOpen}
        onClose={() => actions.setScheduleDialogOpen(false)}
      />
    </div>
  );
}
