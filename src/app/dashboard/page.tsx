"use client";

import Link from "next/link";
import { FileAudio, Search, Clock, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  
  // Real data from IndexedDB cache
  const recordings = useLiveQuery(() => db.meetings.toArray()) || [];

  const filteredRecordings = recordings.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (e: React.MouseEvent, id?: number) => {
    e.preventDefault();
    if (id !== undefined) {
      const confirm = window.confirm("Are you sure you want to permanently delete this intelligence from the secure scribe?");
      if (confirm) {
        await db.meetings.delete(id);
      }
    }
  };

  const handleEdit = async (e: React.MouseEvent, id?: number, currentTitle?: string) => {
    e.preventDefault();
    if (id !== undefined && currentTitle) {
      const newTitle = window.prompt("Rename this recording entry:", currentTitle);
      if (newTitle && newTitle.trim() !== "") {
        await db.meetings.update(id, { title: newTitle.trim() });
      }
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto hide-print">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-medium text-white mb-2">Scribe Dashboard</h1>
          <p className="text-slate-400">Manage and analyze your secure offline intelligence.</p>
        </div>
        
        <div className="self-start md:self-auto">
          <Link href="/dashboard/new">
            <button className="bg-white text-black font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-slate-200 transition-colors shadow-lg">
              <span className="text-xl leading-none">+</span> New Meeting
            </button>
          </Link>
        </div>
      </header>

      <div className="mb-8 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input 
          type="text" 
          placeholder="Search through all structured intelligence..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-slate-600 transition-colors shadow-sm"
        />
      </div>

      <div className="space-y-4">
        {filteredRecordings.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/50">
            {recordings.length === 0 
              ? "No intelligence recordings found in the offline scribe. Capture a meeting to begin." 
              : "No search results match your criteria."}
          </div>
        ) : (
          filteredRecordings.sort((a,b) => b.createdAt - a.createdAt).map((rec) => (
            <div key={rec.id} className="group bg-slate-950 border border-slate-800 rounded-xl p-5 flex items-center justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                  <FileAudio className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                    {rec.title}
                    <button onClick={(e) => handleEdit(e, rec.id, rec.title)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white transition-opacity"><Edit2 className="w-3 h-3" /></button>
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {rec.date}</span>
                    <span>Length: {rec.duration}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link href={`/dashboard/note/${rec.id}`}>
                  <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
                    Access Intelligence
                  </button>
                </Link>
                <button onClick={(e) => handleDelete(e, rec.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
