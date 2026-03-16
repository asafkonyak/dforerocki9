import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebRTCContextType {
  socket: Socket | null;
  isConnected: boolean;
  peers: Map<string, RTCPeerConnection>;
  connect: () => void;
  disconnect: () => void;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null);

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};

interface WebRTCProviderProps {
  children: React.ReactNode;
  socketUrl?: string; // e.g. 'http://localhost:3000' or deployed signaling server URL
}

export const WebRTCProvider: React.FC<WebRTCProviderProps> = ({ children, socketUrl }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Refs to hold active RTCPeerConnections
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const connect = () => {
    if (socket) return;
    
    const newSocket = io(socketUrl || window.location.origin, {
      autoConnect: true,
    });
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected:', newSocket.id);
    });
    
    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
      
      // Close all peer connections on disconnect
      peersRef.current.forEach((peer) => peer.close());
      peersRef.current.clear();
    });
    
    setSocket(newSocket);
  };
  
  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };
  
  // Example WebRTC Signaling Handlers (placeholder for real implementation)
  useEffect(() => {
    if (!socket) return;
    
    // We would handle WebRTC 'offer', 'answer', 'ice-candidate' events here
    
    return () => {
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, [socket]);

  return (
    <WebRTCContext.Provider value={{
      socket,
      isConnected,
      peers: peersRef.current,
      connect,
      disconnect
    }}>
      {children}
    </WebRTCContext.Provider>
  );
};
