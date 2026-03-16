import { RouterProvider } from "react-router";
import { router } from "./routes";
import { WebRTCProvider } from "../contexts/WebRTCContext";
import { AudioProvider } from "../contexts/AudioContext";

export default function App() {
  return (
    <div className="dark">
      <WebRTCProvider socketUrl="http://localhost:3000">
        <AudioProvider>
          <RouterProvider router={router} />
        </AudioProvider>
      </WebRTCProvider>
    </div>
  );
}