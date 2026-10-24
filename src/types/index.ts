export type UserRole = 'USER' | 'HOST' | 'ADMIN' | 'SUPERADMIN';

export type ExperienceStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
