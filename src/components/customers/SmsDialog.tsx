import { useState, useEffect } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { CustomerWithStats } from "@/types";

interface SmsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomers: CustomerWithStats[];
  onSend: (message: string) => Promise<void>;
  isSending: boolean;
}

export function SmsDialog({
  isOpen,
  onClose,
  selectedCustomers,
  onSend,
  isSending,
}: SmsDialogProps) {
  const [message, setMessage] = useState("");

  // Reset message when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setMessage("");
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(message);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send SMS</DialogTitle>
          <DialogDescription>
            Send an SMS message to {selectedCustomers.length} selected customer
            {selectedCustomers.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="space-y-2">
            <Label>Recipients</Label>
            <div className="flex flex-wrap gap-2">
              {selectedCustomers.slice(0, 5).map((customer) => (
                <div
                  key={customer.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                >
                  {customer.firstName} {customer.lastName}
                </div>
              ))}
              {selectedCustomers.length > 5 && (
                <div className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  +{selectedCustomers.length - 5} more
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              {message.length} / 160 characters
            </p>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!message.trim() || isSending}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send SMS
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
