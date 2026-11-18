// Shows a saved daily review (the two answers). Renders nothing if there is none.

import type { DailyReview } from '../types';
import styles from './ReviewText.module.css';

export function ReviewText({ review }: { review: DailyReview | undefined }) {
  if (!review) return null;
  return (
    <div className={styles.review}>
      {review.wentWell && (
        <p>
          <span className={styles.label}>Went well</span>
          {review.wentWell}
        </p>
      )}
      {review.improve && (
        <p>
          <span className={styles.label}>To improve</span>
          {review.improve}
        </p>
      )}
    </div>
  );
}
