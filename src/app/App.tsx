import { RouterProvider } from "react-router";
import { router } from "./routes";
import { SocketProvider } from "../contexts/SocketContext";
import { WebRTCProvider } from "../contexts/WebRTCContext";
import { AudioProvider } from "../contexts/AudioContext";

export default function App() {
  return (
    <div className="dark">
      <SocketProvider socketUrl={import.meta.env.VITE_SIGNALING_SERVER_URL}>
        <WebRTCProvider>
          <AudioProvider>
            <RouterProvider router={router} />
          </AudioProvider>
        </WebRTCProvider>
      </SocketProvider>
    </div>
  );
}