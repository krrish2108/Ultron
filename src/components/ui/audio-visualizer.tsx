import { useEffect, useState, useRef } from "react";

interface AudioVisualizerProps {
  isRecording: boolean;
}

export function AudioVisualizer({ isRecording }: AudioVisualizerProps) {
  const [mounted, setMounted] = useState(false);
  const [volumes, setVolumes] = useState<number[]>(Array(32).fill(0));
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isRecording) {
      startVisualization();
    } else {
      stopVisualization();
    }
    return () => {
      stopVisualization();
    };
  }, [isRecording]);

  const startVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64; // Gives us 32 frequency bins
      analyser.smoothingTimeConstant = 0.7;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      const update = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
        
        // Convert to array of numbers 0-1
        const newVolumes = Array.from(dataArrayRef.current).map(v => v / 255);
        setVolumes(newVolumes);
        
        rafRef.current = requestAnimationFrame(update);
      };
      
      update();

    } catch (err) {
      console.error("Error accessing microphone for visualizer:", err);
    }
  };

  const stopVisualization = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setVolumes(Array(32).fill(0));
  };

  if (!mounted) return null;

  return (
    <div className="flex items-center justify-center w-full h-[56px] relative overflow-hidden rounded-xl">
      <div className="absolute inset-0 bg-primary/10 blur-xl animate-pulse" />
      
      <div className="flex items-center justify-center gap-[3px] h-12 w-full px-4 relative z-0 opacity-80">
        {volumes.map((vol, i) => {
          // Create a wave shape: higher in the middle, shorter on edges
          const distanceFromCenter = Math.abs(i - 15.5);
          const baseHeight = Math.max(8, 48 - distanceFromCenter * 3);
          
          // Height is baseHeight * 0.2 min, plus volume multiplier
          // We map 0-1 volume to 0-1 height multiplier
          const height = isRecording ? Math.max(4, baseHeight * (0.2 + vol * 0.8)) : 4;

          return (
            <div
              key={i}
              className="w-1 bg-[#00f0ff] rounded-full shadow-[0_0_8px_#00f0ff]"
              style={{
                height: `${height}px`,
                transition: 'height 50ms ease-out'
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
