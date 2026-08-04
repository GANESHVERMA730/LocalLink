import { useEffect, useRef, useState } from 'react';
import { MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { CategoryIcon } from '@/components/Icon';
import { SERVICE_CATEGORIES } from '@/constants/categories';
import { reverseGeocode } from '@/lib/queries';
import { loadLastSearch, saveLastSearch, pushRecentAddress } from '@/lib/searchHistory';
import PropTypes from 'prop-types';

export function SearchForm({ onSearch, loading }) {
  const [place, setPlace] = useState(null);
  const [maxDistance, setMaxDistance] = useState(10000);
  const [category, setCategory] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [date, setDate] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [formError, setFormError] = useState('');

  const restoredRef = useRef(false);

  const runSearch = (overrides = {}) => {
    const next = {
      place,
      maxDistance,
      category,
      minRating,
      date,
      ...overrides,
    };
    if (!next.place) {
      setFormError('Search for a locality above, or use your current location.');
      return;
    }
    setFormError('');
    const params = {
      lat: next.place.lat,
      lng: next.place.lng,
      maxDistance: next.maxDistance,
      category: next.category || undefined,
      minRating: next.minRating || undefined,
      date: next.date || undefined,
      locationLabel: next.place.label,
    };
    saveLastSearch(params);
    onSearch(params);
  };

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const last = loadLastSearch();
    if (!last) return;
    const restoredPlace = { lat: last.lat, lng: last.lng, label: last.locationLabel || '' };
    setPlace(restoredPlace);
    setMaxDistance(last.maxDistance ?? 10000);
    setCategory(last.category ?? '');
    setMinRating(last.minRating ?? 0);
    setDate(last.date ?? '');
    onSearch(last);
    // Restore is a one-shot on mount; runSearch would re-save what we just read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectPlace = (selected) => {
    setPlace(selected);
    pushRecentAddress(selected);
    runSearch({ place: selected });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setFormError('Your browser does not support location access. Search for a locality instead.');
      return;
    }
    setFormError('');
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let label = 'Your current location';
        try {
          const reversed = await reverseGeocode(lat, lng);
          if (reversed?.label) label = reversed.label;
        } catch {
          // Coordinates are valid even if naming them failed — search anyway.
        }
        const selected = { lat, lng, label };
        setPlace(selected);
        setGeoLoading(false);
        runSearch({ place: selected });
      },
      () => {
        setGeoLoading(false);
        setFormError('Could not get your location. Search for a locality instead.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleCategory = (value) => {
    setCategory(value);
    if (place) runSearch({ category: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch();
  };

  return (
    <div className="card p-4 sm:p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="location">Location</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <AddressAutocomplete
              value={place?.label ?? ''}
              onSelect={handleSelectPlace}
              onClear={() => setPlace(null)}
            />
            <Button type="button" variant="secondary" onClick={useMyLocation} loading={geoLoading} className="w-full shrink-0 sm:w-auto">
              {!geoLoading && <MapPin size={16} />}
              Use my location
            </Button>
          </div>
          {formError && <p role="alert" className="mt-1.5 break-words text-xs text-red-600">{formError}</p>}
        </div>

        <div>
          <label className="label">Category</label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => handleCategory('')} className={`badge px-3 py-1.5 text-sm transition-colors ${!category ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>All</button>
            {SERVICE_CATEGORIES.map((cat) => (
              <button key={cat.value} type="button" onClick={() => handleCategory(cat.value)} className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${category === cat.value ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
                <CategoryIcon name={cat.icon} className="h-4 w-4 shrink-0" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="label mb-0" htmlFor="radius">Search radius</label>
            <span className="shrink-0 text-sm font-semibold text-primary-700">{maxDistance < 1000 ? `${maxDistance} m` : `${(maxDistance / 1000).toFixed(0)} km`}</span>
          </div>
          <input id="radius" type="range" min={1000} max={50000} step={1000} value={maxDistance} onChange={(e) => setMaxDistance(Number(e.target.value))} className="mt-2 w-full" />
        </div>

        <button type="button" onClick={() => setShowFilters((v) => !v)} className="flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-ink-800">
          <SlidersHorizontal size={16} />
          More filters {showFilters && <X size={14} />}
        </button>

        {showFilters && (
          <div className="grid gap-4 rounded-xl bg-ink-50 p-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="minRating">Min rating</label>
              <select id="minRating" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="input">
                <option value={0}>Any rating</option>
                <option value={3}>3.0+ ★</option>
                <option value={4}>4.0+ ★</option>
                <option value={4.5}>4.5+ ★</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="availableOn">Available on date</label>
              <input id="availableOn" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            </div>
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full sm:w-auto">
          {!loading && <Search size={16} />}
          {loading ? 'Searching…' : 'Search providers'}
        </Button>
      </form>
    </div>
  );
}

SearchForm.propTypes = {
  onSearch: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
