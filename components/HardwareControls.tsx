
import React from 'react';
import { SystemState } from '../types';
import { Thermometer, Droplets, Sun, CloudRain, User, ZapOff } from 'lucide-react';

interface Props {
  state: SystemState;
  setState: React.Dispatch<React.SetStateAction<SystemState>>;
  triggerMotion: () => void;
  isSensorDisconnected: boolean;
  onToggleDisconnect: () => void;
}

const HardwareControls: React.FC<Props> = ({ 
  state, 
  setState, 
  triggerMotion, 
  isSensorDisconnected, 
  onToggleDisconnect 
}) => {
  const updateState = (key: keyof SystemState, val: any) => {
    setState(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Moisture Section */}
      <section className={isSensorDisconnected ? 'opacity-40 grayscale pointer-events-none' : ''}>
        <div className="flex justify-between items-end mb-3">
          <label className="text-xs sm:text-sm font-medium text-slate-400 flex items-center gap-2">
            <Droplets size={16} /> Soil Moisture
          </label>
          <span className="text-md sm:text-lg font-bold font-mono text-emerald-400">{Math.round(state.moisture)}%</span>
        </div>
        <div className="py-2">
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="0.1"
            value={state.moisture}
            onChange={(e) => updateState('moisture', parseFloat(e.target.value))}
            className="w-full h-3 sm:h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
        <div className="flex justify-between text-[9px] mt-1 text-slate-600 font-mono">
          <span>DRY (3200)</span>
          <span>WET (1500)</span>
        </div>
      </section>

      {/* Climate Section */}
      <div className="grid grid-cols-2 gap-4">
        <section>
          <label className="text-[10px] font-medium text-slate-400 flex items-center gap-2 mb-2">
            <Thermometer size={14} /> Temp (°C)
          </label>
          <input 
            type="number" 
            value={state.temperature}
            onChange={(e) => updateState('temperature', parseInt(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </section>
        <section>
          <label className="text-[10px] font-medium text-slate-400 flex items-center gap-2 mb-2">
            <Droplets size={14} /> Humid (%)
          </label>
          <input 
            type="number" 
            value={state.humidity}
            onChange={(e) => updateState('humidity', parseInt(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </section>
      </div>

      {/* Lighting Section */}
      <section>
        <div className="flex justify-between items-end mb-3">
          <label className="text-xs sm:text-sm font-medium text-slate-400 flex items-center gap-2">
            <Sun size={16} /> Ambient Light
          </label>
          <span className="text-md sm:text-lg font-bold font-mono text-amber-400">{state.light}%</span>
        </div>
        <div className="py-2">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={state.light}
            onChange={(e) => updateState('light', parseInt(e.target.value))}
            className="w-full h-3 sm:h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </section>

      {/* Boolean States */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <button 
          onClick={onToggleDisconnect}
          className={`w-full flex items-center justify-between px-4 py-4 sm:py-3 rounded-xl border transition-all ${isSensorDisconnected ? 'bg-red-500/10 border-red-500 text-red-400 shadow-inner' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
        >
          <div className="flex items-center gap-3">
            <ZapOff size={18} />
            <span className="text-xs font-bold uppercase tracking-wide">Disconnect Sensor</span>
          </div>
          <div className={`w-3 h-3 rounded-full ${isSensorDisconnected ? 'bg-red-400 shadow-[0_0_10px_#f87171]' : 'bg-slate-600'}`} />
        </button>

        <button 
          onClick={() => updateState('isRaining', !state.isRaining)}
          className={`w-full flex items-center justify-between px-4 py-4 sm:py-3 rounded-xl border transition-all ${state.isRaining ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-inner' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
        >
          <div className="flex items-center gap-3">
            <CloudRain size={18} />
            <span className="text-xs font-bold uppercase tracking-wide">Rain Sensor</span>
          </div>
          <div className={`w-3 h-3 rounded-full ${state.isRaining ? 'bg-blue-400 shadow-[0_0_10px_#60a5fa]' : 'bg-slate-600'}`} />
        </button>

        <button 
          onClick={triggerMotion}
          className="w-full flex items-center justify-between px-4 py-4 sm:py-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 active:bg-slate-700 transition-all"
        >
          <div className="flex items-center gap-3">
            <User size={18} />
            <span className="text-xs font-bold uppercase tracking-wide">PIR Trigger</span>
          </div>
          <div className={`w-3 h-3 rounded-full ${Date.now() - state.lastMotionTime < 500 ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-slate-600'}`} />
        </button>
      </div>

      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 mt-2">
        <p className="text-[10px] text-slate-500 leading-tight italic">
          Logic: Errors can be reset by toggling the "Mode Btn" on the virtual device.
        </p>
      </div>
    </div>
  );
};

export default HardwareControls;
