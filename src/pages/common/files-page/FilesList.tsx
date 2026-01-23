/**
 * Files List Page
 * Lists all customer files for a store
 * Admin sees all files, staff sees only files from their assigned customers
 */

import { useState, useEffect, useMemo } from "react";
import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Loader2,
  AlertCircle,
  FileText,
  Download,
  Filter,
  Image,
  FileSpreadsheet,
  File as FileIcon,
  Folder,
  ArrowLeft,
  MoreVertical,
  ArrowUpDown,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { usePagination, useDebouncedSearch } from "@/hooks";
import { storeService, customerFileService, customerService } from "@/services";
import type { CustomerFile } from "@/services/customer-file.service";
import type { CustomerWithStats } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PageView,
  TableView,
  type TableColumn,
} from "@/components/common/page-view";
import { FilePreviewDialog } from "@/components/customers/FilePreviewDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// File type colors
const FILE_TYPE_COLORS: Record<string, string> = {
  image: "bg-purple-100 text-purple-600",
  pdf: "bg-red-100 text-red-600",
  document: "bg-blue-100 text-blue-600",
  other: "bg-gray-100 text-gray-600",
};

// File type icons
function FileTypeIcon({ fileType }: { fileType: string }) {
  switch (fileType) {
    case "image":
      return <Image className="h-5 w-5" />;
    case "pdf":
      return <FileText className="h-5 w-5" />;
    case "document":
      return <FileSpreadsheet className="h-5 w-5" />;
    default:
      return <FileIcon className="h-5 w-5" />;
  }
}

