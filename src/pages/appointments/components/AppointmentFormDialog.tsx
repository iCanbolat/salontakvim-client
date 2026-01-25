/**
 * Appointment Form Dialog
 * Create or edit an appointment
 */

import { format } from "date-fns";
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
import { Controller } from "react-hook-form";
import { useAppointmentForm } from "../hooks/useAppointmentForm";
import type { Appointment } from "@/types";

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
    register,
    control,
    formState: { errors, isDirty },
  } = form;

  const { onSubmit, watch, setValue } = actions;

  const watchServiceId = watch("serviceId");
  const watchDate = watch("date");
  const watchStaffId = watch("staffId");

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

        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceId">
                Service <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="serviceId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services?.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - ${service.price} ({service.duration}{" "}
                          min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.serviceId && (
                <p className="text-sm text-red-600">
                  {errors.serviceId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationId">Location (optional)</Label>
              <Controller
                name="locationId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || "all"}
                    onValueChange={(value) =>
                      field.onChange(value === "all" ? undefined : value)
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
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staffId">
                Staff Member <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="staffId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={user?.role === "staff"}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.staffId && (
                <p className="text-sm text-red-600">{errors.staffId.message}</p>
              )}
            </div>

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
                <Controller
                  name="time"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
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
                />
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
