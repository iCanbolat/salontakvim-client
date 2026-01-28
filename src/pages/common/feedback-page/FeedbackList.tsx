/**
 * Feedback List Page
 * Displays and manages all customer feedback for the store
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  AlertCircle,
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  MoreHorizontal,
  Filter,
  Search,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import {
  storeService,
  feedbackService,
  staffService,
  serviceService,
} from "@/services";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { FeedbackWithDetails } from "@/types";
import { cn } from "@/lib/utils";

// Star display component
function StarDisplay({
  rating,
  size = "sm",
}: {
  rating: number | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  if (rating === null || rating === undefined)
    return <span className="text-gray-400">-</span>;

  const sizeClass = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            rating >= star
              ? "fill-yellow-400 text-yellow-400"
              : rating >= star - 0.5
                ? "fill-yellow-200 text-yellow-400"
                : "text-gray-200",
          )}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

// Stats card component
function StatsCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Rating distribution bar
function RatingBar({
  rating,
  count,
  total,
}: {
  rating: number;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3">{rating}</span>
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-muted-foreground">{count}</span>
    </div>
  );
}

export function FeedbackList() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] =
    useState<FeedbackWithDetails | null>(null);
  const [responseText, setResponseText] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch feedback list
  const {
    data: feedbackList,
    isLoading: feedbackLoading,
    error: feedbackError,
  } = useQuery({
    queryKey: [
      "feedback",
      store?.id,
      staffFilter !== "all" ? staffFilter : undefined,
      serviceFilter !== "all" ? serviceFilter : undefined,
    ],
    queryFn: () =>
      feedbackService.getFeedback(store!.id, {
        staffId: staffFilter !== "all" ? staffFilter : undefined,
        serviceId: serviceFilter !== "all" ? serviceFilter : undefined,
      }),
    enabled: !!store?.id,
  });

  // Fetch feedback stats
  const { data: stats } = useQuery({
    queryKey: ["feedback-stats", store?.id],
    queryFn: () => feedbackService.getFeedbackStats(store!.id),
    enabled: !!store?.id,
  });

  // Fetch staff for filter
  const { data: staffList } = useQuery({
    queryKey: ["staff", store?.id],
    queryFn: () => staffService.getStaffMembers(store!.id),
    enabled: !!store?.id,
  });

  // Fetch services for filter
  const { data: servicesList } = useQuery({
    queryKey: ["services", store?.id],
    queryFn: () => serviceService.getServices(store!.id),
    enabled: !!store?.id,
  });

  // Respond to feedback mutation
  const respondMutation = useMutation({
    mutationFn: ({
      feedbackId,
      response,
    }: {
      feedbackId: string;
      response: string;
    }) =>
      feedbackService.respondToFeedback(store!.id, feedbackId, {
        storeResponse: response,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback", store?.id] });
      toast.success("Yanıt başarıyla gönderildi");
      setRespondDialogOpen(false);
      setSelectedFeedback(null);
      setResponseText("");
    },
    onError: () => {
      toast.error("Yanıt gönderilirken bir hata oluştu");
    },
  });

  // Delete feedback mutation
  const deleteMutation = useMutation({
    mutationFn: (feedbackId: string) =>
      feedbackService.deleteFeedback(store!.id, feedbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback", store?.id] });
      queryClient.invalidateQueries({
        queryKey: ["feedback-stats", store?.id],
      });
      toast.success("Geri bildirim silindi");
    },
    onError: () => {
      toast.error("Geri bildirim silinirken bir hata oluştu");
    },
  });

  // Filter feedback by search term
  const filteredFeedback = useMemo(() => {
    if (!feedbackList) return [];
    if (!searchTerm) return feedbackList;

    const term = searchTerm.toLowerCase();
    return feedbackList.filter((f) => {
      const customerName =
        `${f.customer?.firstName || ""} ${f.customer?.lastName || ""}`.toLowerCase();
      const staffName =
        `${f.staff?.firstName || ""} ${f.staff?.lastName || ""}`.toLowerCase();
      const serviceName = f.service?.name?.toLowerCase() || "";
      const comment = f.comment?.toLowerCase() || "";

      return (
        customerName.includes(term) ||
        staffName.includes(term) ||
        serviceName.includes(term) ||
        comment.includes(term)
      );
    });
  }, [feedbackList, searchTerm]);

  const handleRespond = (feedback: FeedbackWithDetails) => {
    setSelectedFeedback(feedback);
    setResponseText(feedback.storeResponse || "");
    setRespondDialogOpen(true);
  };

  const handleView = (feedback: FeedbackWithDetails) => {
    setSelectedFeedback(feedback);
    setViewDialogOpen(true);
  };

  const handleSubmitResponse = () => {
    if (!selectedFeedback || !responseText.trim()) return;
    respondMutation.mutate({
      feedbackId: selectedFeedback.id,
      response: responseText.trim(),
    });
  };

  // Loading state
  if (storeLoading || feedbackLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Error state
  if (feedbackError) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Geri bildirimler yüklenirken bir hata oluştu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Müşteri Geri Bildirimleri
        </h1>
        <p className="text-muted-foreground">
          Müşterilerinizin randevu sonrası gönderdiği değerlendirmeleri
          görüntüleyin
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Toplam Değerlendirme"
          value={stats?.totalFeedback || 0}
          icon={MessageSquare}
          description="Tüm zamanlar"
        />
        <StatsCard
          title="Ortalama Puan"
          value={<StarDisplay rating={stats?.averageOverallRating} size="lg" />}
          icon={Star}
        />
        <StatsCard
          title="Olumlu"
          value={
            stats?.ratingDistribution
              ? (stats.ratingDistribution[4] || 0) +
                (stats.ratingDistribution[5] || 0)
              : 0
          }
          icon={ThumbsUp}
          description="4+ yıldız"
        />
        <StatsCard
          title="İyileştirme Gerekli"
          value={
            stats?.ratingDistribution
              ? (stats.ratingDistribution[1] || 0) +
                (stats.ratingDistribution[2] || 0)
              : 0
          }
          icon={ThumbsDown}
          description="2 yıldız ve altı"
        />
      </div>

      {/* Rating Distribution */}
      {stats && stats.totalFeedback > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Puan Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <RatingBar
                  key={rating}
                  rating={rating}
                  count={
                    stats.ratingDistribution[
                      rating as keyof typeof stats.ratingDistribution
                    ] || 0
                  }
                  total={stats.totalFeedback}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Müşteri, personel veya yorum ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Personel seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Personel</SelectItem>
                {staffList?.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.firstName} {staff.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Hizmet seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Hizmetler</SelectItem>
                {servicesList?.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Değerlendirmeler</CardTitle>
          <CardDescription>
            {filteredFeedback.length} değerlendirme listeleniyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFeedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz geri bildirim yok</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeedback.map((feedback) => (
                <div
                  key={feedback.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={feedback.customer?.avatar || undefined}
                        />
                        <AvatarFallback>
                          {feedback.customer?.firstName?.charAt(0) ||
                            feedback.customer?.lastName?.charAt(0) ||
                            "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {feedback.customer?.firstName}{" "}
                          {feedback.customer?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(
                            new Date(feedback.createdAt),
                            "d MMMM yyyy, HH:mm",
                            { locale: tr },
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleView(feedback)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Detayları Gör
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRespond(feedback)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Yanıtla
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteMutation.mutate(feedback.id)}
                          >
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-6 flex-wrap">
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Genel
                      </span>
                      <StarDisplay rating={feedback.overallRating} />
                    </div>
                    {feedback.serviceRating && (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Hizmet
                        </span>
                        <StarDisplay rating={feedback.serviceRating} />
                      </div>
                    )}
                    {feedback.staffRating && (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Personel
                        </span>
                        <StarDisplay rating={feedback.staffRating} />
                      </div>
                    )}
                    {feedback.cleanlinessRating && (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Temizlik
                        </span>
                        <StarDisplay rating={feedback.cleanlinessRating} />
                      </div>
                    )}
                    {feedback.valueRating && (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Fiyat/Performans
                        </span>
                        <StarDisplay rating={feedback.valueRating} />
                      </div>
                    )}
                  </div>

                  {/* Service & Staff info */}
                  <div className="flex gap-4 text-sm">
                    {feedback.service && (
                      <Badge variant="outline">{feedback.service.name}</Badge>
                    )}
                    {feedback.staff && (
                      <span className="text-muted-foreground">
                        Personel: {feedback.staff.firstName}{" "}
                        {feedback.staff.lastName}
                      </span>
                    )}
                  </div>

                  {/* Comment */}
                  {feedback.comment && (
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">
                      "{feedback.comment}"
                    </p>
                  )}

                  {/* Store Response */}
                  {feedback.storeResponse && (
                    <div className="border-l-4 border-primary pl-4 py-2">
                      <p className="text-xs font-medium text-primary mb-1">
                        İşletme Yanıtı
                      </p>
                      <p className="text-sm">{feedback.storeResponse}</p>
                      {feedback.respondedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(
                            new Date(feedback.respondedAt),
                            "d MMMM yyyy, HH:mm",
                            { locale: tr },
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Respond Dialog */}
      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Geri Bildirime Yanıt Ver</DialogTitle>
            <DialogDescription>
              Müşterinizin geri bildirimine yanıt yazın
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedFeedback && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      {selectedFeedback.customer?.firstName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">
                    {selectedFeedback.customer?.firstName}{" "}
                    {selectedFeedback.customer?.lastName}
                  </span>
                  <StarDisplay rating={selectedFeedback.overallRating} />
                </div>
                {selectedFeedback.comment && (
                  <p className="text-sm text-muted-foreground">
                    "{selectedFeedback.comment}"
                  </p>
                )}
              </div>
            )}
            <Textarea
              placeholder="Yanıtınızı yazın..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRespondDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={!responseText.trim() || respondMutation.isPending}
            >
              {respondMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                "Yanıtla"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Geri Bildirim Detayı</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={selectedFeedback.customer?.avatar || undefined}
                  />
                  <AvatarFallback>
                    {selectedFeedback.customer?.firstName?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedFeedback.customer?.firstName}{" "}
                    {selectedFeedback.customer?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(
                      new Date(selectedFeedback.createdAt),
                      "d MMMM yyyy, HH:mm",
                      { locale: tr },
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">
                    Genel Değerlendirme
                  </span>
                  <StarDisplay
                    rating={selectedFeedback.overallRating}
                    size="md"
                  />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">
                    Hizmet Kalitesi
                  </span>
                  <StarDisplay
                    rating={selectedFeedback.serviceRating}
                    size="md"
                  />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">
                    Personel
                  </span>
                  <StarDisplay
                    rating={selectedFeedback.staffRating}
                    size="md"
                  />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">
                    Temizlik
                  </span>
                  <StarDisplay
                    rating={selectedFeedback.cleanlinessRating}
                    size="md"
                  />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">
                    Fiyat/Performans
                  </span>
                  <StarDisplay
                    rating={selectedFeedback.valueRating}
                    size="md"
                  />
                </div>
              </div>

              {selectedFeedback.service && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">
                    Hizmet
                  </span>
                  <Badge variant="outline">
                    {selectedFeedback.service.name}
                  </Badge>
                </div>
              )}

              {selectedFeedback.staff && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">
                    Personel
                  </span>
                  <p className="text-sm">
                    {selectedFeedback.staff.firstName}{" "}
                    {selectedFeedback.staff.lastName}
                  </p>
                </div>
              )}

              {selectedFeedback.comment && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">
                    Yorum
                  </span>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    "{selectedFeedback.comment}"
                  </p>
                </div>
              )}

              {selectedFeedback.storeResponse && (
                <div className="border-l-4 border-primary pl-4">
                  <span className="text-xs text-muted-foreground block mb-1">
                    İşletme Yanıtı
                  </span>
                  <p className="text-sm">{selectedFeedback.storeResponse}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Kapat
            </Button>
            {selectedFeedback && (
              <Button
                onClick={() => {
                  setViewDialogOpen(false);
                  handleRespond(selectedFeedback);
                }}
              >
                Yanıtla
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FeedbackList;
