import { Clock, CheckCircle2, XCircle, X, Circle } from 'lucide-react';
import PropTypes from 'prop-types';
import { formatDateTime } from '@/lib/format';

const STEP_META = {
  pending: { label: 'Request sent', icon: Clock, tone: 'text-amber-600 bg-amber-50' },
  accepted: { label: 'Accepted by provider', icon: CheckCircle2, tone: 'text-primary-600 bg-primary-50' },
  rejected: { label: 'Declined by provider', icon: XCircle, tone: 'text-red-600 bg-red-50' },
  completed: { label: 'Marked complete', icon: CheckCircle2, tone: 'text-primary-700 bg-primary-50' },
  cancelled: { label: 'Cancelled', icon: X, tone: 'text-ink-500 bg-ink-100' },
};

export function BookingTimeline({ booking }) {
  const history = booking.statusHistory?.length
    ? booking.statusHistory
    : // Bookings created before statusHistory existed still deserve a timeline.
      [{ status: 'pending', at: booking.createdAt }].concat(
        booking.status !== 'pending' ? [{ status: booking.status, at: booking.updatedAt }] : [],
      );

  return (
    <ol className="space-y-3">
      {history.map((step, i) => {
        const meta = STEP_META[step.status] ?? {
          label: step.status,
          icon: Circle,
          tone: 'text-ink-500 bg-ink-100',
        };
        const Icon = meta.icon;
        const actor = typeof step.by === 'object' && step.by?.name ? step.by.name : null;
        return (
          <li key={`${step.status}-${i}`} className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.tone}`}>
              <Icon size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-medium text-ink-800">{meta.label}</p>
              <p className="mt-0.5 break-words text-xs text-ink-400">
                {step.at ? formatDateTime(step.at) : 'Time not recorded'}
                {actor && ` · ${actor}`}
              </p>
              {step.note && <p className="mt-1 break-words text-xs text-ink-500">{step.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

BookingTimeline.propTypes = {
  booking: PropTypes.object.isRequired,
};
