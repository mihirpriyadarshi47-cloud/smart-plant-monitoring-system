import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ShieldCheck, AlertTriangle, Play, Loader2, Code, Lock, Key } from 'lucide-react';

const SOURCE_CODE = `// ESP32 Smart Plant Source Code Analysis Target
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>      
#include <WiFiClientSecure.h> 

const char *ssid = "YOUR_WIFI_NAME";         
const char *password = "YOUR_WIFI_PASSWORD"; 
String botToken = "YOUR_BOT_TOKEN";  
String chatID = "YOUR_CHAT_ID";      

void sendTelegramMessage(String msg) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // SSL SECURITY RISK
    HTTPClient https;
    String url = "https://api.telegram.org/bot" + botToken + "/sendMessage?text=" + msg;
    if (https.begin(client, url)) { https.GET(); https.end(); }
  }
}

void loop() {
  esp_task_wdt_reset(); // WATCHDOG ENABLED (SAFETY)
  if (pumpActive && (millis() - pumpStartTime > maxPumpRunTime)) {
      if (moistureProgress < 5) { // DRY RUN PROTECTION (SAFETY)
          digitalWrite(PumpPin, LOW);
          systemError = true;
      }
  }
}`;

const SecurityAuditor: React.FC = () => {
  const [audit, setAudit] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    // Basic check for Netlify environment variable injection
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === "__API_KEY_PLACEHOLDER__" || apiKey === "undefined") {
      setError("API Key not found. Please set 'API_KEY' in your Netlify Environment Variables.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze this ESP32 C++ code for safety and security: ${SOURCE_CODE}. 
        Identify vulnerabilities (like hardcoded secrets, setInsecure() calls) and safety strengths (Watchdog, overrun protection). 
        Keep the report concise and high-impact.`,
        config: {
          thinkingConfig: { thinkingBudget: 4000 }
        }
      });
      setAudit(response.text || "Audit failed to generate.");
    } catch (err) {
      setError("AI Analysis Error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
              <ShieldCheck className="text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="text-md sm:text-lg font-bold">AI Safety Auditor</h3>
              <p className="text-[10px] text-slate-500">Scanning firmware v2.7.0</p>
            </div>
          </div>
          <button 
            onClick={runAudit}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 rounded-full transition-all font-bold text-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
            {loading ? 'Analysing...' : 'Run Audit'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs">
            <Key size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!audit && !loading && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-700 border-2 border-dashed border-slate-800 rounded-xl">
            <Code size={32} className="mb-2 opacity-20" />
            <p className="text-xs font-medium">Click "Run Audit" to start analysis</p>
          </div>
        )}

        {audit && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[10px] sm:text-[11px] leading-relaxed whitespace-pre-wrap text-slate-300 max-h-[400px] overflow-y-auto custom-scrollbar">
              {audit}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">Safety Strengths</h4>
          <ul className="text-[10px] sm:text-[11px] space-y-2 text-slate-400">
            <li className="flex items-center gap-2"><ShieldCheck size={12} className="text-emerald-500" /> Watchdog Reset Enabled</li>
            <li className="flex items-center gap-2"><ShieldCheck size={12} className="text-emerald-500" /> Dry Run Detection Logic</li>
            <li className="flex items-center gap-2"><ShieldCheck size={12} className="text-emerald-500" /> Automatic Rain Shutdown</li>
          </ul>
        </div>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">Security Risks</h4>
          <ul className="text-[10px] sm:text-[11px] space-y-2 text-slate-400">
            <li className="flex items-center gap-2"><AlertTriangle size={12} className="text-red-500" /> Hardcoded WiFi Secrets</li>
            <li className="flex items-center gap-2"><Lock size={12} className="text-red-500" /> Unauthenticated Web Interface</li>
            <li className="flex items-center gap-2"><AlertTriangle size={12} className="text-red-500" /> SSL setInsecure() Active</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SecurityAuditor;