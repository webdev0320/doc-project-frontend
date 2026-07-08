import React from 'react'

export default function Footer() {
  return (
    <footer className="mt-auto py-6 border-t dark:border-white/5 border-black/5 dark:bg-black/20 bg-slate-50/50 backdrop-blur-sm z-10 relative">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
            <span className="text-indigo-500 font-bold text-xs">DP</span>
          </div>
          <div>
            <h3 className="text-xs font-bold dark:text-slate-300 text-slate-800 uppercase tracking-widest">Doc Project</h3>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">Secure Multi-Tenant Local Environment</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-500">SYSTEM: ONLINE</span>
          </div>
          <span className="text-[10px] text-slate-400">
            &copy; {new Date().getFullYear()} Doc Project. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}
