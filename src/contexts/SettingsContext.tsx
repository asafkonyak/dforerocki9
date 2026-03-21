import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  isSimulationEnabled: boolean;
  isWebRTCEnabled: boolean;
  setSimulationEnabled: (enabled: boolean) => void;
  setWebRTCEnabled: (enabled: boolean) => void;
  testWebRTC: () => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSimulationEnabled, setSimulationEnabled] = useState(() => {
    return localStorage.getItem('settings_simulation') === 'true';
  });
  const [isWebRTCEnabled, setWebRTCEnabled] = useState(() => {
    return localStorage.getItem('settings_webrtc') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('settings_simulation', isSimulationEnabled.toString());
  }, [isSimulationEnabled]);

  useEffect(() => {
    localStorage.setItem('settings_webrtc', isWebRTCEnabled.toString());
  }, [isWebRTCEnabled]);

  const testWebRTC = async () => {
    console.log('[Settings] Testing WebRTC connection...');
    // Real implementation would go here, for now we simulate a test
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.1;
        console.log('[Settings] WebRTC test result:', success ? 'SUCCESS' : 'FAILED');
        resolve(success);
      }, 1500);
    });
  };

  return (
    <SettingsContext.Provider value={{
      isSimulationEnabled,
      isWebRTCEnabled,
      setSimulationEnabled,
      setWebRTCEnabled,
      testWebRTC
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
