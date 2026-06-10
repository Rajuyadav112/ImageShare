"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  tier: string;
  storage_used: number;
  is_active: boolean;
  is_superadmin: boolean;
};

type StatsRecord = {
  total_users: number;
  total_images: number;
  total_storage_bytes: number;
};

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<StatsRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // 1. Authenticate check & Fetch admin permissions
    api.getMe()
      .then((profile) => {
        if (profile.name) setUserName(profile.name);
        if (profile.email) setUserEmail(profile.email);

        if (profile.is_superadmin) {
          setIsAdmin(true);
          loadAdminData();
        } else {
          setIsAdmin(false);
          setLoading(false);
          // Redirect standard user
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        }
      })
      .catch(() => {
        setIsAdmin(false);
        setLoading(false);
        // Redirect anonymous
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

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [usersData, statsData] = await Promise.all([
        api.adminGetUsers(),
        api.adminGetStats()
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (e) {
      alert("Failed to load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      const updatedUser = await api.adminUpdateUserStatus(userId, newStatus);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: updatedUser.is_active } : u));
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    }
  };

  const handleTierChange = async (userId: string, newTier: string) => {
    try {
      const updatedUser = await api.adminUpdateUserTier(userId, newTier);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, tier: updatedUser.tier } : u));
    } catch (err: any) {
      alert(err.message || "Failed to update tier.");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      (user.name && user.name.toLowerCase().includes(query))
    );
  });

  if (isAdmin === null || loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500">
        Loading Admin Workspace...
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-center p-4">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-slate-500">You do not have administrative permissions. Redirecting you home...</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col min-h-screen w-full bg-slate-50 text-slate-900">
      
      {/* HEADER */}
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
          <a href="/analytics" className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors">
            <span className="hidden sm:inline">Usage Analytics</span>
            <span className="inline sm:hidden">Analytics</span>
          </a>
          <a href="/admin" className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-md bg-blue-50 text-blue-700">
            <span className="hidden sm:inline">Control Panel</span>
            <span className="inline sm:hidden">Admin</span>
          </a>
        </nav>

        {/* Right Info */}
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

      {/* ADMIN CONTENT */}
      <section className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl w-full mx-auto flex flex-col gap-8">
          
          {/* Welcome Header */}
          <div className="flex items-start gap-4">
            <div className="text-4xl">👑</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Superadmin Control Center</h1>
              <p className="text-slate-600">As the software owner, manage user quotas, subscription tiers, and ban active sessions.</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="saas-panel p-6 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col">
              <h3 className="text-slate-500 text-sm font-medium">Total Platform Users</h3>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats ? stats.total_users : "..."}</p>
            </div>
            
            <div className="saas-panel p-6 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col">
              <h3 className="text-slate-500 text-sm font-medium">Total Images Hosted</h3>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats ? stats.total_images : "..."}</p>
            </div>
            
            <div className="saas-panel p-6 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col">
              <h3 className="text-slate-500 text-sm font-medium">Global Storage Consumed</h3>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats ? formatBytes(stats.total_storage_bytes) : "..."}
              </p>
            </div>
          </div>

          {/* User Directory */}
          <div className="saas-panel bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-800">User Management Directory</h2>
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <input 
                  type="text" 
                  placeholder="Search user by name or email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full border border-slate-100 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Tier Status</th>
                    <th className="px-6 py-4">Storage Used</th>
                    <th className="px-6 py-4">Access Status</th>
                    <th className="px-6 py-4">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-400 py-8">
                        No registered users match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Name/Email */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{user.name || "Anonymous User"}</span>
                            <span className="text-slate-400 mt-0.5">{user.email}</span>
                            {user.phone && <span className="text-slate-500 font-mono text-[10px] mt-0.5">{user.phone}</span>}
                          </div>
                        </td>
                        
                        {/* Tier Selector */}
                        <td className="px-6 py-4">
                          {user.email === "rajuyadav84211@gmail.com" ? (
                            <span className="bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded text-[10px]">
                              PRO (SYSTEM OWNER)
                            </span>
                          ) : (
                            <select 
                              value={user.tier} 
                              onChange={(e) => handleTierChange(user.id, e.target.value)}
                              className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-blue-500"
                            >
                              <option value="FREE">FREE TIER</option>
                              <option value="PRO">PRO TIER</option>
                            </select>
                          )}
                        </td>
                        
                        {/* Storage bytes */}
                        <td className="px-6 py-4 font-mono text-slate-600">
                          {formatBytes(user.storage_used)}
                        </td>
                        
                        {/* Active/Banned Toggle */}
                        <td className="px-6 py-4">
                          {user.email === "rajuyadav84211@gmail.com" ? (
                            <span className="text-emerald-600 font-medium">Unbannable</span>
                          ) : (
                            <button
                              onClick={() => handleStatusToggle(user.id, user.is_active)}
                              className={`px-3 py-1 rounded font-medium cursor-pointer transition-colors ${
                                user.is_active 
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" 
                                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                              }`}
                            >
                              {user.is_active ? "Active" : "Banned"}
                            </button>
                          )}
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4 font-medium text-slate-500">
                          {user.is_superadmin ? (
                            <span className="text-purple-600 font-bold">Superadmin</span>
                          ) : (
                            <span>User</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
