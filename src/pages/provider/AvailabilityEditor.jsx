import { useEffect, useState } from 'react';
import { Plus, Trash2, Clock, Calendar, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchMyAvailabilities, createAvailability, deleteAvailability } from '@/lib/queries';
import { DAYS_OF_WEEK } from '@/constants/categories';
import { Button, Spinner, EmptyState, PageHeader, ErrorBanner } from '@/components/ui';

export function AvailabilityEditor() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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

  const handleDelete = async (id) => {
    try { await deleteAvailability(id); await load(); } catch { setError('Could not remove this slot.'); }
  };

  const slotsByDay = (day) => slots.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));

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
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex min-w-0 items-center gap-2 font-semibold text-ink-800">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${daySlots.length > 0 ? 'bg-primary-100 text-primary-700' : 'bg-ink-100 text-ink-400'}`}>{idx}</span>
                    <span className="truncate">{day}</span>
                  </h3>
                  <button onClick={() => setAdding({ dayOfWeek: idx, startTime: '09:00', endTime: '17:00' })} className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"><Plus size={14} />Add</button>
                </div>
                {daySlots.length === 0 ? <p className="mt-2 text-sm text-ink-400 sm:pl-9">Unavailable</p> : (
                  <div className="mt-2 flex flex-wrap gap-2 sm:pl-9">
                    {daySlots.map((s) => (
                      <span key={s._id} className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-primary-50 px-3 py-1.5 text-sm text-primary-700">
                        <Clock size={14} className="shrink-0" />{s.startTime} – {s.endTime}
                        <button aria-label="Remove slot" onClick={() => handleDelete(s._id)} className="ml-1 rounded p-0.5 text-primary-400 hover:bg-primary-100 hover:text-primary-700"><Trash2 size={12} /></button>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink-950/50 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[90dvh] w-full max-w-md animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[85dvh] sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-ink-900">Add availability slot</h2>
              <button onClick={() => setAdding(null)} aria-label="Close" className="shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
              <div className="space-y-4">
                <div><label className="label" htmlFor="dayOfWeek">Day of week</label><select id="dayOfWeek" className="input" value={adding.dayOfWeek} onChange={(e) => setAdding({ ...adding, dayOfWeek: Number(e.target.value) })}>{DAYS_OF_WEEK.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label className="label" htmlFor="startTime">Start time</label><input id="startTime" type="time" className="input" value={adding.startTime} onChange={(e) => setAdding({ ...adding, startTime: e.target.value })} /></div>
                  <div><label className="label" htmlFor="endTime">End time</label><input id="endTime" type="time" className="input" value={adding.endTime} onChange={(e) => setAdding({ ...adding, endTime: e.target.value })} /></div>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3 pb-[env(safe-area-inset-bottom)] sm:flex-row">
                <Button type="button" variant="secondary" onClick={() => setAdding(null)} className="w-full sm:flex-1">Cancel</Button>
                <Button onClick={handleAdd} loading={saving} className="w-full sm:flex-1">Add slot</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
