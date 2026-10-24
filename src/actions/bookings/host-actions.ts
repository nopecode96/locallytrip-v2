'use server';

import { updateBookingStatus, AllowedBookingStatus } from './update-status';

/**
 * Server Action: Update Host Booking Status
 * Memperbarui status pesanan tur oleh Host (confirmed | cancelled | completed).
 * Memvalidasi kepemilikan tur oleh host yang sedang login dan melakukan revalidatePath.
 */
export async function updateHostBookingStatus(
  bookingId: string | number,
  status: 'confirmed' | 'cancelled' | 'completed'
) {
  return updateBookingStatus(bookingId, status as AllowedBookingStatus);
}
