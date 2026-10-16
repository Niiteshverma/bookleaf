import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  BookOpen,
  DollarSign,
  TrendingUp,
  Clock,
  PlusCircle,
  Ticket,
  ChevronRight,
  Info,
  CheckCircle,
} from 'lucide-react';

export default function AuthorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/author/dashboard');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-800">
              Author ID: {user?.authorCode || 'AUTH'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Member since {user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : '2023'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Manage your publishing catalog, review royalty reports, and connect with support.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/create-ticket"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-600/25 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Raise Support Ticket
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {/* Royalty & Performance Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Royalty Earned */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Royalty Earned
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(stats.totalRoyaltyEarned)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">80% Net profit split</span>
        </div>

        {/* Royalty Paid */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Royalty Disbursed
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(stats.royaltyPaid)}
          </p>
          <span className="text-[11px] text-blue-600 mt-1 block font-medium">
            Direct Bank Transfer
          </span>
        </div>

        {/* Royalty Pending */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Royalty Pending
          </p>
          <p className="text-2xl font-black text-amber-900 mt-1">
            {formatCurrency(stats.royaltyPending)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats.royaltyPending >= 1000 ? 'Scheduled for next payout' : 'Rolls over (< ₹1,000)'}
          </span>
        </div>

        {/* Total Copies Sold */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Copies Sold
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {(stats.totalCopiesSold || 0).toLocaleString()}
          </p>
          <span className="text-[11px] text-purple-600 mt-1 block font-medium">
            Across all retail channels
          </span>
        </div>
      </div>

      {/* BookLeaf Policy Transparency Note */}
      <div className="mb-8 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900">
          <span className="font-bold">BookLeaf Royalty Policy Notice: </span>
          Royalties follow an 80/20 net profit split and are calculated quarterly, paid within 45 days of the quarter ending. The minimum disbursement threshold is ₹1,000 (balances below this roll over to the next quarter).
        </div>
      </div>

      {/* Books and Support Tickets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Published & In-Production Books (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Books Catalog</h2>
              <p className="text-xs text-slate-500">
                {stats.publishedBooks} Published &bull; {stats.inProductionBooks} In Production
              </p>
            </div>
            <Link
              to="/my-books"
              className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 group"
            >
              View All Books
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="space-y-3">
            {data?.recentBooks && data.recentBooks.length > 0 ? (
              data.recentBooks.map((book) => (
                <div
                  key={book.id}
                  className="p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-12 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 shrink-0 font-bold text-xs">
                      <BookOpen className="w-5 h-5 text-brand-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ISBN: {book.isbn || 'Pending'} &bull; Genre: {book.genre}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            book.status === 'Published & Live'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {book.status}
                        </span>
                        {book.mrp && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            MRP: ₹{book.mrp}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="block text-xs text-slate-500 font-medium">Royalty Earned</span>
                    <span className="font-bold text-sm text-slate-900">
                      {formatCurrency(book.totalRoyaltyEarned)}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {book.totalCopiesSold || 0} copies sold
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 py-6 text-center">No books found in account.</p>
            )}
          </div>
        </div>

        {/* Right: Support Ticket Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-3">
              <Ticket className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Author Support Desk</h2>
            <p className="text-xs text-slate-500 mt-1">
              Have questions regarding royalties, distribution, book printing, or production? Our support team and AI assistant are ready to help.
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Open Tickets</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {stats.openTickets || 0} Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Resolved Queries</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {stats.resolvedTickets || 0} Closed
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/tickets"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 text-center transition-colors"
            >
              View My Support Tickets
            </Link>
            <Link
              to="/create-ticket"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 text-center transition-colors shadow-sm"
            >
              Raise New Ticket
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
