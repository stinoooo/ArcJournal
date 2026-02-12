import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Spinner from './components/Spinner';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import ArcStats from './pages/ArcWrapped';
import Settings from './pages/Settings';

function LoadingScreen() {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Spinner size={32} />
      <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)', fontSize: 13 }}>Loading ArcJournal...</p>
    </div>
  );
}

function AuthLayout() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={user.onboardingComplete ? '/app' : '/onboarding'} replace />;
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
  if (user.onboardingComplete) return <Navigate to="/app" replace />;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TitleBar />
      <div style={{ flex: 1, overflow: 'hidden' }}><Outlet /></div>
    </div>
  );
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/signin" replace />;
  if (!user.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TitleBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}><Outlet /></main>
      </div>
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
                <Route path="/signup" element={<SignUp />} />
              </Route>
              <Route element={<OnboardingLayout />}>
                <Route path="/onboarding" element={<Onboarding />} />
              </Route>
              <Route path="/app" element={<ProtectedLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="journal" element={<Journal />} />
                <Route path="stats"   element={<ArcStats />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}
