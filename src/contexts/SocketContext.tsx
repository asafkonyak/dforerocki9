import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  isError: boolean;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
  socketUrl?: string;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, socketUrl }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const connect = () => {
    if (socketRef.current) return;
    
    // Reset error state on new connection attempt
    setIsError(false);
    
    // Convert http/https to ws/wss if needed, and add /ws if not present
    let url = socketUrl || window.location.origin.replace(/^http/, 'ws');
    if (!url.startsWith('ws')) {
      url = 'ws://' + url;
    }
    if (!url.endsWith('/ws')) {
      url = url.replace(/\/$/, '') + '/ws';
    }

    console.log('Attempting to connect to WebSocket at:', url);
    
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      setIsConnected(true);
      setIsError(false);
      console.log('WebSocket connected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsError(true);
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'log') {
          console.log('[Server Log]:', data.payload || data);
        } else if (data.type === 'message') {
          console.log('[Server Message]:', data.payload || data);
        } else {
          console.log('[WebSocket Message]:', data);
        }
      } catch (e) {
        console.log('[WebSocket Raw Message]:', event.data);
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
      socketRef.current = null;
    };
    
    socketRef.current = ws;
  };
  
  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (socketUrl) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [socketUrl]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      isError,
      connect,
      disconnect
    }}>
      {children}
    </SocketContext.Provider>
  );
};
