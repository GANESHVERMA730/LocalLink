import { useEffect, useState } from 'react';
import { MapPin, Save, Check, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchMyProviderProfile, updateProviderProfile, updateMe } from '@/lib/queries';
import { Button, Spinner, PageHeader, ErrorBanner } from '@/components/ui';

export function ProviderProfileEditor() {
  const { user, refreshUser } = useAuth();
  const [, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  useEffect(() => {
    if (user) { setName(user.name); setPhone(user.phone); }
    fetchMyProviderProfile()
      .then((p) => {
        if (p) {
          setProfile(p);
          setBio(p.bio);
          setAddress(p.address);
          setCity(p.city);
          if (p.location?.coordinates) { setLng(String(p.location.coordinates[0])); setLat(String(p.location.coordinates[1])); }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateMe({ name, phone });
      await refreshUser();
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const patch = { bio, address, city };
      if (!isNaN(latNum) && !isNaN(lngNum)) patch.location = { type: 'Point', coordinates: [lngNum, latNum] };
      const updated = await updateProviderProfile(patch);
      setProfile(updated);
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
      <PageHeader title="Provider profile" subtitle="This is how customers see you in search results" />
      <form onSubmit={handleSave} className="space-y-6">
        {error && <ErrorBanner message={error} />}
        {saved && <div className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700"><Check size={16} />Profile saved successfully.</div>}

        <div className="card p-4 sm:p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-700"><User size={16} />Basic information</h2>
          <div className="space-y-4">
            <div><label className="label" htmlFor="name">Display name</label><input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><label className="label" htmlFor="phone">Phone</label><input id="phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Visible to customers you book with" /></div>
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-700"><MapPin size={16} />Provider details</h2>
          <div className="space-y-4">
            <div><label className="label" htmlFor="bio">Bio</label><textarea id="bio" rows={4} className="input resize-none" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell customers about your experience, specialties, and what makes you reliable." /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="addr">Street address</label><input id="addr" className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main Street" /></div>
              <div><label className="label" htmlFor="city">City</label><input id="city" className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="San Francisco" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="lat">Latitude</label><input id="lat" type="number" step="any" className="input" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="40.7128" /></div>
              <div><label className="label" htmlFor="lng">Longitude</label><input id="lng" type="number" step="any" className="input" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-74.0060" /></div>
            </div>
            <p className="text-xs text-ink-400">Enter your latitude and longitude so customers can find you by distance. For NYC demo data, try 40.71, -74.00.</p>
          </div>
        </div>

        <div className="flex justify-stretch sm:justify-end">
          <Button type="submit" loading={saving} className="w-full sm:w-auto">{!saving && <Save size={16} />}Save profile</Button>
        </div>
      </form>
    </div>
  );
}
