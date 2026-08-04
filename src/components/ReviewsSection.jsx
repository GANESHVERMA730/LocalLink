import { useCallback, useEffect, useState } from 'react';
import { MessageSquareQuote, Star } from 'lucide-react';
import PropTypes from 'prop-types';
import { fetchProviderReviews } from '@/lib/queries';
import { Avatar, Button, EmptyState, Spinner, StarRow } from '@/components/ui';
import { formatDate } from '@/lib/format';

const PAGE_SIZE = 5;
const EMPTY_BREAKDOWN = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

export function ReviewsSection({ providerId, refreshKey = 0 }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (targetPage) => {
      const first = targetPage === 1;
      if (first) setLoading(true);
      else setLoadingMore(true);
      try {
        const data = await fetchProviderReviews(providerId, { page: targetPage, limit: PAGE_SIZE });
        // Append on "load more" so earlier pages stay on screen.
        setReviews((prev) => (first ? data.reviews : [...prev, ...data.reviews]));
        setSummary(data.summary);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setError('');
      } catch {
        setError('Could not load reviews right now.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [providerId],
  );

  useEffect(() => {
    if (providerId) load(1);
  }, [providerId, refreshKey, load]);

  const total = summary?.reviewCount ?? 0;
  const breakdown = summary?.breakdown ?? EMPTY_BREAKDOWN;

  return (
    <section className="mt-6">
      <h2 className="mb-3 text-lg font-semibold text-ink-900">Reviews</h2>

      {loading ? (
        <div className="card p-6"><Spinner className="mx-auto h-6 w-6" /></div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : total === 0 ? (
        <EmptyState
          icon={<MessageSquareQuote size={24} />}
          title="No reviews yet"
          description="This provider hasn't been reviewed. Reviews appear here once a completed booking is rated."
        />
      ) : (
        <>
          <div className="card p-4 sm:p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="shrink-0 text-center sm:w-36">
                <p className="text-4xl font-bold text-ink-900">{summary.rating.toFixed(1)}</p>
                <div className="mt-1 flex justify-center"><StarRow rating={Math.round(summary.rating)} size={15} /></div>
                <p className="mt-1 text-xs text-ink-500">{total} review{total === 1 ? '' : 's'}</p>
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = breakdown[star] ?? 0;
                  const pct = total ? (count / total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="flex w-8 shrink-0 items-center gap-0.5 text-xs text-ink-500">
                        {star}<Star size={11} className="fill-ink-300 text-ink-300" />
                      </span>
                      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-ink-100">
                        <div className="h-full rounded-full bg-accent-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 shrink-0 text-right text-xs text-ink-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {reviews.map((r) => (
              <li key={r._id} className="card p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Avatar src={r.customer?.profileImage} name={r.customer?.name ?? 'Customer'} size="md" className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="break-words font-semibold text-ink-900">{r.customer?.name ?? 'Customer'}</p>
                      <span className="text-xs text-ink-400">{formatDate(r.createdAt)}</span>
                    </div>
                    <div className="mt-1"><StarRow rating={r.rating} size={14} /></div>
                    {r.comment && <p className="mt-2 break-words text-sm leading-relaxed text-ink-600">{r.comment}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {page < totalPages && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" loading={loadingMore} onClick={() => load(page + 1)}>
                Load more reviews
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

ReviewsSection.propTypes = {
  providerId: PropTypes.string.isRequired,
  refreshKey: PropTypes.number,
};
