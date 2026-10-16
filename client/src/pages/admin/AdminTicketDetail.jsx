import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/StatusBadge.jsx';
import {
  ArrowLeft,
  Sparkles,
  Send,
  Lock,
  User,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen,
  Edit3,
} from 'lucide-react';

export default function AdminTicketDetail() {
  const { id: ticketId } = useParams();
  const { user } = useAuth();
  const { socket, joinTicket, leaveTicket } = useSocket();

  const [ticket, setTicket] = useState(null);
  const [adminTeam, setAdminTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Draft State
  const [draftMessage, setDraftMessage] = useState('');
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [approvingDraft, setApprovingDraft] = useState(false);
  const [resolveOnSend, setResolveOnSend] = useState(false);

  // Manual message & Internal notes
  const [manualMessage, setManualMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [activeTab, setActiveTab] = useState('conversation'); // 'conversation' | 'internal_notes'

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTicketAndTeam();
  }, [ticketId]);

  // Socket.IO real-time sync for live messages and internal notes
  useEffect(() => {
    if (!socket || !ticketId) return;

    joinTicket(ticketId);

    const handleNewMessage = (newMsg) => {
      setTicket((prev) => {
        if (!prev) return prev;
        const exists = prev.messages.some((m) => m.id === newMsg.id);
        if (exists) return prev;
        return {
          ...prev,
          messages: [...prev.messages, newMsg],
        };
      });
      scrollToBottom();
    };

    const handleNewInternalNote = (note) => {
      setTicket((prev) => {
        if (!prev) return prev;
        const exists = prev.internalNotes.some((n) => n.id === note.id);
        if (exists) return prev;
        return {
          ...prev,
          internalNotes: [note, ...prev.internalNotes],
        };
      });
    };

    const handleStatusChanged = ({ status }) => {
      setTicket((prev) => (prev ? { ...prev, status } : prev));
    };

    socket.on('message:new', handleNewMessage);
    socket.on('internal_note:new', handleNewInternalNote);
    socket.on('ticket:status_changed', handleStatusChanged);

    return () => {
      leaveTicket(ticketId);
      socket.off('message:new', handleNewMessage);
      socket.off('internal_note:new', handleNewInternalNote);
      socket.off('ticket:status_changed', handleStatusChanged);
    };
  }, [socket, ticketId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchTicketAndTeam = async () => {
    try {
      setLoading(true);
      const [ticketRes, teamRes] = await Promise.all([
        axiosClient.get(`/tickets/${ticketId}`),
        axiosClient.get('/admin/team'),
      ]);

      if (ticketRes.success) {
        setTicket(ticketRes.ticket);
        setDraftMessage(ticketRes.ticket.aiDraftResponse || '');
      }
      if (teamRes.success) {
        setAdminTeam(teamRes.admins);
      }
    } catch (err) {
      setError(err.message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Approve & Send AI Draft
  const handleApproveDraft = async () => {
    if (!draftMessage.trim()) return;

    try {
      setApprovingDraft(true);
      const res = await axiosClient.post(`/tickets/${ticketId}/approve-ai-draft`, {
        message: draftMessage.trim(),
        resolved: resolveOnSend,
      });

      if (res.success) {
        setTicket((prev) => ({
          ...prev,
          status: res.ticket.status,
          aiDraftResponse: null,
          messages: [...prev.messages, res.sentMessage],
        }));
        setIsEditingDraft(false);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to approve draft:', err);
    } finally {
      setApprovingDraft(false);
    }
  };

  // 2. Send Manual Admin Reply
  const handleSendManual = async (e) => {
    e.preventDefault();
    if (!manualMessage.trim()) return;

    try {
      const res = await axiosClient.post(`/tickets/${ticketId}/messages`, {
        message: manualMessage.trim(),
      });
      if (res.success) {
        setManualMessage('');
        setTicket((prev) => ({
          ...prev,
          messages: [...prev.messages, res.message],
        }));
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    }
  };

  // 3. Add Private Internal Note
  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    if (!internalNote.trim()) return;

    try {
      const res = await axiosClient.post(`/tickets/${ticketId}/internal-notes`, {
        note: internalNote.trim(),
      });
      if (res.success) {
        setInternalNote('');
        setTicket((prev) => ({
          ...prev,
          internalNotes: [res.internalNote, ...(prev.internalNotes || [])],
        }));
      }
    } catch (err) {
      console.error('Failed to add internal note:', err);
    }
  };

  // 4. Update Status
  const handleStatusChange = async (newStatus) => {
    try {
      const res = await axiosClient.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      if (res.success) {
        setTicket((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // 5. Override Category / Priority
  const handleClassificationChange = async (category, priority) => {
    try {
      const res = await axiosClient.patch(`/tickets/${ticketId}/classification`, {
        category,
        priority,
      });
      if (res.success) {
        setTicket((prev) => ({ ...prev, category, priority }));
      }
    } catch (err) {
      console.error('Failed to update classification:', err);
    }
  };

  // 6. Assign Ticket
  const handleAssign = async (assignedToId) => {
    try {
      const res = await axiosClient.patch(`/tickets/${ticketId}/assign`, { assignedToId });
      if (res.success) {
        const assignedAdmin = adminTeam.find((a) => a.id === assignedToId) || null;
        setTicket((prev) => ({ ...prev, assignedTo: assignedAdmin }));
      }
    } catch (err) {
      console.error('Failed to assign ticket:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-800">Ticket not found</h2>
        <Link to="/admin" className="text-brand-600 font-bold text-sm mt-2 inline-block">
          &larr; Back to operations queue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button & top bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ticket Queue
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Conversation, AI Draft & Reply Area (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Ticket Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                {ticket.ticketNumber}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <CategoryBadge category={ticket.category} />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {ticket.subject}
            </h1>

            {ticket.book && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-700" />
                  <span className="text-xs font-bold text-slate-800">{ticket.book.title}</span>
                  <span className="text-[11px] text-slate-500">(ISBN: {ticket.book.isbn})</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {ticket.book.status}
                </span>
              </div>
            )}
          </div>

          {/* AI-Generated Response Draft (Highlighted Section from PDF Page 3) */}
          {ticket.aiDraftResponse && (
            <div className="bg-gradient-to-br from-purple-50/70 to-indigo-50/70 border border-purple-200/90 rounded-2xl p-6 shadow-sm relative">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-purple-950">
                      AI-Drafted Response (Knowledge-Base Grounded)
                    </h3>
                    <span className="text-[10px] text-purple-700 font-medium">
                      Model: LLaMA 3.3 70B &bull; Confidence: {((ticket.aiConfidence || 0.95) * 100).toFixed(0)}% &bull; Human Review Required
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingDraft(!isEditingDraft)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-purple-200 hover:bg-purple-50 text-purple-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditingDraft ? 'Done Editing' : 'Edit Draft'}
                </button>
              </div>

              {isEditingDraft ? (
                <textarea
                  rows={6}
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-purple-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-sans"
                />
              ) : (
                <div className="p-4 rounded-xl bg-white border border-purple-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line shadow-xs">
                  {draftMessage}
                </div>
              )}

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-purple-200/60">
                <label className="flex items-center gap-2 text-xs font-semibold text-purple-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resolveOnSend}
                    onChange={(e) => setResolveOnSend(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Mark ticket as Resolved upon sending</span>
                </label>

                <button
                  type="button"
                  onClick={handleApproveDraft}
                  disabled={approvingDraft || !draftMessage.trim()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-md shadow-purple-700/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  {approvingDraft ? 'Dispatching...' : 'Approve & Send Response'}
                </button>
              </div>
            </div>
          )}

          {/* Conversation & Internal Notes Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('conversation')}
                className={`flex-1 py-3.5 px-4 text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'conversation'
                    ? 'border-b-2 border-brand-600 text-brand-700 bg-brand-50/20'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Conversation Thread ({ticket.messages?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('internal_notes')}
                className={`flex-1 py-3.5 px-4 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'internal_notes'
                    ? 'border-b-2 border-amber-600 text-amber-800 bg-amber-50/20'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Private Internal Notes ({ticket.internalNotes?.length || 0})
              </button>
            </div>

            {/* Conversation Messages */}
            {activeTab === 'conversation' && (
              <div className="p-6 flex flex-col gap-4">
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {ticket.messages?.map((msg) => {
                    const isAdminSender = msg.sender?.role === 'ADMIN';

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${
                          isAdminSender ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                            isAdminSender
                              ? 'bg-slate-900 text-amber-400'
                              : 'bg-brand-600 text-white'
                          }`}
                        >
                          {isAdminSender ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>

                        <div>
                          <div
                            className={`flex items-center gap-2 mb-1 text-[11px] font-semibold ${
                              isAdminSender ? 'justify-end text-slate-800' : 'text-brand-900'
                            }`}
                          >
                            <span>{msg.sender?.name || 'User'}</span>
                            {msg.isAiGenerated && (
                              <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-bold">
                                AI Approved
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-normal">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div
                            className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                              isAdminSender
                                ? 'bg-slate-900 text-white rounded-tr-none'
                                : 'bg-brand-50 border border-brand-200 text-brand-950 rounded-tl-none'
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply composer */}
                <form onSubmit={handleSendManual} className="pt-4 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a custom response to the author..."
                    value={manualMessage}
                    onChange={(e) => setManualMessage(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!manualMessage.trim()}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </form>
              </div>
            )}

            {/* Internal Notes (Hidden from Author) */}
            {activeTab === 'internal_notes' && (
              <div className="p-6 flex flex-col gap-4">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>
                    Internal notes are strictly confidential to the operations team. Authors cannot view these notes.
                  </span>
                </div>

                <form onSubmit={handleAddInternalNote} className="space-y-3">
                  <textarea
                    rows={3}
                    placeholder="Add operational notes (e.g. verified with Repro India print desk, royalty scheduled for batch run next week)..."
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    className="w-full p-3 rounded-xl border border-amber-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 bg-amber-50/20"
                  ></textarea>
                  <button
                    type="submit"
                    disabled={!internalNote.trim()}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Save Internal Note
                  </button>
                </form>

                <div className="space-y-3 mt-4 border-t border-slate-100 pt-4">
                  {ticket.internalNotes?.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4 italic">
                      No internal notes recorded for this ticket.
                    </p>
                  ) : (
                    ticket.internalNotes?.map((note) => (
                      <div
                        key={note.id}
                        className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950"
                      >
                        <div className="flex items-center justify-between text-[10px] text-amber-700 font-semibold mb-1">
                          <span>{note.author?.name || 'Admin'}</span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="whitespace-pre-line leading-relaxed">{note.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Author Information & Admin Controls (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Author Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Author Information
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-sm">
                {ticket.author.name.charAt(0)}
              </div>
              <div>
                <span className="font-extrabold text-slate-900 block text-sm">
                  {ticket.author.name}
                </span>
                <span className="font-mono text-xs text-slate-500">
                  ID: {ticket.author.authorCode || 'AUTH'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-800">{ticket.author.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-medium text-slate-800">{ticket.author.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">City:</span>
                <span className="font-medium text-slate-800">{ticket.author.city || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Ticket Management Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Operations Controls
            </h3>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Assigned Specialist
              </label>
              <select
                value={ticket.assignedTo?.id || ''}
                onChange={(e) => handleAssign(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Unassigned</option>
                {adminTeam.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name} ({admin.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Override */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Category Override
              </label>
              <select
                value={ticket.category}
                onChange={(e) => handleClassificationChange(e.target.value, ticket.priority)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ROYALTY_AND_PAYMENTS">Royalty & Payments</option>
                <option value="ISBN_AND_METADATA_ISSUES">ISBN & Metadata Issues</option>
                <option value="PRINTING_AND_QUALITY">Printing & Quality</option>
                <option value="DISTRIBUTION_AND_AVAILABILITY">Distribution & Availability</option>
                <option value="BOOK_STATUS_AND_PRODUCTION_UPDATES">Production Updates</option>
                <option value="GENERAL_INQUIRY">General Inquiry</option>
              </select>
            </div>

            {/* Priority Override */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Priority Override
              </label>
              <select
                value={ticket.priority}
                onChange={(e) => handleClassificationChange(ticket.category, e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
