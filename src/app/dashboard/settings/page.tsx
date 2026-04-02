"use client";

import { ChevronLeft, Upload, Building2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export default function ScribeSettings() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [brandColor, setBrandColor] = useState("#ffffff");
  const [saved, setSaved] = useState(false);
  const [connectedApps, setConnectedApps] = useState<string[]>([]);
  const [connectedMeetings, setConnectedMeetings] = useState<string[]>([]);
  const [deploymentMode, setDeploymentMode] = useState<"local" | "hybrid" | "cloud">("local");
  
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  
  const settings = useLiveQuery(() => db.settings.get(1));

  useEffect(() => {
    if (settings) {
      setLogoPreview(settings.logoDataUrl);
      setCompanyName(settings.companyName);
      setBrandColor(settings.brandColor);
      if (settings.connectedApps) setConnectedApps(settings.connectedApps);
      if (settings.connectedMeetings) setConnectedMeetings(settings.connectedMeetings);
      if (settings.deploymentMode) setDeploymentMode(settings.deploymentMode);
    }
  }, [settings]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setLogoPreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setLogoPreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleApp = (app: string) => {
    setConnectedApps(prev => prev.includes(app) ? prev.filter(a => a !== app) : [...prev, app]);
  };

  const toggleMeeting = (app: string) => {
    setConnectedMeetings(prev => prev.includes(app) ? prev.filter(a => a !== app) : [...prev, app]);
  };

  const saveSettings = async () => {
    await db.settings.put({
      ...(settings || {}),
      id: 1,
      companyName,
      brandColor,
      logoDataUrl: logoPreview,
      connectedApps,
      connectedMeetings,
      deploymentMode
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto hide-print">
      <header className="mb-12 flex items-center gap-4">
        <Link href="/dashboard" className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center hover:bg-slate-800 transition-colors text-white border border-slate-800">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-medium text-white mb-1">Scribe Configuration</h1>
          <p className="text-slate-400">Manage your Brand Identity System, Integrations, and Deployment modes.</p>
        </div>
      </header>
      
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 mb-8 shadow-sm relative">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-6 h-6 text-slate-300" />
          <h2 className="text-xl font-medium text-white">Brand Identity System</h2>
        </div>
        <p className="text-sm text-slate-400 mb-8 max-w-2xl">
          Integrate your company's branding into the Intelligence ecosystem. Personalize the application with your logo, which will propagate throughout the UI, including the secure Scribe entry and exported executive summaries.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Company Logo Drop</label>
            <input 
              type="file" 
              accept="image/*" 
              ref={logoInputRef} 
              onChange={handleManualUpload} 
              className="hidden" 
            />
            <div 
              onClick={() => logoInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-xl p-8 text-center hover:border-slate-500 hover:bg-slate-900 transition-colors flex flex-col items-center justify-center min-h-[200px] group cursor-pointer"
            >
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Brand Logo Preview" className="max-h-24 max-w-full object-contain mb-4" />
              ) : (
                <Upload className="w-8 h-8 text-slate-500 mb-4 group-hover:text-slate-300 transition-colors" />
              )}
              <h3 className="text-slate-300 font-medium mb-1">Drag & drop your logo</h3>
              <p className="text-xs text-slate-500">Supports SVG, PNG, JPG (High-res recommended)</p>
            </div>
            {logoPreview && (
              <button 
                onClick={() => setLogoPreview(null)}
                className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors w-full text-center block"
              >
                Remove Custom Logo
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Company Name (for PDF Header)</label>
              <input 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-slate-600 transition-colors"
                placeholder="e.g. Acme Corporation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Primary Brand Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer bg-slate-900 border border-slate-800"
                />
                <span className="text-sm text-slate-500">Used for highlights and accents in exported reports.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex justify-end gap-4 items-center">
          {saved && <span className="text-emerald-400 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Saved to Scribe Ecosystem</span>}
          <button 
            onClick={saveSettings}
            className="bg-white text-black font-medium px-6 py-2.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Save Scribe Configuration
          </button>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 mb-8 shadow-sm relative overflow-hidden">
         <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-medium text-white flex items-center gap-3">
               Connect Integrations & Workflows
            </h2>
         </div>
         <p className="text-sm text-slate-400 mb-6 max-w-2xl">
            Authorize third-party systems to securely sync Scribe intelligence downstream into your existing pipelines. 
         </p>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Slack', 'Salesforce', 'HubSpot', 'Zapier', 'Asana', 'CRM Sync', 'API Docs', 'BI Connectors'].map(app => {
               const isConnected = connectedApps.includes(app);
               return (
               <div key={app} onClick={() => toggleApp(app)} className={`bg-slate-900 border ${isConnected ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 hover:border-blue-500/50'} p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group`}>
                  <div className={`w-10 h-10 rounded ${isConnected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-blue-400'} flex items-center justify-center transition-colors cursor-pointer`}>
                     {isConnected ? <CheckCircle2 className="w-5 h-5"/> : <Upload className="w-5 h-5"/>}
                  </div>
                  <span className="text-sm font-medium text-white">{app}</span>
               </div>
            )})}
         </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 mb-8 shadow-sm relative overflow-hidden">
         <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-medium text-white flex items-center gap-3">
               Virtual Meeting Connectors
            </h2>
         </div>
         <p className="text-sm text-slate-400 mb-6 max-w-2xl">
            Automatically ingest and translate meetings securely directly from conference links.
         </p>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Zoom Link', 'Microsoft Teams', 'Google Meet'].map(app => {
               const isConnected = connectedMeetings.includes(app);
               return (
               <div key={app} onClick={() => toggleMeeting(app)} className={`bg-slate-900 border ${isConnected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 hover:border-emerald-500/50'} p-4 rounded-xl flex items-center gap-4 transition-colors cursor-pointer group`}>
                  <div className={`w-10 h-10 rounded-full ${isConnected ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-emerald-400'} flex items-center justify-center transition-colors`}>
                     <CheckCircle2 className="w-5 h-5"/>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-sm font-medium text-white">{app}</span>
                     <span className={`text-xs ${isConnected ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>{isConnected ? 'Connected Active' : 'Not Connected'}</span>
                  </div>
               </div>
            )})}
         </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 mb-8 shadow-sm relative overflow-hidden">
         <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-medium text-white flex items-center gap-3">
               Architecture & Deployment Rules
            </h2>
         </div>
         <p className="text-sm text-slate-400 mb-6 max-w-2xl">
            Control the data-plane topography of your Scribe records. Switch from local-only execution to cloud-linked modes.
         </p>
         <div className="flex flex-col space-y-4">
            <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer ${deploymentMode === 'local' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-900 hover:border-slate-600'}`}>
               <input type="radio" name="deployMode" checked={deploymentMode === 'local'} onChange={() => setDeploymentMode('local')} className="w-5 h-5 accent-emerald-500" />
               <div className="flex flex-col">
                  <span className="text-white font-medium">Local-Only Sandbox (Highest Security)</span>
                  <span className="text-sm text-slate-400">All data stays isolated on this machine. Hardware execution only.</span>
               </div>
            </label>
            <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-not-allowed opacity-50 border-slate-800 bg-slate-900`}>
               <input type="radio" name="deployMode" disabled className="w-5 h-5 accent-emerald-500" />
               <div className="flex flex-col">
                  <span className="text-white font-medium">Internal Company Server (SaaS Node)</span>
                  <span className="text-sm text-slate-400">Requires dedicated Enterprise API keys. (Contact Sales)</span>
               </div>
            </label>
            <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer ${deploymentMode === 'hybrid' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-900 hover:border-slate-600'}`}>
               <input type="radio" name="deployMode" checked={deploymentMode === 'hybrid'} onChange={() => setDeploymentMode('hybrid')} className="w-5 h-5 accent-emerald-500" />
               <div className="flex flex-col">
                  <span className="text-white font-medium">Cloud Hybrid Sync</span>
                  <span className="text-sm text-slate-400">Link multiple Scribe devices via end-to-end encrypted cloud.</span>
               </div>
            </label>
         </div>
      </div>

    </div>
  );
}
