"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  Bot, 
  Settings, 
  Activity, 
  LogOut,
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { generateDirectPDF } from "@/lib/pdfGenerator";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [intelOpen, setIntelOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const settings = useLiveQuery(() => db.settings.get(1));
  
  // Extract Active Note ID for contextual translation
  const noteIdMatch = pathname.match(/\/dashboard\/note\/(\d+)/);
  const activeNoteId = noteIdMatch ? parseInt(noteIdMatch[1], 10) : null;
  const activeNote = useLiveQuery(() => activeNoteId ? db.meetings.get(activeNoteId) : undefined, [activeNoteId]);
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-900 h-screen flex flex-col print:hidden shrink-0">
      <div className="p-6">
        {settings?.logoDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logoDataUrl} alt="Brand Logo" className="h-8 w-auto mb-4 object-contain" />
        )}
        <h1 className="text-xl font-medium tracking-wide text-white">Six Intelligence<br/><span className="text-sm text-slate-400">Scribe</span></h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <Link 
          href="/dashboard"
          className={clsx(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
            pathname === "/dashboard" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
          )}
        >
          <Home className="w-4 h-4" />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>

        {/* Intelligence Tools */}
        <div className="pt-4 pb-1">
          <button 
            onClick={() => setIntelOpen(!intelOpen)}
            className="flex items-center justify-between w-full px-3 py-2 text-slate-400 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bot className="w-4 h-4" />
              <span className="text-sm font-medium">Intelligence Tools</span>
            </div>
            <ChevronDown className={clsx("w-4 h-4 transition-transform", intelOpen ? "rotate-180" : "")} />
          </button>
          
          {intelOpen && (
            <div className="pl-10 pr-3 py-2 space-y-2">
              <Link href="/dashboard/chat" className="block text-sm text-slate-400 hover:text-white transition-colors">Analysis Chatbot</Link>
              
              <button 
                className="mt-2 block w-full text-left text-sm text-slate-400 hover:text-white transition-colors pt-1 pb-2"
                onClick={() => {
                  window.print();
                }}
              >
                Export Scribe PDF
              </button>
              <button 
                className="block w-full text-left text-sm text-slate-400 hover:text-white transition-colors pb-3 mb-2"
                onClick={() => {
                  document.body.classList.add('print-transcript-only');
                  window.print();
                  setTimeout(() => document.body.classList.remove('print-transcript-only'), 500);
                }}
              >
                Download Smart Transcript PDF
              </button>
            </div>
          )}
        </div>

        {/* Global Language Toggle */}
        <div className="pt-2 pb-1 border-t border-slate-900 border-b border-slate-900 mb-2">
          <div className="px-3 py-2 flex flex-col gap-2">
             <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dialect Override</span>
             <select 
               value={settings?.language || "GB"}
               onChange={async (e) => {
                 await db.settings.put({
                    ...(settings || { id: 1, companyName: "", brandColor: "#ffffff", logoDataUrl: null }),
                    language: e.target.value as "GB" | "US"
                 });
               }}
               className="bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block w-full p-2 outline-none cursor-pointer"
             >
               <option value="GB">British English (GB)</option>
               <option value="US">American English (US)</option>
             </select>
          </div>
        </div>
      </nav>

      <div className="p-4 space-y-1">
        {/* Scribe Settings */}
        <div className="pb-1">
          <button 
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex items-center justify-between w-full px-3 py-2 text-slate-400 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Scribe Settings</span>
            </div>
            <ChevronDown className={clsx("w-4 h-4 transition-transform", settingsOpen ? "rotate-180" : "")} />
          </button>
          
          {settingsOpen && (
            <div className="pl-10 pr-3 py-2 space-y-2">
              <Link href="/dashboard/settings" className="block text-sm text-slate-400 hover:text-white transition-colors">Scribe Configuration</Link>
              <button className="block text-sm text-slate-400 hover:text-white transition-colors w-full text-left">Set as Default</button>
            </div>
          )}
        </div>

        <Link 
          href="/dashboard/health"
          className={clsx(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
            pathname === "/dashboard/health" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
          )}
        >
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium">Scribe Health</span>
        </Link>
        
        <div className="pt-2 mt-2 border-t border-slate-800/80">
          <Link 
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-red-400 hover:bg-slate-900 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign out</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
