import { useState, useEffect, useMemo } from "react";
import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { usePagination, useDebouncedSearch } from "@/hooks";
import {
  storeService,
  customerFileService,
  customerService,
  appointmentService,
} from "@/services";
import type { CustomerFile } from "@/services/customer-file.service";
import type { CustomerWithStats, Appointment } from "@/types";

export function useFilesList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [folderPage, setFolderPage] = useState(1);

  const [view, setView] = useState<"grid" | "list">("list");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [uploadedSort, setUploadedSort] = useState<"asc" | "desc">("desc");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  // Preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<CustomerFile | null>(null);
  const [previewAppointment, setPreviewAppointment] =
    useState<Appointment | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const customersBasePath = "/customers";

  const debouncedSearch = useDebouncedSearch(searchTerm, {
    minLength: 2,
    delay: 400,
  });

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch folders (when no customer selected)
  const { data: foldersResponse, isPending: foldersPending } = useQuery({
    queryKey: ["store-folders", store?.id, debouncedSearch, folderPage],
    queryFn: () =>
      customerFileService.getFolders(store!.id, {
        search: debouncedSearch || undefined,
        limit: 12, // Items per page for folders
        page: folderPage,
      }),
    enabled: !!store?.id && !selectedCustomerId,
    placeholderData: keepPreviousData,
  });

  // Fetch files (when customer selected)
  const {
    data: filesResponse,
    isPending: filesPending,
    error,
  } = useQuery({
    queryKey: [
      "store-files",
      store?.id,
      selectedCustomerId,
      debouncedSearch,
      fileTypeFilter,
      currentPage,
    ],
    queryFn: () =>
      customerFileService.getFiles(store!.id, selectedCustomerId!, {
        search: debouncedSearch || undefined,
        fileType: fileTypeFilter !== "all" ? fileTypeFilter : undefined,
        limit: 20, // Items per page for files
        page: currentPage,
      }),
    enabled: !!store?.id && !!selectedCustomerId,
    placeholderData: keepPreviousData,
  });

  // Fetch selected customer profile details when in folder view
  const { data: selectedCustomerProfile } = useQuery({
    queryKey: ["customer", store?.id, selectedCustomerId],
    queryFn: () =>
      customerService.getCustomerProfile(store!.id, selectedCustomerId!),
    enabled: !!store?.id && !!selectedCustomerId,
  });

  const isInitialLoading =
    storeLoading || (selectedCustomerId ? filesPending : foldersPending);

  // No longer need full customer map for folders as backend provides stats with names
  // But we might need customer map if we used sorting on client side that depends on names?
  // Current logic for folders handles names from server response.

  const folders = foldersResponse?.data || [];

  const customerMap = useMemo(() => {
    const map = new Map<string, CustomerWithStats>();
    if (selectedCustomerProfile) {
      map.set(
        selectedCustomerProfile.customer.id,
        selectedCustomerProfile.customer,
      );
    }
    return map;
  }, [selectedCustomerProfile]);

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

  // Pagination for FILES
  const { paginatedItems, totalPages, goToPage, startIndex, endIndex } =
    usePagination({
      items: filesResponse?.data || [],
      itemsPerPage: 20,
      totalItems: filesResponse?.total ?? 0,
      currentPage,
      onPageChange: setCurrentPage,
      disableSlice: true,
    });

  // Pagination for FOLDERS
  const {
    paginatedItems: paginatedFolders,
    totalPages: folderTotalPages,
    goToPage: goToFolderPage,
    startIndex: folderStartIndex,
    endIndex: folderEndIndex,
  } = usePagination({
    items: folders, // These are already paginated from server (data of current page)
    itemsPerPage: 12,
    totalItems: foldersResponse?.total ?? 0,
    currentPage: folderPage,
    onPageChange: setFolderPage,
    disableSlice: true,
  });

  // Reset to first page on search/filter change
  useEffect(() => {
    setCurrentPage(1);
    setFolderPage(1);
  }, [debouncedSearch, fileTypeFilter, selectedCustomerId]);

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
    setPreviewAppointment(null);

    setIsPreviewLoading(true);
    try {
      // Fetch appointment detail if linked
      if (file.appointmentId) {
        try {
          const appointment = await appointmentService.getAppointment(
            store!.id,
            file.appointmentId,
          );
          setPreviewAppointment(appointment);
        } catch (err) {
          console.error("Failed to fetch appointment detail for file", err);
          // Don't show toast error here as it's secondary to the file preview itself
        }
      }

      if (file.fileType === "image") {
        const { blob } = await customerFileService.downloadStoreFile(
          store!.id,
          file.id,
        );
        const url = URL.createObjectURL(blob);
        setPreviewImageUrl(url);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message;
      toast.error(message || "Failed to load preview");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleViewCustomer = (customerId: string) => {
    navigate(`${customersBasePath}/${customerId}`);
  };

  const handleToggleUploadedSort = () => {
    setUploadedSort((prev) => (prev === "asc" ? "desc" : "asc"));
    // Sort is not implemented on server for now
    toast.info("Sorting is not supported yet (default: newest first)");
  };

  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (file: CustomerFile) =>
      customerFileService.deleteFile(store!.id, file.customerId, file.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-files", store?.id] });
      queryClient.invalidateQueries({ queryKey: ["store-folders", store?.id] });
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
      previewAppointment,
      previewImageUrl,
      isPreviewLoading,
    },
    data: {
      store,
      filesData: selectedCustomerId
        ? filesResponse
        : {
            total: foldersResponse?.total,
            totalSize: foldersResponse?.totalSize,
          }, // Adjusted for FilesList.tsx consumption
      folders,
      activeFiles: filesResponse?.data || [],
      activeFolder:
        folders.find((f) => f.customerId === selectedCustomerId) || null,
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
