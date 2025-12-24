
import React, { useState } from 'react';
import { SystemState } from '../types';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface Props {
  state: SystemState;
  onTogglePump: () => void;
  onToggleMode: () => void;
}

const WebDashboard: React.FC<Props> = ({ state, onTogglePump, onToggleMode }) => {
  const [activeTab, setActiveTab] = useState('dash');
  
  const status = state.isRaining ? "Raining (Pump Disabled)" : 
                 state.pumpActive ? "Watering..." : 
                 state.moisture < 20 ? "Needs Water" : "Perfect";

  const gaugeColor = state.moisture < 20 ? "#ff1744" : state.moisture > 80 ? "#2979ff" : "#00e676";

  return (
    <div className="w-full h-full bg-[#222] overflow-hidden flex flex-col relative font-sans">
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000&auto=format&fit=crop')", backgroundSize: 'cover' }}
      />
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      <div className="relative z-10 px-4 pt-6 pb-2">
        <h1 className="text-[#00e676] text-xl font-bold font-['Orbitron']">Smart Plant Monitoring System</h1>
        <div className="flex justify-between items-center mt-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">LIVE DASHBOARD</span>
          <div className="flex gap-2">
            <div className="bg-black/50 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
              <ShieldAlert size={10} className="text-red-400" /> VULNERABLE
            </div>
            <div className="bg-black/50 px-2 py-1 rounded text-[10px] font-bold">📶 {state.rssi > -65 ? 'Strong' : 'Good'}</div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4 max-w-md mx-auto w-full">
        {activeTab === 'dash' && (
          <>
            <div className={`bg-[#1e1e2e]/70 backdrop-blur-md rounded-2xl p-5 border ${state.isRaining ? 'border-blue-500' : 'border-white/10'} shadow-xl`}>
              <div className="text-[11px] text-gray-300 font-bold border-b border-white/10 pb-1 mb-4">SOIL MOISTURE LEVEL</div>
              
              <div className="flex justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${state.autoMode ? 'bg-blue-600' : 'bg-yellow-500 text-black'}`}>
                  {state.autoMode ? 'AUTO' : 'MANUAL'}
                </span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${state.pumpActive ? 'bg-emerald-500 text-black' : 'bg-red-600'}`}>
                  {state.pumpActive ? 'PUMP ON' : 'PUMP OFF'}
                </span>
              </div>

              <div className="relative w-40 h-20 mx-auto overflow-hidden">
                <div className="absolute top-0 left-0 w-40 h-40 rounded-full border-[10px] border-white/10" />
                <div 
                   className="absolute top-0 left-0 w-40 h-40 rounded-full border-[10px] transition-all duration-1000"
                   style={{ 
                     borderColor: gaugeColor,
                     clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
                     transform: `rotate(${270 + (state.moisture * 1.8)}deg)` 
                   }}
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-[#1e1e2e] rounded-t-full flex flex-col items-center justify-end pb-1">
                  <span className="text-3xl font-bold font-['Orbitron']">{Math.round(state.moisture)}%</span>
                </div>
              </div>

              <div className={`mt-4 text-center font-bold text-sm ${state.systemError ? 'text-red-500' : 'text-gray-400'}`}>
                {state.systemError ? '⚠ SYSTEM FAILURE ⚠' : status}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#1e1e2e]/70 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-center">
                  <div className="text-[10px] text-gray-400 font-bold mb-2">CLIMATE</div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🌡️</span>
                    <span className="text-lg font-bold font-['Orbitron']">{state.temperature}°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💧</span>
                    <span className="text-sm text-gray-400 font-['Orbitron']">{state.humidity}%</span>
                  </div>
               </div>
               <div className="bg-[#1e1e2e]/70 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
                  <div className="text-[10px] text-gray-400 font-bold mb-2 uppercase">Lighting</div>
                  <div className="text-2xl mb-1">{state.isRaining ? '🌧️' : state.light < 30 ? '🌙' : '☀️'}</div>
                  <div className="text-[10px] font-bold font-['Orbitron']">
                    {state.isRaining ? 'RAINING' : state.light < 30 ? `NIGHT (${state.light}%)` : `SUNNY (${state.light}%)`}
                  </div>
               </div>
            </div>

            <div className="bg-[#1e1e2e]/70 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-2">
              <button 
                onClick={() => {
                   if (state.isRaining) alert("🚫 Cannot turn on Pump: It is Raining!");
                   else onTogglePump();
                }}
                className="w-full bg-[#f57c00] py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
              >
                Toggle Pump
              </button>
              <button 
                onClick={onToggleMode}
                className="w-full bg-[#1976D2] py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
              >
                Toggle Mode
              </button>
            </div>
          </>
        )}

        {activeTab === 'graph' && (
          <div className="bg-[#1e1e2e]/70 backdrop-blur-md rounded-2xl p-5 border border-white/10">
            <div className="text-[11px] text-gray-300 font-bold border-b border-white/10 pb-1 mb-4">HISTORY GRAPH</div>
            <div className="bg-white rounded-lg h-64 flex items-center justify-center text-slate-400 text-xs">
              [ ThingSpeak Chart Placeholder ]
            </div>
          </div>
        )}

        {activeTab === 'set' && (
          <div className="bg-[#1e1e2e]/70 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="text-[11px] text-gray-300 font-bold border-b border-white/10 pb-1">CALIBRATION</div>
            <div className="bg-black/50 p-3 rounded-lg text-sm">
              Raw Value: <span className="text-[#00e676] font-bold font-mono">{state.rawMoisture}</span>
            </div>
            <div>
              <label className="text-xs text-gray-400">Dry Value (0%):</label>
              <input type="number" readOnly value="3200" className="w-full bg-black/50 border border-white/20 rounded p-2 text-center mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Wet Value (100%):</label>
              <input type="number" readOnly value="1500" className="w-full bg-black/50 border border-white/20 rounded p-2 text-center mt-1" />
            </div>
            <button className="w-full bg-[#388E3C] py-3 rounded-lg font-bold">Save Settings</button>
          </div>
        )}
      </div>

      <div className="relative z-10 h-[70px] bg-[#14141e]/95 backdrop-blur-md border-t border-white/10 flex justify-around items-center">
        <NavItem active={activeTab === 'dash'} onClick={() => setActiveTab('dash')} label="Dash" icon="🏠" />
        <NavItem active={activeTab === 'graph'} onClick={() => setActiveTab('graph')} label="Graph" icon="📈" />
        <NavItem active={activeTab === 'set'} onClick={() => setActiveTab('set')} label="Config" icon="⚙️" />
      </div>
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; label: string; icon: string; onClick: () => void }> = ({ active, label, icon, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center flex-1 transition-all ${active ? 'text-[#00e676]' : 'text-gray-500'}`}
  >
    <span className="text-xl mb-1">{icon}</span>
    <span className={`text-[10px] font-bold ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default WebDashboard;
