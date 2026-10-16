import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient.js';
import {
  Ticket,
  Paperclip,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Send,
} from 'lucide-react';

export default function CreateTicket() {
  const [searchParams] = useSearchParams();
  const preselectedBookId = searchParams.get('bookId') || '';

  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState(preselectedBookId);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successTicket, setSuccessTicket] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchBooksDropdown();
  }, []);

  const fetchBooksDropdown = async () => {
    try {
      const res = await axiosClient.get('/author/books-dropdown');
      if (res.success) {
        setBooks(res.books);
      }
    } catch (err) {
      console.error('Failed to load books dropdown:', err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please provide a subject for your inquiry.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide detailed information about your concern.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        subject: subject.trim(),
        description: description.trim(),
        bookId: bookId && bookId !== 'general' ? bookId : null,
      };

      const res = await axiosClient.post('/tickets', payload);
      if (res.success) {
        setSuccessTicket(res.ticket);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successTicket) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Ticket #{successTicket.ticketNumber} Raised
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">
          Your Query Has Been Submitted!
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
          Our AI operations assistant has categorized your ticket and drafted an initial review for our operations desk. A BookLeaf specialist will follow up shortly.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            to="/tickets"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md transition-all"
          >
            Go to My Tickets
          </Link>
          <button
            onClick={() => {
              setSuccessTicket(null);
              setSubject('');
              setDescription('');
              setBookId('');
              setAttachmentName('');
            }}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl transition-all"
          >
            Submit Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Submit a Support Query
            </h1>
            <p className="text-xs text-slate-500">
              Select your book, detail your question, and our support team will assist you.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-rose-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Book Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Related Book (or General Query)
            </label>
            <select
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="general">General / Account Level (No specific book)</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} — {b.isbn ? `ISBN: ${b.isbn}` : b.status}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Choose General/Account Level if your question is about payments, bank accounts, or publishing packages.
            </span>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Discrepancy in pending royalty payout calculation"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Detailed Description
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide full details, including any dates, error messages, or copies count. Our AI assistant will review this against the BookLeaf Knowledge Base."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
            ></textarea>
          </div>

          {/* File Attachment Support (UI requirement from PDF) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Attach Supporting Documents / Photos (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                <Paperclip className="w-4 h-4 text-slate-500" />
                <span>{attachmentName ? 'Change File' : 'Choose File (Photo / PDF)'}</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                />
              </label>
              {attachmentName && (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {attachmentName}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Helpful for print defect claims, photo proofs, or bank transfer statements.
            </span>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/30 transition-all active:scale-95 disabled:opacity-70 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting & Classifying...' : 'Submit Support Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
