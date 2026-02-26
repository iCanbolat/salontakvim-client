import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { appointmentService } from "@/services";
import type { Appointment } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, MapPin, User, Tag, Info } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { formatAppointmentNumber } from "@/utils/appointment.utils";

type PageState =
  | { status: "loading" }
  | { status: "details"; appointment: Appointment }
  | { status: "success"; appointment: Appointment }
  | { status: "error"; message: string };

export default function CancelAppointmentPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setState({
        status: "error",
        message: "Geçersiz veya eksik iptal bağlantısı.",
      });
      return;
    }

    let isMounted = true;

    appointmentService
      .getAppointmentByToken(token)
      .then((appointment) => {
        if (!isMounted) return;
        setState({ status: "details", appointment });
      })
      .catch((error: any) => {
        if (!isMounted) return;
        setState({
          status: "error",
          message:
            error.response?.data?.message || "Randevu bilgileri alınamadı.",
        });
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleCancel = async () => {
    if (!token || state.status !== "details") return;

    setIsProcessing(true);
    try {
      const updated = await appointmentService.cancelAppointmentByToken(
        token,
        reason,
      );
      setState({ status: "success", appointment: updated });
    } catch (error: any) {
      setState({
        status: "error",
        message:
          error.response?.data?.message ||
          "Randevu iptal edilirken bir hata oluştu.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (state.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground font-medium">
            Randevu bilgileri yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-red-50 text-center">
          <div className="bg-red-50 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            İşlem Başarısız
          </h1>
          <p className="text-gray-600 mb-8">{state.message}</p>
        </div>
      </div>
    );
  }

  if (state.status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-green-50 text-center">
          <div className="bg-green-50 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Info className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Randevunuz İptal Edildi
          </h1>
          <p className="text-gray-600 mb-8">
            Randevunuz başarıyla iptal edilmiştir. İlgili kişilere bildirim
            gönderildi.
          </p>
          <div className="bg-gray-50 p-5 rounded-xl text-left mb-8 border border-gray-100">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-3">
              Randevu Özeti
            </p>
            <div className="space-y-1">
              <p className="text-base font-semibold text-gray-900">
                {state.appointment.serviceName}
              </p>
              <p className="text-sm text-gray-600">
                {format(
                  new Date(state.appointment.startDateTime),
                  "d MMMM yyyy HH:mm",
                  { locale: tr },
                )}
              </p>
              <p className="text-sm text-gray-500 italic mt-2 border-t pt-2">
                Referans:{" "}
                {formatAppointmentNumber(state.appointment.publicNumber)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { appointment } = state;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 font-sans">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-rose-600 p-8 text-white">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Randevu İptali
          </h1>
          <p className="text-rose-100 opacity-90 mt-2 text-lg">
            Randevunuzu iptal etmek istediğinizden emin misiniz?
          </p>
        </div>

        <div className="p-8 md:p-10">
          <div className="mb-10">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center">
              <span className="bg-gray-100 h-px flex-1"></span>
              <span className="px-4">Randevu Detayları</span>
              <span className="bg-gray-100 h-px flex-1"></span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div className="flex items-start space-x-3">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <Tag className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                    Hizmet
                  </p>
                  <p className="font-bold text-gray-900 leading-tight">
                    {appointment.serviceName}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                    Mağaza / Konum
                  </p>
                  <p className="font-bold text-gray-900 leading-tight">
                    {appointment.storeName || "Mağaza Bilgisi Yok"}
                    {appointment.locationName && (
                      <span className="block text-sm font-medium text-gray-500">
                        {appointment.locationName}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                    Tarih
                  </p>
                  <p className="font-bold text-gray-900 leading-tight">
                    {format(
                      new Date(appointment.startDateTime),
                      "d MMMM yyyy",
                      { locale: tr },
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                    Saat
                  </p>
                  <p className="font-bold text-gray-900 leading-tight">
                    {format(new Date(appointment.startDateTime), "HH:mm", {
                      locale: tr,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                    Personel
                  </p>
                  <p className="font-bold text-gray-900 leading-tight">
                    {appointment.staffName || "Herhangi Biri"}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <Info className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                    Randevu No
                  </p>
                  <p className="font-bold text-gray-900 leading-tight">
                    {formatAppointmentNumber(appointment.publicNumber)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
              İptal Nedeni (İsteğe Bağlı)
            </h2>
            <Textarea
              placeholder="Size daha iyi hizmet verebilmemiz için iptal nedeninizi belirtebilirsiniz..."
              className="min-h-[120px] resize-none border-gray-200 focus:border-rose-500 focus:ring-rose-500 rounded-xl"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div className="flex flex-col space-y-4">
            <Button
              variant="destructive"
              className="w-full h-14 text-lg font-bold bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  İşlem Yapılıyor...
                </>
              ) : (
                "Randevuyu İptal Et"
              )}
            </Button>
            <Link to="/">
              <Button
                variant="ghost"
                className="w-full h-12 text-gray-500 hover:text-gray-900 rounded-xl font-medium"
              >
                Vazgeç ve Randevumu Koru
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">
            © 2026 Salon Takvim - Tüm Hakları Saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
}
