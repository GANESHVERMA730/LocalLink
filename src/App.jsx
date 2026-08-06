import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';
import { CustomerSearch } from '@/pages/customer/CustomerSearch';
import { CustomerDashboard } from '@/pages/customer/CustomerDashboard';
import { Favorites } from '@/pages/customer/Favorites';
import { ProviderProfilePage } from '@/pages/customer/ProviderProfile';
import { BookingsList } from '@/pages/BookingsList';
import { BookingDetail } from '@/pages/BookingDetail';
import { ProfileSettings } from '@/pages/ProfileSettings';
import { ProviderProfileEditor } from '@/pages/provider/ProviderProfileEditor';
import { ServicesManager } from '@/pages/provider/ServicesManager';
import { AvailabilityEditor } from '@/pages/provider/AvailabilityEditor';
import { ProviderDashboard } from '@/pages/provider/ProviderDashboard';
import { FullPageSpinner } from '@/components/ui';
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-2xl">⚠</span>
          </div>
          <h1 className="text-xl font-bold text-ink-900">Something went wrong</h1>
          <p className="max-w-sm text-sm text-ink-500">An unexpected error occurred. Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Refresh page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppLayout() {
  return (
    <FavoritesProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-ink-50">
          <Navbar />
          <main className="animate-fade-in">
            <Outlet />
          </main>
        </div>
      </NotificationProvider>
    </FavoritesProvider>
  );
}

function RoleRoute({ role }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user?.role !== role) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function DashboardHome() {
  const { user } = useAuth();
  if (user?.role === 'provider') return <Navigate to="/dashboard/provider/bookings" replace />;
  return <CustomerDashboard />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />

        {/* Customer routes */}
        <Route path="search" element={<CustomerSearch />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="providers/:userId" element={<ProviderProfilePage />} />
        <Route path="bookings" element={<BookingsList />} />
        <Route path="bookings/:bookingId" element={<BookingDetail />} />
        <Route path="profile" element={<ProfileSettings />} />

        {/* Provider-only routes */}
        <Route element={<RoleRoute role="provider" />}>
          <Route path="provider/profile" element={<ProviderProfileEditor />} />
          <Route path="provider/services" element={<ServicesManager />} />
          <Route path="provider/availability" element={<AvailabilityEditor />} />
          <Route path="provider/bookings" element={<ProviderDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { fontSize: '14px', maxWidth: '360px' },
              success: { iconTheme: { primary: '#16a34a', secondary: '#f0fdf4' } },
              error: { iconTheme: { primary: '#dc2626', secondary: '#fef2f2' } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

