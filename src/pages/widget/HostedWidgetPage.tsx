/**
 * Hosted booking page for customers without their own site
 * Renders the widget loader script using a public widget key.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Contact,
  ImageIcon,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Store,
  X,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PaginationControls } from "@/components/common/PaginationControls";
import { usePagination } from "@/hooks/usePagination";
import { feedbackService } from "@/services/feedback.service";
import { widgetPublicService } from "@/services/widget-public.service";
import type { FeedbackWithDetails } from "@/types/feedback.types";
import type { Location } from "@/types/location.types";
import type { WidgetPublicConfig } from "@/types/widget.types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

function getInitials(name?: string) {
  if (!name) return "ST";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function HostedWidgetPage() {
  const { slug } = useParams<{ slug: string }>();
  const widgetMountRef = useRef<HTMLDivElement>(null); // Only this node will be mutated by the widget loader
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );

  const containerId = useMemo(
    () => `salontakvim-widget-host-${slug || "unknown"}`,
    [slug],
  );

  const {
    data: bootstrap,
    isLoading: bootstrapLoading,
    isError: bootstrapError,
  } = useQuery({
    queryKey: ["widgetEmbedBootstrap", slug],
    queryFn: () => widgetPublicService.getEmbedBootstrap(slug!),
    enabled: Boolean(slug),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const {
    data: config,
    isLoading,
    isError,
  } = useQuery<WidgetPublicConfig>({
    queryKey: ["publicWidgetConfig", slug, bootstrap?.token],
    queryFn: () =>
      widgetPublicService.getWidgetConfigBySlug(slug!, bootstrap?.token),
    enabled: Boolean(slug && bootstrap?.token),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>(
    {
      queryKey: ["publicLocations", slug, bootstrap?.token],
      queryFn: () =>
        widgetPublicService.getPublicLocations(slug!, bootstrap?.token),
      enabled: Boolean(slug && bootstrap?.token),
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  );

  const { data: feedbacks, isLoading: feedbackLoading } = useQuery<
    FeedbackWithDetails[]
  >({
    queryKey: ["publicFeedback", config?.store.id],
    queryFn: () =>
      feedbackService.getPublicFeedback(config!.store.id, {
        limit: 6,
      }),
    enabled: Boolean(config?.store.id && bootstrap?.token),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedFeedbacks,
    goToPage,
    canGoNext,
    canGoPrevious,
    startIndex: feedbackStartIndex,
    endIndex: feedbackEndIndex,
  } = usePagination({
    items: feedbacks || [],
    itemsPerPage: 4,
  });

  useEffect(() => {
    const handleWidgetReady = () => setIsWidgetReady(true);
    window.addEventListener("salontakvim:ready", handleWidgetReady);
    return () =>
      window.removeEventListener("salontakvim:ready", handleWidgetReady);
  }, []);

  useEffect(() => {
    if (!config || !slug || !bootstrap?.token) return;

    if (!config.widgetKey) {
      setWidgetError(
        "This booking page is not ready yet. Please contact the business owner.",
      );
      return;
    }

    const container = widgetMountRef.current;
    if (!container) return;

    setWidgetError(null);
    setIsWidgetReady(false);

    // Cleanup previous script if exists
    if (scriptRef.current) {
      try {
        scriptRef.current.removeEventListener("load", handleLoad);
        scriptRef.current.removeEventListener("error", handleError);
        if (scriptRef.current.parentNode) {
          scriptRef.current.parentNode.removeChild(scriptRef.current);
        }
      } catch {
        // Ignore cleanup errors
      }
      scriptRef.current = null;
    }

    // Clear only the widget mount node (keeps React-managed overlay intact)
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    function handleLoad() {
      setIsWidgetReady(true);
    }

    function handleError() {
      setWidgetError(
        "The booking widget could not be loaded. Please try again.",
      );
    }

    const script = document.createElement("script");
    script.src = bootstrap.loaderUrl;
    script.async = true;
    script.setAttribute("data-widget-key", config.widgetKey);
    // script.setAttribute("data-mode", "inline");
    script.setAttribute("data-container", `#${containerId}`);
    script.setAttribute("data-salontakvim-hosted", "true");
    script.setAttribute("data-token", bootstrap.token);
    script.setAttribute("data-api-base", bootstrap.apiBaseUrl);
    script.setAttribute("data-slug", bootstrap.slug);
    script.dataset.inHostPage = "true"; // marker to distinguish from loader-injected scripts

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    scriptRef.current = script;
    document.body.appendChild(script);
    console.log(script);

    return () => {
      if (scriptRef.current) {
        try {
          scriptRef.current.removeEventListener("load", handleLoad);
          scriptRef.current.removeEventListener("error", handleError);
          if (scriptRef.current.parentNode) {
            scriptRef.current.parentNode.removeChild(scriptRef.current);
          }
        } catch {
          // Ignore cleanup errors
        }
        scriptRef.current = null;
      }
    };
  }, [bootstrap, config, slug, containerId]);

  const contactItems = [
    config?.store.email && {
      label: "Email",
      value: config.store.email,
      icon: Mail,
    },
    config?.store.phone && {
      label: "Phone",
      value: config.store.phone,
      icon: Phone,
    },
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    icon: typeof Mail;
  }>;

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "text-amber-400 fill-amber-400" : "text-slate-300"
        }`}
      />
    ));

  const formatAddress = (location: Location) => {
    const parts = [
      location.address,
      location.city,
      location.state,
      location.zipCode,
      location.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Alert className="max-w-xl w-full" variant="destructive">
          <AlertDescription>
            Bu randevu bağlantısında mağaza bilgisi eksik. Lütfen bağlantıyı
            kontrol edin.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (bootstrapError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Alert className="max-w-xl w-full" variant="destructive">
          <AlertDescription>
            Randevu sayfası başlatılamadı. Lütfen yönetici panelinden güncel
            bağlantıyı aldığınızdan emin olun.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (bootstrapLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Alert className="max-w-xl w-full">
          <AlertDescription>Randevu deneyimi hazırlanıyor...</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-12 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Store className="h-8 w-8 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Online Randevu
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {config?.store.name || "SalonTakvim Randevu"}
              </h1>
              <p className="text-sm text-slate-600 max-w-xl">
                {config?.store.description ||
                  "Size uygun hizmeti seçin, saati belirleyin ve randevunuzu hızlıca oluşturun."}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <button
            onClick={() => {
              const element = document.getElementById("booking");
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition"
          >
            Randevu Al
          </button>
          <button
            onClick={() => {
              const element = document.getElementById("feedback");
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition"
          >
            Müşteri Yorumları
          </button>
        </nav>

        {isError && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>
              Randevu sayfası yüklenemedi. Bağlantı geçersiz veya süresi dolmuş
              olabilir.
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-slate-200/80 bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle>İşletme Hakkında</CardTitle>
            <p className="text-sm text-muted-foreground">
              Randevunuzu oluşturmadan önce kısa bilgiler.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 w-2/3 rounded bg-slate-200 animate-pulse" />
                <div className="h-3 w-full rounded bg-slate-200 animate-pulse" />
                <div className="h-3 w-5/6 rounded bg-slate-200 animate-pulse" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-slate-700">
                {config?.store.description ||
                  "Bu sayfa üzerinden hizmetlerimizi inceleyebilir ve anında randevu oluşturabilirsiniz."}
              </p>
            )}

            {/* Store Images Gallery */}
            {config?.store.storeImages &&
              config.store.storeImages.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        <span>Fotoğraflar</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {config.store.storeImages.length} Fotoğraf
                      </span>
                    </div>
                    <Carousel
                      opts={{
                        align: "start",
                        loop: true,
                      }}
                      className="w-full"
                    >
                      <CarouselContent className="-ml-2">
                        {config.store.storeImages.map((imageUrl, index) => (
                          <CarouselItem key={index} className="pl-2 basis-1/3">
                            <button
                              onClick={() => setSelectedImageIndex(index)}
                              className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100 hover:opacity-95 transition-opacity focus:outline-none"
                            >
                              <img
                                src={imageUrl}
                                alt={`${config.store.name} - Fotoğraf ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {config.store.storeImages.length > 1 && (
                        <div className="absolute right-8 bottom-4 flex gap-1">
                          <CarouselPrevious className="static h-7 w-7 translate-y-0 bg-white/80 hover:bg-white" />
                          <CarouselNext className="static h-7 w-7 translate-y-0 bg-white/80 hover:bg-white" />
                        </div>
                      )}
                    </Carousel>
                  </div>
                </>
              )}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Contact className="h-4 w-4" />
                <span>İletişim</span>
              </div>
              {contactItems.length ? (
                contactItems.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5"
                  >
                    <Icon className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {label === "Email"
                          ? "E-posta"
                          : label === "Phone"
                            ? "Telefon"
                            : label}
                      </p>
                      <p className="text-sm text-slate-800">{value}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5">
                  <CalendarClock className="h-4 w-4 text-slate-500" />
                  <p className="text-sm text-slate-700">
                    Randevu detaylarını bir sonraki adımda onaylayacağız.
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4" />
                  <span>Konumlar</span>
                </div>
                {locationsLoading ? (
                  <div className="space-y-2">
                    <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
                    <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
                  </div>
                ) : locations &&
                  locations.filter((l) => l.isVisible !== false).length > 0 ? (
                  <div className="space-y-2">
                    {locations
                      .filter((location) => location.isVisible !== false)
                      .map((location) => (
                        <div
                          key={location.id}
                          className="group relative rounded-xl border border-slate-200/80 bg-slate-50 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/30"
                        >
                          <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                            {location.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                            {formatAddress(location)}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Henüz konum bilgisi eklenmemiş.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 mt-4">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
                    Güvenli Randevu
                  </p>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Bilgileriniz Salontakvim altyapısıyla güvende.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-slate-200/80 overflow-hidden pb-0">
          <CardHeader className="bg-white/80 backdrop-blur">
            <CardTitle>Randevunuzu Planlayın</CardTitle>
            <p className="text-sm text-muted-foreground">
              Aşağıdaki panelden hizmet ve saati seçerek randevunuzu tamamlayın.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative bg-linear-to-br from-white via-slate-50 to-slate-100">
              <div
                id={containerId}
                ref={widgetMountRef}
                className="relative h-full"
              />

              {!isWidgetReady && !widgetError && !isError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-slate-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <p className="text-sm">Randevu paneli yükleniyor…</p>
                  </div>
                </div>
              )}

              {widgetError && (
                <div className="absolute inset-0 flex items-center justify-center px-6">
                  <Alert variant="destructive" className="w-full max-w-xl">
                    <AlertDescription>{widgetError}</AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <section id="feedback">
          <Card className="shadow-lg border-slate-200/80">
            <CardHeader>
              <CardTitle>Müşteri Yorumları</CardTitle>
              <p className="text-sm text-muted-foreground">
                Gerçek müşterilerden gelen değerlendirmeler.
              </p>
            </CardHeader>
            <CardContent>
              {feedbackLoading ? (
                <div className="space-y-4">
                  <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                </div>
              ) : feedbacks && feedbacks.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {paginatedFeedbacks.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {feedback.customer?.firstName || "Misafir"}{" "}
                              {feedback.customer?.lastName || ""}
                            </p>
                            {feedback.service?.name && (
                              <p className="text-xs text-slate-500">
                                {feedback.service.name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {renderStars(feedback.overallRating)}
                          </div>
                        </div>
                        {feedback.comment && (
                          <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                            “{feedback.comment}”
                          </p>
                        )}
                        <p className="mt-3 text-xs text-slate-400">
                          {format(new Date(feedback.createdAt), "d MMMM yyyy", {
                            locale: tr,
                          })}
                        </p>
                      </div>
                    ))}
                  </div>

                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                    canGoPrevious={canGoPrevious}
                    canGoNext={canGoNext}
                    startIndex={feedbackStartIndex}
                    endIndex={feedbackEndIndex}
                    totalItems={feedbacks.length}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Henüz paylaşılmış bir yorum bulunmuyor.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Image Lightbox Modal */}
      {selectedImageIndex !== null && config?.store.storeImages && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label="Kapat"
          >
            <X className="h-6 w-6" />
          </button>

          {config.store.storeImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev !== null && prev > 0
                      ? prev - 1
                      : (config.store.storeImages?.length ?? 1) - 1,
                  );
                }}
                className="absolute left-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                aria-label="Önceki"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev !== null &&
                    prev < (config.store.storeImages?.length ?? 1) - 1
                      ? prev + 1
                      : 0,
                  );
                }}
                className="absolute right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                aria-label="Sonraki"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <img
            src={config.store.storeImages[selectedImageIndex]}
            alt={`${config.store.name} - Fotoğraf ${selectedImageIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {selectedImageIndex + 1} / {config.store.storeImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
