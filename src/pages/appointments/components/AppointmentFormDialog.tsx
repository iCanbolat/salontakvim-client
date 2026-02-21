/**
 * Appointment Form Dialog
 * Create or edit an appointment
 */

import { format } from "date-fns";
import { memo } from "react";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useWatch } from "react-hook-form";
import { useAppointmentForm } from "../hooks/useAppointmentForm";
import type { Appointment } from "@/types";

interface AppointmentFormDialogProps {
  storeId: string;
  appointment?: Appointment | null;
  open: boolean;
  onClose: () => void;
}

export const AppointmentFormDialog = memo(function AppointmentFormDialog({
  storeId,
  appointment,
  open,
  onClose,
}: AppointmentFormDialogProps) {
  const { form, state, data, actions } = useAppointmentForm({
    storeId,
    appointment,
    open,
    onClose,
  });

  const {
    isEditing,
    isDatePopoverOpen,
    setIsDatePopoverOpen,
    isPending,
    isAvailabilityLoading,
    isAvailabilityError,
  } = state;

  const { services, locations, staff, availableSlots, availableTimes, user } =
    data;

  const {
    control,
    formState: { isDirty },
  } = form;

  const { onSubmit, setValue } = actions;

  const watchServiceId = useWatch({ control, name: "serviceId" });
  const watchDate = useWatch({ control, name: "date" });
  const watchStaffId = useWatch({ control, name: "staffId" });

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

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
            <DialogBody className="space-y-4">
              <FormField
                control={control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Service <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setValue("locationId", undefined, {
                          shouldDirty: true,
                        });
                        setValue("staffId", "", { shouldDirty: true });
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services?.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - ${service.price} (
                            {service.duration} min)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (optional)</FormLabel>
                    <Select
                      value={field.value || "all"}
                      onValueChange={(value) => {
                        field.onChange(value === "all" ? undefined : value);
                        setValue("staffId", "", { shouldDirty: true });
                      }}
                      disabled={!watchServiceId}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              watchServiceId
                                ? "Select a location"
                                : "Select a service first"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All locations</SelectItem>
                        {locations?.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="staffId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Staff Member <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={user?.role === "staff" || !watchServiceId}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              watchServiceId
                                ? "Select a staff member"
                                : "Select a service first"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staff?.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.firstName} {member.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="customerLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Last Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <Popover
                        open={isDatePopoverOpen}
                        onOpenChange={setIsDatePopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
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
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              watchDate ? new Date(watchDate) : undefined
                            }
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(format(date, "yyyy-MM-dd"));
                                setIsDatePopoverOpen(false);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Time <span className="text-red-500">*</span>
                      </FormLabel>
                      {isAvailabilityLoading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={
                            !watchServiceId ||
                            !watchStaffId ||
                            !watchDate ||
                            availableTimes.length === 0
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={
                                  !watchServiceId || !watchStaffId
                                    ? "Select service & staff"
                                    : availableTimes.length === 0
                                      ? "No availability"
                                      : "Select time"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableSlots.map((slot) => (
                              <SelectItem
                                key={slot.startTime}
                                value={slot.startTime}
                              >
                                {slot.startTime} – {slot.endTime}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {isAvailabilityError && (
                        <p className="text-sm text-red-600">
                          Failed to load availability
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="numberOfPeople"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of People</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="customerNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special requests or notes..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
        </Form>
      </DialogContent>
    </Dialog>
  );
});

AppointmentFormDialog.displayName = "AppointmentFormDialog";
