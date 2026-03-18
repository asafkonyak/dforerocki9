import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';

interface WebRTCContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  peers: Map<string, RTCPeerConnection>;
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
}

export const WebRTCProvider: React.FC<WebRTCProviderProps> = ({ children }) => {
  const { socket, isConnected } = useSocket();
  
  // Refs to hold active RTCPeerConnections
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Example WebRTC Signaling Handlers
  useEffect(() => {
    if (!socket) return;
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        // Dispatch based on data.type (e.g. 'offer', 'answer', 'ice-candidate')
        switch (data.type) {
          case 'offer':
            console.log('Received WebRTC offer:', data.payload);
            break;
          case 'answer':
            console.log('Received WebRTC answer:', data.payload);
            break;
          case 'ice-candidate':
            console.log('Received ICE candidate:', data.payload);
            break;
        }
      } catch (e) {
        // Not a JSON message or not a WebRTC event
      }
    };

    socket.addEventListener('message', handleMessage);
    
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    if (!isConnected) {
      // Close all peer connections on disconnect
      peersRef.current.forEach((peer) => peer.close());
      peersRef.current.clear();
    }
  }, [isConnected]);

  return (
    <WebRTCContext.Provider value={{
      socket,
      isConnected,
      peers: peersRef.current
    }}>
      {children}
    </WebRTCContext.Provider>
  );
};
