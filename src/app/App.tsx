import { RouterProvider } from "react-router";
import { router } from "./routes";
import { SocketProvider } from "../contexts/SocketContext";
import { WebRTCProvider } from "../contexts/WebRTCContext";
import { AudioProvider } from "../contexts/AudioContext";
import { SettingsProvider } from "../contexts/SettingsContext";

export default function App() {
  return (
    <div className="dark">
      <SocketProvider socketUrl={(import.meta as any).env.VITE_SIGNALING_SERVER_URL}>
        <WebRTCProvider>
          <SettingsProvider>
            <AudioProvider>
              <RouterProvider router={router} />
            </AudioProvider>
          </SettingsProvider>
        </WebRTCProvider>
      </SocketProvider>
    </div>
  );
}