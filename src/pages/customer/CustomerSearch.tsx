import { useState } from 'react';
import { Search as SearchIcon, MapPin } from 'lucide-react';
import { SearchForm, type SearchParams } from '@/components/SearchForm';
import { ProviderCard } from '@/components/ProviderCard';
import { EmptyState, Spinner } from '@/components/ui';
import { searchProviders } from '@/lib/queries';
import type { SearchResultProvider } from '@/types/db';

export function CustomerSearch() {
  const [results, setResults] = useState<SearchResultProvider[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastParams, setLastParams] = useState<SearchParams | null>(null);

  const handleSearch = async (params: SearchParams) => {
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
    } catch {
      setError('Could not complete the search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">Find services near you</h1>
        <p className="mt-1 text-sm text-ink-500">Search by location, category, and availability. Providers are ranked by distance.</p>
      </div>

      <SearchForm onSearch={handleSearch} loading={loading} />

      <div className="mt-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-8 w-8" />
            <p className="mt-3 text-sm text-ink-500">Searching nearby providers…</p>
          </div>
        )}

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {!loading && !error && results && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-800">{results.length} {results.length === 1 ? 'provider' : 'providers'} found</h2>
              {lastParams?.locationLabel && <span className="flex items-center gap-1 text-sm text-ink-500"><MapPin size={14} />{lastParams.locationLabel}</span>}
            </div>
            {results.length === 0 ? (
              <EmptyState icon={<SearchIcon size={24} />} title="No providers found" description="Try widening your search radius, removing filters, or choosing a different location." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {results.map((r) => <ProviderCard key={r._id} result={r} />)}
              </div>
            )}
          </div>
        )}

        {!loading && !error && !results && (
          <EmptyState icon={<MapPin size={24} />} title="Start your search" description="Enter lat,lng coordinates or use your current location to find service providers near you." />
        )}
      </div>
    </div>
  );
}
