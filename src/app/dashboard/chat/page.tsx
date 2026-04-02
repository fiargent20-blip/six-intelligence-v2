"use client";

import { ChevronLeft, Bot, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export default function IntelligenceChatbot() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "I am the Six Intelligence Analysis Bot. Ask me specific questions about your cached recordings." }
  ]);
  const [input, setInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  // Load entire local intelligence scribe dynamically
  const allMeetings = useLiveQuery(() => db.meetings.toArray());

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatting) return;
    
    const userMsg = input;
    // Optimistically push user message
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsChatting(true);

    try {
      // Build an aggressive highly-dense memory buffer of all meetings to prevent token overflow
      const scribeContext = (allMeetings || []).map(m => ({
        id: m.id,
        title: m.title,
        date: m.date,
        summary: m.summary,
        insights: m.insights,
        actions: m.actions
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, contextObj: scribeContext })
      });
      
      const data = await response.json();
      
      if (data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Internal Neural routing error." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Secure communication error with the Intelligence Core." }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-[90vh] flex flex-col hide-print relative">
      <header className="mb-8 flex items-center gap-4">
        <Link href="/dashboard" className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center hover:bg-slate-800 transition-colors text-white border border-slate-800">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-medium text-white mb-1 flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-400" />
            Global Scribe Chat
          </h1>
          <p className="text-slate-400">Query your entire meeting history and extract cross-cutting insights.</p>
        </div>
      </header>
      
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl mb-10">
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-800' : 'bg-blue-500/10'}`}>
                {msg.role === 'user' ? <span className="text-xs text-white">U</span> : <Bot className="w-4 h-4 text-blue-400" />}
              </div>
              <div className={`mt-1 max-w-[80%] ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-2xl rounded-tr-none px-4 py-3 text-sm' : 'text-slate-300 text-sm leading-relaxed whitespace-pre-wrap'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isChatting && (
             <div className="flex gap-4 animate-pulse">
               <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-blue-400" /></div>
               <div className="mt-2 text-slate-500 text-xs">Scanning complete intelligence scribe...</div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-900 bg-slate-950">
          <form onSubmit={handleSend} className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about key decisions aggregated across all your past meetings..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-14 py-4 text-white focus:outline-none focus:border-slate-600 transition-colors"
              disabled={isChatting}
            />
            <button type="submit" disabled={isChatting || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-50">
              <Send className="w-4 h-4 ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
