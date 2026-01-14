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
import { CalendarClock, Loader2, Mail, Phone, ShieldCheck } from "lucide-react";
import { widgetPublicService } from "@/services/widget-public.service";
import type { WidgetPublicConfig } from "@/types/widget.types";

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
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);

  const containerId = useMemo(
    () => `salontakvim-widget-host-${slug || "unknown"}`,
    [slug]
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
        "This booking page is not ready yet. Please contact the business owner."
      );
      return;
    }

    const container = widgetContainerRef.current;
    if (!container) return;

    setWidgetError(null);
    setIsWidgetReady(false);
    container.innerHTML = "";

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-salontakvim-hosted="true"][data-widget-key="${config.widgetKey}"]`
    );
    if (existingScript) {
      existingScript.remove();
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

    const handleLoad = () => setIsWidgetReady(true);
    const handleError = () =>
      setWidgetError(
        "The booking widget could not be loaded. Please try again."
      );

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    document.body.appendChild(script);

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
      script.remove();
      container.innerHTML = "";
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

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Alert className="max-w-xl w-full" variant="destructive">
          <AlertDescription>
            This booking link is missing a store slug. Please verify the URL.
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
            This booking link could not be initialized. Please use the latest
            link or embed code from your dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (bootstrapLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Alert className="max-w-xl w-full">
          <AlertDescription>
            Preparing your booking experience...
          </AlertDescription>
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
                Book an appointment
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {config?.store.name || "SalonTakvim Booking"}
              </h1>
              <p className="text-sm text-slate-600 max-w-xl">
                {config?.store.description ||
                  "Choose a service, pick a time, and confirm your visit in a few guided steps."}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary" className="bg-slate-900 text-white">
                  Live booking
                </Badge>
                <Badge
                  variant="outline"
                  className="border-green-200 text-green-700 bg-green-50"
                >
                  No account needed
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-slate-300 text-slate-700 bg-white"
            >
              <ShieldCheck className="h-4 w-4 mr-1" /> Secure & private
            </Badge>
            <Badge
              variant="outline"
              className="border-blue-200 text-blue-700 bg-blue-50"
            >
              Powered by SalonTakvim
            </Badge>
          </div>
        </div>

        {isError && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>
              We could not load this booking page. The link may be invalid or
              expired.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px,1fr]">
          <Card className="shadow-lg border-slate-200/80 bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle>About this business</CardTitle>
              <p className="text-sm text-muted-foreground">
                Quick details before you confirm your visit.
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
                    "Use this hosted page to pick a service and reserve a spot instantly."}
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
                          {label}
                        </p>
                        <p className="text-sm text-slate-800">{value}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5">
                    <CalendarClock className="h-4 w-4 text-slate-500" />
                    <p className="text-sm text-slate-700">
                      We will confirm your booking details on the next step.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-blue-600">
                      Safe booking
                    </p>
                    <p className="text-sm text-slate-800">
                      Your information stays private and is only used for this
                      appointment.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-slate-200/80 overflow-hidden">
            <CardHeader className="bg-white/80 backdrop-blur border-b border-slate-200/70">
              <CardTitle>Schedule your visit</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select a service, pick a time, and confirm your appointment in
                the widget below.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div
                id={containerId}
                ref={widgetContainerRef}
                className="relative min-h-[720px] bg-linear-to-br from-white via-slate-50 to-slate-100"
              >
                {!isWidgetReady && !widgetError && !isError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <p className="text-sm">Loading booking experience…</p>
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
      </div>
    </div>
  );
}
