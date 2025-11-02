import { useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';

export const useSocket = (url = 'http://localhost:3001') => {
  const socketRef = useRef(null);
  const handlersRef = useRef({});

  useEffect(() => {
    socketRef.current = io(url, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url]);

  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      handlersRef.current[event] = handler;
      socketRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback((event) => {
    if (socketRef.current && handlersRef.current[event]) {
      socketRef.current.off(event, handlersRef.current[event]);
      delete handlersRef.current[event];
    }
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    on,
    off,
    emit,
  };
};