export function FilesList() {
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

  // Table columns
  const fileColumns: TableColumn<CustomerFile>[] = [
    {
      key: "file",
      header: "File",
      render: (file) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${FILE_TYPE_COLORS[file.fileType]}`}>
            <FileTypeIcon fileType={file.fileType} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate max-w-[200px] md:max-w-[300px]">
              {file.originalName}
            </p>
            <p className="text-xs text-gray-500">
              {customerFileService.formatFileSize(file.fileSize)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      headerClassName: "w-[100px]",
      cellClassName: "w-[100px]",
      hideOnMobile: true,
      render: (file) => (
        <Badge variant="secondary" className="capitalize">
          {file.fileType}
        </Badge>
      ),
    },
    {
      key: "uploaded",
      header: (
        <Button
          variant="ghost"
          size="sm"
          className="px-2 h-7"
          onClick={handleToggleUploadedSort}
        >
          Uploaded
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      headerClassName: "w-[130px]",
      cellClassName: "w-[130px]",
      hideOnMobile: true,
      render: (file) => (
        <span className="text-sm text-gray-600">
          {format(new Date(file.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "tags",
      header: "Tags",
      headerClassName: "w-[140px]",
      cellClassName: "w-[140px]",
      hideOnTablet: true,
      render: (file) =>
        file.tags && file.tags.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            {file.tags.slice(0, 2).map((tag, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-xs truncate max-w-[60px] block"
                title={tag}
              >
                {tag}
              </Badge>
            ))}
            {file.tags.length > 2 && (
              <Badge variant="outline" className="text-xs shrink-0">
                +{file.tags.length - 2}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right w-[100px] md:w-[140px]",
      cellClassName: "text-right w-[100px] md:w-[140px]",
      render: (file) => (
        <div className="flex items-center justify-end gap-1">
          {/* Tablet and Up: Direct Action Buttons */}
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(file);
              }}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleViewCustomer(file.customerId);
              }}
              title="View Customer"
            >
              <User className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={deleteMutation.isPending}
                  title="Delete"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete File</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete{" "}
                    <span className="font-medium text-gray-900">
                      {file.originalName}
                    </span>
                    ? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(file);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Mobile: Action Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDownload(file)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleViewCustomer(file.customerId)}
                >
                  <User className="h-4 w-4 mr-2" />
                  View Customer
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete File</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete{" "}
                        <span className="font-medium text-gray-900">
                          {file.originalName}
                        </span>
                        ? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(file);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ),
    },
  ];

  const renderFolderCard = (folder: {
    customerId: string;
    customerName: string;
    fileCount: number;
    totalSize: number;
    lastUploadedAt: string;
  }) => (
    <div
      key={folder.customerId}
      onClick={() => {
        setSelectedCustomerId(folder.customerId);
        setView("list");
      }}
      className="group relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <Folder className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">
              {folder.customerName}
            </p>
            <p className="text-xs text-gray-500">
              {folder.fileCount} file{folder.fileCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {format(new Date(folder.lastUploadedAt), "MMM d, yyyy")}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{customerFileService.formatFileSize(folder.totalSize)}</span>
        <span className="text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Open folder
        </span>
      </div>
    </div>
  );

  // Grid card render
  const renderGridItem = (file: CustomerFile) => (
    <div
      key={file.id}
      className="relative group border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => file.fileType === "image" && handlePreview(file)}
    >
      <div className="flex items-start gap-3 pr-8">
        <div className={`p-2 rounded-lg ${FILE_TYPE_COLORS[file.fileType]}`}>
          <FileTypeIcon fileType={file.fileType} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{file.originalName}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
            <span>{customerFileService.formatFileSize(file.fileSize)}</span>
            <span>•</span>
            <span>{format(new Date(file.createdAt), "MMM d, yyyy")}</span>
          </div>
          {file.description && (
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">
              {file.description}
            </p>
          )}
          {file.tags && file.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {file.tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(file);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleViewCustomer(file.customerId);
              }}
            >
              <User className="h-4 w-4 mr-2" />
              View Customer
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete File</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete{" "}
                    <span className="font-medium text-gray-900">
                      {file.originalName}
                    </span>
                    ? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(file);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  // Empty state messages
  const emptyTitle = debouncedSearch
    ? `No files matching "${debouncedSearch}"`
    : selectedCustomerId
      ? "No files in this folder"
      : "No files uploaded yet";

  const emptyDescription = debouncedSearch
    ? "Try adjusting your search query"
    : selectedCustomerId
      ? "This customer has no uploaded files yet"
      : "Customer files will appear here when uploaded";

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Files</h1>
          <p className="text-gray-600 mt-1">View and manage customer files</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load files. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const selectedCustomer = selectedCustomerId
    ? customerMap.get(selectedCustomerId)
    : null;

  const selectedCustomerLabel = selectedCustomer
    ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`.trim() ||
      selectedCustomer.email ||
      "Customer"
    : selectedCustomerId
      ? `Customer ${selectedCustomerId.slice(0, 6)}`
      : null;

  if (!store) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row text-center sm:text-start items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedCustomerId ? selectedCustomerLabel : "Files"}
          </h1>
          <p className="text-gray-600 mt-1">
            {selectedCustomerId ? (
              <>
                {activeFolder?.fileCount ?? 0} file
                {(activeFolder?.fileCount ?? 0) !== 1 ? "s" : ""} •{" "}
                {customerFileService.formatFileSize(
                  activeFolder?.totalSize ?? 0,
                )}
              </>
            ) : (
              <>
                {filesData?.total ?? 0} file
                {(filesData?.total ?? 0) !== 1 ? "s" : ""} •{" "}
                {customerFileService.formatFileSize(filesData?.totalSize ?? 0)}{" "}
                total
              </>
            )}
          </p>

          {selectedCustomerId && (
            <div className="mt-3 flex items-center justify-center sm:justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomerId(null)}
                className="h-8 transition-all hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to folders
              </Button>
            </div>
          )}
        </div>
      </div>

      {!selectedCustomerId ? (
        <PageView
          data={paginatedFolders}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search customers or files..."
          view="grid"
          onViewChange={() => null}
          hideViewToggle
          renderGridItem={(folder) => renderFolderCard(folder)}
          gridMinColumnClassName="md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]"
          currentPage={folderPage}
          totalPages={folderTotalPages}
          onPageChange={goToFolderPage}
          startIndex={folderStartIndex}
          endIndex={folderEndIndex}
          totalItems={folders.length}
          emptyIcon={<Folder className="h-12 w-12 text-gray-300" />}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          headerActions={
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="pdf">PDFs</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      ) : (
        <PageView
          data={paginatedItems}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search files in this folder..."
          view={view}
          onViewChange={setView}
          renderGridItem={renderGridItem}
          gridMinColumnClassName="md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]"
          renderTableView={(data) => (
            <TableView
              data={data}
              columns={fileColumns}
              getRowKey={(file) => file.id}
              onRowClick={(file) =>
                file.fileType === "image" && handlePreview(file)
              }
              rowClassName="cursor-pointer"
            />
          )}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          startIndex={startIndex}
          endIndex={endIndex}
          totalItems={activeFiles.length}
          emptyIcon={<FileText className="h-12 w-12 text-gray-300" />}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          headerActions={
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="pdf">PDFs</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}

      {/* Preview Dialog */}
      <FilePreviewDialog
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        file={previewFile}
        imageUrl={previewImageUrl}
        isLoading={isPreviewLoading}
      />
    </div>
  );
}
