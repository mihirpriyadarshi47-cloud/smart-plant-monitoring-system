
import React, { useEffect, useRef } from 'react';
import { SystemState, ScreenState } from '../types';

interface Props {
  state: SystemState;
}

const LOGIC_WIDTH = 128;
const LOGIC_HEIGHT = 64;
const SCALE_FACTOR = 4;
const OLED_COLOR = '#00f2ff';

const OledEmulator: React.FC<Props> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawSignalBars = (ctx: CanvasRenderingContext2D, x: number, y: number, rssi: number) => {
    let bars = 0;
    if (rssi > -55) bars = 4;
    else if (rssi > -65) bars = 3;
    else if (rssi > -75) bars = 2;
    else if (rssi > -85) bars = 1;

    for (let i = 0; i < 4; i++) {
      if (i < bars) {
        ctx.fillRect(x + (i * 4), y - (i * 2), 2, 2 + (i * 2));
      } else {
        ctx.strokeRect(x + (i * 4), y - (i * 2), 2, 2 + (i * 2));
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    canvas.width = LOGIC_WIDTH * SCALE_FACTOR;
    canvas.height = LOGIC_HEIGHT * SCALE_FACTOR;

    const render = () => {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (!state.displayActive) return;

      ctx.save();
      ctx.scale(SCALE_FACTOR, SCALE_FACTOR);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = OLED_COLOR;
      ctx.strokeStyle = OLED_COLOR;
      ctx.lineWidth = 1.5; // Slightly thicker lines for visibility

      if (state.systemError) {
        ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillText("CRITICAL ERROR", 64, 25);
        ctx.font = '7px "JetBrains Mono", monospace';
        ctx.fillText("TANK EMPTY / FAILURE", 64, 42);
      } else if (state.currentScreen === ScreenState.SHOW_INFO) {
        ctx.lineWidth = 1;
        ctx.font = '7px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        let statusStr = state.isRaining ? "SYS: RAIN" : state.isDND ? "SYS: SLEEP" : "SYS: OK";
        ctx.fillText(statusStr, 0, 8);
        ctx.textAlign = 'right';
        ctx.fillText(state.autoMode ? "[AUTO]" : "[MANU]", 105, 8);
        drawSignalBars(ctx, 110, 8, state.rssi);

        ctx.fillRect(0, 12, 128, 0.5);
        ctx.textAlign = 'left';
        ctx.fillText("SOIL MOISTURE", 0, 24);
        ctx.font = 'bold 18px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round(state.moisture)}%`, 128, 32);

        ctx.strokeRect(0, 38, 128, 4);
        ctx.fillRect(2, 40, Math.max(0, (state.moisture / 100) * 124), 1);

        ctx.font = '7px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`T:${Math.round(state.temperature)}°C`, 0, 58);
        ctx.fillText(`H:${Math.round(state.humidity)}%`, 45, 58);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        ctx.textAlign = 'right';
        ctx.fillText(timeStr, 128, 58);
      } else {
        // --- FACIAL EXPRESSIONS ---
        // Eyes (Same for all)
        ctx.beginPath(); ctx.arc(40, 20, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(88, 20, 6, 0, Math.PI * 2); ctx.fill();
        
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';

        if (state.pumpActive) {
          // HYDRATING: Animated pulsing O-mouth
          const pulse = Math.sin(Date.now() / 150) * 2;
          ctx.beginPath(); 
          ctx.arc(64, 38, 8 + pulse, 0, Math.PI * 2); 
          ctx.fill();
          ctx.fillText("DRINKING...", 64, 58);
        } else if (state.moisture < 20) {
          // THIRSTY: Frown and small pupil eyes (optional: just frown for now)
          ctx.beginPath();
          ctx.arc(64, 48, 12, 1.1 * Math.PI, 1.9 * Math.PI); // Upward curve for mouth = Frown
          ctx.stroke();
          
          // Add "sweat" or "dry" indicator
          ctx.fillText("SO THIRSTY!", 64, 58);
          
          // Pupil detail for "Thirsty/Scared"
          ctx.fillStyle = 'black';
          ctx.beginPath(); ctx.arc(40, 20, 2, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(88, 20, 2, 0, Math.PI * 2); ctx.fill();
        } else {
          // OPTIMAL: Happy Curved Smile
          ctx.beginPath();
          ctx.arc(64, 30, 15, 0.1 * Math.PI, 0.9 * Math.PI); // Downward curve for mouth = Smile
          ctx.stroke();
          ctx.fillText("HAPPY PLANT", 64, 58);
        }
      }
      ctx.restore();
    };

    let frameId: number;
    const loop = () => { render(); frameId = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(frameId);
  }, [state]);

  return (
    <div className="w-full max-w-full aspect-[128/64] bg-black rounded-lg border-4 border-slate-900 shadow-inner overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default OledEmulator;
