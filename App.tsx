
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SystemState, ScreenState, HardwareConfig } from './types';
import OledEmulator from './components/OledEmulator';
import HardwareControls from './components/HardwareControls';
import WebDashboard from './components/WebDashboard';
import SecurityAuditor from './components/SecurityAuditor';
import { Cpu, Monitor, Globe, Shield, Wind, MousePointer2, Volume2, VolumeX } from 'lucide-react';

const App: React.FC = () => {
  const config: HardwareConfig = {
    wetSoilVal: 1500,
    drySoilVal: 3200,
    moistPerLow: 20,
    moistPerHigh: 80,
    maxPumpRunTime: 15000, // 60s in your real code
  };

  const [state, setState] = useState<SystemState>({
    moisture: 45,
    rawMoisture: 2400,
    temperature: 24,
    humidity: 60,
    light: 80,
    isRaining: false,
    pumpActive: false,
    autoMode: true, // Initial state: AUTO (matches prevMode = true)
    systemError: false,
    rssi: -60,
    lastPumpStartTime: 0,
    startMoistureLevel: 45,
    isDND: false,
    displayActive: true,
    lastMotionTime: Date.now(),
    currentScreen: ScreenState.SHOW_INFO,
    ledActive: false,
    buzzerActive: false,
  });

  const [activeTab, setActiveTab] = useState<'hardware' | 'web' | 'security'>('hardware');
  const [isMuted, setIsMuted] = useState(false);
  const [isSensorDisconnected, setIsSensorDisconnected] = useState(false);
  
  const audioContext = useRef<AudioContext | null>(null);
  const lastScreenSwitch = useRef(Date.now());
  const lastLedToggle = useRef(Date.now());
  const lastBuzzerToggle = useRef(Date.now());

  const playBeep = useCallback((freq: number, duration: number) => {
    if (isMuted) return;
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
      const osc = audioContext.current.createOscillator();
      const gain = audioContext.current.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, audioContext.current.currentTime);
      gain.gain.setValueAtTime(0.05, audioContext.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration / 1000);
      osc.connect(gain);
      gain.connect(audioContext.current.destination);
      osc.start();
      osc.stop(audioContext.current.currentTime + duration / 1000);
    } catch (e) {
      console.warn("Audio failed", e);
    }
  }, [isMuted]);

  const handleMouseMove = useCallback(() => {
    setState(prev => {
      const now = Date.now();
      if (!prev.displayActive || now - prev.lastMotionTime > 100) {
        return { ...prev, displayActive: true, lastMotionTime: now };
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleMouseMove);
    };
  }, [handleMouseMove]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const now = Date.now();
        const next = { ...prev };
        const hour = new Date().getHours();
        next.isDND = hour >= 22 || hour < 7;

        if (now - prev.lastMotionTime > 30000) {
          next.displayActive = false;
        }

        // --- Hardware Simulation (getSensors logic) ---
        let currentRaw = isSensorDisconnected ? 4095 : Math.round(config.drySoilVal - (next.moisture / 100) * (config.drySoilVal - config.wetSoilVal));
        next.rawMoisture = currentRaw;

        if (currentRaw < 100 || currentRaw > 4000) {
          next.systemError = true;
          next.moisture = 100; // Force 100 to stop auto-pump in your C++ code
        }

        // --- Environmental Physics ---
        if (!prev.pumpActive && !prev.isRaining && !prev.systemError) {
          next.moisture = Math.max(0, prev.moisture - 0.01);
        } else if (prev.pumpActive) {
          next.moisture = Math.min(100, prev.moisture + 0.15);
        } else if (prev.isRaining) {
          next.moisture = Math.min(100, prev.moisture + 0.05);
        }

        // --- Alarm Buzzer (Matches buzzerAlarmInterval = 1000) ---
        if (prev.systemError && !next.isDND) {
          if (now - lastBuzzerToggle.current >= 1000) {
            next.buzzerActive = true;
            lastBuzzerToggle.current = now;
            playBeep(800, 200); // 200ms Alarm beep
            setTimeout(() => setState(s => ({...s, buzzerActive: false})), 200);
          }
        }

        // --- Auto Watering (loop logic) ---
        if (!prev.isRaining && prev.autoMode && !prev.systemError && !next.isDND) {
          if (next.moisture < config.moistPerLow && !prev.pumpActive) {
            next.pumpActive = true;
            next.lastPumpStartTime = now;
            next.startMoistureLevel = next.moisture;
            playBeep(2500, 100);
          } else if (next.moisture > config.moistPerHigh && prev.pumpActive) {
            next.pumpActive = false;
            playBeep(2000, 100);
          }
        }

        if (prev.isRaining && prev.pumpActive) {
          next.pumpActive = false;
        }

        // --- Pump Safety Watchdog (loop logic) ---
        if (next.pumpActive) {
          const runTime = now - next.lastPumpStartTime;
          if (runTime > config.maxPumpRunTime) {
            const progress = next.moisture - next.startMoistureLevel;
            if (progress < 5) {
              next.pumpActive = false;
              next.systemError = true;
            } else {
              next.lastPumpStartTime = now;
              next.startMoistureLevel = next.moisture;
            }
          }
          if (now - lastLedToggle.current >= 500) {
            next.ledActive = !prev.ledActive;
            lastLedToggle.current = now;
          }
        } else {
          next.ledActive = false;
        }

        if (now - lastScreenSwitch.current > 5000) {
          next.currentScreen = prev.currentScreen === ScreenState.SHOW_INFO ? ScreenState.SHOW_FACE : ScreenState.SHOW_INFO;
          lastScreenSwitch.current = now;
        }

        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [config, playBeep, isSensorDisconnected]);

  // --- Matches handleToggle() ---
  const togglePump = () => {
    playBeep(2500, 100); // Interaction Beep
    if (state.isRaining) return;

    // logic: if (!prevMode && !systemError)
    if (!state.autoMode && !state.systemError) {
      setState(prev => ({
        ...prev,
        pumpActive: !prev.pumpActive,
        lastPumpStartTime: !prev.pumpActive ? Date.now() : 0,
        startMoistureLevel: !prev.pumpActive ? prev.moisture : 0,
      }));
    }
  };

  // --- Matches handleMode() ---
  const toggleMode = () => {
    playBeep(2500, 100); // Interaction Beep
    console.log(`[SYSTEM] Mode Toggle: Clearing Errors. New Mode: ${!state.autoMode ? 'AUTO' : 'MANUAL'}`);
    
    // logic: prevMode = !prevMode; systemError = false;
    setState(prev => ({
      ...prev,
      autoMode: !prev.autoMode,
      systemError: false 
    }));
    
    // Automatically fix the "hardware" fault so it doesn't immediately re-trigger
    setIsSensorDisconnected(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden">
      <header className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-slate-900 border-b border-slate-800 shrink-0 gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-emerald-500/20 p-2 rounded-lg shrink-0">
            <Cpu className="text-emerald-400" size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">SmartPlant <span className="text-emerald-400">Simulator</span></h1>
            <p className="text-[10px] text-slate-400 font-mono truncate">PROTOTYPE SYNCED: handleMode()</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
           <button 
             onClick={() => setIsMuted(!isMuted)}
             className={`p-2 rounded-lg ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'} hover:bg-slate-700 transition-colors`}
           >
             {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
           </button>
           <button 
             onClick={() => setActiveTab('hardware')}
             className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg sm:rounded-full text-xs transition-all whitespace-nowrap ${activeTab === 'hardware' ? 'bg-emerald-600 shadow-lg' : 'bg-slate-800'}`}
           >
             <Monitor size={14} /> Hardware
           </button>
           <button 
             onClick={() => setActiveTab('web')}
             className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg sm:rounded-full text-xs transition-all whitespace-nowrap ${activeTab === 'web' ? 'bg-emerald-600 shadow-lg' : 'bg-slate-800'}`}
           >
             <Globe size={14} /> Dashboard
           </button>
           <button 
             onClick={() => setActiveTab('security')}
             className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg sm:rounded-full text-xs transition-all whitespace-nowrap ${activeTab === 'security' ? 'bg-blue-600 shadow-lg' : 'bg-slate-800'}`}
           >
             <Shield size={14} /> Security
           </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <div className={`flex-1 p-4 sm:p-6 transition-opacity duration-300 overflow-y-auto ${activeTab === 'hardware' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute w-full h-full'}`}>
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            <div className="lg:col-span-8 bg-slate-900/30 rounded-3xl border border-slate-800/50 p-4 sm:p-6 flex items-center justify-center relative overflow-hidden min-h-[400px]">
               <div className="relative z-10 flex flex-col gap-8 items-center w-full">
                 <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border-2 border-slate-700 shadow-2xl w-full max-w-[480px]">
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex gap-2">
                         <div className={`w-3 h-3 rounded-full ${state.ledActive ? 'bg-blue-400 shadow-[0_0_15px_#60a5fa]' : 'bg-slate-900 transition-colors'}`} />
                         <div className={`w-3 h-3 rounded-full ${state.buzzerActive ? 'bg-amber-400 animate-pulse shadow-[0_0_10px_#fbbf24]' : 'bg-slate-900'}`} />
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-mono text-slate-400 font-bold uppercase tracking-widest block">ESP32 DevKit</span>
                      </div>
                    </div>
                    <div className="flex justify-center mb-6">
                       <OledEmulator state={state} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="flex flex-col items-center gap-2">
                          <button 
                            onClick={togglePump} 
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 flex items-center justify-center transition-all ${state.systemError ? 'border-red-900/50 bg-slate-950 cursor-not-allowed' : 'bg-slate-900 border-slate-700 active:translate-y-1 shadow-lg'}`}
                          >
                             <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-inner ${state.systemError ? 'bg-red-900' : 'bg-red-600'}`} />
                          </button>
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Pump Btn</span>
                       </div>
                       <div className="flex flex-col items-center gap-2">
                          <button 
                            onClick={toggleMode} 
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-full border-4 border-slate-700 active:translate-y-1 flex items-center justify-center transition-all shadow-lg"
                          >
                             <div className="w-5 h-5 sm:w-6 sm:h-6 bg-slate-500 rounded-full shadow-inner" />
                          </button>
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Mode Btn</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-xl border-2 transition-all duration-500 ${state.pumpActive ? 'bg-blue-600 border-blue-400 shadow-lg' : 'bg-slate-800 border-slate-700 opacity-50'}`}>
                       <Wind className={state.pumpActive ? 'animate-spin' : ''} size={24} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">Motor Status</span>
                 </div>
               </div>
            </div>
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
               <h2 className="text-md font-bold mb-6 flex items-center gap-2 text-emerald-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                 <MousePointer2 size={18} /> Physical Controls
               </h2>
               <HardwareControls 
                 state={state} 
                 setState={setState} 
                 triggerMotion={handleMouseMove} 
                 isSensorDisconnected={isSensorDisconnected}
                 onToggleDisconnect={() => setIsSensorDisconnected(!isSensorDisconnected)}
               />
            </div>
          </div>
        </div>

        <div className={`flex-1 transition-opacity duration-300 ${activeTab === 'web' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute w-full h-full'}`}>
           <WebDashboard state={state} onTogglePump={togglePump} onToggleMode={toggleMode} />
        </div>

        <div className={`flex-1 p-4 sm:p-6 transition-opacity duration-300 overflow-y-auto ${activeTab === 'security' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute w-full h-full'}`}>
           <div className="max-w-4xl mx-auto">
              <SecurityAuditor />
           </div>
        </div>
      </main>

      <footer className="px-4 py-2 sm:px-6 bg-slate-900 border-t border-slate-800 text-[9px] sm:text-[11px] text-slate-500 font-mono flex justify-between shrink-0">
        <div className="flex gap-4 items-center truncate mr-2">
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> ONLINE</span>
          <span className="hidden sm:inline opacity-50">192.168.1.104</span>
        </div>
        <div className="flex gap-4 font-bold uppercase tracking-tighter sm:tracking-widest shrink-0">
          <span className={state.autoMode ? 'text-blue-400' : 'text-amber-400'}>{state.autoMode ? 'AUTO' : 'MANU'}</span>
          <span className={state.pumpActive ? 'text-blue-400' : 'text-slate-600'}>PUMP:{state.pumpActive ? 'ON' : 'OFF'}</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
