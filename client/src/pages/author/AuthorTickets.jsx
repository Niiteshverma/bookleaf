import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/StatusBadge.jsx';
import {
  Ticket,
  MessageSquare,
  Send,
  PlusCircle,
  Clock,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  User,
  Sparkles,
} from 'lucide-react';

export default function AuthorTickets() {
  const { user } = useAuth();
  const { socket, joinTicket, leaveTicket } = useSocket();

  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  // Listen to Socket.IO live updates
  useEffect(() => {
    if (!socket) return;

    // When an admin responds, update the conversation live
    const handleNewMessage = (newMsg) => {
      if (selectedTicketId && newMsg.ticketId === selectedTicketId) {
        setActiveTicket((prev) => {
          if (!prev) return prev;
          // Avoid duplicate messages
          const exists = prev.messages.some((m) => m.id === newMsg.id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...prev.messages, newMsg],
          };
        });
        scrollToBottom();
      }
    };

    const handleStatusChanged = ({ status }) => {
      setActiveTicket((prev) => (prev ? { ...prev, status } : prev));
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicketId ? { ...t, status } : t))
      );
    };

    socket.on('message:new', handleNewMessage);
    socket.on('ticket:status_changed', handleStatusChanged);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('ticket:status_changed', handleStatusChanged);
    };
  }, [socket, selectedTicketId]);

  // When selected ticket changes, join the room and fetch details
  useEffect(() => {
    if (!selectedTicketId) return;

    joinTicket(selectedTicketId);
    fetchTicketDetail(selectedTicketId);

    return () => {
      leaveTicket(selectedTicketId);
    };
  }, [selectedTicketId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/tickets/my-tickets');
      if (res.success) {
        setTickets(res.tickets);
        if (res.tickets.length > 0 && !selectedTicketId) {
          setSelectedTicketId(res.tickets[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetail = async (id) => {
    try {
      setLoadingDetail(true);
      const res = await axiosClient.get(`/tickets/${id}`);
      if (res.success) {
        setActiveTicket(res.ticket);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to load ticket detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    try {
      setSendingReply(true);
      const res = await axiosClient.post(`/tickets/${selectedTicketId}/messages`, {
        message: replyText.trim(),
      });

      if (res.success) {
        setReplyText('');
        // Add message to active state if socket hasn't done so
        setActiveTicket((prev) => {
          if (!prev) return prev;
          const exists = prev.messages.some((m) => m.id === res.message.id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...prev.messages, res.message],
          };
        });
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Support Tickets</h1>
          <p className="text-sm text-slate-600 mt-1">
            Track communication with BookLeaf operations. Replies update in real time.
          </p>
        </div>

        <Link
          to="/create-ticket"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Raise New Ticket
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Support Tickets Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Have a question about royalties, production, or printing? Raise your first query.
          </p>
          <Link
            to="/create-ticket"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Submit Query Now
          </Link>
        </div>
      ) : (
        /* Split-Pane Layout: Tickets List (Left) + Conversation Thread (Right) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm min-h-[650px]">
          {/* Left Column: Tickets List (5 cols) */}
          <div className="lg:col-span-5 border-r border-slate-200 flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                All Queries ({tickets.length})
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
              {tickets.map((t) => {
                const isSelected = t.id === selectedTicketId;

                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-brand-50/70 border-l-4 border-brand-600 pl-3'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold font-mono text-slate-800">
                        {t.ticketNumber}
                      </span>
                      <StatusBadge status={t.status} />
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {t.subject}
                    </h3>

                    {t.book ? (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        {t.book.title}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        General / Account Query
                      </span>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <CategoryBadge category={t.category} />
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Conversation (7 cols) */}
          <div className="lg:col-span-7 flex flex-col h-full bg-slate-50/30">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-full py-20">
                <div className="w-6 h-6 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : activeTicket ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200 bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {activeTicket.ticketNumber}
                        </span>
                        <StatusBadge status={activeTicket.status} />
                        <PriorityBadge priority={activeTicket.priority} />
                      </div>
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1.5 leading-snug">
                        {activeTicket.subject}
                      </h2>
                      {activeTicket.book && (
                        <p className="text-xs text-brand-800 font-medium mt-0.5">
                          Concerning: {activeTicket.book.title} (ISBN: {activeTicket.book.isbn || 'N/A'})
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[460px]">
                  {activeTicket.messages?.map((msg) => {
                    const isAuthorSender = msg.sender?.role === 'AUTHOR';

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${
                          isAuthorSender ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                            isAuthorSender
                              ? 'bg-brand-600 text-white'
                              : msg.isAiGenerated
                              ? 'bg-purple-700 text-white shadow-sm'
                              : 'bg-slate-800 text-amber-400'
                          }`}
                        >
                          {isAuthorSender ? (
                            <User className="w-4 h-4" />
                          ) : msg.isAiGenerated ? (
                            <Sparkles className="w-4 h-4 text-purple-200" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div
                            className={`flex items-center gap-2 mb-1 text-[11px] font-semibold ${
                              isAuthorSender ? 'justify-end text-brand-900' : 'text-slate-600'
                            }`}
                          >
                            <span>
                              {msg.isAiGenerated
                                ? 'BookLeaf AI Support'
                                : msg.sender?.name || (isAuthorSender ? 'You' : 'BookLeaf Support')}
                            </span>
                            {msg.isAiGenerated && (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> AI Assistant
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
                              isAuthorSender
                                ? 'bg-brand-50 border border-brand-200 text-brand-950 rounded-tr-none'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
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

                {/* Reply Form */}
                <div className="p-4 border-t border-slate-200 bg-white">
                  {activeTicket.status === 'CLOSED' ? (
                    <div className="text-center py-2 text-xs text-slate-500 italic">
                      This ticket is closed. If you send a reply, it will be automatically reopened for review.
                    </div>
                  ) : null}

                  <form onSubmit={handleSendReply} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a message to BookLeaf operations..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={sendingReply}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400 bg-slate-50/50"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingReply ? 'Sending...' : 'Send'}</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                Select a ticket to view conversation
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
