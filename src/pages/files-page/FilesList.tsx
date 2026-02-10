/**
 * Files List Page
 * Lists all customer files for a store
 * Admin sees all files, staff sees only files from their assigned customers
 */

import { useMemo } from "react";
import { format } from "date-fns";
import {
  Loader2,
  AlertCircle,
  FileText,
  Download,
  Filter,
  Folder,
  ArrowLeft,
  MoreVertical,
  Trash2,
  User,
} from "lucide-react";
import { customerFileService } from "@/services";
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
import { PageView, TableView } from "@/components/common/page-view";
import { FilePreviewDialog } from "@/components/common/customer-files";
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

import { useFilesList } from "./hooks/useFilesList";
import {
  getFileColumns,
  FILE_TYPE_COLORS,
  FileTypeIcon,
} from "./components/FileColumns";

export function FilesList() {
  const { state, data, paging, actions, mutations } = useFilesList();

  const {
    searchTerm,
    view,
    fileTypeFilter,
    selectedCustomerId,
    isInitialLoading,
    error,
    isPreviewOpen,
    previewFile,
    previewAppointment,
    previewImageUrl,
    isPreviewLoading,
  } = state;

  const { store, filesData, folders, activeFiles, activeFolder, customerMap } =
    data;

  const {
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
  } = paging;

  const fileColumns = useMemo(
    () =>
      getFileColumns({
        handleToggleUploadedSort: actions.handleToggleUploadedSort,
        handleDownload: actions.handleDownload,
        handleViewCustomer: actions.handleViewCustomer,
        deleteFile: (file) => mutations.deleteMutation.mutate(file),
        isDeleting: mutations.deleteMutation.isPending,
      }),
    [actions, mutations],
  );

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
        actions.setSelectedCustomerId(folder.customerId);
        actions.setView("list");
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
      onClick={() => actions.handlePreview(file)}
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
                actions.handleDownload(file);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                actions.handleViewCustomer(file.customerId);
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
                      mutations.deleteMutation.mutate(file);
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
  const emptyTitle = searchTerm
    ? `No files matching "${searchTerm}"`
    : selectedCustomerId
      ? "No files in this folder"
      : "No files uploaded yet";

  const emptyDescription = searchTerm
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

  console.log(selectedCustomer);

  const selectedCustomerLabel = selectedCustomer
    ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`.trim() ||
      selectedCustomer.email ||
      "Customer"
    : activeFolder?.customerName
      ? activeFolder.customerName
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
            {selectedCustomerId ? selectedCustomerLabel : "Folders"}
          </h1>
          <p className="text-gray-600 mt-1">
            {selectedCustomerId ? (
              <>
                {filesData?.total ?? 0} file
                {(filesData?.total ?? 0) !== 1 ? "s" : ""} •{" "}
                {customerFileService.formatFileSize(filesData?.totalSize ?? 0)}
              </>
            ) : (
              <>
                {filesData?.total ?? 0} folder
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
                onClick={() => actions.setSelectedCustomerId(null)}
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
          onSearchChange={actions.setSearchTerm}
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
              <Select
                value={fileTypeFilter}
                onValueChange={actions.setFileTypeFilter}
              >
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
          onSearchChange={actions.setSearchTerm}
          searchPlaceholder="Search files in this folder..."
          view={view}
          onViewChange={actions.setView}
          renderGridItem={renderGridItem}
          gridMinColumnClassName="md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]"
          renderTableView={(data) => (
            <TableView
              data={data}
              columns={fileColumns}
              getRowKey={(file) => file.id}
              onRowClick={(file) => actions.handlePreview(file)}
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
              <Select
                value={fileTypeFilter}
                onValueChange={actions.setFileTypeFilter}
              >
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
        onOpenChange={actions.setIsPreviewOpen}
        file={previewFile}
        appointment={previewAppointment || undefined}
        imageUrl={previewImageUrl}
        isLoading={isPreviewLoading}
      />
    </div>
  );
}
