import { useEffect, useState } from 'react';
import { Plus, Trash2, Clock, Calendar, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchMyAvailabilities, createAvailability, deleteAvailability } from '@/lib/queries';
import type { Availability } from '@/types/db';
import { DAYS_OF_WEEK } from '@/types/db';
import { Button, Spinner, EmptyState, PageHeader, ErrorBanner } from '@/components/ui';

export function AvailabilityEditor() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<{ dayOfWeek: number; startTime: string; endTime: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try { setSlots(await fetchMyAvailabilities()); } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const handleAdd = async () => {
    if (!adding) return;
    if (adding.startTime >= adding.endTime) { setError('End time must be after start time.'); return; }
    setSaving(true);
    setError(null);
    try { await createAvailability(adding); setAdding(null); await load(); } catch { setError('Could not add this slot.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteAvailability(id); await load(); } catch { setError('Could not remove this slot.'); }
  };

  const slotsByDay = (day: number) => slots.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6"><Spinner className="h-8 w-8 mx-auto mt-20" /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <PageHeader title="Weekly availability" subtitle="Set the days and times customers can book you" action={<Button onClick={() => setAdding({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' })}><Plus size={16} />Add slot</Button>} />
      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {slots.length === 0 && !adding ? (
        <EmptyState icon={<Calendar size={24} />} title="No availability set" description="Add time slots so customers know when they can book you." action={<Button onClick={() => setAdding({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' })}><Plus size={16} />Add your first slot</Button>} />
      ) : (
        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day, idx) => {
            const daySlots = slotsByDay(idx);
            return (
              <div key={idx} className="card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-semibold text-ink-800">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${daySlots.length > 0 ? 'bg-primary-100 text-primary-700' : 'bg-ink-100 text-ink-400'}`}>{idx}</span>
                    {day}
                  </h3>
                  <button onClick={() => setAdding({ dayOfWeek: idx, startTime: '09:00', endTime: '17:00' })} className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"><Plus size={14} />Add</button>
                </div>
                {daySlots.length === 0 ? <p className="mt-2 pl-9 text-sm text-ink-400">Unavailable</p> : (
                  <div className="mt-2 flex flex-wrap gap-2 pl-9">
                    {daySlots.map((s) => (
                      <span key={s._id} className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5 text-sm text-primary-700">
                        <Clock size={14} />{s.startTime} – {s.endTime}
                        <button onClick={() => handleDelete(s._id)} className="ml-1 rounded p-0.5 text-primary-400 hover:bg-primary-100 hover:text-primary-700"><Trash2 size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-md animate-slide-up rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-ink-900">Add availability slot</h2>
              <button onClick={() => setAdding(null)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"><X size={20} /></button>
            </div>
            <div className="px-6 py-5">
              {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
              <div className="space-y-4">
                <div><label className="label">Day of week</label><select className="input" value={adding.dayOfWeek} onChange={(e) => setAdding({ ...adding, dayOfWeek: Number(e.target.value) })}>{DAYS_OF_WEEK.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Start time</label><input type="time" className="input" value={adding.startTime} onChange={(e) => setAdding({ ...adding, startTime: e.target.value })} /></div>
                  <div><label className="label">End time</label><input type="time" className="input" value={adding.endTime} onChange={(e) => setAdding({ ...adding, endTime: e.target.value })} /></div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setAdding(null)} className="flex-1">Cancel</Button>
                <Button onClick={handleAdd} loading={saving} className="flex-1">Add slot</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
