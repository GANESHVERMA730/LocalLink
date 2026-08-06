import { useEffect, useState } from 'react';
import { Save, User, Phone, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { updateMe } from '@/lib/queries';
import { api } from '@/lib/api';
import { Button, Spinner, PageHeader, ErrorBanner, Avatar } from '@/components/ui';

export function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) { setName(user.name); setPhone(user.phone); setLoading(false); }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateMe({ name, phone });
      await refreshUser();
      toast.success('Profile saved.');
    } catch {
      const msg = 'Could not save your profile. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
      const res = await api.post('/uploads/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await updateMe({ profileImage: res.data.url });
      await refreshUser();
      toast.success('Profile photo updated.');
    } catch {
      toast.error('Could not upload photo. Max 5 MB, images only.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6"><Spinner className="h-8 w-8 mx-auto mt-20" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <PageHeader title="Profile settings" subtitle="Manage your account information" />
      <form onSubmit={handleSave} className="space-y-6">
        {error && <ErrorBanner message={error} />}
        <div className="card p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar src={user?.profileImage} name={name || 'User'} size="lg" />
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary-600 text-white shadow hover:bg-primary-700"
                aria-label="Upload profile photo"
                title="Upload photo"
              >
                {uploading ? <Spinner className="h-3 w-3" /> : <Upload size={12} />}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
              </label>
            </div>
            <div className="min-w-0"><p className="truncate font-semibold text-ink-900">{user?.email}</p><p className="text-sm capitalize text-ink-400">{user?.role}</p></div>
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
        <div className="flex justify-stretch sm:justify-end">
          <Button type="submit" loading={saving} className="w-full sm:w-auto">{!saving && <Save size={16} />}Save changes</Button>
        </div>
      </form>
    </div>
  );
}
