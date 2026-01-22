/**
 * Coupon Types
 * Discount coupon related types and interfaces
 */

export type CouponType = 'percentage' | 'fixed_amount';
export type CouponStatus = 'active' | 'expired' | 'used' | 'cancelled';

/**
 * Coupon entity
 */
export interface Coupon {
  id: string;
  storeId: string;
  code: string;
  name: string;
  description?: string | null;
  type: CouponType;
  value: string;
  minPurchaseAmount?: string | null;
  maxDiscountAmount?: string | null;
  usageLimit?: number | null;
  usageLimitPerCustomer: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableServiceIds?: string[] | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Coupon with statistics
 */
export interface CouponWithStats extends Coupon {
  assignedCount: number;
  totalDiscountGiven: string;
}

/**
 * Customer coupon assignment
 */
export interface CustomerCoupon {
  id: string;
  couponId: string;
  customerId: string;
  storeId: string;
  status: CouponStatus;
  usedCount: number;
  usedAt?: string | null;
  notifiedAt?: string | null;
  assignedBy?: string | null;
  createdAt: string;
  coupon?: Coupon;
}

/**
 * Coupon assignment with customer details
 */
export interface CouponAssignment {
  customerCoupon: CustomerCoupon;
  customer: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  };
}

/**
 * Create coupon DTO
 */
export interface CreateCouponDto {
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
  validFrom: string;
  validUntil: string;
  isActive?: boolean;
  applicableServiceIds?: string[];
}

/**
 * Update coupon DTO
 */
export interface UpdateCouponDto extends Partial<CreateCouponDto> {}

/**
 * Assign coupon to customers DTO
 */
export interface AssignCouponDto {
  customerIds: string[];
  notifyCustomers?: boolean;
}

/**
 * Coupon validation result
 */
export interface CouponValidationResult {
  valid: boolean;
  coupon: Coupon;
  discountAmount: number;
  finalAmount?: number;
}

/**
 * Coupon filters for list query
 */
export interface CouponFilters {
  search?: string;
  isActive?: boolean;
  includeExpired?: boolean;
}
