import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '@/context/AuthContext';
import { fetchFavorites, addFavorite, removeFavorite } from '@/lib/queries';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';
  const [ids, setIds] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!isCustomer) {
      setIds(new Set());
      setLoaded(true);
      return [];
    }
    try {
      const providers = await fetchFavorites();
      setIds(new Set(providers.map((p) => (typeof p.user === 'object' ? p.user._id : p.user))));
      return providers;
    } catch {
      return [];
    } finally {
      setLoaded(true);
    }
  }, [isCustomer]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Optimistic: flip the id immediately, then revert just that id if the
  // request fails, so a slow network never blocks the heart from responding.
  const toggleFavorite = useCallback(
    async (providerId) => {
      if (!providerId || !isCustomer) return;
      const wasSaved = ids.has(providerId);
      setIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(providerId);
        else next.add(providerId);
        return next;
      });
      try {
        if (wasSaved) await removeFavorite(providerId);
        else await addFavorite(providerId);
      } catch {
        setIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(providerId);
          else next.delete(providerId);
          return next;
        });
      }
    },
    [ids, isCustomer],
  );

  const value = useMemo(
    () => ({
      favoriteIds: ids,
      isFavorite: (id) => ids.has(id),
      toggleFavorite,
      refresh,
      enabled: isCustomer,
      loaded,
    }),
    [ids, toggleFavorite, refresh, isCustomer, loaded],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

FavoritesProvider.propTypes = {
  children: PropTypes.node,
};

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside a FavoritesProvider');
  return ctx;
}
