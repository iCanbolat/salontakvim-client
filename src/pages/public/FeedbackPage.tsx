/**
 * Public Feedback Submission Page
 * Allows customers to submit feedback for completed appointments
 * No authentication required - link expires after submission
 */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { feedbackService } from "@/services/feedback.service";
import type { CreateFeedbackDto } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Star,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Star rating component
function StarRating({
  value,
  onChange,
  disabled = false,
  label,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            className={cn(
              "p-1 transition-colors",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => !disabled && setHovered(0)}
            onClick={() => !disabled && onChange(star)}
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                (hovered || value) >= star
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const storeId = searchParams.get("storeId");
  const token = searchParams.get("token");

  // Form state
  const [overallRating, setOverallRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [staffRating, setStaffRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // Check if feedback can be submitted
  const {
    data: checkResult,
    isLoading: isChecking,
    error: checkError,
  } = useQuery({
    queryKey: ["feedback-check", storeId, appointmentId, token],
    queryFn: () => feedbackService.checkFeedbackStatus(storeId!, appointmentId!, token || undefined),
    enabled: !!storeId && !!appointmentId,
    retry: false,
  });

  // Submit feedback mutation
  const submitMutation = useMutation({
    mutationFn: (data: CreateFeedbackDto & { token?: string }) =>
      feedbackService.submitPublicFeedback(storeId!, data),
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (overallRating === 0) {
      return;
    }

    const data: CreateFeedbackDto & { token?: string } = {
      appointmentId: appointmentId!,
      overallRating,
      serviceRating: serviceRating || undefined,
      staffRating: staffRating || undefined,
      cleanlinessRating: cleanlinessRating || undefined,
      valueRating: valueRating || undefined,
      comment: comment.trim() || undefined,
      isPublic,
      token: token || undefined,
    };

    submitMutation.mutate(data);
  };

  // Invalid link - missing params or token
  if (!storeId || !appointmentId || !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Geçersiz Bağlantı
              </h2>
              <p className="text-gray-600">
                Bu geri bildirim bağlantısı geçersiz veya eksik.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600">Geri bildirim durumu kontrol ediliyor...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error or cannot submit
  if (checkError || !checkResult?.canSubmit) {
    const reason = checkResult?.reason || "Bir hata oluştu";
    const isAlreadySubmitted = reason === "Feedback already submitted";

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div
                className={cn(
                  "mx-auto w-16 h-16 rounded-full flex items-center justify-center",
                  isAlreadySubmitted ? "bg-green-100" : "bg-yellow-100"
                )}
              >
                {isAlreadySubmitted ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isAlreadySubmitted
                  ? "Geri Bildirim Zaten Gönderilmiş"
                  : "Geri Bildirim Gönderilemez"}
              </h2>
              <p className="text-gray-600">
                {isAlreadySubmitted
                  ? "Bu randevu için geri bildirim zaten gönderilmiş. Teşekkür ederiz!"
                  : reason === "Appointment not found"
                  ? "Randevu bulunamadı."
                  : reason === "Appointment is not completed"
                  ? "Sadece tamamlanmış randevular için geri bildirim gönderilebilir."
                  : reason}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Successfully submitted
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Teşekkürler!
              </h2>
              <p className="text-gray-600">
                Geri bildiriminiz başarıyla gönderildi. Değerli görüşleriniz için
                teşekkür ederiz.
              </p>
              {checkResult.appointmentDetails?.storeName && (
                <p className="text-sm text-gray-500">
                  {checkResult.appointmentDetails.storeName}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Feedback form
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Store className="h-8 w-8 text-blue-600" />
          </div>
          {checkResult.appointmentDetails?.storeName && (
            <h1 className="text-2xl font-bold text-gray-900">
              {checkResult.appointmentDetails.storeName}
            </h1>
          )}
          <p className="text-gray-600">
            Deneyiminizi bizimle paylaşın
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Geri Bildirim Formu</CardTitle>
            <CardDescription>
              Randevunuz hakkındaki düşüncelerinizi paylaşın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Overall Rating - Required */}
              <div className="space-y-2">
                <StarRating
                  value={overallRating}
                  onChange={setOverallRating}
                  label="Genel Değerlendirme *"
                />
                {overallRating === 0 && submitMutation.isPending === false && (
                  <p className="text-sm text-gray-500">
                    Lütfen en az bir yıldız seçin
                  </p>
                )}
              </div>

              {/* Optional ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <StarRating
                  value={serviceRating}
                  onChange={setServiceRating}
                  label="Hizmet Kalitesi"
                />
                <StarRating
                  value={staffRating}
                  onChange={setStaffRating}
                  label="Personel"
                />
                <StarRating
                  value={cleanlinessRating}
                  onChange={setCleanlinessRating}
                  label="Temizlik"
                />
                <StarRating
                  value={valueRating}
                  onChange={setValueRating}
                  label="Fiyat/Performans"
                />
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="comment">Yorumunuz (İsteğe Bağlı)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Deneyiminizi paylaşın..."
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-sm text-gray-500 text-right">
                  {comment.length}/1000
                </p>
              </div>

              {/* Public toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <Label>Yorumu Herkese Açık Yap</Label>
                  <p className="text-sm text-gray-500">
                    Diğer müşterilerin görmesine izin ver
                  </p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>

              {/* Error message */}
              {submitMutation.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {(submitMutation.error as any)?.response?.data?.message ||
                      "Geri bildirim gönderilirken bir hata oluştu."}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={overallRating === 0 || submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  "Geri Bildirimi Gönder"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          Bu bağlantı geri bildirim gönderildikten sonra geçersiz olacaktır.
        </p>
      </div>
    </div>
  );
}
