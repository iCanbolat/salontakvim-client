/**
 * Appointment Form Dialog
 * Create or edit an appointment
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useAuth } from "@/contexts";
import {
  appointmentService,
  serviceService,
  staffService,
  locationService,
} from "@/services";
import type {
  Appointment,
  CreateAppointmentDto,
  AvailabilityTimeSlot,
  AvailabilityResponse,
} from "@/types";
import { invalidateAfterAppointmentChange } from "@/lib/invalidate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const appointmentSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  staffId: z.string().min(1, "Staff member is required"),
  locationId: z.string().optional(),
  guestFirstName: z.string().min(1, "First name is required"),
  guestLastName: z.string().min(1, "Last name is required"),
  guestEmail: z.string().email("Invalid email address"),
  guestPhone: z.string().optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  numberOfPeople: z.number().min(1).max(10),
  customerNotes: z.string().optional().or(z.literal("")),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormDialogProps {
  storeId: string;
  appointment?: Appointment | null;
  open: boolean;
  onClose: () => void;
}

export function AppointmentFormDialog({
  storeId,
  appointment,
  open,
  onClose,
}: AppointmentFormDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(!!appointment);

  // Update isEditing only when dialog opens to prevent flickering on close
  useEffect(() => {
    if (open) {
      setIsEditing(!!appointment);
    }
  }, [open, appointment]);

  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  // Fetch staff member record if user is staff
  const { data: currentStaffMember } = useQuery({
    queryKey: ["my-staff-member", storeId, user?.id],
    queryFn: async () => {
      const staffMembers = await staffService.getStaffMembers(storeId);
      return staffMembers.find((s) => s.userId === user?.id);
    },
    enabled: open && user?.role === "staff",
  });

  // Fetch services
  const { data: services } = useQuery({
    queryKey: ["services", storeId],
    queryFn: () => serviceService.getServices(storeId),
    enabled: open,
  });

  // Fetch locations
  const { data: locations } = useQuery({
    queryKey: ["locations", storeId],
    queryFn: () => locationService.getLocations(storeId),
    enabled: open,
  });

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    mode: "onBlur",
    defaultValues: {
      serviceId: "",
      staffId: "",
      locationId: undefined,
      guestFirstName: "",
      guestLastName: "",
      guestEmail: "",
      guestPhone: "",
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
      numberOfPeople: 1,
      customerNotes: "",
    },
  });

  // Watch form values for controlled components
  const watchServiceId = watch("serviceId");
  const watchLocationId = watch("locationId");
  const watchStaffId = watch("staffId");
  const watchDate = watch("date");
  const watchTime = watch("time");

  // Fetch staff (filtered server-side by service/location)
  const { data: staff } = useQuery({
    queryKey: ["staff", storeId, watchServiceId, watchLocationId],
    queryFn: () =>
      staffService.getStaffMembers(storeId, {
        includeHidden: false,
        serviceId: watchServiceId || undefined,
        locationId: watchLocationId,
      }),
    enabled: open,
  });

  const selectedService = services?.find((s) => s.id === watchServiceId);

  const filteredStaff = staff;

  const {
    data: availability,
    isFetching: isAvailabilityLoading,
    isError: isAvailabilityError,
  } = useQuery<AvailabilityResponse>({
    queryKey: [
      "availability",
      storeId,
      watchServiceId,
      watchStaffId,
      watchLocationId,
      watchDate,
      appointment?.id ?? null,
    ],
    queryFn: () =>
      appointmentService.getAvailability({
        storeId,
        serviceId: watchServiceId,
        staffId: watchStaffId,
        date: watchDate,
        locationId: watchLocationId,
        excludeAppointmentId: appointment?.id,
      }),
    enabled:
      open &&
      Boolean(watchDate) &&
      Boolean(watchServiceId) &&
      Boolean(watchStaffId) &&
      Boolean(selectedService),
  });

  const availableSlots: AvailabilityTimeSlot[] =
    availability?.slots?.filter((slot) => slot.available) ?? [];
  const availableTimes = availableSlots.map((slot) => slot.startTime);

  // Reset form when appointment changes
  useEffect(() => {
    if (appointment) {
      const startDate = new Date(appointment.startDateTime);
      reset({
        serviceId: appointment.serviceId || "",
        staffId: appointment.staffId || "",
        locationId: appointment.locationId,
        guestFirstName: appointment.guestInfo?.firstName || "",
        guestLastName: appointment.guestInfo?.lastName || "",
        guestEmail: appointment.guestInfo?.email || "",
        guestPhone: appointment.guestInfo?.phone || "",
        date: startDate.toISOString().split("T")[0],
        time: startDate.toTimeString().slice(0, 5),
        numberOfPeople: appointment.numberOfPeople,
        customerNotes: appointment.customerNotes || "",
      });
    } else {
      reset({
        serviceId: "",
        staffId: currentStaffMember?.id || "",
        locationId: undefined,
        guestFirstName: "",
        guestLastName: "",
        guestEmail: "",
        guestPhone: "",
        date: new Date().toISOString().split("T")[0],
        time: "09:00",
        numberOfPeople: 1,
        customerNotes: "",
      });
    }
  }, [appointment, reset, open, currentStaffMember]);

  // If a location is selected, ensure staff belongs to that location; otherwise reset staff.
  useEffect(() => {
    if (!open) return;
    if (!watchLocationId) return; // no filter when location not chosen

    const staffMatchesLocation = filteredStaff?.some(
      (member) => member.id === watchStaffId,
    );

    if (watchStaffId && !staffMatchesLocation) {
      setValue("staffId", "", { shouldDirty: true });
    }
  }, [filteredStaff, open, setValue, watchLocationId, watchStaffId]);

  // Ensure selected time is always one of the available times
  useEffect(() => {
    if (!open) return;
    if (!watchServiceId || !watchStaffId) return;

    // If availability not loaded yet, don't touch user selection.
    if (!availability) return;

    if (availableTimes.length === 0) {
      if (watchTime) {
        setValue("time", "", { shouldDirty: true });
      }
      return;
    }

    if (!availableTimes.includes(watchTime)) {
      setValue("time", availableTimes[0], { shouldDirty: true });
    }
  }, [
    availability,
    availableTimes,
    open,
    setValue,
    watchServiceId,
    watchStaffId,
    watchTime,
  ]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateAppointmentDto) =>
      appointmentService.createAppointment(storeId, data),
    onSuccess: () => {
      invalidateAfterAppointmentChange(queryClient, storeId);
      onClose();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: CreateAppointmentDto) =>
      appointmentService.updateAppointment(storeId, appointment!.id, {
        serviceId: data.serviceId,
        staffId: data.staffId,
        locationId: data.locationId,
        startDateTime: data.startDateTime,
        numberOfPeople: data.numberOfPeople,
        customerNotes: data.customerNotes,
      }),
    onSuccess: () => {
      invalidateAfterAppointmentChange(queryClient, storeId);
      onClose();
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    // Combine date and time
    const startDateTime = `${data.date}T${data.time}:00`;

    const appointmentData: CreateAppointmentDto = {
      serviceId: data.serviceId,
      staffId: data.staffId,
      locationId: data.locationId,
      guestFirstName: data.guestFirstName,
      guestLastName: data.guestLastName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone || undefined,
      startDateTime,
      numberOfPeople: data.numberOfPeople,
      customerNotes: data.customerNotes || undefined,
    };

    if (isEditing) {
      updateMutation.mutate(appointmentData);
    } else {
      createMutation.mutate(appointmentData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Appointment" : "Create New Appointment"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update appointment details"
              : "Schedule a new appointment for a customer"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          <DialogBody className="space-y-4">
            {/* Service Selection */}
            <div className="space-y-2">
              <Label htmlFor="serviceId">
                Service <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchServiceId || undefined}
                onValueChange={(value) =>
                  setValue("serviceId", value, { shouldDirty: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services?.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - ${service.price} ({service.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceId && (
                <p className="text-sm text-red-600">
                  {errors.serviceId.message}
                </p>
              )}
            </div>

            {/* Location Selection (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="locationId">Location (optional)</Label>
              <Select
                value={watchLocationId || ""}
                onValueChange={(value) =>
                  setValue(
                    "locationId",
                    value && value !== "all" ? value : undefined,
                    {
                      shouldDirty: true,
                    },
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Staff Selection */}
            <div className="space-y-2">
              <Label htmlFor="staffId">
                Staff Member <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchStaffId || undefined}
                onValueChange={(value) =>
                  setValue("staffId", value, { shouldDirty: true })
                }
                disabled={user?.role === "staff"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStaff?.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.staffId && (
                <p className="text-sm text-red-600">{errors.staffId.message}</p>
              )}
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guestFirstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="guestFirstName"
                  {...register("guestFirstName")}
                  placeholder="John"
                />
                {errors.guestFirstName && (
                  <p className="text-sm text-red-600">
                    {errors.guestFirstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestLastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="guestLastName"
                  {...register("guestLastName")}
                  placeholder="Doe"
                />
                {errors.guestLastName && (
                  <p className="text-sm text-red-600">
                    {errors.guestLastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guestEmail">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="guestEmail"
                  type="email"
                  {...register("guestEmail")}
                  placeholder="john@example.com"
                />
                {errors.guestEmail && (
                  <p className="text-sm text-red-600">
                    {errors.guestEmail.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestPhone">Phone (optional)</Label>
                <Input
                  id="guestPhone"
                  {...register("guestPhone")}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Popover
                  open={isDatePopoverOpen}
                  onOpenChange={setIsDatePopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watchDate ? (
                        format(new Date(watchDate), "MMM dd")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchDate ? new Date(watchDate) : undefined}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      onSelect={(date) => {
                        if (date) {
                          setValue("date", format(date, "yyyy-MM-dd"), {
                            shouldDirty: true,
                          });
                          setIsDatePopoverOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && (
                  <p className="text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">
                  Time <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watchTime}
                  onValueChange={(value) =>
                    setValue("time", value, { shouldDirty: true })
                  }
                  disabled={
                    !watchServiceId ||
                    !watchStaffId ||
                    !watchDate ||
                    isAvailabilityLoading ||
                    availableTimes.length === 0
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        !watchServiceId || !watchStaffId
                          ? "Select service & staff"
                          : isAvailabilityLoading
                            ? "Loading..."
                            : availableTimes.length === 0
                              ? "No availability"
                              : "Select time"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot.startTime} value={slot.startTime}>
                        {slot.startTime} – {slot.endTime}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isAvailabilityError && (
                  <p className="text-sm text-red-600">
                    Failed to load availability
                  </p>
                )}
                {errors.time && (
                  <p className="text-sm text-red-600">{errors.time.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfPeople">Number of People</Label>
                <Input
                  id="numberOfPeople"
                  type="number"
                  min="1"
                  max="10"
                  {...register("numberOfPeople", { valueAsNumber: true })}
                />
                {errors.numberOfPeople && (
                  <p className="text-sm text-red-600">
                    {errors.numberOfPeople.message}
                  </p>
                )}
              </div>
            </div>
            {/* Customer Notes */}
            <div className="space-y-2">
              <Label htmlFor="customerNotes">Customer Notes</Label>
              <Textarea
                id="customerNotes"
                {...register("customerNotes")}
                placeholder="Any special requests or notes..."
                rows={3}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update Appointment"
              ) : (
                "Create Appointment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
