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
  Eye,
  Filter,
  Image,
  FileSpreadsheet,
  File as FileIcon,
  MoreVertical,
  ArrowUpDown,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { usePagination, useDebouncedSearch } from "@/hooks";
import { storeService, customerFileService } from "@/services";
import type { CustomerFile } from "@/services/customer-file.service";
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

  const isInitialLoading = (storeLoading || filesPending) && !filesData;
  const files = filesData?.files || [];

  const sortedFiles = useMemo(() => {
    if (!files.length) return files;
    return [...files].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return uploadedSort === "asc" ? aTime - bTime : bTime - aTime;
    });
  }, [files, uploadedSort]);

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
    items: sortedFiles,
    itemsPerPage: 20,
  });

  // Reset to first page on search/filter change
  useEffect(() => {
    goToPage(1);
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
        file.id
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
          file.id
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

  const handleDelete = async (file: CustomerFile) => {
    if (
      window.confirm(`Are you sure you want to delete "${file.originalName}"?`)
    ) {
      deleteMutation.mutate(file);
    }
  };

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
      headerClassName: "text-right w-[100px] md:w-[180px]",
      cellClassName: "text-right w-[100px] md:w-[180px]",
      render: (file) => (
        <div className="flex items-center justify-end gap-1">
          {/* Tablet and Up: Direct Action Buttons */}
          <div className="hidden md:flex items-center gap-1">
            {file.fileType === "image" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(file);
                }}
                title="Preview"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
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
            <Button
              variant="ghost"
              size="icon"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(file);
              }}
              disabled={deleteMutation.isPending}
              title="Delete"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
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
                {file.fileType === "image" && (
                  <DropdownMenuItem onClick={() => handlePreview(file)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                )}
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
                <DropdownMenuItem
                  onClick={() => handleDelete(file)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ),
    },
  ];

  // Grid card render
  const renderGridItem = (file: CustomerFile) => (
    <div
      key={file.id}
      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => file.fileType === "image" && handlePreview(file)}
    >
      <div className="flex items-start gap-3">
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
      <div className="flex items-center justify-between mt-3 pt-3 border-t">
        <div className="flex items-center gap-1">
          {file.fileType === "image" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePreview(file);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(file);
            }}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleViewCustomer(file.customerId);
              }}
            >
              <User className="h-4 w-4 mr-2" />
              View Customer
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(file);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  // Empty state messages
  const emptyTitle = debouncedSearch
    ? `No files matching "${debouncedSearch}"`
    : "No files uploaded yet";

  const emptyDescription = debouncedSearch
    ? "Try adjusting your search query"
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

  if (!store) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row text-center sm:text-start items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Files</h1>
          <p className="text-gray-600 mt-1">
            {filesData?.total ?? 0} file
            {(filesData?.total ?? 0) !== 1 ? "s" : ""} •{" "}
            {customerFileService.formatFileSize(filesData?.totalSize ?? 0)}{" "}
            total
          </p>
        </div>
      </div>

      {/* Files List */}
      <PageView
        data={paginatedItems}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search files..."
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
        totalItems={files.length}
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
