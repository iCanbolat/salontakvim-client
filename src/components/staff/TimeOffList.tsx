/**
 * Time Off List Component
 * Displays staff breaks/time off with manage options
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { breakService } from "@/services";
import type { StaffBreak } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { TimeOffDialog } from "./TimeOffDialog";

interface TimeOffListProps {
  storeId: number;
  staffId: number;
  staffName: string;
}

export function TimeOffList({ storeId, staffId, staffName }: TimeOffListProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBreak, setEditingBreak] = useState<StaffBreak | null>(null);

  // Fetch breaks
  const {
    data: breaks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["staff-breaks", storeId, staffId],
    queryFn: () => breakService.getStaffBreaks(storeId, staffId),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (breakId: number) =>
      breakService.deleteStaffBreak(storeId, staffId, breakId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["staff-breaks", storeId, staffId],
      });
      toast.success("İzin silindi");
    },
    onError: (error: Error) => {
      toast.error("İzin silinemedi: " + error.message);
    },
  });

  const handleEdit = (breakItem: StaffBreak) => {
    setEditingBreak(breakItem);
    setIsDialogOpen(true);
  };

  const handleDelete = (breakId: number) => {
    if (confirm("Bu izni silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate(breakId);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBreak(null);
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), "d MMMM yyyy", { locale: tr });
  };

  const formatTimeRange = (breakItem: StaffBreak) => {
    if (breakItem.startTime && breakItem.endTime) {
      return `${breakItem.startTime.substring(
        0,
        5
      )} - ${breakItem.endTime.substring(0, 5)}`;
    }
    return "Tüm Gün";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          İzinler yüklenemedi: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">İzinler ve Molalar</h3>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni İzin
        </Button>
      </div>

      {/* Breaks List */}
      {breaks && breaks.length > 0 ? (
        <div className="space-y-3">
          {breaks.map((breakItem) => (
            <Card key={breakItem.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Date Range */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {formatDate(breakItem.startDate)}
                        {breakItem.startDate !== breakItem.endDate &&
                          ` - ${formatDate(breakItem.endDate)}`}
                      </span>
                    </div>

                    {/* Time Range */}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{formatTimeRange(breakItem)}</span>
                      {breakItem.isRecurring && (
                        <Badge variant="secondary" className="ml-2">
                          Tekrarlayan
                        </Badge>
                      )}
                    </div>

                    {/* Reason */}
                    {breakItem.reason && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <p className="text-gray-800">{breakItem.reason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(breakItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(breakItem.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg bg-gray-50">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Henüz izin kaydı bulunmuyor</p>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            İlk İzni Ekle
          </Button>
        </div>
      )}

      {/* Dialog */}
      <TimeOffDialog
        storeId={storeId}
        staffId={staffId}
        staffName={staffName}
        timeOff={editingBreak}
        open={isDialogOpen}
        onClose={handleCloseDialog}
      />
    </div>
  );
}
