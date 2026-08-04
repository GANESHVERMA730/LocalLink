import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { geocodeSearch } from '@/lib/queries';
import { loadRecentAddresses } from '@/lib/searchHistory';
import PropTypes from 'prop-types';

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 400;

// Module-level so suggestions survive remounts and repeat searches cost no requests.
const suggestionCache = new Map();

function splitLabel(label) {
  const [primary, ...rest] = label.split(',');
  return { primary: primary.trim(), secondary: rest.join(',').trim() };
}

export function AddressAutocomplete({ value, onSelect, onClear, disabled }) {
  const [query, setQuery] = useState(value ?? '');
  const [suggestions, setSuggestions] = useState([]);
  const [recent, setRecent] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [highlight, setHighlight] = useState(-1);

  const listId = useId();
  const wrapperRef = useRef(null);
  const abortRef = useRef(null);
  const skipFetchRef = useRef(false);

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  useEffect(() => {
    setQuery(value ?? '');
  }, [value]);

  useEffect(() => {
    setRecent(loadRecentAddresses());
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    // A selection just filled the input — showing results for it would be noise.
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      setError('');
      return;
    }

    const key = trimmed.toLowerCase();
    const cached = suggestionCache.get(key);
    if (cached) {
      setSuggestions(cached);
      setError(cached.length ? '' : 'No matching places found.');
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');
    geocodeSearch(trimmed, controller.signal)
      .then((results) => {
        suggestionCache.set(key, results);
        setSuggestions(results);
        setHighlight(-1);
        if (results.length === 0) setError('No matching places found.');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setSuggestions([]);
        setError(
          err?.response?.status === 429
            ? 'Too many lookups. Wait a moment and try again.'
            : 'Could not look up that address. Check your connection and try again.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const showRecent = query.trim().length < MIN_QUERY_LENGTH && recent.length > 0;
  const options = showRecent ? recent : suggestions;

  const choose = (place) => {
    skipFetchRef.current = true;
    setQuery(place.label);
    setOpen(false);
    setHighlight(-1);
    setSuggestions([]);
    onSelect(place);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!options.length) return;
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => {
        const next = e.key === 'ArrowDown' ? h + 1 : h - 1;
        if (next < 0) return options.length - 1;
        if (next >= options.length) return 0;
        return next;
      });
      return;
    }
    if (e.key === 'Enter') {
      // Let the suggestion win over form submission while the list is open.
      if (open && highlight >= 0 && options[highlight]) {
        e.preventDefault();
        choose(options[highlight]);
      }
    }
  };

  const clear = () => {
    setQuery('');
    setSuggestions([]);
    setError('');
    setOpen(false);
    onClear?.();
  };

  return (
    <div ref={wrapperRef} className="relative min-w-0 flex-1">
      <MapPin size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
      <input
        id="location"
        type="text"
        role="combobox"
        aria-expanded={open && options.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={highlight >= 0 ? `${listId}-opt-${highlight}` : undefined}
        autoComplete="off"
        disabled={disabled}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="input pl-10 pr-10"
        placeholder="Search a locality, e.g. Gomti Nagar, Lucknow"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {loading ? (
          <Loader2 size={16} className="animate-spin text-ink-400" />
        ) : query ? (
          <button type="button" onClick={clear} aria-label="Clear address" className="text-ink-400 hover:text-ink-700">
            <X size={16} />
          </button>
        ) : null}
      </div>

      {open && (options.length > 0 || error) && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card-hover">
          {showRecent && (
            <p className="border-b border-ink-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-ink-400">
              Recent searches
            </p>
          )}
          {options.length > 0 ? (
            <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1">
              {options.map((place, i) => {
                const { primary, secondary } = splitLabel(place.label);
                return (
                  <li key={place.id ?? place.label} id={`${listId}-opt-${i}`} role="option" aria-selected={i === highlight}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => choose(place)}
                      className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${i === highlight ? 'bg-primary-50' : 'hover:bg-ink-50'}`}
                    >
                      <Search size={15} className="mt-0.5 shrink-0 text-ink-400" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink-900">{primary}</span>
                        {secondary && <span className="block truncate text-xs text-ink-500">{secondary}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p role="alert" className="break-words px-3 py-2.5 text-sm text-ink-500">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

AddressAutocomplete.propTypes = {
  value: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onClear: PropTypes.func,
  disabled: PropTypes.bool,
};
