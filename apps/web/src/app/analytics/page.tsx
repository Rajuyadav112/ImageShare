"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

type AnalyticsData = {
  total_uploads: number;
  total_bandwidth_bytes: number;
  ai_quota_used: number;
  ai_quota_total: number;
};

export default function Analytics() {
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    api.getAnalytics().then(setStats).catch(console.error);
    api.getMe()
      .then(profile => {
        if (profile.is_superadmin) setIsSuperadmin(true);
        if (profile.name) setUserName(profile.name);
        if (profile.email) setUserEmail(profile.email);
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const mbUsed = stats ? (stats.total_bandwidth_bytes / (1024 * 1024)).toFixed(1) : "0.0";
  const percentage = stats ? (stats.ai_quota_used / stats.ai_quota_total) * 100 : 0;

  return (
    <main className="flex flex-col h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
      
      {/* TOP NAVBAR */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-8 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-lg text-white">
            A
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 cursor-pointer hidden sm:block" onClick={() => window.location.href='/'}>ImageShare</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm font-medium">
          <a href="/" className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors">
            <span className="hidden sm:inline">Get Started</span>
            <span className="inline sm:hidden">Start</span>
          </a>
          <a href="/analytics" className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-md bg-blue-50 text-blue-700">
            <span className="hidden sm:inline">Usage Analytics</span>
            <span className="inline sm:hidden">Analytics</span>
          </a>
          {isSuperadmin && (
            <a href="/admin" className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors">
              <span className="hidden sm:inline">Control Panel</span>
              <span className="inline sm:hidden">Admin</span>
            </a>
          )}
        </nav>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(prev => !prev);
              }}
              className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {getInitials(userName)}
              </div>
              <span className="text-sm font-semibold text-slate-800 hidden md:inline max-w-[120px] truncate">{userName}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>

            {isDropdownOpen && (
              /* Dropdown Menu */
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-40"
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-medium text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{userEmail}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CENTER PANEL: Main Analytics Content */}
      <section className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">
          
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="text-4xl">📊</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Usage Analytics</h1>
              <p className="text-slate-600 font-normal">Real-time usage metrics and asset delivery performance.</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="saas-panel p-6 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col justify-center hover:shadow-md transition-shadow">
              <h3 className="text-slate-500 text-sm font-medium">Total Images Uploaded</h3>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats ? stats.total_uploads : "..."}</p>
            </div>
            
            <div className="saas-panel p-6 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col justify-center hover:shadow-md transition-shadow">
              <h3 className="text-slate-500 text-sm font-medium">Storage Bandwidth</h3>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {mbUsed} <span className="text-lg text-slate-400 font-normal">MB</span>
              </p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: '45%' }}></div>
              </div>
            </div>
            
            <div className="saas-panel p-6 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col justify-center hover:shadow-md transition-shadow">
              <h3 className="text-slate-500 text-sm font-medium">AI Generation Quota</h3>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats ? stats.ai_quota_used : "..."} <span className="text-lg text-slate-400 font-normal">/ {stats ? stats.ai_quota_total : "50"}</span>
              </p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="saas-panel p-6 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-slate-800">Recent Bandwidth</h3>
            <div className="w-full h-48 border border-slate-100 rounded-xl flex items-end justify-between px-8 py-4 gap-4 bg-slate-50">
              {/* Chart Columns */}
              {[40, 70, 45, 90, 65, 30, 85].map((h, i) => (
                <div 
                  key={i} 
                  className="w-full bg-blue-100 hover:bg-blue-600 transition-colors rounded-t-sm cursor-pointer group relative" 
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap shadow-md">
                    {h} MB
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
