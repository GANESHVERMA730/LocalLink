import { useEffect, useState } from 'react';
import { Save, User, Phone, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { updateMe } from '@/lib/queries';
import { Button, Spinner, PageHeader, ErrorBanner, Avatar } from '@/components/ui';

export function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) { setName(user.name); setPhone(user.phone); setLoading(false); }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateMe({ name, phone });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6"><Spinner className="h-8 w-8 mx-auto mt-20" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <PageHeader title="Profile settings" subtitle="Manage your account information" />
      <form onSubmit={handleSave} className="space-y-6">
        {error && <ErrorBanner message={error} />}
        {saved && <div className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700"><Check size={16} />Profile saved.</div>}
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-4">
            <Avatar src={user?.profileImage} name={name || 'User'} size="lg" />
            <div><p className="font-semibold text-ink-900">{user?.email}</p><p className="text-sm text-ink-400 capitalize">{user?.role}</p></div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="name"><User size={14} className="inline" /> Display name</label>
              <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="phone"><Phone size={14} className="inline" /> Phone number</label>
              <input id="phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Visible to people you book with" />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>{!saving && <Save size={16} />}Save changes</Button>
        </div>
      </form>
    </div>
  );
}
