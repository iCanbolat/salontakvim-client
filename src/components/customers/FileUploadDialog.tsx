import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Upload,
  File,
  FileText,
  Image,
  Loader2,
  Plus,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { customerFileService } from "@/services/customer-file.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export const uploadSchema = z.object({
  files: z.array(z.any()).min(1, "En az bir dosya seçmelisiniz"),
  description: z.string().optional(),
  tags: z.string().optional(),
});

export type UploadFormValues = z.infer<typeof uploadSchema>;

export const FILE_TYPE_ICONS: Record<string, React.ElementType> = {
  image: Image,
  pdf: FileText,
  document: File,
  other: File,
};

export const FILE_TYPE_COLORS: Record<string, string> = {
  image: "bg-purple-100 text-purple-700",
  pdf: "bg-red-100 text-red-700",
  document: "bg-blue-100 text-blue-700",
  other: "bg-gray-100 text-gray-700",
};

export const getFileType = (file: File): string => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  if (
    file.type.includes("word") ||
    file.type.includes("document") ||
    file.type.includes("text") ||
    file.type.includes("spreadsheet")
  )
    return "document";
  return "other";
};

export const FileIcon = ({
  fileType,
  className,
}: {
  fileType: string;
  className?: string;
}) => {
  const Icon = FILE_TYPE_ICONS[fileType] || File;
  return <Icon className={cn("h-5 w-5", className)} />;
};

interface FileUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  customerId: string;
  initialFiles?: File[];
  onSuccess?: () => void;
}

