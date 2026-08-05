import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import PropTypes from 'prop-types';
import { Avatar, StatusBadge, Button } from '@/components/ui';
import { formatDateTime, formatPrice, formatRelativeTime } from '@/lib/format';
import { allowedActions } from '@/lib/bookingFlow';

export function BookingCard({ booking, viewerRole, onAction }) {
  const [acting, setActing] = useState(null);
  const [error, setError] = useState(null);

  const other = viewerRole === 'provider' ? booking.customer : booking.provider;
  const actions = onAction ? allowedActions(booking.status, viewerRole) : [];

  const handleAction = async (status) => {
    setActing(status);
    setError(null);
    try {
      await onAction(booking._id, status);
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Could not update this booking. Please try again.');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="card overflow-hidden">
      <Link
        to={`/dashboard/bookings/${booking._id}`}
        className="group flex items-start gap-3 p-4 transition-colors hover:bg-ink-50/60 sm:gap-4"
      >
        <Avatar src={other?.profileImage} name={other?.name ?? 'User'} size="md" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            <h3 className="truncate font-semibold text-ink-900">{other?.name ?? 'Unknown'}</h3>
            <div className="shrink-0">
              <StatusBadge status={booking.status} />
            </div>
          </div>
          <p className="mt-0.5 break-words text-sm text-ink-500">
            {booking.service?.title ?? 'Service'}
            {booking.service && ` · ${formatPrice(Number(booking.service.basePrice), booking.service.priceUnit)}`}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
            <span className="flex items-center gap-1">
              <Calendar size={12} className="shrink-0" />
              {formatDateTime(booking.scheduledAt)}
            </span>
            <span>Requested {formatRelativeTime(booking.createdAt)}</span>
          </div>
        </div>
        <ArrowRight
          size={16}
          className="mt-1 hidden shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-500 sm:mt-0 sm:block"
        />
      </Link>

      {(actions.length > 0 || error) && (
        <div className="border-t border-ink-100 px-4 py-3">
          {error && <p className="mb-2 break-words text-xs text-red-600">{error}</p>}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((a) => (
                <Button
                  key={a.status}
                  variant={a.variant}
                  loading={acting === a.status}
                  disabled={acting !== null && acting !== a.status}
                  onClick={() => handleAction(a.status)}
                  className="text-sm"
                >
                  {a.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

BookingCard.propTypes = {
  booking: PropTypes.object.isRequired,
  viewerRole: PropTypes.oneOf(['customer', 'provider']).isRequired,
  onAction: PropTypes.func,
};
