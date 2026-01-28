/**
 * Feedback Types
 * Appointment feedback/review related types and interfaces
 */

/**
 * Feedback entity
 */
export interface Feedback {
  id: string;
  appointmentId: string;
  storeId: string;
  customerId?: string | null;
  staffId?: string | null;
  serviceId?: string | null;
  overallRating: number;
  serviceRating?: number | null;
  staffRating?: number | null;
  cleanlinessRating?: number | null;
  valueRating?: number | null;
  comment?: string | null;
  storeResponse?: string | null;
  respondedAt?: string | null;
  respondedBy?: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Feedback with customer details
 */
export interface FeedbackWithDetails extends Feedback {
  customer?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
  };
  staff?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  service?: {
    id: string;
    name: string;
  };
}

/**
 * Feedback statistics
 */
export interface FeedbackStats {
  totalFeedback: number;
  averageOverallRating: number;
  averageServiceRating?: number;
  averageStaffRating?: number;
  averageCleanlinessRating?: number;
  averageValueRating?: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * Create feedback DTO
 */
export interface CreateFeedbackDto {
  appointmentId: string;
  overallRating: number;
  serviceRating?: number;
  staffRating?: number;
  cleanlinessRating?: number;
  valueRating?: number;
  comment?: string;
}

/**
 * Update feedback DTO
 */
export interface UpdateFeedbackDto {
  comment?: string;
}

/**
 * Respond to feedback DTO
 */
export interface RespondToFeedbackDto {
  storeResponse: string;
}

/**
 * Feedback filters for list query
 */
export interface FeedbackFilters {
  customerId?: string;
  staffId?: string;
  serviceId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Response for checking if feedback can be submitted
 */
export interface FeedbackCheckResponse {
  canSubmit: boolean;
  reason?: string;
  appointmentDetails?: {
    serviceName?: string;
    staffName?: string;
    appointmentDate?: string;
    storeName?: string;
  };
}