export function FileUploadDialog({
  isOpen,
  onOpenChange,
  storeId,
  customerId,
  initialFiles = [],
  onSuccess,
}: FileUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number>(0);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      files: [],
      description: "",
      tags: "",
    },
  });

  form.register("files");

  const filesToUpload = form.watch("files");

  useEffect(() => {
    if (isOpen && initialFiles.length > 0) {
      const currentFiles = form.getValues("files");
      // Avoid duplicates or just replace? Usually adding is expected from drop but replace might be cleaner if it opens fresh.
      // Given handleDrop in CustomerFiles adds to queue, we'll follow that.
      form.setValue("files", [...currentFiles, ...initialFiles]);
    }
  }, [isOpen, initialFiles, form]);

  const uploadMutation = useMutation({
    mutationFn: async (values: UploadFormValues) => {
      const { files, description, tags: uploadTags } = values;
      const tags = uploadTags
        ? uploadTags.split(",").map((t) => t.trim())
        : undefined;

      const results = [];
      for (const file of files) {
        const result = await customerFileService.uploadFile(
          storeId,
          customerId,
          file,
          {
            description: description || undefined,
            tags,
          }
        );
        results.push(result);
      }
      return results;
    },
    onSuccess: (results) => {
      toast.success(`${results.length} dosya başarıyla yüklendi`);
      resetForm();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Dosyalar yüklenemedi");
    },
  });

  const resetForm = () => {
    form.reset({
      files: [],
      description: "",
      tags: "",
    });
    setSelectedPreviewIndex(0);
    onOpenChange(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} çok büyük (maks 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const current = form.getValues("files") ?? [];
      form.setValue("files", [...current, ...validFiles], {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
    e.target.value = "";
  };

  const removeFileFromQueue = (index: number) => {
    const nextFiles = filesToUpload.filter((_, i) => i !== index);
    form.setValue("files", nextFiles);
    if (selectedPreviewIndex >= index && selectedPreviewIndex > 0) {
      setSelectedPreviewIndex((prev) => prev - 1);
    }
  };

  const getFilePreviewUrl = (file: File) => {
    return URL.createObjectURL(file);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) resetForm();
        else onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-5xl h-[72vh] flex flex-col p-0">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) =>
              uploadMutation.mutate(values)
            )}
            className="flex flex-col h-full overflow-hidden"
          >
            <DialogHeader className="p-6 border-b">
              <DialogTitle>Dosya Yükle</DialogTitle>
              <DialogDescription>
                Birden fazla dosya seçebilir, açıklama ve etiket
                ekleyebilirsiniz.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="flex-1 overflow-hidden p-6">
              <div className="flex h-full gap-6">
                {/* Left Side: Files & Details */}
                <div className="w-96 flex flex-col gap-6 border-r pr-6 overflow-y-auto">
                  {/* Files to Upload */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold">
                        Yüklenecek Dosyalar ({filesToUpload.length})
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Ekle
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                      />
                    </div>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-2">
                      {filesToUpload.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                          <Upload className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Henüz dosya seçilmedi</p>
                          <p className="text-xs mt-1">
                            "Ekle" butonuna tıklayarak dosya seçin
                          </p>
                        </div>
                      ) : (
                        filesToUpload.map((file, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "text-xs flex items-center justify-between p-2 rounded group transition-colors cursor-pointer",
                              selectedPreviewIndex === idx
                                ? "bg-primary/10 border border-primary/20"
                                : "bg-muted/50 hover:bg-muted"
                            )}
                            onClick={() => setSelectedPreviewIndex(idx)}
                          >
                            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                              <div
                                className={cn(
                                  "p-1 rounded shrink-0",
                                  FILE_TYPE_COLORS[getFileType(file)]
                                )}
                              >
                                <FileIcon
                                  fileType={getFileType(file)}
                                  className="h-3 w-3"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate font-medium">
                                  {file.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {customerFileService.formatFileSize(
                                    file.size
                                  )}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFileFromQueue(idx);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-destructive p-1 hover:bg-destructive/10 rounded shrink-0 ml-2"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Description & Tags */}
                  <div className="space-y-4 pt-4 border-t">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Açıklama (Opsiyonel)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Dosya hakkında notlar..."
                              className="h-24 resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Etiketler</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="virgül ile ayırın (örn: fatura, rontgen)"
                            />
                          </FormControl>
                          <FormDescription>
                            Dosyaları kolayca bulmak için etiketler ekleyin.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Right Side: Preview */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="relative flex-1 bg-black/5 rounded-lg border overflow-hidden flex items-center justify-center">
                    {filesToUpload.length > 0 ? (
                      <>
                        {getFileType(filesToUpload[selectedPreviewIndex]) ===
                        "image" ? (
                          <img
                            src={getFilePreviewUrl(
                              filesToUpload[selectedPreviewIndex]
                            )}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : getFileType(filesToUpload[selectedPreviewIndex]) ===
                          "pdf" ? (
                          <iframe
                            src={getFilePreviewUrl(
                              filesToUpload[selectedPreviewIndex]
                            )}
                            className="w-full h-full border-0"
                            title="PDF Preview"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <div
                              className={cn(
                                "p-4 rounded-lg",
                                FILE_TYPE_COLORS[
                                  getFileType(
                                    filesToUpload[selectedPreviewIndex]
                                  )
                                ]
                              )}
                            >
                              <FileIcon
                                fileType={getFileType(
                                  filesToUpload[selectedPreviewIndex]
                                )}
                                className="h-16 w-16"
                              />
                            </div>
                            <p className="font-medium text-center px-4">
                              {filesToUpload[selectedPreviewIndex]?.name}
                            </p>
                            <span className="text-xs">
                              Bu dosya türü için önizleme desteklenmiyor
                            </span>
                          </div>
                        )}

                        {/* Navigation */}
                        {filesToUpload.length > 1 && (
                          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 rounded-full shadow-md"
                              onClick={() =>
                                setSelectedPreviewIndex((prev) =>
                                  prev > 0 ? prev - 1 : prev
                                )
                              }
                              disabled={selectedPreviewIndex === 0}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="bg-secondary px-3 py-1 rounded-full text-xs font-medium shadow-md flex items-center">
                              {selectedPreviewIndex + 1} /{" "}
                              {filesToUpload.length}
                            </div>
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 rounded-full shadow-md"
                              onClick={() =>
                                setSelectedPreviewIndex((prev) =>
                                  prev < filesToUpload.length - 1
                                    ? prev + 1
                                    : prev
                                )
                              }
                              disabled={
                                selectedPreviewIndex ===
                                filesToUpload.length - 1
                              }
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Eye className="h-16 w-16 opacity-20" />
                        <p>Önizleme için dosya seçin</p>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {filesToUpload.length > 1 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 min-h-[72px]">
                      {filesToUpload.map((file, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "relative shrink-0 w-16 h-16 rounded border-2 transition-all cursor-pointer overflow-hidden",
                            selectedPreviewIndex === idx
                              ? "border-primary shadow-sm"
                              : "border-transparent opacity-60 hover:opacity-100"
                          )}
                          onClick={() => setSelectedPreviewIndex(idx)}
                        >
                          {getFileType(file) === "image" ? (
                            <img
                              src={getFilePreviewUrl(file)}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          ) : (
                            <div
                              className={cn(
                                "w-full h-full flex items-center justify-center",
                                FILE_TYPE_COLORS[getFileType(file)]
                              )}
                            >
                              <FileIcon
                                fileType={getFileType(file)}
                                className="h-6 w-6"
                              />
                            </div>
                          )}
                          <button
                            type="button"
                            className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl hover:bg-destructive/90 p-0.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFileFromQueue(idx);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="p-6 border-t bg-muted/30">
              <Button type="button" variant="outline" onClick={resetForm}>
                İptal
              </Button>
              <Button
                type="submit"
                disabled={
                  uploadMutation.isPending || filesToUpload.length === 0
                }
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  `${filesToUpload.length} Dosyayı Yükle`
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
