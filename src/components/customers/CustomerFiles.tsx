import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { SearchInput } from "@/components/ui/search-input";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import {
  File,
  Download,
  MoreVertical,
  Plus,
  Filter,
  Eye,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  customerFileService,
  type CustomerFile,
} from "@/services/customer-file.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilePreviewDialog } from "./FilePreviewDialog";
import { FileDeleteDialog } from "./FileDeleteDialog";
import {
  FileUploadDialog,
  FILE_TYPE_COLORS,
  FileIcon,
} from "./FileUploadDialog";

interface CustomerFilesProps {
  storeId: string;
  customerId: string;
}

export function CustomerFiles({ storeId, customerId }: CustomerFilesProps) {
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
  const { data, isLoading, error } = useQuery({
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
    []
  );

  const handleDownload = async (file: CustomerFile) => {
    try {
      const { blob, fileName } = await customerFileService.downloadFile(
        storeId,
        customerId,
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
          file.id
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

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-red-500">
          Failed to load files. Please try again.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Files & Documents
            </CardTitle>
            {isLoading ? (
              <Skeleton className="h-4 w-32 mt-1" />
            ) : data ? (
              <p className="text-sm text-muted-foreground mt-1">
                {data.total} file{data.total !== 1 ? "s" : ""} •{" "}
                {customerFileService.formatFileSize(data.totalSize)} total
              </p>
            ) : null}
          </div>
          <Button onClick={() => setIsUploadDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        />

        {/* Search and Filter */}
        <div className="flex gap-2">
          <SearchInput
            placeholder="Search files..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="flex-1"
          />
          <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
            <SelectTrigger className="w-[140px]">
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

        {/* Files List */}
        {isLoading ? (
          <div className="space-y-2 h-70 overflow-y-auto">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.files && data.files.length > 0 ? (
          <div className="space-y-2 h-70 overflow-y-auto">
            {data.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors group"
              >
                {/* File Icon */}
                <div
                  className={`p-2 rounded-lg ${
                    FILE_TYPE_COLORS[file.fileType]
                  }`}
                >
                  <FileIcon fileType={file.fileType} />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {file.originalName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>
                      {customerFileService.formatFileSize(file.fileSize)}
                    </span>
                    <span>•</span>
                    <span>
                      {format(new Date(file.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  {file.description && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {file.description}
                    </p>
                  )}
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {file.tags.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {file.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{file.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Desktop actions */}
                  <div className="hidden md:flex items-center gap-1">
                    {file.fileType === "image" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(file)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(file)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Mobile-only preview */}
                      {file.fileType === "image" && (
                        <DropdownMenuItem
                          onClick={() => handlePreview(file)}
                          className="md:hidden"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDownload(file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteFileId(file.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-70 overflow-y-auto text-gray-500">
            <File className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p>No files uploaded yet</p>
            <p className="text-sm">
              Upload files to keep customer documents organized
            </p>
          </div>
        )}
      </CardContent>

      {/* Dialogs */}
      <FileUploadDialog
        isOpen={isUploadDialogOpen}
        onOpenChange={(open) => {
          setIsUploadDialogOpen(open);
          if (!open) setDroppedFiles([]);
        }}
        storeId={storeId}
        customerId={customerId}
        initialFiles={droppedFiles}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ["customer-files", storeId, customerId],
          });
          setDroppedFiles([]);
        }}
      />

      <FilePreviewDialog
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        file={previewFile}
        imageUrl={previewImageUrl}
        isLoading={isPreviewLoading}
      />

      <FileDeleteDialog
        isOpen={!!deleteFileId}
        onOpenChange={(open) => !open && setDeleteFileId(null)}
        onConfirm={() => deleteFileId && deleteMutation.mutate(deleteFileId)}
        isDeleting={deleteMutation.isPending}
      />
    </Card>
  );
}
