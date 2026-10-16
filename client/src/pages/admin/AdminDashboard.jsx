import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/StatusBadge.jsx';
import {
  ShieldAlert,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  Inbox,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function AdminDashboard() {
  const { socket } = useSocket();

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter, categoryFilter, priorityFilter, urgentOnly]);

  // Real-time live ticket queue updates
  useEffect(() => {
    if (!socket) return;

    const handleNewTicket = (newT) => {
      // Re-fetch to enrich and maintain filter consistency
      fetchDashboardData();
    };

    const handleTicketUpdated = () => {
      fetchDashboardData();
    };

    socket.on('ticket:new', handleNewTicket);
    socket.on('ticket:status_changed', handleTicketUpdated);
    socket.on('ticket:updated', handleTicketUpdated);

    return () => {
      socket.off('ticket:new', handleNewTicket);
      socket.off('ticket:status_changed', handleTicketUpdated);
      socket.off('ticket:updated', handleTicketUpdated);
    };
  }, [socket, statusFilter, categoryFilter, priorityFilter, urgentOnly]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);
      if (urgentOnly) params.append('urgentOnly', 'true');
      if (search.trim()) params.append('search', search.trim());

      const [ticketsRes, statsRes] = await Promise.all([
        axiosClient.get(`/admin/tickets?${params.toString()}`),
        axiosClient.get('/admin/dashboard-stats'),
      ]);

      if (ticketsRes.success) {
        setTickets(ticketsRes.tickets);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.error('Failed to load admin queue data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Operations Control Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Author Communication Desk
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Monitor incoming queries, verify AI classifications, approve response drafts, and track urgent tickets.
          </p>
        </div>

        <button
          onClick={() => {
            setUrgentOnly(!urgentOnly);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
            urgentOnly
              ? 'bg-rose-600 text-white shadow-rose-600/30'
              : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          {urgentOnly ? 'Showing Urgent Only (Reset)' : 'Filter Urgent & Unresolved'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Total Queries
          </span>
          <span className="text-2xl font-black text-slate-900 block mt-1">
            {stats?.totalTickets || 0}
          </span>
          <span className="text-[10px] text-slate-400">All-time tickets</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
            Unresolved Backlog
          </span>
          <span className="text-2xl font-black text-amber-800 block mt-1">
            {stats?.unresolvedTickets || 0}
          </span>
          <span className="text-[10px] text-amber-600 font-medium">Open & In Progress</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
            Urgent Attention
          </span>
          <span className="text-2xl font-black text-rose-700 block mt-1">
            {stats?.urgentTickets || 0}
          </span>
          <span className="text-[10px] text-rose-600 font-medium">Critical & High Priority</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-xs bg-orange-50/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 block">
            Overdue (&gt;48 hrs)
          </span>
          <span className="text-2xl font-black text-orange-800 block mt-1">
            {stats?.overdueTickets || 0}
          </span>
          <span className="text-[10px] text-orange-600 font-medium">Needs immediate action</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs bg-blue-50/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
            Resolved
          </span>
          <span className="text-2xl font-black text-blue-800 block mt-1">
            {(stats?.resolvedTickets || 0) + (stats?.closedTickets || 0)}
          </span>
          <span className="text-[10px] text-blue-600 font-medium">Successfully handled</span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by ticket #, subject, author name, or book title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="OPEN">Open Only</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="ALL">Priority: All Levels</option>
              <option value="CRITICAL">Critical Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Category Filter:
          </span>
          {[
            { key: 'ALL', label: 'All Categories' },
            { key: 'ROYALTY_AND_PAYMENTS', label: 'Royalty & Payments' },
            { key: 'ISBN_AND_METADATA_ISSUES', label: 'ISBN & Metadata' },
            { key: 'PRINTING_AND_QUALITY', label: 'Printing & Quality' },
            { key: 'DISTRIBUTION_AND_AVAILABILITY', label: 'Distribution' },
            { key: 'BOOK_STATUS_AND_PRODUCTION_UPDATES', label: 'Production Status' },
            { key: 'GENERAL_INQUIRY', label: 'General Inquiry' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                categoryFilter === cat.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Queue Table */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Tickets Match Filters</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try resetting your status, priority or category filters.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Ticket # & Flags</th>
                  <th className="px-5 py-3.5">Subject & Book</th>
                  <th className="px-5 py-3.5">Author</th>
                  <th className="px-5 py-3.5">Category (AI)</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Assigned To</th>
                  <th className="px-5 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      t.isOverdue ? 'bg-orange-50/30' : t.isUrgentAttention ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {t.ticketNumber}
                        </span>
                        {t.aiDraftResponse && (
                          <span
                            title="AI Draft Ready for Review"
                            className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px]"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      {/* Urgent / Overdue Badges */}
                      <div className="flex flex-col gap-0.5 mt-1">
                        {t.isOverdue && (
                          <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-orange-800 bg-orange-100 px-1.5 py-0.5 rounded">
                            Overdue &gt;48h
                          </span>
                        )}
                        {t.isUrgentAttention && !t.isOverdue && (
                          <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">
                            Urgent
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        to={`/admin/tickets/${t.id}`}
                        className="font-bold text-slate-900 text-sm hover:text-brand-700 line-clamp-1"
                      >
                        {t.subject}
                      </Link>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {t.book ? `Book: ${t.book.title}` : 'General / Account Level'}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800 block text-xs">
                        {t.author.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {t.author.authorCode || t.author.email}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <CategoryBadge category={t.category} />
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <PriorityBadge priority={t.priority} />
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-slate-600 text-xs">
                      {t.assignedTo ? (
                        <span className="font-semibold text-slate-800">
                          {t.assignedTo.name.split(' ')[0]}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-[11px] text-slate-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <Link
                        to={`/admin/tickets/${t.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-brand-700 text-white text-xs font-bold transition-colors"
                      >
                        Manage
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
