/**
 * Customer File Service
 * API calls for customer file management
 */

import { axiosInstance } from "./api-client";

export interface CustomerFile {
  id: string;
  storeId: string;
  customerId: string;
  uploadedBy: string | null;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileType: "image" | "pdf" | "document" | "other";
  fileSize: number;
  description: string | null;
  tags: string[] | null;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFileListResponse {
  files: CustomerFile[];
  total: number;
  totalSize: number;
}

export interface UploadFileOptions {
  description?: string;
  tags?: string[];
}

export interface UpdateFileOptions {
  description?: string;
  tags?: string[];
}

export const customerFileService = {
  /**
   * Get all files for a customer
   */
  async getFiles(
    storeId: string,
    customerId: string,
    options?: {
      fileType?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<CustomerFileListResponse> {
    const params = new URLSearchParams();

    if (options?.fileType) params.append("fileType", options.fileType);
    if (options?.search) params.append("search", options.search);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    const response = await axiosInstance.get<CustomerFileListResponse>(
      `/stores/${storeId}/customers/${customerId}/files?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get a single file
   */
  async getFile(
    storeId: string,
    customerId: string,
    fileId: string
  ): Promise<CustomerFile> {
    const response = await axiosInstance.get<CustomerFile>(
      `/stores/${storeId}/customers/${customerId}/files/${fileId}`
    );
    return response.data;
  },

  /**
   * Upload a file for a customer
   */
  async uploadFile(
    storeId: string,
    customerId: string,
    file: File,
    options?: UploadFileOptions
  ): Promise<CustomerFile> {
    const formData = new FormData();
    formData.append("file", file);

    if (options?.description) {
      formData.append("description", options.description);
    }
    if (options?.tags && options.tags.length > 0) {
      options.tags.forEach((tag) => formData.append("tags", tag));
    }

    const response = await axiosInstance.post<CustomerFile>(
      `/stores/${storeId}/customers/${customerId}/files`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Update file metadata
   */
  async updateFile(
    storeId: string,
    customerId: string,
    fileId: string,
    options: UpdateFileOptions
  ): Promise<CustomerFile> {
    const response = await axiosInstance.patch<CustomerFile>(
      `/stores/${storeId}/customers/${customerId}/files/${fileId}`,
      options
    );
    return response.data;
  },

  /**
   * Delete a file
   */
  async deleteFile(
    storeId: string,
    customerId: string,
    fileId: string
  ): Promise<void> {
    await axiosInstance.delete(
      `/stores/${storeId}/customers/${customerId}/files/${fileId}`
    );
  },

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(
    storeId: string,
    customerId: string,
    fileIds: string[]
  ): Promise<{ deleted: number }> {
    const response = await axiosInstance.delete<{ deleted: number }>(
      `/stores/${storeId}/customers/${customerId}/files`,
      { data: { fileIds } }
    );
    return response.data;
  },

  /**
   * Download a file with auth, returning blob and filename
   */
  async downloadFile(
    storeId: string,
    customerId: string,
    fileId: string
  ): Promise<{ blob: Blob; fileName: string }> {
    const response = await axiosInstance.get(
      `/stores/${storeId}/customers/${customerId}/files/${fileId}/download`,
      { responseType: "blob" }
    );

    const disposition = response.headers["content-disposition"] || "";
    let fileName = "download";
    const match = disposition.match(/filename="?([^";]+)"?/i);
    if (match && match[1]) {
      try {
        fileName = decodeURIComponent(match[1]);
      } catch {
        fileName = match[1];
      }
    }

    return { blob: response.data, fileName };
  },

  /**
   * Get download URL for a file (opens in new tab)
   */
  getDownloadUrl(storeId: string, customerId: string, fileId: string): string {
    const baseUrl = axiosInstance.defaults.baseURL || "";
    return `${baseUrl}/stores/${storeId}/customers/${customerId}/files/${fileId}/download`;
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  /**
   * Get file icon based on type
   */
  getFileTypeIcon(fileType: string): string {
    switch (fileType) {
      case "image":
        return "image";
      case "pdf":
        return "file-text";
      case "document":
        return "file";
      default:
        return "file";
    }
  },
};
