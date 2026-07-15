import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import useAuth from './hooks/useAuth';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientList from './pages/ClientList';
import ClientDetail from './pages/ClientDetail';
import TaskList from './pages/TaskList';
import Chat from './pages/Chat';
import AdminPanel from './pages/AdminPanel';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';

// Layout Assets
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Loader from './components/Loader';

const queryClient = new QueryClient();

// Protected Routes
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <Loader fullScreen />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Admin Protection
const AdminRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return <Loader fullScreen />;
  const hasAccess = isAuthenticated && (user?.role === 'admin' || user?.role === 'partner');
  return hasAccess ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Sidebar />
      <div className="pl-[240px]">
        <Navbar />
        <main className="pt-16 px-6 pb-6 md:px-8 md:pb-8 min-h-[calc(100vh-56px)]">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) return <Loader fullScreen />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<ClientList />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/tasks" element={<TaskList />} />
          <Route path="/chat" element={<Chat />} />
          
          {/* Role Protected Panels */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
              },
            }}
          />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
