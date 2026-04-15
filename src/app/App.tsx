import React, { Suspense } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { SocketProvider } from "../contexts/SocketContext";
import { AudioProvider } from "../contexts/AudioContext";
import { SettingsProvider } from "../contexts/SettingsContext";
import { CameraProvider } from "../contexts/CameraContext";
import { LoadingScreen } from "./components/LoadingScreen";
import { AssetManager } from "./components/AssetManager";

export default function App() {
  return (
    <div className="dark">
      <AssetManager />
      <SocketProvider socketUrl={(import.meta as any).env.VITE_SIGNALING_SERVER_URL}>
        <SettingsProvider>
          <AudioProvider>
            <CameraProvider>
              <Suspense fallback={<LoadingScreen />}>
                <RouterProvider router={router} />
              </Suspense>
            </CameraProvider>
          </AudioProvider>
        </SettingsProvider>
      </SocketProvider>
    </div>
  );
}