import { createContext, useContext, useEffect, useState } from 'react';
import { setAuth, clearAuth, getStoredUser, getToken } from '@/lib/api';
import { registerUser, loginUser, fetchMe } from '@/lib/queries';
import { disconnectSocket } from '@/lib/socket';
import PropTypes from 'prop-types';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();
    if (token && stored) {
      setUser(stored);
      // Verify token is still valid by fetching /users/me
      fetchMe()
        .then((fresh) => setUser(fresh))
        .catch(() => {
          clearAuth();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async ({ email, password, name, role, phone }) => {
    try {
      const { token, user: newUser } = await registerUser({ email, password, name, role, phone });
      setAuth(token, newUser);
      setUser(newUser);
      return { error: null };
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { token, user: newUser } = await loginUser(email, password);
      setAuth(token, newUser);
      setUser(newUser);
      return { error: null };
    } catch (err) {
      return { error: mapAuthError(err) };
    }
  };

  const signOut = () => {
    clearAuth();
    disconnectSocket();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const fresh = await fetchMe();
      setUser(fresh);
      setAuth(getToken(), fresh);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};

function mapAuthError(err) {
  const status = err?.response?.status;
  const message = err?.response?.data?.error;
  if (status === 401) return message || 'Incorrect email or password.';
  if (status === 409) return message || 'An account with that email already exists.';
  if (message) return message;
  return 'Something went wrong. Please try again.';
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
