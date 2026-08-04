import { useState } from 'react';
import { Star } from 'lucide-react';
import PropTypes from 'prop-types';
import { createReview } from '@/lib/queries';
import { Button, ErrorBanner, StarInput, StarRow } from '@/components/ui';
import { formatDate } from '@/lib/format';

const MAX_COMMENT = 1000;

export function ReviewPrompt({ bookingId, providerName, existingReview, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (existingReview) {
    return (
      <div className="card p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-700"><Star size={16} />Your review</h2>
        <StarRow rating={existingReview.rating} />
        {existingReview.comment && <p className="mt-2 break-words text-sm text-ink-600">{existingReview.comment}</p>}
        <p className="mt-2 text-xs text-ink-400">Submitted {formatDate(existingReview.createdAt)}</p>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      setError('Pick a star rating first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { review } = await createReview({ bookingId, rating, comment: comment.trim() });
      onSubmitted(review);
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Could not submit your review. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-4 sm:p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink-700"><Star size={16} />Leave a review</h2>
      <p className="mb-3 text-xs text-ink-500">How was your experience with {providerName}?</p>
      {error && <div className="mb-3"><ErrorBanner message={error} /></div>}
      <StarInput value={rating} onChange={setRating} disabled={saving} />
      <textarea
        rows={3}
        maxLength={MAX_COMMENT}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="input mt-3 resize-none"
        placeholder="Share what went well, or what could have been better (optional)."
      />
      <div className="mt-1 text-right text-xs text-ink-400">{comment.length}/{MAX_COMMENT}</div>
      <Button type="submit" loading={saving} className="mt-2 w-full sm:w-auto">Submit review</Button>
    </form>
  );
}

ReviewPrompt.propTypes = {
  bookingId: PropTypes.string.isRequired,
  providerName: PropTypes.string,
  existingReview: PropTypes.object,
  onSubmitted: PropTypes.func.isRequired,
};
