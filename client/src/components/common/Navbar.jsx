import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import {
  BookOpen,
  LayoutDashboard,
  Ticket,
  PlusCircle,
  LogOut,
  ShieldAlert,
  User,
  Radio,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin, isAuthor } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link
              to={isAdmin ? '/admin' : '/dashboard'}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center font-bold shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-tight">
                  BookLeaf
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-brand-700 block -mt-0.5">
                  Publishing
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {isAuthor && (
                <>
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/dashboard')
                        ? 'bg-brand-50 text-brand-800 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>

                  <Link
                    to="/my-books"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/my-books')
                        ? 'bg-brand-50 text-brand-800 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    My Books
                  </Link>

                  <Link
                    to="/tickets"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/tickets')
                        ? 'bg-brand-50 text-brand-800 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Ticket className="w-4 h-4" />
                    My Tickets
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin')
                        ? 'bg-brand-50 text-brand-800 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Operations Ticket Queue
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right Section: Live Sync Status, Actions & Profile */}
          <div className="flex items-center gap-3">
            {/* Real-time sync badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={isConnected ? 'Real-time WebSocket Live' : 'Connecting to live updates...'}
            >
              <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse text-emerald-600' : ''}`} />
              <span>{isConnected ? 'Live Sync' : 'Connecting'}</span>
            </div>

            {/* Author Quick CTA */}
            {isAuthor && (
              <Link
                to="/create-ticket"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all shadow-brand-600/20 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                Raise Support Ticket
              </Link>
            )}

            {/* User Profile Info & Logout */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="text-right hidden lg:block">
                <span className="block text-sm font-semibold text-slate-800 leading-tight">
                  {user?.name}
                </span>
                <span className="block text-[11px] font-medium text-slate-500">
                  {isAdmin ? 'Operations Admin' : `Author (${user?.authorCode || 'Verified'})`}
                </span>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600 font-semibold text-xs">
                {user?.name?.charAt(0) || <User className="w-4 h-4" />}
              </div>

              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile hamburger menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 px-2 border-t border-slate-100 flex flex-col gap-1 bg-white">
            {isAuthor && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Dashboard
                </Link>
                <Link
                  to="/my-books"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  My Books
                </Link>
                <Link
                  to="/tickets"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  My Tickets
                </Link>
                <Link
                  to="/create-ticket"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-brand-700 bg-brand-50"
                >
                  + Raise Support Ticket
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Operations Ticket Queue
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
