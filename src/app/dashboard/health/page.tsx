"use client";

import { ChevronLeft, Activity, ShieldCheck, Database } from "lucide-react";
import Link from "next/link";

export default function ScribeHealth() {
  return (
    <div className="p-8 max-w-4xl mx-auto hide-print">
      <header className="mb-12 flex items-center gap-4">
        <Link href="/dashboard" className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center hover:bg-slate-800 transition-colors text-white border border-slate-800">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-medium text-white mb-1 flex items-center gap-3">
            <Activity className="w-8 h-8 text-emerald-400" />
            Scribe Health
          </h1>
          <p className="text-slate-400">System diagnostics and security status.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-medium text-white">Security Status</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">End-to-End Encryption</span>
              <span className="text-emerald-400 font-medium">Active</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Offline Standalone Capability</span>
              <span className="text-emerald-400 font-medium">Ready</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">2FA Scribe Protocol</span>
              <span className="text-emerald-400 font-medium">Mock Enabled</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-medium text-white">Cache & Storage Engine</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Local Database Storage</span>
              <span className="text-white font-medium">21.4 MB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">IndexedDB Synced Meetings</span>
              <span className="text-white font-medium">2 Items</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 mt-4 overflow-hidden border border-slate-800">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '15%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
