import { useEffect } from 'react';

// list of assets to preload for the smoothest experience
const CRITICAL_VIDEOS = [
  '/assets/referee_menu.mp4',
  '/assets/robots/back_stage1.mp4',
  '/assets/robots/back_stage2.mp4',
  '/assets/referee_practice.mp4'
];

export function AssetManager() {
  useEffect(() => {
    // Basic preloading strategy using hidden video elements
    const cache = new Set<string>();

    const preloadVideo = (url: string) => {
      if (cache.has(url)) return;
      
      const v = document.createElement('video');
      v.preload = 'auto';
      v.muted = true;
      v.style.display = 'none';
      
      // Start loading
      v.src = url;
      cache.add(url);
      
      console.log(`[AssetManager] Preloading critical asset: ${url}`);
      
      // Optional: keep it in DOM if needed for persistence, 
      // but usually just creating it is enough for browser cache.
      document.body.appendChild(v);
      
      // Remove from DOM after some time or when loaded to keep DOM clean
      v.oncanplaythrough = () => {
         console.log(`[AssetManager] Asset ready: ${url}`);
         // No need to keep in body once cached
         // setTimeout(() => document.body.removeChild(v), 5000);
      };
    };

    // Delay slightly to not block the initial hydration
    const timer = setTimeout(() => {
      CRITICAL_VIDEOS.forEach(preloadVideo);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null; // This is a logic-only component
}
