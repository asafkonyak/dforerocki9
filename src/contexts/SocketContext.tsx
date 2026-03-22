import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  isError: boolean;
  lastMessage: any | null;
  sendMessage: (msg: any) => void;
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
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    setIsError(false);
    
    let url = socketUrl || ((import.meta as any).env.VITE_SIGNALING_SERVER_URL || window.location.origin.replace(/^http/, 'ws'));
    if (!url.startsWith('ws')) {
      url = 'ws://' + url;
    }
    if (!url.endsWith('/ws')) {
      url = url.replace(/\/$/, '') + '/ws';
    }

    console.log('[SocketContext] Connecting to:', url);
    
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      setIsConnected(true);
      setIsError(false);
      console.log('[SocketContext] Connected');
    };

    ws.onerror = (error) => {
      console.error('[SocketContext] Error:', error);
      setIsError(true);
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SocketContext] Message received:', data);
        
        // Special highlighting for countdown messages
        // Support both old format {type: 'countdown', value: X} and new format {cmd: {count_down: X}}
        const messageData = data.data || data;
        let countdownValue = null;
        
        if (messageData && messageData.type === 'countdown') {
          countdownValue = messageData.value;
        } else if (data.cmd && data.cmd.count_down !== undefined) {
          countdownValue = data.cmd.count_down;
        }
        
        if (countdownValue !== null) {
          console.log('%c[COUNTDOWN] %c' + countdownValue, 'color: #00f0ff; font-weight: bold;', 'color: #ff006e; font-size: 1.2em; font-weight: 900;');
        }
        
        setLastMessage(data);
      } catch (e) {
        console.log('[SocketContext] Raw message:', event.data);
        setLastMessage({ type: 'raw', data: event.data });
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log('[SocketContext] Disconnected');
      socketRef.current = null;
    };
    
    socketRef.current = ws;
  }, [socketUrl]);
  
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((msg: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('[SocketContext] Cannot send message: Socket not connected');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      // Logic removed to keep socket alive across navigation
      // disconnect(); 
    };
  }, [connect]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      isError,
      lastMessage,
      sendMessage,
      connect,
      disconnect
    }}>
      {children}
    </SocketContext.Provider>
  );
};
