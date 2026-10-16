import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient.js';
import { BookOpen, Search, PlusCircle, HelpCircle } from 'lucide-react';

export default function MyBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/author/books');
      if (res.success) {
        setBooks(res.books);
      }
    } catch (err) {
      setError(err.message || 'Failed to load books catalog.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.isbn.toLowerCase().includes(search.toLowerCase()) ||
      b.genre.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && b.status === 'Published & Live') ||
      (statusFilter === 'PRODUCTION' && b.status && b.status.startsWith('In Production'));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Published Books</h1>
          <p className="text-sm text-slate-600 mt-1">
            Detailed breakdown of your ISBNs, copies sold, retail pricing, and royalty statements.
          </p>
        </div>

        <Link
          to="/create-ticket"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Raise Support Query
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title, ISBN, or genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="ALL">All Titles ({books.length})</option>
            <option value="PUBLISHED">Published & Live</option>
            <option value="PRODUCTION">In Production</option>
          </select>
        </div>
      </div>

      {/* Books Table */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No books found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Book Title & Genre</th>
                  <th className="px-5 py-3.5">ISBN & Partner</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">MRP</th>
                  <th className="px-5 py-3.5">Copies Sold</th>
                  <th className="px-5 py-3.5">Earned</th>
                  <th className="px-5 py-3.5">Paid</th>
                  <th className="px-5 py-3.5">Pending</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredBooks.map((book) => {
                  const isPublished = book.status === 'Published & Live';

                  return (
                    <tr key={book.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 text-sm block">
                          {book.title}
                        </span>
                        <span className="text-[11px] text-slate-500">{book.genre}</span>
                        {book.publicationDate && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Published: {new Date(book.publicationDate).toLocaleDateString()}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-800 block">
                          {book.isbn || 'Assigned in stage'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {book.printPartner ? `Partner: ${book.printPartner}` : 'In Production'}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isPublished
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {book.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap font-semibold">
                        {book.mrp ? `₹${book.mrp}` : <span className="text-slate-400">—</span>}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900">
                          {book.totalCopiesSold || 0}
                        </span>
                        {isPublished && (
                          <span className="text-[10px] text-slate-400 block">units</span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-900">
                        {formatCurrency(book.totalRoyaltyEarned)}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-blue-700 font-semibold">
                        {formatCurrency(book.royaltyPaid)}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            book.royaltyPending > 0 ? 'text-amber-700' : 'text-slate-400'
                          }`}
                        >
                          {formatCurrency(book.royaltyPending)}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/create-ticket?bookId=${book.id}`}
                          title="Raise support ticket about this book"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-brand-500 hover:text-brand-700 text-slate-600 text-xs font-semibold transition-colors"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          Query
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
