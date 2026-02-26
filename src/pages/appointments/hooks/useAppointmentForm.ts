/**
 * useAppointmentForm Hook
 * Encapsulates the logic for the appointment creation and editing form.
 */

import { useEffect, useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
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
  customerName: z.string().min(1, "First name is required"),
  customerLastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().or(z.literal("")),
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
  const isEditing = !!appointment;
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const defaultFormValues: AppointmentFormData = useMemo(() => {
    if (appointment) {
      const startDate = new Date(appointment.startDateTime);
      return {
        serviceId: appointment.serviceId || "",
        staffId: appointment.staffId || "",
        locationId: appointment.locationId || undefined,
        customerName: appointment.customerName || "",
        customerLastName: appointment.customerLastName || "",
        email: appointment.email || "",
        phone: appointment.phone || "",
        date: startDate.toISOString().split("T")[0],
        time: startDate.toTimeString().slice(0, 5),
        numberOfPeople: appointment.numberOfPeople,
        customerNotes: appointment.customerNotes || "",
      };
    }

    return {
      serviceId: "",
      staffId: "",
      locationId: undefined,
      customerName: "",
      customerLastName: "",
      email: "",
      phone: "",
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
      numberOfPeople: 1,
      customerNotes: "",
    };
  }, [appointment]);

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
    enabled: true,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch locations
  const { data: locations } = useQuery({
    queryKey: ["locations", storeId],
    queryFn: () => locationService.getLocations(storeId),
    enabled: true,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Form setup
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    mode: "onBlur",
    defaultValues: defaultFormValues,
  });

  const { control, setValue, reset } = form;

  // Watch form values
  const watchServiceId = useWatch({ control, name: "serviceId" });
  const watchLocationId = useWatch({ control, name: "locationId" });
  const watchStaffId = useWatch({ control, name: "staffId" });
  const watchDate = useWatch({ control, name: "date" });
  const watchTime = useWatch({ control, name: "time" });

  // Fetch staff by selected service, then filter client-side by selected location
  const { data: staffByService } = useQuery({
    queryKey: ["staff-by-service", storeId, watchServiceId],
    queryFn: () =>
      staffService.getStaffMembers(storeId, {
        includeHidden: false,
        serviceId: watchServiceId || undefined,
      }),
    enabled: open && Boolean(watchServiceId),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const filteredLocations = useMemo(() => {
    if (!watchServiceId || !locations || !staffByService) {
      return [];
    }

    const availableLocationIds = new Set(
      staffByService
        .map((member) => member.locationId)
        .filter((id): id is string => Boolean(id)),
    );

    if (availableLocationIds.size === 0) {
      return locations;
    }

    return locations.filter((location) =>
      availableLocationIds.has(location.id),
    );
  }, [watchServiceId, locations, staffByService]);

  const filteredStaff = useMemo(() => {
    if (!watchServiceId || !staffByService) {
      return [];
    }

    if (!watchLocationId) {
      return staffByService;
    }

    return staffByService.filter(
      (member) => !member.locationId || member.locationId === watchLocationId,
    );
  }, [watchServiceId, watchLocationId, staffByService]);

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
      watchDate,
      appointment?.id ?? null,
    ],
    queryFn: () =>
      appointmentService.getAvailability({
        storeId,
        serviceId: watchServiceId,
        staffId: watchStaffId,
        date: watchDate,
        excludeAppointmentId: appointment?.id,
      }),
    enabled:
      open &&
      Boolean(watchDate) &&
      Boolean(watchServiceId) &&
      Boolean(watchStaffId),
    staleTime: 5 * 60 * 1000, // Increased to 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (open) {
      // Formu sıfırla
      reset(defaultFormValues);
    }
  }, [open, reset, defaultFormValues]);

  useEffect(() => {
    if (!open || !watchServiceId) {
      return;
    }

    if (watchLocationId) {
      const existsInServiceLocations = filteredLocations.some(
        (location) => location.id === watchLocationId,
      );

      if (!existsInServiceLocations) {
        setValue("locationId", undefined, { shouldDirty: true });
      }
    }
  }, [open, watchServiceId, watchLocationId, filteredLocations, setValue]);

  const availableSlots: AvailabilityTimeSlot[] = useMemo(
    () => availability?.slots?.filter((slot) => slot.available) ?? [],
    [availability],
  );
  const availableTimes = useMemo(
    () => availableSlots.map((slot) => slot.startTime),
    [availableSlots],
  );

  // Set default staff if current user is staff and no staff selected
  useEffect(() => {
    if (open && !isEditing && currentStaffMember?.id && !watchStaffId) {
      setValue("staffId", currentStaffMember.id);
    }
  }, [currentStaffMember, open, isEditing, watchStaffId, setValue]);

  // If a location is selected, ensure staff belongs to that location
  useEffect(() => {
    if (!open || !watchLocationId || !filteredStaff.length) return;

    const staffMatchesLocation = filteredStaff.some(
      (member) => member.id === watchStaffId,
    );

    if (watchStaffId && !staffMatchesLocation) {
      setValue("staffId", "", { shouldDirty: true });
    }
  }, [filteredStaff, open, setValue, watchLocationId, watchStaffId]);

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
      customerFirstName: data.customerName,
      customerLastName: data.customerLastName,
      customerEmail: data.email,
      customerPhone: data.phone || undefined,
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
      staff: filteredStaff,
      availableSlots,
      availableTimes,
      user,
    },
    actions: {
      onSubmit: form.handleSubmit(onSubmit),
      setValue,
    },
  };
}
