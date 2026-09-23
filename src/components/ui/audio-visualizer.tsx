import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AudioVisualizerProps {
  isRecording: boolean;
}

export function AudioVisualizer({ isRecording }: AudioVisualizerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Generate 32 bars for the visualizer
  const bars = Array.from({ length: 32 });

  return (
    <div className="flex items-center justify-center w-full h-[56px] relative overflow-hidden rounded-xl">
      {/* Glow Effect behind the bars */}
      <div className="absolute inset-0 bg-primary/10 blur-xl animate-pulse" />
      
      {/* Central wave text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <span className="text-primary font-mono text-xs uppercase tracking-widest font-bold drop-shadow-[0_0_8px_var(--color-primary)] bg-background/50 px-3 py-1 rounded-full backdrop-blur-sm border border-primary/20">
          {isRecording ? "Listening..." : "Initializing Link..."}
        </span>
      </div>

      <div className="flex items-center justify-center gap-[3px] h-12 w-full px-4 relative z-0 opacity-80">
        {bars.map((_, i) => {
          // Create a wave shape: higher in the middle, shorter on edges
          const distanceFromCenter = Math.abs(i - 15.5);
          const baseHeight = Math.max(8, 48 - distanceFromCenter * 3);
          
          return (
            <motion.div
              key={i}
              className="w-1 bg-[#00f0ff] rounded-full shadow-[0_0_8px_#00f0ff]"
              initial={{ height: "4px" }}
              animate={
                isRecording
                  ? {
                      height: [
                        `${baseHeight * 0.3}px`,
                        `${baseHeight * (Math.random() * 0.5 + 0.5)}px`,
                        `${baseHeight * 0.3}px`,
                      ],
                    }
                  : { height: "4px" }
              }
              transition={{
                duration: isRecording ? Math.random() * 0.4 + 0.4 : 0.5,
                repeat: isRecording ? Infinity : 0,
                ease: "easeInOut",
                delay: isRecording ? Math.random() * 0.2 : 0,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
