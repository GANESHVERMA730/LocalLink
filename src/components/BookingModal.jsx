import { useState } from 'react';
import { X, Calendar, Clock, Check } from 'lucide-react';
import { Button, ErrorBanner } from '@/components/ui';
import { CategoryIcon } from '@/components/Icon';
import { createBooking } from '@/lib/queries';
import { formatPrice, toLocalInputValue, fromLocalInputValue } from '@/lib/format';
import { SERVICE_CATEGORIES } from '@/constants/categories';
import PropTypes from 'prop-types';

export function BookingModal({ service, providerId, providerName, onClose, onBooked }) {
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return toLocalInputValue(d.toISOString());
  });
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const meta = SERVICE_CATEGORIES.find((c) => c.value === service.category);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const booking = await createBooking({
        providerId,
        serviceId: service._id,
        scheduledAt: fromLocalInputValue(scheduledAt),
        durationMinutes: duration,
        customerNotes: notes,
      });
      onBooked(booking._id);
    } catch {
      setError('Could not create the booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink-950/50 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
      <div className="flex max-h-[90dvh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[85dvh] sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-100 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-ink-900">Book a service</h2>
          <button onClick={onClose} aria-label="Close" className="shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-ink-50 p-3 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600"><CategoryIcon name={meta?.icon ?? 'Briefcase'} className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1"><p className="truncate font-semibold text-ink-900">{service.title}</p><p className="truncate text-xs text-ink-500">from {providerName}</p></div>
            <p className="shrink-0 text-sm font-bold text-primary-700">{formatPrice(Number(service.basePrice), service.priceUnit)}</p>
          </div>
          {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="scheduledAt"><Calendar size={14} className="inline" /> When do you need it?</label>
              <input id="scheduledAt" type="datetime-local" required min={toLocalInputValue(new Date().toISOString())} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="duration"><Clock size={14} className="inline" /> Duration (minutes)</label>
              <div className="flex flex-wrap gap-2">
                {[30, 60, 90, 120, 180].map((d) => (
                  <button key={d} type="button" onClick={() => setDuration(d)} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${duration === d ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>{d}m</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="notes">Notes for the provider <span className="text-ink-400">(optional)</span></label>
              <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="input resize-none" placeholder="Describe what you need, any access details, etc." />
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 pb-[env(safe-area-inset-bottom)] sm:flex-row">
            <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="w-full sm:flex-1">{!loading && <Check size={16} />}Send request</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

BookingModal.propTypes = {
  service: PropTypes.object.isRequired,
  providerId: PropTypes.string.isRequired,
  providerName: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onBooked: PropTypes.func.isRequired,
};
