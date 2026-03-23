import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Layout from './components/layout/Layout';
const Approvals = () => <div className="bg-white p-6 rounded-2xl border border-slate-200">Approvals Page</div>;
const Withdrawals = () => <div className="bg-white p-6 rounded-2xl border border-slate-200">Withdrawals Page</div>;
const Tasks = () => <div className="bg-white p-6 rounded-2xl border border-slate-200">Tasks Page</div>;
const Notifications = () => <div className="bg-white p-6 rounded-2xl border border-slate-200">Notifications Page</div>;
const Settings = () => <div className="bg-white p-6 rounded-2xl border border-slate-200">Settings Page</div>;

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Users />
              </PrivateRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <PrivateRoute>
                <Approvals />
              </PrivateRoute>
            }
          />
          <Route
            path="/withdrawals"
            element={
              <PrivateRoute>
                <Withdrawals />
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <Tasks />
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <Notifications />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
