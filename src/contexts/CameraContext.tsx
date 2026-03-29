import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface CameraContextType {
  mainCameraId: string | null;
  player2CameraId: string | null;
  setMainCamera: (id: string) => void;
  setPlayer2Camera: (id: string) => void;
  availableCameras: MediaDeviceInfo[];
  refreshCameras: () => Promise<void>;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mainCameraId, setMainCameraId] = useState<string | null>(localStorage.getItem('mainCameraId'));
  const [player2CameraId, setPlayer2CameraId] = useState<string | null>(localStorage.getItem('player2CameraId'));
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);

  const refreshCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      
      // Auto-assign if not set and cameras available
      if (!mainCameraId && videoDevices.length > 0) {
        updateMainCamera(videoDevices[0].deviceId);
      }
      if (!player2CameraId && videoDevices.length > 1) {
        updatePlayer2Camera(videoDevices[1].deviceId);
      }
    } catch (err) {
      console.error('Error enumerating cameras:', err);
    }
  }, [mainCameraId, player2CameraId]);

  const updateMainCamera = (id: string) => {
    setMainCameraId(id);
    localStorage.setItem('mainCameraId', id);
  };

  const updatePlayer2Camera = (id: string) => {
    setPlayer2CameraId(id);
    localStorage.setItem('player2CameraId', id);
  };

  useEffect(() => {
    // Permission and initial list
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        refreshCameras();
      })
      .catch(() => refreshCameras());
      
    navigator.mediaDevices.addEventListener('devicechange', refreshCameras);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshCameras);
  }, [refreshCameras]);

  return (
    <CameraContext.Provider value={{ 
      mainCameraId, 
      player2CameraId, 
      setMainCamera: updateMainCamera, 
      setPlayer2Camera: updatePlayer2Camera, 
      availableCameras, 
      refreshCameras 
    }}>
      {children}
    </CameraContext.Provider>
  );
};

export const useCamera = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
};
