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
} from "@/services/customer-file.service";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

interface UseCustomerFilesProps {
  storeId: string;
  customerId: string;
}

export function useCustomerFiles({
  storeId,
  customerId,
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
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);

  // Fetch files
  const {
    data,
    isLoading,
    error,
    refetch: refreshFiles,
  } = useQuery({
    queryKey: [
      "customer-files",
      storeId,
      customerId,
      debouncedSearch,
      fileTypeFilter,
    ],
    queryFn: () =>
      customerFileService.getFiles(storeId, customerId, {
        search: debouncedSearch || undefined,
        fileType: fileTypeFilter !== "all" ? fileTypeFilter : undefined,
      }),
    enabled: !!storeId && !!customerId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (fileId: string) =>
      customerFileService.deleteFile(storeId, customerId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customer-files", storeId, customerId],
      });
      toast.success("Dosya başarıyla silindi");
      setDeleteFileId(null);
    },
    onError: (error: Error) => {
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

    if (file.fileType === "image") {
      try {
        setIsPreviewLoading(true);
        const { blob } = await customerFileService.downloadFile(
          storeId,
          customerId,
          file.id,
        );
        const url = URL.createObjectURL(blob);
        setPreviewImageUrl(url);
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message;
        toast.error(message || "Önizleme yüklenemedi");
      } finally {
        setIsPreviewLoading(false);
      }
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
    data,
    isLoading,
    error,
    isDeleting: deleteMutation.isPending,
    fileInputRef,
  };
}
