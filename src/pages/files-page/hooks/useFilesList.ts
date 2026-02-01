import { useState, useEffect, useMemo } from "react";
import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { usePagination, useDebouncedSearch } from "@/hooks";
import { storeService, customerFileService, customerService } from "@/services";
import type { CustomerFile } from "@/services/customer-file.service";
import type { CustomerWithStats } from "@/types";

export function useFilesList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [uploadedSort, setUploadedSort] = useState<"asc" | "desc">("desc");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  // Preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<CustomerFile | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Determine base path based on current location (admin or staff)
  const customersBasePath = location.pathname.startsWith("/staff")
    ? "/staff/customers"
    : "/admin/customers";

  const debouncedSearch = useDebouncedSearch(searchTerm, {
    minLength: 2,
    delay: 400,
  });

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch all files
  const {
    data: filesData,
    isPending: filesPending,
    error,
  } = useQuery({
    queryKey: ["store-files", store?.id, debouncedSearch, fileTypeFilter],
    queryFn: () =>
      customerFileService.getAllStoreFiles(store!.id, {
        search: debouncedSearch || undefined,
        fileType: fileTypeFilter !== "all" ? fileTypeFilter : undefined,
      }),
    enabled: !!store?.id,
    placeholderData: keepPreviousData,
  });

  // Fetch customers for folder names
  const { data: customers } = useQuery({
    queryKey: ["customers", store?.id, "files"],
    queryFn: () => customerService.getCustomers(store!.id),
    enabled: !!store?.id,
    placeholderData: keepPreviousData,
  });

  const isInitialLoading = (storeLoading || filesPending) && !filesData;
  const files = filesData?.files || [];

  const customerMap = useMemo(() => {
    const map = new Map<string, CustomerWithStats>();
    (customers || []).forEach((customer) => {
      map.set(customer.id, customer);
    });
    return map;
  }, [customers]);

  const folders = useMemo(() => {
    if (!files.length)
      return [] as Array<{
        customerId: string;
        customerName: string;
        fileCount: number;
        totalSize: number;
        lastUploadedAt: string;
      }>;

    const grouped = new Map<
      string,
      {
        customerId: string;
        customerName: string;
        fileCount: number;
        totalSize: number;
        lastUploadedAt: string;
      }
    >();

    files.forEach((file) => {
      const customer = customerMap.get(file.customerId);
      const name = customer
        ? `${customer.firstName} ${customer.lastName}`.trim() ||
          customer.email ||
          "Customer"
        : `Customer ${file.customerId.slice(0, 6)}`;

      const existing = grouped.get(file.customerId);
      const lastUploadedAt = existing
        ? new Date(existing.lastUploadedAt) > new Date(file.createdAt)
          ? existing.lastUploadedAt
          : file.createdAt
        : file.createdAt;

      grouped.set(file.customerId, {
        customerId: file.customerId,
        customerName: name,
        fileCount: (existing?.fileCount || 0) + 1,
        totalSize: (existing?.totalSize || 0) + file.fileSize,
        lastUploadedAt,
      });
    });

    return Array.from(grouped.values()).sort((a, b) => {
      const aTime = new Date(a.lastUploadedAt).getTime();
      const bTime = new Date(b.lastUploadedAt).getTime();
      return bTime - aTime;
    });
  }, [files, customerMap]);

  const sortedFiles = useMemo(() => {
    if (!files.length) return files;
    return [...files].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return uploadedSort === "asc" ? aTime - bTime : bTime - aTime;
    });
  }, [files, uploadedSort]);

  const activeFiles = useMemo(() => {
    if (!selectedCustomerId) return sortedFiles;
    return sortedFiles.filter((file) => file.customerId === selectedCustomerId);
  }, [sortedFiles, selectedCustomerId]);

  const activeFolder = useMemo(() => {
    if (!selectedCustomerId) return null;
    return folders.find((f) => f.customerId === selectedCustomerId) || null;
  }, [folders, selectedCustomerId]);

  // Sync search term from URL
  useEffect(() => {
    const initialSearch = searchParams.get("search");
    if (initialSearch && initialSearch !== searchTerm) {
      setSearchTerm(initialSearch);
    }
  }, [searchParams]);

  // Sync URL with search term
  useEffect(() => {
    const current = new URLSearchParams(searchParams);
    if (searchTerm) {
      current.set("search", searchTerm);
    } else {
      current.delete("search");
    }
    const nextSearch = current.toString();
    const prevSearch = searchParams.toString();

    if (nextSearch !== prevSearch) {
      setSearchParams(current, { replace: true });
    }
  }, [searchTerm, setSearchParams, searchParams]);

  // Pagination
  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
  } = usePagination({
    items: activeFiles,
    itemsPerPage: 20,
  });

  const {
    paginatedItems: paginatedFolders,
    currentPage: folderPage,
    totalPages: folderTotalPages,
    goToPage: goToFolderPage,
    startIndex: folderStartIndex,
    endIndex: folderEndIndex,
  } = usePagination({
    items: folders,
    itemsPerPage: 12,
  });

  // Reset to first page on search/filter change
  useEffect(() => {
    goToPage(1);
    goToFolderPage(1);
  }, [debouncedSearch, fileTypeFilter]);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  const handleDownload = async (file: CustomerFile) => {
    try {
      const { blob, fileName } = await customerFileService.downloadStoreFile(
        store!.id,
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
      toast.error(message || "Failed to download file");
    }
  };

  const handlePreview = async (file: CustomerFile) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
    setPreviewImageUrl(null);

    if (file.fileType === "image") {
      try {
        setIsPreviewLoading(true);
        const { blob } = await customerFileService.downloadStoreFile(
          store!.id,
          file.id,
        );
        const url = URL.createObjectURL(blob);
        setPreviewImageUrl(url);
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message;
        toast.error(message || "Failed to load preview");
      } finally {
        setIsPreviewLoading(false);
      }
    }
  };

  const handleViewCustomer = (customerId: string) => {
    navigate(`${customersBasePath}/${customerId}`);
  };

  const handleToggleUploadedSort = () => {
    setUploadedSort((prev) => (prev === "asc" ? "desc" : "asc"));
    goToPage(1);
    goToFolderPage(1);
  };

  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (file: CustomerFile) =>
      customerFileService.deleteFile(store!.id, file.customerId, file.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-files", store?.id] });
      toast.success("File deleted successfully");
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message;
      toast.error(message || "Failed to delete file");
    },
  });

  return {
    state: {
      searchTerm,
      view,
      fileTypeFilter,
      uploadedSort,
      selectedCustomerId,
      isInitialLoading,
      error,
      isPreviewOpen,
      previewFile,
      previewImageUrl,
      isPreviewLoading,
    },
    data: {
      store,
      filesData,
      customers,
      folders,
      activeFiles,
      activeFolder,
      customerMap,
    },
    paging: {
      paginatedItems,
      currentPage,
      totalPages,
      goToPage,
      startIndex,
      endIndex,
      paginatedFolders,
      folderPage,
      folderTotalPages,
      goToFolderPage,
      folderStartIndex,
      folderEndIndex,
    },
    actions: {
      setSearchTerm,
      setView,
      setFileTypeFilter,
      setSelectedCustomerId,
      handleDownload,
      handlePreview,
      handleViewCustomer,
      handleToggleUploadedSort,
      deleteFile: deleteMutation.mutate,
      setIsPreviewOpen,
    },
    mutations: {
      deleteMutation,
    },
  };
}
