import { format } from "date-fns";
import {
  Download,
  FileText,
  Image,
  FileSpreadsheet,
  File as FileIcon,
  MoreVertical,
  ArrowUpDown,
  Trash2,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { type TableColumn } from "@/components/common/page-view";
import {
  customerFileService,
  type CustomerFile,
} from "@/services/customer-file.service";

// File type colors
export const FILE_TYPE_COLORS: Record<string, string> = {
  image: "bg-purple-100 text-purple-600",
  pdf: "bg-red-100 text-red-600",
  document: "bg-blue-100 text-blue-600",
  other: "bg-gray-100 text-gray-600",
};

// File type icons
export function FileTypeIcon({ fileType }: { fileType: string }) {
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

interface GetFileColumnsProps {
  handleToggleUploadedSort: () => void;
  handleDownload: (file: CustomerFile) => void;
  handleViewCustomer: (customerId: string) => void;
  deleteFile: (file: CustomerFile) => void;
  isDeleting: boolean;
}

export function getFileColumns({
  handleToggleUploadedSort,
  handleDownload,
  handleViewCustomer,
  deleteFile,
  isDeleting,
}: GetFileColumnsProps): TableColumn<CustomerFile>[] {
  return [
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
                  disabled={isDeleting}
                  title="Delete"
                >
                  {isDeleting ? (
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
                      deleteFile(file);
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
                          deleteFile(file);
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
}
