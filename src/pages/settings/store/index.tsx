import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  AlertCircle,
  Building2,
  Save,
  X,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { useStoreSettings } from "./hooks/useStoreSettings";
import { storeService } from "@/services/store.service";

export function StoreSettings() {
  const { state, actions, data, form } = useStoreSettings();
  const { isEditing, formError, isLoading, error, isPending, isSuccess } =
    state;
  const { store } = data;
  const {
    register,
    setValue,
    formState: { errors, isDirty },
  } = form;

  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => storeService.uploadStoreImage(store!.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageUrl: string) =>
      storeService.deleteStoreImage(store!.id, imageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const currentCount = store?.storeImages?.length || 0;

    if (currentCount + fileList.length > 5) {
      toast.error(
        `En fazla 5 resim yükleyebilirsiniz. (Mevcut: ${currentCount})`,
      );
      return;
    }

    // Validate files
    for (const file of fileList) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} geçerli bir resim dosyası değil.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} boyutu 5MB'dan büyük olamaz.`);
        return;
      }
    }

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const file of fileList) {
        try {
          await uploadImageMutation.mutateAsync(file);
          successCount++;
        } catch (err) {
          console.error(`Upload failed for ${file.name}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} resim başarıyla yüklendi.`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} resim yüklenirken hata oluştu.`);
      }
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!confirm("Bu resmi silmek istediğinizden emin misiniz?")) return;

    try {
      await deleteImageMutation.mutateAsync(imageUrl);
      toast.success("Resim başarıyla silindi.");
    } catch (err) {
      console.error("Image delete failed:", err);
      toast.error("Resim silinemedi. Lütfen tekrar deneyin.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your store information and settings
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load store data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row text-center sm:text-start items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your store information and settings
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => actions.setIsEditing(true)}>
            <Building2 className="h-4 w-4 mr-2" />
            Edit Store
          </Button>
        )}
      </div>

      {/* Update Success Message */}
      {isSuccess && !isEditing && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Store settings updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Update Error Message */}
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {formError || "Failed to update store settings. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={actions.onSubmit} className="space-y-6">
        {/* Store Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>
              Basic information about your store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Store Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Store Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                disabled={!isEditing}
                placeholder="My Awesome Salon"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Store Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                Store Slug (URL) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                {...register("slug")}
                disabled={!isEditing}
                onChange={(e) => {
                  const cleaned = actions.slugify(e.target.value);
                  setValue("slug", cleaned, { shouldDirty: true });
                }}
                placeholder="my-salon"
              />
              {errors.slug && (
                <p className="text-sm text-red-600">{errors.slug.message}</p>
              )}
              <p className="text-sm text-gray-500">
                Public booking link: https://yourdomain.com/book/{"{"}slug{"}"}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                disabled={!isEditing}
                rows={3}
                placeholder="Brief description about your store..."
              />
              {errors.description && (
                <p className="text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>How customers can reach you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                disabled={!isEditing}
                placeholder="contact@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                disabled={!isEditing}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Business Settings</CardTitle>
            <CardDescription>
              Currency and other business configurations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency Code</Label>
              <Input
                id="currency"
                {...register("currency")}
                disabled={!isEditing}
                placeholder="USD"
                maxLength={3}
              />
              {errors.currency && (
                <p className="text-sm text-red-600">
                  {errors.currency.message}
                </p>
              )}
              <p className="text-sm text-gray-500">
                3-letter currency code (e.g., USD, EUR, GBP, TRY)
              </p>
            </div>

            {/* Store Status (Read-only) */}
            <div className="space-y-2">
              <Label>Store Status</Label>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    store.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {store.isActive ? "Active" : "Inactive"}
                </span>
                <p className="text-sm text-gray-500">
                  {store.isActive
                    ? "Your store is active and accepting bookings"
                    : "Your store is currently inactive"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Photos Card */}
        <Card>
          <CardHeader>
            <CardTitle>Store Photos</CardTitle>
            <CardDescription>
              Add photos to showcase your store on the booking page (max 5
              photos)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Photo Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {store.storeImages?.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                  >
                    <img
                      src={imageUrl}
                      alt={`Store photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(imageUrl)}
                      disabled={deleteImageMutation.isPending}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                      aria-label="Delete photo"
                    >
                      {deleteImageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}

                {/* Upload Button */}
                {(!store.storeImages || store.storeImages.length < 5) && (
                  <label
                    className={`relative aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors ${
                      isUploading ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="sr-only"
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="h-8 w-8 text-gray-400" />
                        <span className="mt-2 text-xs text-gray-500">
                          Add Photo
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>

              {store.storeImages && store.storeImages.length >= 5 && (
                <p className="text-sm text-gray-500">
                  Maximum 5 photos reached. Delete existing photos to add new
                  ones.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Store Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Store Statistics</CardTitle>
            <CardDescription>
              Overview of your store performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {store.totalAppointments.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {store.totalCustomers.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!isDirty || isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={actions.handleCancel}
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </form>

      {/* Metadata */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Created</p>
              <p className="font-medium">
                {new Date(store.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Last Updated</p>
              <p className="font-medium">
                {new Date(store.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
