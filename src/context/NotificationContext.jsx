import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { useAuth } from './AuthContext';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/queries';
import { onNotificationNew } from '@/lib/socket';

const NotificationContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'SET':
      return { ...state, notifications: action.notifications, unreadCount: action.unreadCount, loaded: true };
    case 'PREPEND': {
      const exists = state.notifications.some((n) => n._id === action.notification._id);
      if (exists) return state;
      return {
        ...state,
        notifications: [action.notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    }
    case 'MARK_READ': {
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n._id === action.id ? { ...n, read: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      };
    default:
      return state;
  }
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, { notifications: [], unreadCount: 0, loaded: false });

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchNotifications({ limit: 30 });
      dispatch({ type: 'SET', notifications: data.notifications ?? [], unreadCount: data.unreadCount ?? 0 });
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    load();
    const unsub = onNotificationNew(({ notification }) => {
      dispatch({ type: 'PREPEND', notification });
    });
    return () => { if (unsub) unsub(); };
  }, [user, load]);

  const markRead = useCallback(async (id) => {
    dispatch({ type: 'MARK_READ', id });
    try {
      await markNotificationRead(id);
    } catch {
      // ignore — optimistic update stands
    }
  }, []);

  const markAllRead = useCallback(async () => {
    dispatch({ type: 'MARK_ALL_READ' });
    try {
      await markAllNotificationsRead();
    } catch {
      // ignore
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ ...state, markRead, markAllRead, reload: load }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
