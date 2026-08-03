import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, MapPin, Search, Calendar, Settings, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  const links =
    user?.role === 'provider'
      ? [
          { to: '/dashboard/provider/profile', label: 'My Profile', icon: UserIcon },
          { to: '/dashboard/provider/services', label: 'Services', icon: Settings },
          { to: '/dashboard/provider/availability', label: 'Availability', icon: Calendar },
          { to: '/dashboard/provider/bookings', label: 'Bookings', icon: Calendar },
        ]
      : [
          { to: '/dashboard/search', label: 'Search', icon: Search },
          { to: '/dashboard/bookings', label: 'My Bookings', icon: Calendar },
        ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link to={user ? '/dashboard' : '/'} className="flex shrink-0 items-center gap-2 font-display text-lg font-bold text-ink-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
            <MapPin size={18} />
          </span>
          LocalLink
        </Link>

        {user && (
          <div className="hidden min-w-0 items-center gap-1 lg:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-ink-600 hover:bg-ink-100'
                  }`
                }
              >
                <l.icon size={16} />
                {l.label}
              </NavLink>
            ))}
          </div>
        )}

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {user ? (
            <>
              <span className="text-sm font-medium text-ink-700 max-w-[120px] truncate">{user.name}</span>
              <button onClick={handleSignOut} className="btn-ghost flex items-center gap-2" title="Logout">
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Sign in</Link>
              <Link to="/register" className="btn-primary">Get started</Link>
            </>
          )}
        </div>

        <button
          className="shrink-0 rounded-lg p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-ink-100 bg-white px-4 pb-4 pt-2 sm:px-6 lg:hidden">
          {user && (
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-primary-50 text-primary-700' : 'text-ink-700 hover:bg-ink-100'
                    }`
                  }
                >
                  <l.icon size={18} />
                  {l.label}
                </NavLink>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  handleSignOut();
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
          {!user && (
            <div className="flex flex-col gap-2">
              <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary w-full">Sign in</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary w-full">Get started</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
