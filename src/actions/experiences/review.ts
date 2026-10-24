'use server';

import { createReview } from '@/actions/reviews/create-review';

export interface SubmitExperienceReviewParams {
  experienceId?: number;
  bookingId: number;
  rating: number; // 1 to 5
  comment: string;
  title?: string;
}

export async function submitExperienceReview(params: SubmitExperienceReviewParams) {
  return await createReview({
    bookingId: params.bookingId,
    rating: params.rating,
    comment: params.comment,
    title: params.title,
  });
}
