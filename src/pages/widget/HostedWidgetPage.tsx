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
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";
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
    script.setAttribute("data-mode", "inline");
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
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 ring-2 ring-slate-200 shadow-sm">
              {config?.store.logo ? (
                <AvatarImage
                  src={config.store.logo}
                  alt={`${config.store.name} logo`}
                />
              ) : null}
              <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold">
                {getInitials(config?.store.name)}
              </AvatarFallback>
            </Avatar>
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
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary" className="bg-slate-900 text-white">
                  Canlı Randevu
                </Badge>
                <Badge
                  variant="outline"
                  className="border-green-200 text-green-700 bg-green-50"
                >
                  Üyelik Gerekmez
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-slate-300 text-slate-700 bg-white"
            >
              <ShieldCheck className="h-4 w-4 mr-1" /> Güvenli & Gizli
            </Badge>
            <Badge
              variant="outline"
              className="border-blue-200 text-blue-700 bg-blue-50"
            >
              SalonTakvim Altyapısıyla
            </Badge>
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <a
            href="#booking"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition"
          >
            Randevu Al
          </a>
          <a
            href="#feedback"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition"
          >
            Müşteri Yorumları
          </a>
          <a
            href="#contact"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:border-slate-300 hover:text-slate-900 transition"
          >
            Ulaşım & İletişim
          </a>
        </nav>

        {isError && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>
              Randevu sayfası yüklenemedi. Bağlantı geçersiz veya süresi dolmuş
              olabilir.
            </AlertDescription>
          </Alert>
        )}

        <div id="booking" className="mt-6 grid gap-6 lg:grid-cols-[320px,1fr]">
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

              <Separator />

              <div className="space-y-3">
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

                <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-blue-600">
                      Güvenli Randevu
                    </p>
                    <p className="text-sm text-slate-800">
                      Bilgileriniz gizli tutulur ve yalnızca bu randevu için
                      kullanılır.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-slate-200/80 overflow-hidden">
            <CardHeader className="bg-white/80 backdrop-blur border-b border-slate-200/70">
              <CardTitle>Randevunuzu Planlayın</CardTitle>
              <p className="text-sm text-muted-foreground">
                Aşağıdaki panelden hizmet ve saati seçerek randevunuzu
                tamamlayın.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative min-h-[720px] bg-linear-to-br from-white via-slate-50 to-slate-100">
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
        </div>

        <section id="feedback" className="mt-10">
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
                <div className="grid gap-4 md:grid-cols-2">
                  {feedbacks.map((feedback) => (
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
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Henüz paylaşılmış bir yorum bulunmuyor.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section id="contact" className="mt-10">
          <Card className="shadow-lg border-slate-200/80">
            <CardHeader>
              <CardTitle>Ulaşım & İletişim</CardTitle>
              <p className="text-sm text-muted-foreground">
                Mağaza konum ve iletişim bilgileri.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {contactItems.length ? (
                  contactItems.map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3"
                    >
                      <Icon className="h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        <p className="text-sm text-slate-800">{value}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    İletişim bilgisi henüz eklenmemiş.
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                  Konumlar
                </h3>
                {locationsLoading ? (
                  <div className="space-y-3">
                    <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                    <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                  </div>
                ) : locations && locations.length > 0 ? (
                  <div className="space-y-3">
                    {locations
                      .filter((location) => location.isVisible !== false)
                      .map((location) => (
                        <div
                          key={location.id}
                          className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3"
                        >
                          <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {location.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatAddress(location) ||
                                "Adres bilgisi eklenmemiş."}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Konum bilgisi henüz paylaşılmamış.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
