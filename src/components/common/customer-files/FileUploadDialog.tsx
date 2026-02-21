import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  customerFileService,
  type CustomerFile,
} from "@/services/customer-file.service";
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
  appointmentId?: string;
  initialFiles?: File[];
  onSuccess?: () => void;
}

export function FileUploadDialog({
  isOpen,
  onOpenChange,
  storeId,
  customerId,
  appointmentId,
  initialFiles = [],
  onSuccess,
}: FileUploadDialogProps) {
  const queryClient = useQueryClient();
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
            appointmentId,
          },
        );
        results.push(result);
      }
      return results;
    },
    onMutate: async (values) => {
      await queryClient.cancelQueries({
        queryKey: ["customer-files", storeId, customerId],
      });

      const tempFiles = values.files.map((file, index) => ({
        id: `temp-${Date.now()}-${index}`,
        storeId,
        customerId,
        uploadedBy: null,
        appointmentId: appointmentId || null,
        fileName: file.name,
        originalName: file.name,
        mimeType: file.type,
        fileType: getFileType(file) as "image" | "pdf" | "document" | "other",
        fileSize: file.size,
        description: values.description || null,
        tags: values.tags ? values.tags.split(",").map((t) => t.trim()) : null,
        downloadUrl: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const previousData = queryClient.getQueriesData({
        predicate: (query) =>
          query.queryKey[0] === "customer-files" &&
          query.queryKey[1] === storeId &&
          query.queryKey[2] === customerId,
      });

      queryClient.setQueriesData(
        {
          predicate: (query) => {
            const key = query.queryKey;
            if (key[0] !== "customer-files") return false;
            if (key[1] !== storeId || key[2] !== customerId) return false;

            if (appointmentId && key[3] && key[3] !== appointmentId) {
              return false;
            }
            return true;
          },
        },
        (old: any) => {
          if (!old) return old;
          const existing = (old.files || old.data || []) as CustomerFile[];
          const nextFiles = [...tempFiles, ...existing];
          const totalSize = nextFiles.reduce(
            (sum, file) => sum + file.fileSize,
            0,
          );

          if ("files" in old) {
            return {
              ...old,
              files: nextFiles,
              total: nextFiles.length,
              totalSize,
            };
          }

          return {
            ...old,
            data: nextFiles,
            total: nextFiles.length,
            totalSize,
          };
        },
      );

      return { previousData, tempIds: tempFiles.map((file) => file.id) };
    },
    onSuccess: (results) => {
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === "customer-files" &&
            query.queryKey[1] === storeId &&
            query.queryKey[2] === customerId,
        },
        (old: any) => {
          if (!old) return old;
          const existing = (old.files || old.data || []) as CustomerFile[];
          const nextFiles = [
            ...results,
            ...existing.filter((file) => !file.id.startsWith("temp-")),
          ];
          const totalSize = nextFiles.reduce(
            (sum, file) => sum + file.fileSize,
            0,
          );

          if ("files" in old) {
            return {
              ...old,
              files: nextFiles,
              total: nextFiles.length,
              totalSize,
            };
          }
          return {
            ...old,
            data: nextFiles,
            total: nextFiles.length,
            totalSize,
          };
        },
      );

      queryClient.invalidateQueries({
        queryKey: ["admin-activities", storeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["activities", storeId],
      });
      if (appointmentId) {
        queryClient.invalidateQueries({
          queryKey: ["appointment", storeId, appointmentId],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["customer-files", storeId, customerId],
      });
      queryClient.invalidateQueries({ queryKey: ["store-files", storeId] });
      queryClient.invalidateQueries({ queryKey: ["store-folders", storeId] });
      toast.success(`${results.length} dosya başarıyla yüklendi`);
      resetForm();
      onSuccess?.();
    },
    onError: (error: Error, _values, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]: any) => {
          queryClient.setQueryData(key, data);
        });
      }
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
              uploadMutation.mutate(values),
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
                                : "bg-muted/50 hover:bg-muted",
                            )}
                            onClick={() => setSelectedPreviewIndex(idx)}
                          >
                            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                              <div
                                className={cn(
                                  "p-1 rounded shrink-0",
                                  FILE_TYPE_COLORS[getFileType(file)],
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
                                    file.size,
                                  )}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFileFromQueue(idx);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Açıklama</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Dosya hakkında kısa bir not..."
                              className="resize-none h-24"
                              {...field}
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
                              placeholder="fatura, sözleşme, rapor..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Virgül ile ayırarak birden fazla etiket
                            ekleyebilirsiniz.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Right Side: Preview */}
                <div className="flex-1 bg-muted/30 rounded-lg flex flex-col overflow-hidden">
                  {filesToUpload.length > 0 ? (
                    <>
                      <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
                        <span className="text-xs font-medium truncate max-w-[200px]">
                          {filesToUpload[selectedPreviewIndex].name}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={selectedPreviewIndex === 0}
                            onClick={() =>
                              setSelectedPreviewIndex((prev) => prev - 1)
                            }
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-[10px] tabular-nums">
                            {selectedPreviewIndex + 1} / {filesToUpload.length}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={
                              selectedPreviewIndex === filesToUpload.length - 1
                            }
                            onClick={() =>
                              setSelectedPreviewIndex((prev) => prev + 1)
                            }
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 flex items-center justify-center p-6 min-h-0">
                        {getFileType(filesToUpload[selectedPreviewIndex]) ===
                        "image" ? (
                          <img
                            src={getFilePreviewUrl(
                              filesToUpload[selectedPreviewIndex],
                            )}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded shadow-lg"
                          />
                        ) : getFileType(filesToUpload[selectedPreviewIndex]) ===
                          "pdf" ? (
                          <iframe
                            src={`${getFilePreviewUrl(
                              filesToUpload[selectedPreviewIndex],
                            )}#toolbar=0`}
                            className="w-full h-full rounded shadow-lg border-0 bg-white"
                            title="PDF Preview"
                          />
                        ) : (
                          <div className="text-center">
                            <div
                              className={cn(
                                "p-8 rounded-2xl mb-4 inline-block shadow-sm",
                                FILE_TYPE_COLORS[
                                  getFileType(
                                    filesToUpload[selectedPreviewIndex],
                                  )
                                ],
                              )}
                            >
                              <FileIcon
                                fileType={getFileType(
                                  filesToUpload[selectedPreviewIndex],
                                )}
                                className="h-16 w-16"
                              />
                            </div>
                            <p className="font-semibold">
                              {filesToUpload[selectedPreviewIndex].name}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Bu dosya türü için önizleme desteklenmiyor.
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                      <Upload className="h-12 w-12 mb-4 opacity-10" />
                      <p>Önizleme yapılacak dosya seçilmedi</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="p-6 border-t gap-2 bg-muted/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => resetForm()}
                disabled={uploadMutation.isPending}
              >
                İptal
              </Button>
              <Button type="submit" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {filesToUpload.length > 0
                  ? `${filesToUpload.length} Dosyayı Yükle`
                  : "Yükle"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
