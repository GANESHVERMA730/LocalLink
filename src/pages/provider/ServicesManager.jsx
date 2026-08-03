import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchMyServices, createService, updateService, deleteService } from '@/lib/queries';
import { SERVICE_CATEGORIES, PRICE_UNITS } from '@/constants/categories';
import { Button, Spinner, EmptyState, PageHeader, ErrorBanner } from '@/components/ui';
import { CategoryIcon } from '@/components/Icon';
import { formatPrice } from '@/lib/format';

const EMPTY = { title: '', category: 'plumber', description: '', basePrice: '', priceUnit: 'per hour', isActive: true };

export function ServicesManager() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    try { setServices(await fetchMyServices()); } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { title: editing.title, category: editing.category, description: editing.description, basePrice: Number(editing.basePrice) || 0, priceUnit: editing.priceUnit, isActive: editing.isActive };
      if (editing.id) await updateService(editing.id, payload);
      else await createService(payload);
      setEditing(null);
      await load();
    } catch { setError('Could not save the service. Please try again.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    try { await deleteService(id); await load(); } catch { setError('Could not delete the service.'); }
  };

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6"><Spinner className="h-8 w-8 mx-auto mt-20" /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <PageHeader title="My services" subtitle="List what you offer — customers see these on your profile" action={<Button onClick={() => setEditing({ ...EMPTY })}><Plus size={16} />Add service</Button>} />
      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {services.length === 0 && !editing ? (
        <EmptyState icon={<Plus size={24} />} title="No services yet" description="Add your first service so customers can find and book you." action={<Button onClick={() => setEditing({ ...EMPTY })}><Plus size={16} />Add service</Button>} />
      ) : (
        <div className="space-y-3">
          {services.map((s) => {
            const meta = SERVICE_CATEGORIES.find((c) => c.value === s.category);
            return (
              <div key={s._id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><CategoryIcon name={meta?.icon ?? 'Briefcase'} className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div><h3 className="font-semibold text-ink-900">{s.title}</h3><p className="text-xs text-ink-400">{meta?.label ?? s.category}</p></div>
                      <p className="text-sm font-bold text-primary-700">{formatPrice(Number(s.basePrice), s.priceUnit)}</p>
                    </div>
                    {s.description && <p className="mt-1.5 text-sm text-ink-500">{s.description}</p>}
                    <span className={`badge mt-2 ${s.isActive ? 'bg-primary-50 text-primary-700' : 'bg-ink-100 text-ink-500'}`}>{s.isActive ? 'Active' : 'Hidden'}</span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => setEditing({ id: s._id, title: s.title, category: s.category, description: s.description, basePrice: String(s.basePrice), priceUnit: s.priceUnit, isActive: s.isActive })} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(s._id)} className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-lg animate-slide-up rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-ink-900">{editing.id ? 'Edit service' : 'New service'}</h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
              <div className="space-y-4">
                <div><label className="label" htmlFor="title">Service title</label><input id="title" required className="input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="e.g. Emergency plumbing repairs" /></div>
                <div>
                  <label className="label">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_CATEGORIES.map((cat) => (
                      <button key={cat.value} type="button" onClick={() => setEditing({ ...editing, category: cat.value })} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${editing.category === cat.value ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
                        <CategoryIcon name={cat.icon} className="h-4 w-4" />{cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label className="label" htmlFor="desc">Description</label><textarea id="desc" rows={3} className="input resize-none" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Describe what's included, your experience, etc." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label" htmlFor="price">Base price</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">$</span><input id="price" type="number" min="0" step="0.01" className="input pl-7" value={editing.basePrice} onChange={(e) => setEditing({ ...editing, basePrice: e.target.value })} placeholder="0" /></div></div>
                  <div><label className="label" htmlFor="unit">Price unit</label><select id="unit" className="input" value={editing.priceUnit} onChange={(e) => setEditing({ ...editing, priceUnit: e.target.value })}>{PRICE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select></div>
                </div>
                <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-500" />Active (visible to customers)</label>
              </div>
              <div className="mt-6 flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setEditing(null)} className="flex-1">Cancel</Button>
                <Button type="submit" loading={saving} className="flex-1">{!saving && <Check size={16} />}{editing.id ? 'Save changes' : 'Add service'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
