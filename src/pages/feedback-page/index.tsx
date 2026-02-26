/**
 * Feedback List Page
 * Displays and manages all customer feedback for the store
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, MessageSquare } from "lucide-react";

import { useAuth } from "@/contexts";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { useCurrentStore } from "@/hooks";
import { toast } from "sonner";
import { feedbackService } from "@/services";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/common/PaginationControls";
import {
  FeedbackCard,
  FeedbackFilters,
  FeedbackHeader,
  FeedbackStats,
} from "./components";

export function FeedbackList() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canFilterByStaffService = isAdmin || user?.role === "manager";
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedSearch(searchTerm, {
    delay: 500,
    minLength: 0,
  });
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    setPage(1);
  }, [staffFilter, serviceFilter, debouncedSearch]);

  const { store, isLoading: storeLoading } = useCurrentStore();

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery({
    queryKey: [
      "feedback-dashboard",
      store?.id,
      staffFilter !== "all" ? staffFilter : undefined,
      serviceFilter !== "all" ? serviceFilter : undefined,
      debouncedSearch || undefined,
      page,
      limit,
    ],
    queryFn: () =>
      feedbackService.getDashboard(store!.id, {
        staffId: staffFilter !== "all" ? staffFilter : undefined,
        serviceId: serviceFilter !== "all" ? serviceFilter : undefined,
        search: debouncedSearch || undefined,
        page,
        limit,
      }),
    enabled: !!store?.id,
    placeholderData: (previous) => previous,
  });

  const feedbackResponse = dashboardData?.feedback;
  const stats = dashboardData?.stats;
  const staffList = dashboardData?.staff;
  const servicesList = dashboardData?.services;

  // Delete feedback mutation
  const deleteMutation = useMutation({
    mutationFn: (feedbackId: string) =>
      feedbackService.deleteFeedback(store!.id, feedbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["feedback-dashboard", store?.id],
      });
      toast.success("Feedback deleted");
    },
    onError: () => {
      toast.error("An error occurred while deleting feedback");
    },
  });

  const feedbackList = (feedbackResponse?.data ?? []).map((item: any) => ({
    ...item.feedback,
    customer: item.customer,
    staff: item.staff,
    service: item.service,
  }));

  const totalItems = feedbackResponse?.total ?? 0;
  const totalPages = feedbackResponse?.totalPages ?? 1;
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;
  const startIndex = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, totalItems);

  // Loading state
  if (storeLoading || (dashboardLoading && !dashboardData)) {
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
  if (dashboardError) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            An error occurred while loading feedback.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <FeedbackHeader
        title="Customer Feedback"
        subtitle="View ratings submitted by your customers after appointments"
      />

      <FeedbackStats stats={stats} />

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>{totalItems} reviews listed</CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackFilters
            canFilterByStaffService={canFilterByStaffService}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            staffFilter={staffFilter}
            onStaffFilterChange={setStaffFilter}
            serviceFilter={serviceFilter}
            onServiceFilterChange={setServiceFilter}
            staffList={staffList}
            servicesList={servicesList}
          />

          {feedbackList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No feedback yet</p>
            </div>
          ) : (
            <div className="space-y-4 md:h-96 overflow-y-auto">
              {feedbackList.map((feedback, index) => (
                <FeedbackCard
                  key={
                    feedback.id ||
                    `${feedback.appointmentId}-${feedback.createdAt}-${index}`
                  }
                  feedback={feedback}
                  onDelete={(feedbackId) => deleteMutation.mutate(feedbackId)}
                />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              canGoPrevious={canGoPrevious}
              canGoNext={canGoNext}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={totalItems}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FeedbackList;
