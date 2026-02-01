import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { type CustomerFile } from "@/services/customer-file.service";

interface FilePreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: CustomerFile | null;
  imageUrl: string | null;
  isLoading: boolean;
}

export function FilePreviewDialog({
  isOpen,
  onOpenChange,
  file,
  imageUrl,
  isLoading,
}: FilePreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{file?.originalName}</DialogTitle>
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
