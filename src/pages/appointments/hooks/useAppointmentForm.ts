/**
 * useAppointmentForm Hook
 * Encapsulates the logic for the appointment creation and editing form.
 */

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export const appointmentSchema = z.object({
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

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface UseAppointmentFormProps {
  storeId: string;
  appointment?: Appointment | null;
  open: boolean;
  onClose: () => void;
}

export function useAppointmentForm({
  storeId,
  appointment,
  open,
  onClose,
}: UseAppointmentFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(!!appointment);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  // Update isEditing only when dialog opens
  useEffect(() => {
    if (open) {
      setIsEditing(!!appointment);
    }
  }, [open, appointment]);

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
  const form = useForm<AppointmentFormData>({
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

  const { reset, setValue, watch } = form;

  // Watch form values
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

  // Fetch ALL staff for the selected service to filter available locations
  const { data: allStaffForService } = useQuery({
    queryKey: ["staff-for-service", storeId, watchServiceId],
    queryFn: () =>
      staffService.getStaffMembers(storeId, {
        includeHidden: false,
        serviceId: watchServiceId || undefined,
      }),
    enabled: open && !!watchServiceId,
  });

  const filteredLocations = useMemo(() => {
    if (!watchServiceId || !allStaffForService || !locations) return locations;

    const availableLocationIds = new Set(
      allStaffForService
        .map((s) => s.locationId)
        .filter((id): id is string => Boolean(id)),
    );

    return locations.filter((location) =>
      availableLocationIds.has(location.id),
    );
  }, [locations, allStaffForService, watchServiceId]);

  const selectedService = useMemo(
    () => services?.find((s) => s.id === watchServiceId),
    [services, watchServiceId],
  );

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

  const availableSlots: AvailabilityTimeSlot[] = useMemo(
    () => availability?.slots?.filter((slot) => slot.available) ?? [],
    [availability],
  );
  const availableTimes = useMemo(
    () => availableSlots.map((slot) => slot.startTime),
    [availableSlots],
  );

  // Reset form when appointment changes
  useEffect(() => {
    if (appointment) {
      const startDate = new Date(appointment.startDateTime);
      reset({
        serviceId: appointment.serviceId || "",
        staffId: appointment.staffId || "",
        locationId: appointment.locationId || undefined,
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
  }, [appointment, reset, open]); // Removed currentStaffMember to prevent re-resetting on data load

  // Set default staff if current user is staff and no staff selected
  useEffect(() => {
    if (open && !isEditing && currentStaffMember?.id && !watchStaffId) {
      setValue("staffId", currentStaffMember.id);
    }
  }, [currentStaffMember, open, isEditing, watchStaffId, setValue]);

  // If a location is selected, ensure staff belongs to that location
  useEffect(() => {
    if (!open || !watchLocationId) return;

    const staffMatchesLocation = staff?.some(
      (member) => member.id === watchStaffId,
    );

    if (watchStaffId && !staffMatchesLocation) {
      setValue("staffId", "", { shouldDirty: true });
    }
  }, [staff, open, setValue, watchLocationId, watchStaffId]);

  // Ensure selected time is always one of the available times
  useEffect(() => {
    if (!open || !watchServiceId || !watchStaffId || !availability) return;

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

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateAppointmentDto) =>
      appointmentService.createAppointment(storeId, data),
    onSuccess: () => {
      invalidateAfterAppointmentChange(queryClient, storeId);
      onClose();
    },
  });

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

  return {
    form,
    state: {
      isEditing,
      isDatePopoverOpen,
      setIsDatePopoverOpen,
      isPending,
      isAvailabilityLoading,
      isAvailabilityError,
    },
    data: {
      services,
      locations: filteredLocations,
      staff,
      availableSlots,
      availableTimes,
      user,
    },
    actions: {
      onSubmit: form.handleSubmit(onSubmit),
      setValue,
      watch,
    },
  };
}
