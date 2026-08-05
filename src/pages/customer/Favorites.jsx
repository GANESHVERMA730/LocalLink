import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search as SearchIcon } from 'lucide-react';
import { useFavorites } from '@/context/FavoritesContext';
import { fetchFavorites } from '@/lib/queries';
import { ProviderCard } from '@/components/ProviderCard';
import { EmptyState, PageHeader, ProviderCardSkeleton } from '@/components/ui';
import { SERVICE_CATEGORIES } from '@/constants/categories';

const CATEGORY_LABEL = Object.fromEntries(SERVICE_CATEGORIES.map((c) => [c.value, c.label.toLowerCase()]));

export function Favorites() {
  const { favoriteIds } = useFavorites();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      setProviders(await fetchFavorites());
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Drop any provider un-hearted since this page loaded, so the optimistic
  // toggle removes the card without waiting for a refetch.
  const stillSaved = useMemo(
    () => providers.filter((p) => favoriteIds.has(typeof p.user === 'object' ? p.user._id : p.user)),
    [providers, favoriteIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stillSaved;
    return stillSaved.filter((p) => {
      const name = (typeof p.user === 'object' ? p.user.name : '') ?? '';
      const haystack = [
        name,
        p.city ?? '',
        p.bio ?? '',
        ...(p.services ?? []).map((s) => `${s.title} ${CATEGORY_LABEL[s.category] ?? s.category}`),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [stillSaved, query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Saved providers" subtitle="Providers you've hearted, ready to book again" />

      {!loading && stillSaved.length > 0 && (
        <div className="mb-5 relative">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search saved providers by name, city, or service"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search saved providers"
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <ProviderCardSkeleton key={i} />)}
        </div>
      ) : stillSaved.length === 0 ? (
        <EmptyState
          icon={<Heart size={24} />}
          title="No saved providers yet"
          description="Tap the heart on any provider in search results or on their profile to save them here."
          action={<Link to="/dashboard/search" className="btn-primary">Find services</Link>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={24} />}
          title="No matches"
          description="No saved provider matches that search. Try a different name, city, or service."
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-500">
            {filtered.length} of {stillSaved.length} saved
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filtered.map((p) => <ProviderCard key={p._id} result={p} />)}
          </div>
        </>
      )}
    </div>
  );
}
