import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export function LiveThreatMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;
    
    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 800,
      height: 800,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.05, 0.05, 0.1], // Dark space
      markerColor: [1, 0, 0], // Red targets
      glowColor: [0, 0.94, 1], // Cyan/Ultron glow
      markers: [
        // Simulated threat origins
        { location: [37.7595, -122.4367], size: 0.05 }, // SF
        { location: [55.7558, 37.6173], size: 0.1 }, // Moscow
        { location: [39.9042, 116.4074], size: 0.08 }, // Beijing
        { location: [51.5072, 0.1276], size: 0.04 }, // London
      ],
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.
        state.phi = phi;
        phi += 0.003;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden opacity-30 mix-blend-screen">
      <div style={{ width: '800px', height: '800px', maxWidth: '100%', aspectRatio: 1 }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', contain: 'layout paint size', opacity: 1, transition: 'opacity 1s ease' }}
        />
      </div>
    </div>
  );
}
