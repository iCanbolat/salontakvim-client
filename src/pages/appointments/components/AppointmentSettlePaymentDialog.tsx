import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import type { Appointment } from "@/types";

const settlePaymentSchema = z.object({
  finalTotalPrice: z.number().min(0, "Price must be at least 0"),
  markAsPaid: z.boolean(),
});

type SettlePaymentFormValues = z.infer<typeof settlePaymentSchema>;

interface AppointmentSettlePaymentDialogProps {
  appointment: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettle: (data: SettlePaymentFormValues) => void;
  isPending: boolean;
}

export function AppointmentSettlePaymentDialog({
  appointment,
  open,
  onOpenChange,
  onSettle,
  isPending,
}: AppointmentSettlePaymentDialogProps) {
  const form = useForm<SettlePaymentFormValues>({
    resolver: zodResolver(settlePaymentSchema),
    defaultValues: {
      finalTotalPrice: Number(appointment.totalPrice || 0),
      markAsPaid: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        finalTotalPrice: Number(appointment.totalPrice || 0),
        markAsPaid: true,
      });
    }
  }, [open, appointment, form]);

  const onSubmit = (data: SettlePaymentFormValues) => {
    onSettle(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settle Payment</DialogTitle>
          <DialogDescription>
            Update the final price and payment details for appointment #
            {appointment.publicNumber}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="finalTotalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final Total Price</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-7"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="markAsPaid"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mark as Paid</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This will record the appointment as fully paid.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </DialogBody>

            <DialogFooter className="pt-6 mt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Settlement
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
