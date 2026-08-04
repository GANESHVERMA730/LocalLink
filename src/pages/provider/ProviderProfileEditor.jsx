import { useEffect, useState } from 'react';
import { MapPin, Save, Check, User, Award, Briefcase, CalendarDays, Clock, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchMyProviderProfile, updateProviderProfile, updateMe, fetchMyServices } from '@/lib/queries';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { CategoryIcon } from '@/components/Icon';
import { SERVICE_CATEGORIES } from '@/constants/categories';
import { Avatar, Button, Spinner, PageHeader, ErrorBanner, StarRating, StatTile, VerifiedBadge } from '@/components/ui';
import { formatMonthYear, formatResponseTime } from '@/lib/format';

const SERVICE_META = Object.fromEntries(SERVICE_CATEGORIES.map((c) => [c.value, c]));

const RESPONSE_TIME_OPTIONS = [
  { value: 0, label: 'Not stated' },
  { value: 15, label: 'Within 15 minutes' },
  { value: 60, label: 'Within an hour' },
  { value: 240, label: 'Within 4 hours' },
  { value: 1440, label: 'Within a day' },
];

export function ProviderProfileEditor() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [responseTimeMinutes, setResponseTimeMinutes] = useState(0);
  // Coordinates are derived from the picked address only — never shown or typed.
  const [coords, setCoords] = useState(null);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (user) { setName(user.name); setPhone(user.phone); }
    Promise.all([fetchMyProviderProfile(), fetchMyServices().catch(() => [])])
      .then(([p, s]) => {
        setServices(s ?? []);
        if (p) {
          setProfile(p);
          setBio(p.bio ?? '');
          setAddress(p.address ?? '');
          setCity(p.city ?? '');
          setYearsExperience(p.yearsExperience ? String(p.yearsExperience) : '');
          setResponseTimeMinutes(p.responseTimeMinutes ?? 0);
          const c = p.location?.coordinates;
          if (Array.isArray(c) && (c[0] !== 0 || c[1] !== 0)) setCoords({ lng: c[0], lat: c[1] });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSelectPlace = (place) => {
    setAddress(place.label);
    if (place.city) setCity(place.city);
    setCoords({ lat: place.lat, lng: place.lng });
    setLocationError('');
  };

  const handleClearPlace = () => {
    setAddress('');
    setCoords(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!coords) {
      setLocationError('Search for your address and pick a suggestion so customers can find you by distance.');
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateMe({ name, phone });
      await refreshUser();
      const years = parseInt(yearsExperience, 10);
      const updated = await updateProviderProfile({
        bio,
        address,
        city,
        yearsExperience: Number.isNaN(years) ? 0 : years,
        responseTimeMinutes,
        location: { type: 'Point', coordinates: [coords.lng, coords.lat] },
      });
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

  const categories = Array.from(new Set(services.filter((s) => s.isActive).map((s) => s.category)));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <PageHeader title="Provider profile" subtitle="This is how customers see you in search results" />

      <div className="card mb-6 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-primary-500 to-primary-700 sm:h-20" />
        <div className="px-4 pb-5 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Avatar src={user?.profileImage} name={name || user?.name || 'Provider'} size="lg" className="-mt-9 shrink-0 ring-4 ring-white" />
            <div className="min-w-0 flex-1 sm:pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-lg font-bold text-ink-900">{name || user?.name}</h2>
                {profile?.isVerified && <VerifiedBadge />}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
                <StarRating rating={profile?.rating ?? 0} />
                {profile?.reviewCount > 0 && <span>({profile.reviewCount} reviews)</span>}
                {city && <span className="flex items-center gap-1"><MapPin size={14} className="shrink-0" />{city}</span>}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatTile icon={<Star size={16} />} label="Average rating" value={profile?.rating ? profile.rating.toFixed(1) : 'New'} />
            <StatTile icon={<Briefcase size={16} />} label="Completed jobs" value={profile?.completedJobs ?? 0} />
            <StatTile icon={<Award size={16} />} label="Years experience" value={yearsExperience || '—'} />
            <StatTile icon={<Clock size={16} />} label="Response time" value={formatResponseTime(responseTimeMinutes)} />
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <StatTile icon={<CalendarDays size={16} />} label="Joined" value={formatMonthYear(user?.createdAt)} />
            <StatTile icon={<Briefcase size={16} />} label="Active services" value={services.filter((s) => s.isActive).length} />
          </div>

          {categories.length > 0 && (
            <div className="mt-4">
              <p className="label">Service categories</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const meta = SERVICE_META[cat];
                  return (
                    <span key={cat} className="badge bg-primary-50 text-primary-700">
                      {meta?.icon && <CategoryIcon name={meta.icon} className="h-3 w-3" />}
                      {meta?.label ?? cat}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

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
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-700"><Award size={16} />About you</h2>
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="bio">About</label>
              <textarea id="bio" rows={5} maxLength={2000} className="input resize-none" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell customers about your experience, specialties, and what makes you reliable." />
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-ink-400">A clear, specific bio wins more bookings than a generic one.</p>
                <span className="text-xs text-ink-400">{bio.length}/2000</span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="years">Years of experience</label>
                <input id="years" type="number" min={0} max={70} className="input" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="5" />
              </div>
              <div>
                <label className="label" htmlFor="response">Typical response time</label>
                <select id="response" className="input" value={responseTimeMinutes} onChange={(e) => setResponseTimeMinutes(Number(e.target.value))}>
                  {RESPONSE_TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-700"><MapPin size={16} />Service location</h2>
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="location">Address or locality</label>
              <AddressAutocomplete value={address} onSelect={handleSelectPlace} onClear={handleClearPlace} />
              {locationError
                ? <p role="alert" className="mt-1.5 break-words text-xs text-red-600">{locationError}</p>
                : <p className="mt-1.5 text-xs text-ink-400">Start typing and pick a suggestion — we place you on the map automatically so nearby customers can find you.</p>}
            </div>
            <div>
              <label className="label" htmlFor="city">City</label>
              <input id="city" className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Filled in from your address" />
            </div>
            {coords && (
              <p className="flex items-start gap-1.5 rounded-lg bg-primary-50 px-3 py-2.5 text-xs text-primary-700">
                <Check size={14} className="mt-0.5 shrink-0" />
                Location set — you will appear in distance-based searches around this address.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-stretch sm:justify-end">
          <Button type="submit" loading={saving} className="w-full sm:w-auto">{!saving && <Save size={16} />}Save profile</Button>
        </div>
      </form>
    </div>
  );
}
