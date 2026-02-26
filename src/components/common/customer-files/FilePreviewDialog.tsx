import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Loader2, Calendar, User, ShoppingBag } from "lucide-react";
import { type CustomerFile } from "@/services/customer-file.service";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface PreviewAppointment {
  id: string;
  startDateTime: string;
  serviceName: string | null;
  staffName: string | null;
}

interface FilePreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: CustomerFile | null;
  imageUrl: string | null;
  isLoading: boolean;
  appointment?: PreviewAppointment;
}

export function FilePreviewDialog({
  isOpen,
  onOpenChange,
  file,
  imageUrl,
  isLoading,
  appointment,
}: FilePreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {file?.originalName}
            {appointment && (
              <div className="mt-2 text-sm font-normal text-muted-foreground flex flex-wrap gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(
                      new Date(appointment.startDateTime),
                      "dd MMMM yyyy HH:mm",
                      { locale: tr },
                    )}
                  </span>
                </div>
                {appointment.serviceName && (
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="h-3 w-3" />
                    <span>{appointment.serviceName}</span>
                  </div>
                )}
                {appointment.staffName && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{appointment.staffName}</span>
                  </div>
                )}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          {file ? (
            <div className="flex items-center justify-center min-h-[300px]">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Önizleme hazırlanıyor...</span>
                </div>
              ) : file.fileType === "image" ? (
                imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={file.originalName}
                    className="max-h-[70vh] object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-muted-foreground">
                    Önizleme yüklenemedi
                  </div>
                )
              ) : file.fileType === "pdf" ? (
                imageUrl ? (
                  <iframe
                    src={`${imageUrl}#toolbar=0`}
                    className="w-full h-[70vh] rounded-lg border-0 bg-white"
                    title={file.originalName}
                  />
                ) : (
                  <div className="text-muted-foreground">
                    Önizleme yüklenemedi
                  </div>
                )
              ) : (
                <div className="text-muted-foreground text-center">
                  Bu dosya türü için önizleme desteklenmiyor
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground text-center">
              Önizleme için dosya seçin
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
