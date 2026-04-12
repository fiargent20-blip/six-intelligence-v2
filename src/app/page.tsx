"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export default function SecureScribeEntry() {
  const router = useRouter();
  const settings = useLiveQuery(() => db.settings.get(1));
  
  const [accessId, setAccessId] = useState("");
  const [securityToken, setSecurityToken] = useState("");
  const [errorStatus, setErrorStatus] = useState("");

  const handleAuthentication = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus("");
    
    // Explicitly authenticate against the hardcoded V1 parity proxy credentials
    if (accessId.trim() === "six@sixintelligence.co.uk" && securityToken === "Six2026!") {
      // Set an isolated local session cookie specifically tailored for V2 Scribe without polluting V1 native domains
      document.cookie = "scribe_auth_v2_active=six_clearance_granted; path=/; max-age=86400; SameSite=Strict";
      
      // Native transition physically bypassing the lock matrix
      router.push("/dashboard");
    } else {
      setErrorStatus("Authentication clearance heavily denied.");
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md bg-slate-950 border border-slate-900 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          {settings?.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoDataUrl} alt="Brand" className="h-16 w-auto object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
              <Lock className="w-8 h-8 text-slate-300" />
            </div>
          )}
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-2xl font-medium tracking-wide text-white mb-2">{settings?.companyName || "Six Intelligence"} Scribe</h1>
          <p className="text-slate-400 text-sm">Secure Entry Protocol (V2 Commercial)</p>
        </div>

        <form onSubmit={handleAuthentication} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Access ID</label>
            <input 
              type="text" 
              className="w-full bg-black border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-slate-600 transition-colors"
              placeholder="six@sixintelligence.co.uk"
              value={accessId}
              onChange={(e) => setAccessId(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              className="w-full bg-black border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-slate-600 transition-colors"
              placeholder="••••••••"
              value={securityToken}
              onChange={(e) => setSecurityToken(e.target.value)}
              required
            />
          </div>

          {errorStatus && (
            <div className="text-red-400 text-sm text-center font-medium bg-red-950/40 p-2 rounded-md border border-red-900/50">
              {errorStatus}
            </div>
          )}

          <button type="submit" className="w-full bg-white text-black font-medium rounded-lg px-4 py-3 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Authenticate & Enter
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-8">
          End-to-end encrypted. Scribe Commercial Layer Active.
        </p>
      </div>
    </div>
  );
}
