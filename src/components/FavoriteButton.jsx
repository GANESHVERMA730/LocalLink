import { Heart } from 'lucide-react';
import PropTypes from 'prop-types';
import { useFavorites } from '@/context/FavoritesContext';

export function FavoriteButton({ providerId, size = 18, className = '' }) {
  const { isFavorite, toggleFavorite, enabled } = useFavorites();
  if (!enabled || !providerId) return null;

  const saved = isFavorite(providerId);

  // ProviderCard wraps its whole body in a <Link>, so the click must be stopped
  // from navigating before it can toggle.
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(providerId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved providers' : 'Save provider'}
      title={saved ? 'Remove from saved' : 'Save provider'}
      className={`rounded-full p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        saved ? 'text-red-500 hover:bg-red-50' : 'text-ink-300 hover:bg-ink-100 hover:text-red-400'
      } ${className}`}
    >
      <Heart size={size} className={saved ? 'fill-red-500' : ''} />
    </button>
  );
}

FavoriteButton.propTypes = {
  providerId: PropTypes.string,
  size: PropTypes.number,
  className: PropTypes.string,
};
