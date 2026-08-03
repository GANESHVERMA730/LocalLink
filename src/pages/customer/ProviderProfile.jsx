import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock } from 'lucide-react';
import { fetchProviderProfile, fetchAvailabilitiesByProvider } from '@/lib/queries';
import { Avatar, StarRating, VerifiedBadge, Button, Spinner, EmptyState } from '@/components/ui';
import { CategoryIcon } from '@/components/Icon';
import { SERVICE_CATEGORIES, DAYS_OF_WEEK } from '@/constants/categories';
import { formatPrice } from '@/lib/format';
import { BookingModal } from '@/components/BookingModal';

export function ProviderProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [avails, setAvails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingService, setBookingService] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([fetchProviderProfile(userId), fetchAvailabilitiesByProvider(userId)])
      .then(([data, a]) => {
        setProfile(data.profile);
        setAvails(a);
        setError(null);
      })
      .catch(() => setError('Could not load this provider profile.'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6"><Spinner className="h-8 w-8 mx-auto mt-20" /></div>;
  if (error || !profile) return <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6"><EmptyState icon={<MapPin size={24} />} title="Provider not found" description={error ?? undefined} action={<Button variant="secondary" onClick={() => navigate('/dashboard/search')}>Back to search</Button>} /></div>;

  const services = profile.services.filter((s) => s.isActive);
  const availByDay = {};
  avails.forEach((a) => { if (!availByDay[a.dayOfWeek]) availByDay[a.dayOfWeek] = []; availByDay[a.dayOfWeek].push(a); });
  const providerUser = profile.user;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link to="/dashboard/search" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800"><ArrowLeft size={16} />Back to search</Link>

      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary-500 to-primary-700" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <Avatar src={providerUser.profileImage} name={providerUser.name} size="lg" className="ring-4 ring-white" />
            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-ink-900">{providerUser.name}</h1>
                {profile.isVerified && <VerifiedBadge />}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-500">
                <StarRating rating={profile.rating} />
                {profile.reviewCount > 0 && <span>({profile.reviewCount} reviews)</span>}
                {profile.city && <span className="flex items-center gap-1"><MapPin size={14} />{profile.city}</span>}
              </div>
            </div>
          </div>
          {profile.bio && <p className="mt-4 text-sm leading-relaxed text-ink-600">{profile.bio}</p>}
          {profile.address && <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-500"><MapPin size={14} />{profile.address}</p>}
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-ink-900">Services offered</h2>
        {services.length === 0 ? (
          <EmptyState icon={<Calendar size={24} />} title="No services listed yet" description="This provider hasn't added any services." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((s) => {
              const meta = SERVICE_CATEGORIES.find((c) => c.value === s.category);
              return (
                <div key={s._id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><CategoryIcon name={meta?.icon ?? 'Briefcase'} className="h-5 w-5" /></div>
                      <div><h3 className="font-semibold text-ink-900">{s.title}</h3><span className="text-xs text-ink-400">{meta?.label ?? s.category}</span></div>
                    </div>
                    <p className="text-lg font-bold text-primary-700">{formatPrice(Number(s.basePrice), s.priceUnit)}</p>
                  </div>
                  {s.description && <p className="mt-3 text-sm text-ink-500">{s.description}</p>}
                  <Button className="mt-4 w-full" onClick={() => setBookingService(s)}><Calendar size={16} />Book this service</Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {avails.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Weekly availability</h2>
          <div className="card p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DAYS_OF_WEEK.map((day, idx) => {
                const slots = availByDay[idx] ?? [];
                return (
                  <div key={day} className="flex items-start gap-2 rounded-lg bg-ink-50 px-3 py-2.5">
                    <Clock size={16} className="mt-0.5 shrink-0 text-ink-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-700">{day}</p>
                      {slots.length === 0 ? <p className="text-xs text-ink-400">Unavailable</p> : <p className="text-xs text-ink-500">{slots.map((s) => `${s.startTime}–${s.endTime}`).join(', ')}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {bookingService && (
        <BookingModal service={bookingService} providerId={profile.user} providerName={providerUser.name} onClose={() => setBookingService(null)} onBooked={(bookingId) => { setBookingService(null); navigate(`/dashboard/bookings/${bookingId}`); }} />
      )}
    </div>
  );
}
