/**
 * useAppointmentForm Hook
 * Encapsulates the logic for the appointment creation and editing form.
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/contexts";
import {
  appointmentService,
  customerService,
  serviceService,
  staffService,
  locationService,
} from "@/services";
import type {
  Appointment,
  CustomerWithStats,
  CreateAppointmentDto,
  AvailabilityTimeSlot,
  AvailabilityResponse,
  PaginatedResponse,
} from "@/types";
import { useDebouncedSearch } from "@/hooks";
import { invalidateAfterAppointmentChange } from "@/lib/invalidate";
import { qk } from "@/lib/query-keys";

const appointmentBaseSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  staffId: z.string().min(1, "Staff member is required"),
  locationId: z.string().optional(),
  phone: z.string().optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  numberOfPeople: z.number().min(1).max(10),
  customerNotes: z.string().optional().or(z.literal("")),
});

const existingCustomerSchema = appointmentBaseSchema.extend({
  isNewCustomer: z.literal(false),
  customerId: z.string().min(1, "Customer is required"),
  customerName: z.string().optional(),
  customerLastName: z.string().optional(),
  email: z.string().optional().or(z.literal("")),
});

const newCustomerSchema = appointmentBaseSchema.extend({
  isNewCustomer: z.literal(true),
  customerId: z.string().optional(),
  customerName: z.string().min(1, "First name is required"),
  customerLastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

export const appointmentSchema = z.discriminatedUnion("isNewCustomer", [
  existingCustomerSchema,
  newCustomerSchema,
]);

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
  const [deferredQueriesReady, setDeferredQueriesReady] = useState(false);
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedCustomerSearch = useDebouncedSearch(customerSearch, {
    delay: 400,
    minLength: 2,
  });
  const normalizedCustomerSearch = customerSearch.trim();

  const defaultFormValues: AppointmentFormData = useMemo(() => {
    if (appointment) {
      const startDate = new Date(appointment.startDateTime);
      return {
        serviceId: appointment.serviceId || "",
        staffId: appointment.staffId || "",
        locationId: appointment.locationId || undefined,
        isNewCustomer: !appointment.customerId,
        customerId: appointment.customerId || "",
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
      isNewCustomer: true,
      customerId: "",
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
    queryKey: qk.myStaffMember(storeId, user?.id),
    queryFn: async () => {
      const staffMembers = await staffService.getStaffMembers(storeId);
      return staffMembers.find((s) => s.userId === user?.id);
    },
    enabled: open && user?.role === "staff",
  });

  // Fetch services
  const { data: services } = useQuery({
    queryKey: qk.services(storeId),
    queryFn: () => serviceService.getServices(storeId),
    enabled: true,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch locations
  const { data: locations } = useQuery({
    queryKey: qk.locations(storeId),
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

  const { control, setValue, reset, getValues } = form;

  // Watch form values
  const watchServiceId = useWatch({ control, name: "serviceId" });
  const watchLocationId = useWatch({ control, name: "locationId" });
  const watchStaffId = useWatch({ control, name: "staffId" });
  const watchDate = useWatch({ control, name: "date" });
  const watchTime = useWatch({ control, name: "time" });
  const watchIsNewCustomer = useWatch({ control, name: "isNewCustomer" });
  const watchCustomerId = useWatch({ control, name: "customerId" });

  // Defer non-critical queries to keep dialog open transition smooth.
  useEffect(() => {
    if (!open) {
      setDeferredQueriesReady(false);
      setIsCustomerSelectOpen(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setDeferredQueriesReady(true);
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [open, appointment?.id]);

  useEffect(() => {
    if (watchIsNewCustomer && isCustomerSelectOpen) {
      setIsCustomerSelectOpen(false);
    }
  }, [watchIsNewCustomer, isCustomerSelectOpen]);

  // Fetch customers for existing-customer selection (lazy + deferred)
  const {
    data: customersResponse,
    isPending: isCustomersPending,
    isFetching: isCustomersFetching,
  } = useQuery<PaginatedResponse<CustomerWithStats>>({
    queryKey: qk.appointmentFormCustomers(storeId, debouncedCustomerSearch),
    queryFn: () =>
      customerService.getCustomers(storeId, {
        page: 1,
        limit: 50,
        search: debouncedCustomerSearch || undefined,
      }),
    enabled:
      open &&
      deferredQueriesReady &&
      !watchIsNewCustomer &&
      (isCustomerSelectOpen || normalizedCustomerSearch.length >= 2),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const isCustomerSearchDebouncing =
    normalizedCustomerSearch.length >= 2 &&
    debouncedCustomerSearch !== normalizedCustomerSearch;

  const isCustomersInitialLoading =
    isCustomerSelectOpen && isCustomersPending && !customersResponse;
  const isCustomersSearching =
    isCustomerSearchDebouncing ||
    (isCustomersFetching && !isCustomersInitialLoading);

  const customers = useMemo<CustomerWithStats[]>(
    () => customersResponse?.data ?? [],
    [customersResponse],
  );

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label:
          `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
          customer.email ||
          "Customer",
        description: customer.phone || customer.email || undefined,
      })),
    [customers],
  );

  const onCustomerSearchChange = useCallback((value: string) => {
    setCustomerSearch(value);
  }, []);

  const onCustomerSelectOpenChange = useCallback((nextOpen: boolean) => {
    setIsCustomerSelectOpen(nextOpen);

    if (!nextOpen) {
      setCustomerSearch("");
    }
  }, []);

  // Fetch staff by selected service, then filter client-side by selected location
  const { data: staffByService } = useQuery({
    queryKey: qk.staffByService(storeId, watchServiceId),
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
    queryKey: qk.availability(
      storeId,
      watchServiceId,
      watchStaffId,
      watchDate,
      appointment?.id ?? null,
    ),
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
      deferredQueriesReady &&
      Boolean(watchDate) &&
      Boolean(watchServiceId) &&
      Boolean(watchStaffId),
    staleTime: 5 * 60 * 1000, // Increased to 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    // Reset only when dialog opens or a different appointment is loaded.
    reset(defaultFormValues);
  }, [open, appointment?.id, reset]);

  useEffect(() => {
    if (!open || watchIsNewCustomer || !watchCustomerId) {
      return;
    }

    const selectedCustomer = customers.find(
      (customer) => customer.id === watchCustomerId,
    );

    if (!selectedCustomer) {
      return;
    }

    const currentValues = getValues();
    const nextFirstName = selectedCustomer.firstName || "";
    const nextLastName = selectedCustomer.lastName || "";
    const nextEmail = selectedCustomer.email || "";
    const nextPhone = selectedCustomer.phone || "";

    if (currentValues.customerName !== nextFirstName) {
      setValue("customerName", nextFirstName, { shouldDirty: true });
    }
    if (currentValues.customerLastName !== nextLastName) {
      setValue("customerLastName", nextLastName, { shouldDirty: true });
    }
    if (currentValues.email !== nextEmail) {
      setValue("email", nextEmail, { shouldDirty: true });
    }
    if (currentValues.phone !== nextPhone) {
      setValue("phone", nextPhone, { shouldDirty: true });
    }
  }, [
    customers,
    getValues,
    open,
    setValue,
    watchCustomerId,
    watchIsNewCustomer,
  ]);

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
      startDateTime,
      numberOfPeople: data.numberOfPeople,
      customerNotes: data.customerNotes || undefined,
    };

    if (!data.isNewCustomer && data.customerId) {
      appointmentData.customerId = data.customerId;
    } else {
      appointmentData.customerFirstName = data.customerName?.trim();
      appointmentData.customerLastName = data.customerLastName?.trim();
      appointmentData.customerEmail = data.email?.trim();
      appointmentData.customerPhone = data.phone || undefined;
    }

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
      customers,
      customerOptions,
      isCustomersInitialLoading,
      isCustomersSearching,
      user,
    },
    watched: {
      serviceId: watchServiceId,
      staffId: watchStaffId,
      locationId: watchLocationId,
      date: watchDate,
      isNewCustomer: watchIsNewCustomer,
    },
    actions: {
      onSubmit: form.handleSubmit(onSubmit),
      setValue,
      onCustomerSearchChange,
      onCustomerSelectOpenChange,
    },
  };
}
