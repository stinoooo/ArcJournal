import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { VaultProvider, useVault } from './context/VaultContext';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Spinner from './components/Spinner';
import AnnouncementBanner from './components/AnnouncementBanner';
import UpdateBanner from './components/UpdateBanner';
import WarningModal from './components/WarningModal';
import api from './api';

import SignIn          from './pages/SignIn';
import Onboarding      from './pages/Onboarding';
import Dashboard       from './pages/Dashboard';
import Journal         from './pages/Journal';
import ArcStats        from './pages/ArcWrapped';
import Settings        from './pages/Settings';
import AdminPanel      from './pages/AdminPanel';
import AccountStatus   from './pages/AccountStatus';
import AccountStanding from './pages/AccountStanding';
import Vault           from './pages/Vault';

function LoadingScreen() {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Spinner size={32} />
      <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)', fontSize: 13 }}>Loading ArcJournal...</p>
    </div>
  );
}

function WarningCheck({ children }) {
  const { user } = useAuth();
  const [pendingWarnings, setPending] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.get('/warnings/unacknowledged')
      .then(r => setPending(r.data.warnings || []))
      .catch(() => setPending([]));
  }, [user]);

  if (pendingWarnings === null) return children;
  if (pendingWarnings.length > 0) {
    return (
      <>
        {children}
        <WarningModal warnings={pendingWarnings} onDismiss={() => setPending([])} />
      </>
    );
  }
  return children;
}

function AuthLayout() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    if (['suspended', 'terminated', 'deleted'].includes(user.status)) return <Navigate to="/account-status" replace />;
    return <Navigate to={user.onboardingComplete ? '/app' : '/onboarding'} replace />;
  }
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TitleBar />
      <div style={{ flex: 1, overflow: 'hidden' }}><Outlet /></div>
    </div>
  );
}

function OnboardingLayout() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/signin" replace />;
  if (['suspended', 'terminated', 'deleted'].includes(user.status)) return <Navigate to="/account-status" replace />;
  if (user.onboardingComplete) return <Navigate to="/app" replace />;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TitleBar />
      <div style={{ flex: 1, overflow: 'hidden' }}><Outlet /></div>
    </div>
  );
}

function MigrationNotice() {
  const { migration } = useVault();
  if (!migration) return null;
  return (
    <div role="status" style={{ padding: '8px 16px', fontSize: 12, color: 'var(--accent)', background: 'var(--accent-glow)', borderBottom: '1px solid var(--border)' }}>
      Encrypting your older entries ({migration.done} of {migration.total}). Keep ArcJournal open until this finishes.
    </div>
  );
}

function JournalGate() {
  const { state } = useVault();
  if (state !== 'unlocked') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TitleBar />
        <div style={{ flex: 1, overflow: 'hidden' }}><Vault /></div>
      </div>
    );
  }
  return (
    <WarningCheck>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TitleBar />
        <UpdateBanner />
        <AnnouncementBanner />
        <MigrationNotice />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <Sidebar />
          <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}><Outlet /></main>
        </div>
      </div>
    </WarningCheck>
  );
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/signin" replace />;
  if (['suspended', 'terminated', 'deleted'].includes(user.status)) return <Navigate to="/account-status" replace />;
  if (!user.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return (
    <VaultProvider>
      <JournalGate />
    </VaultProvider>
  );
}

function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || user.role !== 'admin') return <Navigate to="/app" replace />;
  return <Outlet />;
}

function StatusRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/signin" replace />;
  if (user.status === 'active') return <Navigate to="/app" replace />;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TitleBar />
      <div style={{ flex: 1, overflow: 'hidden' }}><Outlet /></div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route element={<AuthLayout />}>
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<Navigate to="/signin" replace />} />
              </Route>
              <Route element={<OnboardingLayout />}>
                <Route path="/onboarding" element={<Onboarding />} />
              </Route>
              <Route element={<StatusRoute />}>
                <Route path="/account-status" element={<AccountStatus />} />
              </Route>
              <Route path="/app" element={<ProtectedLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="journal"          element={<Journal />} />
                <Route path="stats"            element={<ArcStats />} />
                <Route path="settings"         element={<Settings />} />
                <Route path="account-standing" element={<AccountStanding />} />
                <Route element={<AdminRoute />}>
                  <Route path="admin" element={<AdminPanel />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}