"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Calendar, Bot, Send, Edit3, X, Save } from "lucide-react";
import clsx from "clsx";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

type Tab = "summary" | "objectives" | "action" | "context" | "transcript" | "chat";

export default function NoteDetail() {
  const params = useParams();
  const id = parseInt(params.id as string, 10);
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  // Chat State
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'bot', text: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");
  const [editedObjectives, setEditedObjectives] = useState<string[]>([]);
  const [editedActions, setEditedActions] = useState<any[]>([]);
  const [editedContext, setEditedContext] = useState<string[]>([]);

  // Load from DB
  const note = useLiveQuery(() => db.meetings.get(id));
  const settings = useLiveQuery(() => db.settings.get(1));

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatMessage("");
    setIsChatting(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, contextObj: note })
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch {
      setChatHistory(prev => [...prev, { role: 'bot', text: "Secure communication error." }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleEditSpeaker = async (oldName: string) => {
    if (!note || !note.transcript) return;
    
    const newName = window.prompt(`Rename "${oldName}" globally to:`, oldName);
    if (!newName || newName.trim() === "" || newName === oldName) return;

    // Update Original Transcript Only (Token Limit Hardening: Translations purged)
    const updatedOriginal = note.transcript.map((line: any) => ({
      ...line,
      speaker: line.speaker === oldName ? newName.trim() : line.speaker
    }));

    await db.meetings.update(id, { transcript: updatedOriginal });
  };

  const handleEnableEdit = () => {
    setEditedSummary(note?.strategicSummary || note?.summary || "");
    setEditedObjectives([...(note?.coreObjectives || [])]);
    setEditedActions(JSON.parse(JSON.stringify(note?.actions || [])));
    setEditedContext([...(note?.backgroundContext || [])]);
    setIsEditing(true);
  };

  const handleSaveEdits = async () => {
    if (!note) return;
    
    const objectivesToSave = editedObjectives.filter(v => v.trim() !== "");
    const contextToSave = editedContext.filter(v => v.trim() !== "");

    await db.meetings.update(id, { 
      strategicSummary: editedSummary,
      coreObjectives: objectivesToSave,
      actions: editedActions,
      backgroundContext: contextToSave
    });

    setIsEditing(false);
  };

  const handleReSynthesize = async () => {
    if (!note || !note.transcript) return;
    
    setIsSynthesizing(true);
    try {
      const fullTranscriptText = note.transcript.map((l: any) => {
        if (typeof l === 'string') return l;
        return `[${l.time || '0:00'}] ${l.speaker || 'Speaker'}: ${l.text || ''}`;
      }).join("\n");
      
      const res = await fetch('/api/process-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fullTranscriptText, 
          language: settings?.language || "GB" 
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Retry pipeline crashed.");
      }
      
      // Clean up the title if it contains the recovery string
      const newTitle = note.title.replace(" (Local Recovery)", "");
      
      await db.meetings.update(id, { 
        title: newTitle,
        strategicSummary: data.strategicSummary || data.summary,
        coreObjectives: data.coreObjectives || [],
        actions: data.actions || [],
        backgroundContext: data.backgroundContext || []
      });
      
      alert("Native Structural Synthesis completely restored!");
    } catch (err: any) {
      alert("Retry Failed: " + err.message);
    } finally {
      setIsSynthesizing(false);
    }
  };

  if (!note) {
    return (
      <div className="p-8 max-w-5xl mx-auto h-full flex items-center justify-center text-slate-500">
        Loading intelligence from secure scribe...
      </div>
    );
  }

  return (
    <div id="scribe-document" className="p-8 max-w-5xl mx-auto min-h-screen flex flex-col relative print:p-0">
      
      {/* ---------------- NEW PRINT ONLY HEADER ---------------- */}
      <div className="hidden print:flex flex-col mb-6 pb-6 border-b border-black w-full break-inside-avoid">
        <div className="flex justify-between items-start">
          <div className="flex flex-col print:mt-[1cm]">
            <h1 className="text-4xl font-normal tracking-wide text-black mb-1 leading-none">SIX INTELLIGENCE</h1>
            <div className="text-lg font-medium text-slate-800 leading-none mt-1">
              Scribe Session ({note.date}) ({id}) (Encrypted AES-256)
            </div>
          </div>
          <div className="h-32 flex items-start justify-end">
            {settings?.logoDataUrl ? (
               // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoDataUrl} alt="Brand Logo" className="h-full w-auto object-contain" />
            ) : (
              <div className="text-xl font-bold text-black" style={{ color: settings?.brandColor || "black" }}>
                {settings?.companyName || "Client Logo"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HEADER SECTION (Screen Only) */}
      <header className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden">
        <div className="flex items-start gap-4">
          <Link href="/dashboard" className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center hover:bg-slate-800 transition-colors text-white border border-slate-800 mt-1 shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-medium text-white mb-2 flex items-center gap-4">
              {note.title}
              <span className="text-sm font-normal px-2 py-1 bg-slate-900 text-slate-300 rounded">ID: {id}</span>
            </h1>
            <div className="flex items-center gap-4 text-slate-400 text-sm">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {note.date}</span>
              <span className="print:hidden">Duration: {note.duration}</span>
            </div>
          </div>
        </div>
        
        {/* Subtle Edit Toggles Header Action */}
        <div className="print:hidden pt-2 flex flex-col items-end gap-3">
          {!isEditing ? (
            <button onClick={handleEnableEdit} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg text-sm transition-colors shadow-sm font-medium w-48">
              <Edit3 className="w-4 h-4" /> Edit Analysis
            </button>
          ) : (
            <div className="flex items-center justify-end gap-3 w-48">
              <button onClick={() => setIsEditing(false)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 border border-slate-600 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg text-sm transition-colors shadow-sm">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSaveEdits} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm shadow-lg shadow-blue-500/20 transition-all font-medium">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          )}
          
          {/* Retry Array Structural Component */}
          {(note.strategicSummary?.includes("[System Intercept Event]") || note.title?.includes("(Local Recovery)")) && (
            <button 
              onClick={handleReSynthesize} 
              disabled={isSynthesizing}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 text-white hover:text-white rounded-lg text-sm transition-colors shadow-sm font-medium w-48 disabled:opacity-50"
            >
              <Bot className="w-4 h-4" /> {isSynthesizing ? "Rebuilding..." : "Retry AI Synthesis"}
            </button>
          )}
        </div>
      </header>

      {/* TABS - Hidden in Print */}
      <div className="flex border-b border-slate-800 mb-8 print:hidden overflow-x-auto scrollbar-hide">
        {(["summary", "objectives", "action", "context", "transcript", "chat"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-6 py-3 font-medium text-sm transition-colors border-b-2 capitalize whitespace-nowrap",
              activeTab === tab 
                ? "border-blue-500 text-blue-400" 
                : "border-transparent text-slate-400 hover:text-white"
            )}
          >
            {tab.replace("summary", "Strategic Summary").replace("objectives", "Core Objectives").replace("context", "Context & Insights").replace("transcript", "Smart Transcript").replace("action", "Key Actions").replace("chat", "Analysis Chatbot")}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 space-y-12 pb-8">
        {/* 1. STRATEGIC SUMMARY */}
        <section className={clsx("print:block print-exclude-transcript", activeTab === "summary" ? "block" : "hidden print:block")}>
          <div className="flex items-center justify-between mb-4 print:mb-2 print:border-b print:border-slate-300 print:pb-2">
             <h2 className="text-xl font-medium text-white print:text-black print:font-bold">1. Strategic Summary</h2>
          </div>
          <div className="bg-slate-950 border border-slate-800 print:bg-white print:border-none rounded-xl p-6 print:p-0 text-slate-300 print:text-black leading-relaxed whitespace-pre-wrap">
            {isEditing ? (
              <textarea 
                value={editedSummary} 
                onChange={e => setEditedSummary(e.target.value)} 
                className="w-full h-48 bg-slate-900 border border-slate-700 text-white p-4 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Enter Strategic Summary..."
              />
            ) : (
              note.strategicSummary || note.summary || "No strategic summary available for this meeting capture."
            )}
          </div>
        </section>

        {/* 2. CORE OBJECTIVES */}
        <section className={clsx("print:block print-exclude-transcript", activeTab === "objectives" ? "block" : "hidden print:block")}>
          <h2 className="text-xl font-medium text-white print:text-black print:font-bold mb-4 print:mt-8 print:border-b print:border-slate-300 print:pb-2">2. Core Objectives</h2>
          <div className="bg-slate-950 border border-slate-800 print:bg-white print:border-none rounded-xl p-6 print:p-0 text-slate-300 print:text-black leading-relaxed">
            {isEditing ? (
              <div className="space-y-3">
                {editedObjectives.map((obj, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-slate-500 shrink-0 select-none">{i+1}.</span>
                    <input value={obj} onChange={e => { const newObj=[...editedObjectives]; newObj[i]=e.target.value; setEditedObjectives(newObj); }} className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500" placeholder="Objective detail..." />
                    <button onClick={() => { const newObj=[...editedObjectives]; newObj.splice(i,1); setEditedObjectives(newObj); }} className="p-3 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => setEditedObjectives([...editedObjectives, ""])} className="text-sm font-medium text-blue-400 hover:text-white mt-4 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors">
                  + Add Objective
                </button>
              </div>
            ) : (
              note.coreObjectives && note.coreObjectives.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2">
                  {note.coreObjectives.map((obj: string, i: number) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 print:text-slate-600">No core objectives identified.</p>
              )
            )}
          </div>
        </section>

        {/* 3. KEY ACTIONS */}
        <section className={clsx("print:block print-exclude-transcript", activeTab === "action" ? "block" : "hidden print:block")}>
          <h2 className="text-xl font-medium text-white print:text-black print:font-bold mb-4 print:mt-10 print:border-b print:border-slate-300 print:pb-2">3. Key Actions</h2>
          <div className={clsx("print:bg-transparent print:border-none", isEditing ? "bg-transparent" : "bg-slate-950 border border-slate-800 rounded-xl overflow-hidden print:overflow-visible")}>
            {isEditing ? (
                <div className="space-y-4">
                  {editedActions.map((act, i) => (
                    <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 relative">
                      <button onClick={() => { const a=[...editedActions]; a.splice(i,1); setEditedActions(a); }} className="absolute -top-3 -right-3 p-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                      <div className="flex-1 space-y-1"><label className="text-xs text-slate-500 uppercase font-medium">Activity</label><input placeholder="Activity description" value={act.activity||act.item||""} onChange={e => { const a=[...editedActions]; a[i].activity=e.target.value; setEditedActions(a); }} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
                      <div className="w-full md:w-48 space-y-1"><label className="text-xs text-slate-500 uppercase font-medium">Owner</label><input placeholder="Owner" value={act.owner||""} onChange={e => { const a=[...editedActions]; a[i].owner=e.target.value; setEditedActions(a); }} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
                      <div className="w-full md:w-32 space-y-1"><label className="text-xs text-slate-500 uppercase font-medium">Deadline</label><input placeholder="TBA" value={act.deadline||""} onChange={e => { const a=[...editedActions]; a[i].deadline=e.target.value; setEditedActions(a); }} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
                      <div className="w-full md:w-32 space-y-1"><label className="text-xs text-slate-500 uppercase font-medium">Status</label><input placeholder="Pending" value={act.status||""} onChange={e => { const a=[...editedActions]; a[i].status=e.target.value; setEditedActions(a); }} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></div>
                    </div>
                  ))}
                  <button onClick={() => setEditedActions([...editedActions, {activity:"",owner:"",deadline:"",status:""}])} className="text-sm font-medium text-blue-400 hover:text-white mt-4 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors">
                  + Add Action Item
                  </button>
                </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300 print:text-black">
                <thead className="bg-slate-900 text-slate-400 print:bg-slate-200 print:text-black text-xs uppercase font-medium">
                  <tr>
                    <th className="px-6 py-3 border-b print:border-slate-300">Activity</th>
                    <th className="px-6 py-3 border-b print:border-slate-300">Owner</th>
                    <th className="px-6 py-3 border-b print:border-slate-300">Deadline Date</th>
                    <th className="px-6 py-3 border-b print:border-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                  {note.actions && note.actions.length > 0 ? (
                    note.actions.map((act: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-900/50 print:hover:bg-transparent transition-colors break-inside-avoid">
                        <td className="px-6 py-4">{act.activity || act.item}</td>
                        <td className="px-6 py-4 font-medium text-white print:text-black">{act.owner}</td>
                        <td className="px-6 py-4 text-emerald-400 print:text-black">{act.deadline}</td>
                        <td className="px-6 py-4">{act.status || "Pending"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="px-6 py-4 text-slate-500 text-center">No action items defined.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
        
        {/* 4. BACKGROUND, CONTEXT & INSIGHTS */}
        <section className={clsx("print:block print-exclude-transcript", activeTab === "context" ? "block" : "hidden print:block")}>
          <h2 className="text-xl font-medium text-white print:text-black print:font-bold mb-4 print:mt-10 print:border-b print:border-slate-300 print:pb-2">4. Background, Context and Insights</h2>
          <div className="bg-slate-950 border border-slate-800 print:bg-transparent print:border-none rounded-xl p-6 print:p-0">
            {isEditing ? (
              <div className="space-y-3">
                {editedContext.map((insight, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-slate-500 shrink-0 select-none">•</span>
                    <input value={insight} onChange={e => { const newC=[...editedContext]; newC[i]=e.target.value; setEditedContext(newC); }} className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500" placeholder="Insight or context bullet..." />
                    <button onClick={() => { const newC=[...editedContext]; newC.splice(i,1); setEditedContext(newC); }} className="p-3 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => setEditedContext([...editedContext, ""])} className="text-sm font-medium text-blue-400 hover:text-white mt-4 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors">
                  + Add Context Point
                </button>
              </div>
            ) : (
              note.backgroundContext && note.backgroundContext.length > 0 ? (
                <ul className="list-disc pl-5 space-y-3 text-slate-300 print:text-black">
                  {note.backgroundContext.map((insight: string, i: number) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {note.insights && note.insights.length > 0 ? note.insights.map((insight: any, i: number) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 print:bg-transparent print:border-slate-300 print:border rounded-xl p-5 break-inside-avoid">
                      <h3 className="font-medium mb-2 text-blue-400 print:text-blue-800">{insight.type}</h3>
                      <p className="text-slate-300 print:text-black text-sm">{insight.description}</p>
                    </div>
                  )) : <p className="text-slate-500">No context available.</p>}
                </div>
              )
            )}
          </div>
        </section>

        {/* SMART TRANSCRIPT */}
        <section className={clsx("print:hidden print-only-transcript", activeTab === "transcript" ? "block" : "hidden")}>
          <h2 className="text-xl font-medium text-white print:text-black print:font-bold mb-4 print:mt-10 print:border-b print:border-slate-300 print:pb-2">Smart Transcript</h2>
          <div className="space-y-6 bg-slate-950 border border-slate-800 print:bg-transparent print:border-none rounded-xl p-6 print:p-0">
            {note.transcript && note.transcript.length > 0 ? (
              note.transcript.map((line: any, i: number) => {
                const isMalformed = (!line.text || line.text.length < 10) && ((line.time && line.time.length > 50) || (line.speaker && line.speaker.length > 50));
                
                return (
                  <div key={i} className={clsx("flex break-inside-avoid", isMalformed ? "flex-col gap-2" : "flex-col md:flex-row gap-2 md:gap-4")}>
                    <div className={clsx("shrink-0 border-slate-800 print:border-slate-300", isMalformed ? "w-full" : "w-auto md:w-32 md:border-r pr-2 mr-2")}>
                      <span className="text-xs text-slate-500 print:text-slate-600 block mb-1 whitespace-pre-wrap break-words leading-relaxed">{line.time}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {line.speaker && (
                        <div className="font-medium text-blue-400 mb-1 flex items-center xl:gap-2 print:text-black group break-words whitespace-pre-wrap">
                          {line.speaker}
                          {!isMalformed && (
                            <button 
                              onClick={() => handleEditSpeaker(line.speaker)}
                              className="text-xs font-medium text-blue-400 md:opacity-0 group-hover:opacity-100 hover:text-white bg-blue-500/10 hover:bg-blue-500/30 px-2 py-0.5 rounded transition-all shrink-0 ml-2 print:hidden"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                      {line.text && <p className="text-slate-300 print:text-slate-800 text-sm leading-relaxed whitespace-pre-wrap break-words">{line.text}</p>}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500">No transcript mapping available.</p>
            )}
          </div>
        </section>

        {/* FORENSIC CHATBOT (Screen Only) */}
        <section className={clsx(activeTab === "chat" ? "block" : "hidden", "print:hidden")}>
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[500px]">
            <div className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-blue-400" />
                <h2 className="text-white font-medium">Analysis Chatbot</h2>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-1">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    I have ingested the intelligence from this session into your secure context window. What specific details would you like me to extract?
                  </p>
                </div>
              </div>
              
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-800' : 'bg-blue-500/10'}`}>
                    {msg.role === 'user' ? <span className="text-xs text-white">U</span> : <Bot className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div className={`mt-1 max-w-[80%] ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-2xl rounded-tr-none px-4 py-3 text-sm' : 'text-slate-300 text-sm leading-relaxed whitespace-pre-wrap'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {isChatting && (
                <div className="flex gap-4 animate-pulse">
                   <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-blue-400" /></div>
                   <div className="mt-2 text-slate-500 text-xs">Synthesizing answer...</div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 relative">
              <input 
                type="text" 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask about specific context, metrics, or insights..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-12 py-3 text-white focus:outline-none focus:border-slate-600 transition-colors text-sm"
                disabled={isChatting}
              />
              <button type="submit" disabled={isChatting || !chatMessage.trim()} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* ---------------- NEW FOOTER PRINT ONLY ---------------- */}
      <footer className="hidden print:block fixed bottom-0 w-full text-center text-xs text-slate-500 pt-4 border-t border-slate-300">
        &copy; Six 2026
      </footer>

    </div>
  );
}
