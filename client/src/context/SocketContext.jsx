import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (isLocal ? 'http://localhost:5000' : 'https://bookleaf-1-zcbb.onrender.com');



export function SocketProvider({ children }) {
  const { user, isAuthenticated, isAdmin, isAuthor } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      setIsConnected(true);

      // Join respective notification channels
      if (isAdmin) {
        s.emit('join_admin_channel');
      } else if (isAuthor && user?.id) {
        s.emit('join_author_channel', user.id);
      }
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [isAuthenticated, user?.id, isAdmin, isAuthor]);

  const joinTicket = (ticketId) => {
    if (socket && ticketId) {
      socket.emit('join_ticket', ticketId);
    }
  };

  const leaveTicket = (ticketId) => {
    if (socket && ticketId) {
      socket.emit('leave_ticket', ticketId);
    }
  };

  const value = {
    socket,
    isConnected,
    joinTicket,
    leaveTicket,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export default SocketContext;
