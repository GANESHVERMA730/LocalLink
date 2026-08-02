import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { CustomerSearch } from '@/pages/customer/CustomerSearch';
import { ProviderProfilePage } from '@/pages/customer/ProviderProfile';
import { BookingsList } from '@/pages/BookingsList';
import { BookingDetail } from '@/pages/BookingDetail';
import { ProfileSettings } from '@/pages/ProfileSettings';
import { ProviderProfileEditor } from '@/pages/provider/ProviderProfileEditor';
import { ServicesManager } from '@/pages/provider/ServicesManager';
import { AvailabilityEditor } from '@/pages/provider/AvailabilityEditor';
import { ProviderDashboard } from '@/pages/provider/ProviderDashboard';
import { FullPageSpinner } from '@/components/ui';
import type { Role } from '@/types/db';

function AppLayout() {
  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}

function RoleRoute({ role }: { role: Role }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user?.role !== role) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (user?.role === 'provider') return <Navigate to="/dashboard/provider/bookings" replace />;
  return <Navigate to="/dashboard/search" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardRedirect />} />

        {/* Customer routes */}
        <Route path="search" element={<CustomerSearch />} />
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
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
