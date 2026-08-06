import { useState } from 'react';
import { Search as SearchIcon, MapPin, Map as MapIcon, Grid } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { SearchForm } from '@/components/SearchForm';
import { ProviderCard } from '@/components/ProviderCard';
import { EmptyState, ErrorBanner, ProviderCardSkeleton } from '@/components/ui';
import { searchProviders } from '@/lib/queries';

// Fix default marker icons broken by webpack/vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ResultsMap({ results, center }) {
  if (!center) return null;
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-ink-200 shadow-sm" style={{ height: '380px' }}>
      <MapContainer center={[center.lat, center.lng]} zoom={13} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {results.map((r) => {
          const [lng, lat] = r.location?.coordinates ?? [0, 0];
          if (!lat || !lng) return null;
          return (
            <Marker key={r._id} position={[lat, lng]}>
              <Popup>
                <div className="min-w-[140px]">
                  <p className="font-semibold text-ink-900">{r.user?.name ?? 'Provider'}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{r.city}</p>
                  {r.rating > 0 && <p className="mt-1 text-xs text-accent-600">★ {r.rating.toFixed(1)}</p>}
                  <Link
                    to={`/dashboard/providers/${r.user?._id ?? r.user}`}
                    className="mt-2 block text-xs font-medium text-primary-600 hover:underline"
                  >
                    View profile →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export function CustomerSearch() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastParams, setLastParams] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const handleSearch = async (params) => {
    setLastParams(params);
    setLoading(true);
    setError(null);
    try {
      const data = await searchProviders({
        lat: params.lat,
        lng: params.lng,
        maxDistance: params.maxDistance,
        category: params.category,
        minRating: params.minRating,
        date: params.date,
      });
      setResults(data);
    } catch (err) {
      setError(
        err?.response
          ? 'The server could not complete this search. Please try again in a moment.'
          : 'Could not reach the server. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">Find services near you</h1>
        <p className="mt-1 text-sm text-ink-500">Search by locality, category, and availability. Providers are ranked by distance.</p>
      </div>

      <SearchForm onSearch={handleSearch} loading={loading} />

      <div className="mt-6">
        {loading && (
          <div>
            <p className="mb-4 text-sm text-ink-500">Searching nearby providers…</p>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[0, 1, 2, 3].map((i) => <ProviderCardSkeleton key={i} />)}
            </div>
          </div>
        )}

        {!loading && error && <ErrorBanner message={error} />}

        {!loading && !error && results && (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-ink-800">{results.length} {results.length === 1 ? 'provider' : 'providers'} found</h2>
                {lastParams?.locationLabel && <span className="flex min-w-0 items-center gap-1 text-sm text-ink-500"><MapPin size={14} className="shrink-0" /><span className="truncate">{lastParams.locationLabel}</span></span>}
              </div>
              {results.length > 0 && (
                <div className="flex items-center gap-1 rounded-lg border border-ink-200 p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    className={`rounded p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-ink-400 hover:text-ink-700'}`}
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    aria-label="Map view"
                    className={`rounded p-1.5 transition-colors ${viewMode === 'map' ? 'bg-primary-600 text-white' : 'text-ink-400 hover:text-ink-700'}`}
                  >
                    <MapIcon size={16} />
                  </button>
                </div>
              )}
            </div>
            {results.length === 0 ? (
              <EmptyState
                icon={<SearchIcon size={24} />}
                title="No providers in this area yet"
                description="Try widening the search radius, clearing the category filter, or searching a nearby locality."
              />
            ) : viewMode === 'map' ? (
              <ResultsMap results={results} center={lastParams} />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {results.map((r) => <ProviderCard key={r._id} result={r} />)}
              </div>
            )}
          </div>
        )}

        {!loading && !error && !results && (
          <EmptyState
            icon={<MapPin size={24} />}
            title="Start your search"
            description='Type a locality like "Gomti Nagar" or "Hazratganj", or use your current location to find providers nearby.'
          />
        )}
      </div>
    </div>
  );
}
