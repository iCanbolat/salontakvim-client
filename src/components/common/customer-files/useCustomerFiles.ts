/**
 * useCustomerFiles Hook
 * Centralizes file management logic for a specific customer.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  customerFileService,
  type CustomerFile,
  type CustomerFileListResponse,
  type FilePreviewAppointment,
} from "@/services/customer-file.service";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

interface UseCustomerFilesProps {
  storeId: string;
  customerId: string;
  appointmentId?: string;
  initialFiles?: CustomerFile[];
}

export function useCustomerFiles({
  storeId,
  customerId,
  appointmentId,
  initialFiles,
}: UseCustomerFilesProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedSearch(searchTerm, { minLength: 1 });
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<CustomerFile | null>(null);
  const [previewAppointment, setPreviewAppointment] =
    useState<FilePreviewAppointment | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);

  const shouldUseInitialFiles =
    initialFiles !== undefined &&
    debouncedSearch === "" &&
    fileTypeFilter === "all";

  const initialData = shouldUseInitialFiles
    ? {
        data: initialFiles,
        total: initialFiles.length,
        page: 1,
        limit: initialFiles.length,
        totalPages: 1,
        totalSize: initialFiles.reduce((sum, file) => sum + file.fileSize, 0),
      }
    : undefined;

  // Fetch files
  const {
    data: fetchedData,
    isLoading,
    error,
    refetch: refreshFiles,
  } = useQuery({
    queryKey: [
      "customer-files",
      storeId,
      customerId,
      appointmentId,
      debouncedSearch,
      fileTypeFilter,
    ],
    queryFn: () =>
      customerFileService.getFiles(storeId, customerId, {
        search: debouncedSearch || undefined,
        fileType: fileTypeFilter !== "all" ? fileTypeFilter : undefined,
        appointmentId: appointmentId || undefined,
      }),
    enabled: !!storeId && !!customerId,
    initialData,
  });

  const normalizedData = (() => {
    if (!fetchedData) {
      return undefined;
    }
    if ("files" in fetchedData) {
      return fetchedData as CustomerFileListResponse & {
        files: CustomerFile[];
      };
    }
    return {
      ...fetchedData,
      files: fetchedData.data,
    } as CustomerFileListResponse & { files: CustomerFile[] };
  })();

  const updateCachedFiles = useCallback(
    (
      updater: (files: CustomerFile[]) => CustomerFile[],
      options?: { appointmentScope?: string | null },
    ) => {
      queryClient.setQueriesData(
        {
          predicate: (query) => {
            const key = query.queryKey;
            if (key[0] !== "customer-files") return false;
            if (key[1] !== storeId || key[2] !== customerId) return false;

            const scope = options?.appointmentScope;
            if (scope && key[3] && key[3] !== scope) {
              return false;
            }
            return true;
          },
        },
        (old: any) => {
          if (!old) return old;
          const files = (old.files || old.data || []) as CustomerFile[];
          const nextFiles = updater(files);
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
    },
    [queryClient, storeId, customerId],
  );

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (fileId: string) =>
      customerFileService.deleteFile(storeId, customerId, fileId),
    onMutate: async (fileId) => {
      await queryClient.cancelQueries({
        queryKey: ["customer-files", storeId, customerId],
      });

      const previousData = queryClient.getQueriesData({
        predicate: (query) =>
          query.queryKey[0] === "customer-files" &&
          query.queryKey[1] === storeId &&
          query.queryKey[2] === customerId,
      });

      updateCachedFiles((files) => files.filter((file) => file.id !== fileId), {
        appointmentScope: appointmentId || null,
      });

      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customer-files", storeId, customerId],
      });
      queryClient.invalidateQueries({ queryKey: ["store-files", storeId] });
      queryClient.invalidateQueries({ queryKey: ["store-folders", storeId] });

      if (appointmentId) {
        queryClient.invalidateQueries({
          queryKey: ["appointment", storeId, appointmentId],
        });
      }

      toast.success("Dosya başarıyla silindi");
      setDeleteFileId(null);
    },
    onError: (error: Error, _fileId, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]: any) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error(error.message || "Dosya silinemedi");
    },
  });

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);

      const validFiles = files.filter((file) => {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} çok büyük (maks 10MB)`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        setDroppedFiles(validFiles);
        setIsUploadDialogOpen(true);
      }

      if (e.target) {
        e.target.value = "";
      }
    },
    [],
  );

  const handleDownload = async (file: CustomerFile) => {
    try {
      const { blob, fileName } = await customerFileService.downloadFile(
        storeId,
        customerId,
        file.id,
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || file.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message;
      toast.error(message || "Dosya indirilemedi");
    }
  };

  const handlePreview = async (file: CustomerFile) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
    setPreviewImageUrl(null);
    setPreviewAppointment(null);

    setIsPreviewLoading(true);
    try {
      try {
        const previewContext = await customerFileService.getFilePreviewContext(
          storeId,
          customerId,
          file.id,
        );
        setPreviewAppointment(previewContext.appointment);
      } catch (err) {
        console.error("Failed to fetch file preview context", err);
      }

      if (file.fileType === "image" || file.fileType === "pdf") {
        const { blob } = await customerFileService.downloadFile(
          storeId,
          customerId,
          file.id,
        );
        const url = URL.createObjectURL(blob);
        setPreviewImageUrl(url);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message;
      toast.error(message || "Önizleme yüklenemedi");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  return {
    state: {
      searchTerm,
      fileTypeFilter,
      isUploadDialogOpen,
      droppedFiles,
      isPreviewOpen,
      previewFile,
      previewAppointment,
      previewImageUrl,
      isPreviewLoading,
      deleteFileId,
    },
    actions: {
      setSearchTerm,
      setFileTypeFilter,
      setIsUploadDialogOpen,
      setDroppedFiles,
      setIsPreviewOpen,
      setDeleteFileId,
      handleFileSelect,
      handleDownload,
      handlePreview,
      deleteFile: (id: string) => deleteMutation.mutate(id),
      refreshFiles,
    },
    data: normalizedData,
    isLoading,
    error,
    isDeleting: deleteMutation.isPending,
    fileInputRef,
  };
}
