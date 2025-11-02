import { useEffect, useCallback, useRef } from 'react';

/**
 * WebSocket 통신 훅
 * FastAPI의 /ws/analyze 엔드포인트와 통신
 */
export const useSocket = (url = 'ws://localhost:8000/ws/analyze') => {
  const wsRef = useRef(null);
  const handlersRef = useRef({});

  useEffect(() => {
    // WebSocket 연결
    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      if (handlersRef.current['connect']) {
        handlersRef.current['connect']();
      }
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      if (handlersRef.current['disconnect']) {
        handlersRef.current['disconnect']();
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (handlersRef.current['error']) {
        handlersRef.current['error'](error);
      }
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.step && handlersRef.current[message.step]) {
          handlersRef.current[message.step](message.data || message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [url]);

  const on = useCallback((event, handler) => {
    handlersRef.current[event] = handler;
  }, []);

  const off = useCallback((event) => {
    if (handlersRef.current[event]) {
      delete handlersRef.current[event];
    }
  }, []);

  const send = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  return {
    ws: wsRef.current,
    on,
    off,
    send,
  };
};
