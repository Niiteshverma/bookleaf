/**
 * Real-time WebSocket Handler using Socket.IO
 */

let ioInstance = null;

export function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Join a ticket conversation room
    socket.on('join_ticket', (ticketId) => {
      if (ticketId) {
        socket.join(`ticket_${ticketId}`);
      }
    });

    // Leave a ticket conversation room
    socket.on('leave_ticket', (ticketId) => {
      if (ticketId) {
        socket.leave(`ticket_${ticketId}`);
      }
    });

    // Author joins their private channel for live notifications
    socket.on('join_author_channel', (authorId) => {
      if (authorId) {
        socket.join(`author_${authorId}`);
      }
    });

    // Admin joins the operations desk channel for live queue updates
    socket.on('join_admin_channel', () => {
      socket.join('admin_channel');
    });

    socket.on('disconnect', () => {
      // Disconnect cleanup if necessary
    });
  });

  return io;
}

export function getIO() {
  return ioInstance;
}

/**
 * Emit event to everyone viewing a specific ticket
 */
export function emitToTicket(ticketId, event, data) {
  if (ioInstance) {
    ioInstance.to(`ticket_${ticketId}`).emit(event, data);
  }
}

/**
 * Emit event to all admins (e.g. new ticket created, status changed)
 */
export function emitToAdmins(event, data) {
  if (ioInstance) {
    ioInstance.to('admin_channel').emit(event, data);
  }
}

/**
 * Emit event to a specific author
 */
export function emitToAuthor(authorId, event, data) {
  if (ioInstance) {
    ioInstance.to(`author_${authorId}`).emit(event, data);
  }
}

export default {
  initSocket,
  getIO,
  emitToTicket,
  emitToAdmins,
  emitToAuthor,
};
