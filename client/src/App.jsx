import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';

import Navbar from './components/common/Navbar.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

// Pages
import Login from './pages/Login.jsx';
import AuthorDashboard from './pages/author/AuthorDashboard.jsx';
import MyBooks from './pages/author/MyBooks.jsx';
import CreateTicket from './pages/author/CreateTicket.jsx';
import AuthorTickets from './pages/author/AuthorTickets.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminTicketDetail from './pages/admin/AdminTicketDetail.jsx';

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Root Redirect */}
                <Route path="/" element={<RootRedirect />} />

                {/* Public Auth */}
                <Route path="/login" element={<Login />} />

                {/* Author Portal Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['AUTHOR']}>
                      <AuthorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-books"
                  element={
                    <ProtectedRoute allowedRoles={['AUTHOR']}>
                      <MyBooks />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create-ticket"
                  element={
                    <ProtectedRoute allowedRoles={['AUTHOR']}>
                      <CreateTicket />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tickets"
                  element={
                    <ProtectedRoute allowedRoles={['AUTHOR']}>
                      <AuthorTickets />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Portal Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/tickets/:id"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminTicketDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
