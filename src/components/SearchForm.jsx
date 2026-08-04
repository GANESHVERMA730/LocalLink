import { useState } from 'react';
import { MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { CategoryIcon } from '@/components/Icon';
import { SERVICE_CATEGORIES } from '@/constants/categories';
import PropTypes from 'prop-types';

export function SearchForm({ onSearch, loading }) {
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [locationLabel, setLocationLabel] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [maxDistance, setMaxDistance] = useState(10000);
  const [category, setCategory] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [date, setDate] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [formError, setFormError] = useState('');

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setFormError('Your browser does not support location access. Enter coordinates as "lat,lng" instead.');
      return;
    }
    setFormError('');
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationLabel('Your current location');
        setManualAddress('');
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        setFormError('Could not get your location. Enter coordinates as "lat,lng" instead.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    let searchLat = lat;
    let searchLng = lng;
    let label = locationLabel;

    if (lat === 0 && lng === 0) {
      const parts = manualAddress.split(',').map((s) => parseFloat(s.trim()));
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        setFormError('Enter coordinates as "lat,lng" (e.g. 40.71,-74.00) or use your current location.');
        return;
      }
      if (parts[0] < -90 || parts[0] > 90 || parts[1] < -180 || parts[1] > 180) {
        setFormError('Latitude must be between -90 and 90, longitude between -180 and 180.');
        return;
      }
      [searchLat, searchLng] = parts;
      label = `Coords: ${searchLat}, ${searchLng}`;
      setLat(searchLat);
      setLng(searchLng);
      setLocationLabel(label);
    }

    onSearch({
      lat: searchLat,
      lng: searchLng,
      maxDistance,
      category: category || undefined,
      minRating: minRating || undefined,
      date: date || undefined,
      locationLabel: label,
    });
  };

  return (
    <div className="card p-4 sm:p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="location">Location</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                id="location"
                type="text"
                value={manualAddress || locationLabel}
                onChange={(e) => { setManualAddress(e.target.value); setLocationLabel(''); }}
                className="input pl-10"
                placeholder="Enter lat,lng (e.g. 40.71,-74.00)"
              />
            </div>
            <Button type="button" variant="secondary" onClick={useMyLocation} loading={geoLoading} className="w-full shrink-0 sm:w-auto">
              {!geoLoading && <MapPin size={16} />}
              Use my location
            </Button>
          </div>
          {lat !== 0 && <p className="mt-1.5 break-words text-xs text-ink-400">{locationLabel || 'Location set'} · {lat.toFixed(4)}, {lng.toFixed(4)}</p>}
          {formError && <p role="alert" className="mt-1.5 break-words text-xs text-red-600">{formError}</p>}
        </div>

        <div>
          <label className="label">Category</label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setCategory('')} className={`badge px-3 py-1.5 text-sm transition-colors ${!category ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>All</button>
            {SERVICE_CATEGORIES.map((cat) => (
              <button key={cat.value} type="button" onClick={() => setCategory(cat.value)} className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${category === cat.value ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
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
              <label className="label">Min rating</label>
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="input">
                <option value={0}>Any rating</option>
                <option value={3}>3.0+ ★</option>
                <option value={4}>4.0+ ★</option>
                <option value={4.5}>4.5+ ★</option>
              </select>
            </div>
            <div>
              <label className="label">Available on date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            </div>
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full sm:w-auto">
          {!loading && <Search size={16} />}
          Search providers
        </Button>
      </form>
    </div>
  );
}

SearchForm.propTypes = {
  onSearch: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
