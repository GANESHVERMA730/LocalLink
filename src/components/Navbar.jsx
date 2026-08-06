import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, MapPin, Search, Calendar, Settings, User as UserIcon, Heart, LayoutDashboard, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { formatRelativeTime } from '@/lib/format';

function NotificationDropdown({ onClose }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (n) => {
    if (!n.read) markRead(n._id);
    if (n.link) navigate(n.link);
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-ink-100 bg-white shadow-xl z-50">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <span className="text-sm font-semibold text-ink-900">Notifications</span>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-ink-50">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-ink-400">No notifications yet.</div>
        ) : (
          notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => handleClick(n)}
              className={`w-full px-4 py-3 text-left transition-colors hover:bg-ink-50 ${!n.read ? 'bg-primary-50/40' : ''}`}
            >
              <div className="flex items-start gap-2">
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
                <div className={`min-w-0 ${n.read ? 'pl-4' : ''}`}>
                  <p className="truncate text-sm font-medium text-ink-900">{n.title}</p>
                  <p className="mt-0.5 text-xs text-ink-500 line-clamp-2">{n.message}</p>
                  <p className="mt-1 text-xs text-ink-400">{formatRelativeTime(n.createdAt)}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function Navbar() {
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

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
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
          { to: '/dashboard/search', label: 'Search', icon: Search },
          { to: '/dashboard/favorites', label: 'Saved', icon: Heart },
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
                end={l.end}
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
              {/* Notification bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative rounded-lg p-2 text-ink-600 hover:bg-ink-100 focus-visible:ring-2 focus-visible:ring-primary-500 focus:outline-none"
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
              </div>
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
                  end={l.end}
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
              {/* Mobile notification link */}
              <button
                onClick={() => { setOpen(false); setNotifOpen(true); }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
              >
                <Bell size={18} />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
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
