import { useState } from 'react';
import { Search as SearchIcon, MapPin } from 'lucide-react';
import { SearchForm } from '@/components/SearchForm';
import { ProviderCard } from '@/components/ProviderCard';
import { EmptyState, ErrorBanner, ProviderCardSkeleton } from '@/components/ui';
import { searchProviders } from '@/lib/queries';

export function CustomerSearch() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastParams, setLastParams] = useState(null);

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
              <h2 className="text-lg font-semibold text-ink-800">{results.length} {results.length === 1 ? 'provider' : 'providers'} found</h2>
              {lastParams?.locationLabel && <span className="flex min-w-0 items-center gap-1 text-sm text-ink-500"><MapPin size={14} className="shrink-0" /><span className="truncate">{lastParams.locationLabel}</span></span>}
            </div>
            {results.length === 0 ? (
              <EmptyState
                icon={<SearchIcon size={24} />}
                title="No providers in this area yet"
                description="Try widening the search radius, clearing the category filter, or searching a nearby locality."
              />
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
            description="Type a locality like “Gomti Nagar” or “Hazratganj”, or use your current location to find providers nearby."
          />
        )}
      </div>
    </div>
  );
}
