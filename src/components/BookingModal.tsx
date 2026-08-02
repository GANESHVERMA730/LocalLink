import { useState, type FormEvent } from 'react';
import { X, Calendar, Clock, Check } from 'lucide-react';
import { Button, ErrorBanner } from '@/components/ui';
import { CategoryIcon } from '@/components/Icon';
import { createBooking } from '@/lib/queries';
import { formatPrice, toLocalInputValue, fromLocalInputValue } from '@/lib/format';
import { SERVICE_CATEGORIES } from '@/types/db';
import type { Service } from '@/types/db';

interface Props {
  service: Service;
  providerId: string;
  providerName: string;
  onClose: () => void;
  onBooked: (bookingId: string) => void;
}

export function BookingModal({ service, providerId, providerName, onClose, onBooked }: Props) {
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return toLocalInputValue(d.toISOString());
  });
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = SERVICE_CATEGORIES.find((c) => c.value === service.category);

  const handleSubmit = async (e: FormEvent) => {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
      <div className="w-full max-w-lg animate-slide-up rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-ink-900">Book a service</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-ink-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600"><CategoryIcon name={meta?.icon ?? 'Briefcase'} className="h-5 w-5" /></div>
            <div className="flex-1"><p className="font-semibold text-ink-900">{service.title}</p><p className="text-xs text-ink-500">from {providerName}</p></div>
            <p className="text-sm font-bold text-primary-700">{formatPrice(Number(service.basePrice), service.priceUnit)}</p>
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
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">{!loading && <Check size={16} />}Send request</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
