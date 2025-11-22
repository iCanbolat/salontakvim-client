/**
 * Appointment Form Dialog
 * Create or edit an appointment
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  appointmentService,
  serviceService,
  staffService,
  locationService,
} from "@/services";
import type { Appointment, CreateAppointmentDto } from "@/types";
import { invalidateAfterAppointmentChange } from "@/lib/invalidate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const appointmentSchema = z.object({
  serviceId: z.number().min(1, "Service is required"),
  staffId: z.number().min(1, "Staff member is required"),
  locationId: z.number().optional(),
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
  storeId: number;
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
  const queryClient = useQueryClient();
  const isEditing = !!appointment;

  // Fetch services
  const { data: services } = useQuery({
    queryKey: ["services", storeId],
    queryFn: () => serviceService.getServices(storeId),
    enabled: open,
  });

  // Fetch staff
  const { data: staff } = useQuery({
    queryKey: ["staff", storeId],
    queryFn: () => staffService.getStaffMembers(storeId),
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
    defaultValues: {
      serviceId: 0,
      staffId: 0,
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
  const watchStaffId = watch("staffId");
  const watchLocationId = watch("locationId");

  // Reset form when appointment changes
  useEffect(() => {
    if (appointment) {
      const startDate = new Date(appointment.startDateTime);
      reset({
        serviceId: appointment.serviceId || 0,
        staffId: appointment.staffId || 0,
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
        serviceId: 0,
        staffId: 0,
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
  }, [appointment, reset]);

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="serviceId">
              Service <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchServiceId?.toString()}
              onValueChange={(value) =>
                setValue("serviceId", parseInt(value), { shouldDirty: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services?.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name} - ${service.price} ({service.duration} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceId && (
              <p className="text-sm text-red-600">{errors.serviceId.message}</p>
            )}
          </div>

          {/* Staff Selection */}
          <div className="space-y-2">
            <Label htmlFor="staffId">
              Staff Member <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchStaffId?.toString()}
              onValueChange={(value) =>
                setValue("staffId", parseInt(value), { shouldDirty: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff?.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.firstName} {member.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.staffId && (
              <p className="text-sm text-red-600">{errors.staffId.message}</p>
            )}
          </div>

          {/* Location Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="locationId">Location (optional)</Label>
            <Select
              value={watchLocationId?.toString() || ""}
              onValueChange={(value) =>
                setValue("locationId", value ? parseInt(value) : undefined, {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((location) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Input id="date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">
                Time <span className="text-red-500">*</span>
              </Label>
              <Input id="time" type="time" {...register("time")} />
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
